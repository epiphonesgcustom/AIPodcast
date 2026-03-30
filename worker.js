// AI Podcast Generator — Cloudflare Worker
//
// Required secrets (Settings → Variables and Secrets):
//   ANTHROPIC_API_KEY     — Claude API key (sk-ant-...)
//   APP_PASSWORD          — password to protect the app
//   GOOGLE_CLIENT_ID      — Google OAuth client ID
//   GOOGLE_CLIENT_SECRET  — Google OAuth client secret
//
// Required binding (Bindings tab):
//   AUTH_KV  → PODCAST_AUTH (KV namespace)

const SCOPES   = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email';
const REDIRECT = 'https://misty-mud-5a13.epiphonesgcustom.workers.dev/auth/callback';
const KV_KEY   = 'refresh_token';

export default {
  async fetch(request, env) {
    const url  = new URL(request.url);
    const path = url.pathname;

    // ── CORS preflight ─────────────────────────────────────────────
    if (request.method === 'OPTIONS') {
      return cors(new Response(null, { status: 204 }));
    }

    // ── Auth: popup landing page ──────────────────────────────────
    // Opens a neutral page in the popup that signals readiness via postMessage,
    // then receives the password back — keeping it out of the URL/logs.
    if (path === '/auth/start' && request.method === 'GET') {
      return htmlPage('Connecting...', `
        <p style="color:#666;">Waiting for credentials...</p>
        <script>
          window.opener.postMessage({ type: 'AUTH_READY' }, '*');
          window.addEventListener('message', function(e) {
            if (e.data && e.data.type === 'AUTH_CREDENTIALS') {
              window.location.href = '/auth/login?app_password=' + encodeURIComponent(e.data.password);
            }
          });
        <\/script>
      `);
    }

    // ── Auth: start OAuth flow ─────────────────────────────────────
    if (path === '/auth/login' && request.method === 'GET') {
      const pw = url.searchParams.get('app_password') || '';
      if (!env.APP_PASSWORD || pw !== env.APP_PASSWORD) {
        return cors(json({ error: 'Invalid password' }, 403));
      }
      const authUrl = 'https://accounts.google.com/o/oauth2/v2/auth?' + new URLSearchParams({
        client_id:     env.GOOGLE_CLIENT_ID,
        redirect_uri:  REDIRECT,
        response_type: 'code',
        scope:         SCOPES,
        access_type:   'offline',
        prompt:        'consent',
        state:         pw,
      });
      return Response.redirect(authUrl, 302);
    }

    // ── Auth: OAuth callback ───────────────────────────────────────
    if (path === '/auth/callback' && request.method === 'GET') {
      const code  = url.searchParams.get('code');
      const error = url.searchParams.get('error');

      if (error || !code) {
        return htmlPage('Authentication failed', '<p>Google returned an error: ' + (error || 'no code') + '.</p>');
      }

      const tokenResp = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id:     env.GOOGLE_CLIENT_ID,
          client_secret: env.GOOGLE_CLIENT_SECRET,
          redirect_uri:  REDIRECT,
          grant_type:    'authorization_code',
        }),
      });

      const tokens = await tokenResp.json();
      if (!tokens.refresh_token) {
        return htmlPage('Authentication failed', '<p>No refresh token received. Please try connecting again.</p>');
      }

      await env.AUTH_KV.put(KV_KEY, tokens.refresh_token);

      const userResp = await fetch('https://www.googleapis.com/oauth2/v1/userinfo?alt=json', {
        headers: { Authorization: 'Bearer ' + tokens.access_token }
      });
      const user = await userResp.json();

      return htmlPage('Connected!', '<p>&#10003; Google Drive connected as <strong>' + (user.email || 'your account') + '</strong></p>' +
        '<p style="margin-top:1rem;color:#666;">You can close this window and return to the app.</p>' +
        '<script>if (window.opener) { window.opener.postMessage({ type: "GOOGLE_AUTH_SUCCESS", email: "' + (user.email || '') + '", access_token: "' + tokens.access_token + '" }, "*"); setTimeout(() => window.close(), 1500); }<\/script>');
    }

    // ── Auth: get fresh access token ───────────────────────────────
    if (path === '/auth/token' && request.method === 'POST') {
      if (!checkPassword(request, env)) return cors(json({ error: 'Invalid password' }, 403));

      const refreshToken = await env.AUTH_KV.get(KV_KEY);
      if (!refreshToken) return cors(json({ error: 'Not authenticated' }, 401));

      const tokenResp = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          refresh_token: refreshToken,
          client_id:     env.GOOGLE_CLIENT_ID,
          client_secret: env.GOOGLE_CLIENT_SECRET,
          grant_type:    'refresh_token',
        }),
      });

      const tokens = await tokenResp.json();
      if (!tokens.access_token) return cors(json({ error: 'Failed to refresh token' }, 401));

      const userResp = await fetch('https://www.googleapis.com/oauth2/v1/userinfo?alt=json', {
        headers: { Authorization: 'Bearer ' + tokens.access_token }
      });
      const user = await userResp.json();

      return cors(json({ access_token: tokens.access_token, email: user.email || '' }));
    }

    // ── Auth: logout ───────────────────────────────────────────────
    if (path === '/auth/logout' && request.method === 'POST') {
      if (!checkPassword(request, env)) return cors(json({ error: 'Invalid password' }, 403));
      await env.AUTH_KV.delete(KV_KEY);
      return cors(json({ ok: true }));
    }

    // ── Claude proxy ───────────────────────────────────────────────
    // Two-step pipeline:
    //   Step 1: Haiku + web search  → research each topic, return summaries
    //   Step 2: Chosen model        → write the full script from summaries
    if (path === '/claude' && request.method === 'POST') {
      if (!checkPassword(request, env)) return cors(json({ error: { message: 'Invalid password' } }, 403));

      try {
        const payload = await request.json();
        const { topics, prompt, model, max_tokens } = payload;

        // ── Step 1: Research with Haiku + web search (parallel) ──────
        const researchResults = await Promise.all(
          (topics || []).map(async topic => {
            const searchPrompt =
              'Search the web and find the 5 most significant news stories or developments ' +
              'about "' + topic + '" from the past 7 days. Today is ' + new Date().toDateString() + '. ' +
              'For each story provide: headline, 2-3 sentence summary, why it matters, and the source URL. ' +
              'Focus only on genuinely recent events from the last 7 days. ' +
              'Format your response clearly with each story numbered.';

            const searchResp = await fetch('https://api.anthropic.com/v1/messages', {
              method: 'POST',
              headers: {
                'Content-Type':      'application/json',
                'x-api-key':         env.ANTHROPIC_API_KEY,
                'anthropic-version': '2023-06-01',
                'anthropic-beta':    'web-search-2025-03-05',
              },
              body: JSON.stringify({
                model:      'claude-haiku-4-5-20251001',
                max_tokens: 2048,
                tools:      [{ type: 'web_search_20250305', name: 'web_search' }],
                messages:   [{ role: 'user', content: searchPrompt }],
              }),
            });

            if (!searchResp.ok) {
              const err = await searchResp.json().catch(() => ({}));
              throw new Error('Research step failed for "' + topic + '": ' + (err.error?.message || searchResp.status));
            }

            const searchData = await searchResp.json();
            const searchText = (searchData.content || [])
              .filter(b => b.type === 'text')
              .map(b => b.text)
              .join('\n')
              .trim();

            return { topic, research: searchText };
          })
        );

        // ── Step 2: Write script with chosen model ─────────────────
        const researchContext = researchResults
          .map(r => '## Recent news for topic: ' + r.topic + '\n\n' + r.research)
          .join('\n\n---\n\n');

        const enrichedPrompt =
          'The following is fresh research gathered from the web TODAY (' + new Date().toDateString() + ') ' +
          'about recent developments in the past 7 days. Use this as your primary source material — ' +
          'do not rely on your training knowledge for current events.\n\n' +
          researchContext +
          '\n\n---\n\n' +
          'Using the above research as your source material, ' + prompt;

        const writeResp = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type':      'application/json',
            'x-api-key':         env.ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model:      model || 'claude-sonnet-4-5',
            max_tokens: max_tokens || 4096,
            messages:   [{ role: 'user', content: enrichedPrompt }],
          }),
        });

        if (!writeResp.ok) {
          const err = await writeResp.json().catch(() => ({}));
          throw new Error('Writing step failed: ' + (err.error?.message || writeResp.status));
        }

        const writeData = await writeResp.json();

        return cors(json({
          content:  writeData.content,
          usage:    writeData.usage,
          research: researchResults,
        }));

      } catch (e) {
        return cors(json({ error: { message: e.message } }, 500));
      }
    }

    return cors(new Response('Not found', { status: 404 }));
  }
};

// ── Helpers ────────────────────────────────────────────────────────────────
function checkPassword(request, env) {
  return env.APP_PASSWORD && request.headers.get('X-App-Password') === env.APP_PASSWORD;
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function cors(response) {
  const r = new Response(response.body, response);
  r.headers.set('Access-Control-Allow-Origin',  '*');
  r.headers.set('Access-Control-Allow-Headers', 'Content-Type, X-App-Password, X-Api-Key, x-api-key');
  r.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  return r;
}

function htmlPage(title, body) {
  return new Response('<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + title + '</title>' +
    '<style>body{font-family:-apple-system,sans-serif;max-width:480px;margin:4rem auto;padding:2rem;text-align:center;color:#111}h1{font-size:1.5rem;margin-bottom:1.5rem}</style>' +
    '</head><body><h1>' + title + '</h1>' + body + '</body></html>',
    { headers: { 'Content-Type': 'text/html' } });
}
