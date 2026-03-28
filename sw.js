<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <meta name="mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="theme-color" content="#111111" />
  <title>AI Podcast Generator</title>
  <link rel="manifest" href="manifest.json" />
  <link rel="apple-touch-icon" href="icons/icon-192.png" />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --bg:       #f0f0ee;
      --card:     #ffffff;
      --border:   #e0e0e0;
      --border2:  #d1d5db;
      --text:     #1a1a1a;
      --text2:    #444;
      --text3:    #888;
      --text4:    #bbb;
      --accent:   #2563eb;
      --accent-l: rgba(37,99,235,0.1);
      --green:    #16a34a;
      --green-l:  #f0fdf4;
      --green-b:  #86efac;
      --red:      #dc2626;
      --red-l:    #fef2f2;
      --red-b:    #fca5a5;
      --radius:   12px;
      --safe-top: env(safe-area-inset-top, 0px);
      --safe-bot: env(safe-area-inset-bottom, 0px);
    }

    html { -webkit-text-size-adjust: 100%; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
      padding: calc(var(--safe-top) + 1rem) 1rem calc(var(--safe-bot) + 1.5rem);
    }

    /* ── Layout ── */
    .page { max-width: 1200px; margin: 0 auto; }

    header { margin-bottom: 1.25rem; display: flex; align-items: center; gap: 12px; }
    .header-icon {
      width: 40px; height: 40px; border-radius: 10px;
      background: #111; display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }
    header h1 { font-size: 1.2rem; font-weight: 600; color: #111; line-height: 1.2; }
    header p  { font-size: 0.8rem; color: var(--text3); margin-top: 2px; }

    .layout {
      display: grid;
      grid-template-columns: 360px 1fr;
      gap: 1rem;
      align-items: start;
    }
    @media (max-width: 720px) {
      .layout { grid-template-columns: 1fr; }
    }
    .col { display: flex; flex-direction: column; gap: 1rem; }

    /* ── Cards ── */
    .card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 1rem 1.125rem;
    }
    .card-title {
      font-size: 0.68rem; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.09em;
      color: var(--text4); margin-bottom: 0.875rem;
      display: flex; align-items: center; justify-content: space-between;
    }

    /* ── Form elements ── */
    label {
      display: block; font-size: 0.83rem; font-weight: 500;
      color: var(--text2); margin-bottom: 4px;
    }
    .hint { font-size: 0.74rem; color: var(--text3); margin-top: 4px; line-height: 1.5; }
    .hint a { color: var(--accent); }
    .hint code { background: #f0f0f0; padding: 1px 4px; border-radius: 3px; font-family: monospace; font-size: 0.82em; }

    .field { margin-bottom: 0.875rem; }
    .field:last-child { margin-bottom: 0; }

    input[type="text"], input[type="password"], input[type="search"],
    select, textarea {
      width: 100%; padding: 10px 12px;
      font-size: 0.9rem; /* prevents iOS zoom on focus (must be ≥16px equiv) */
      border: 1px solid var(--border2); border-radius: 8px;
      background: var(--card); color: var(--text);
      outline: none; appearance: none; -webkit-appearance: none;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    /* iOS zoom fix — font-size 16px prevents auto-zoom */
    @media (max-width: 720px) {
      input[type="text"], input[type="password"], input[type="search"], select, textarea {
        font-size: 16px;
      }
    }
    input:focus, select:focus, textarea:focus {
      border-color: var(--accent);
      box-shadow: 0 0 0 3px var(--accent-l);
    }

    .input-wrap { position: relative; display: flex; align-items: center; }
    .input-wrap input { padding-right: 40px; }
    .eye-btn {
      position: absolute; right: 10px; background: none; border: none;
      cursor: pointer; color: var(--text4); padding: 6px; line-height: 1;
      -webkit-tap-highlight-color: transparent;
    }
    .eye-btn:hover, .eye-btn:active { color: var(--text2); }

    .checkbox-row { display: flex; align-items: center; gap: 8px; margin-top: 6px; }
    .checkbox-row input { width: 18px; height: 18px; accent-color: var(--accent); padding: 0; flex-shrink: 0; }
    .checkbox-row label { margin: 0; font-weight: 400; color: var(--text3); font-size: 0.82rem; }

    select { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23888' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
      background-repeat: no-repeat; background-position: right 12px center;
      padding-right: 32px; cursor: pointer; }

    /* ── Topics ── */
    .topic-row { display: flex; gap: 8px; align-items: center; margin-bottom: 7px; }
    .topic-row input { flex: 1; }
    .btn-remove {
      background: none; border: 1px solid var(--border); border-radius: 6px;
      cursor: pointer; color: var(--text4); font-size: 14px;
      padding: 8px 11px; line-height: 1; flex-shrink: 0;
      -webkit-tap-highlight-color: transparent;
      transition: background 0.1s;
    }
    .btn-remove:active { background: #f5f5f5; color: #666; }

    /* ── Buttons ── */
    .btn {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 8px 14px; font-size: 0.84rem;
      border: 1px solid var(--border2); border-radius: 8px;
      background: var(--card); color: var(--text2); cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      transition: background 0.1s; user-select: none;
    }
    .btn:active { background: #f0f0f0; transform: scale(0.98); }

    .btn-primary {
      background: #111; color: #fff; border-color: #111;
      font-size: 1rem; padding: 14px 22px; width: 100%;
      justify-content: center; font-weight: 600; border-radius: 10px;
      letter-spacing: 0.01em;
    }
    .btn-primary:active { background: #333; transform: scale(0.99); }
    .btn-primary:disabled { opacity: 0.38; pointer-events: none; }

    .btn-google {
      background: var(--card); border: 1px solid var(--border2); color: var(--text2);
      font-size: 0.84rem; padding: 10px 16px; border-radius: 8px;
      cursor: pointer; display: inline-flex; align-items: center; gap: 8px;
      -webkit-tap-highlight-color: transparent; user-select: none;
    }
    .btn-google:active { background: #f8f8f8; }

    /* ── Auth status ── */
    .auth-status {
      display: flex; align-items: center; gap: 10px;
      padding: 9px 12px; border-radius: 8px; font-size: 0.84rem; margin-bottom: 10px;
    }
    .auth-status.connected    { background: var(--green-l); border: 1px solid var(--green-b); color: #166534; }
    .auth-status.disconnected { background: #fafafa; border: 1px solid var(--border); color: #777; }
    .auth-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .auth-dot.green { background: var(--green); }
    .auth-dot.grey  { background: #ccc; }
    #authEmail { margin-left: auto; font-size: 0.75rem; color: var(--text3); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 160px; }

    /* ── Collapsible ── */
    .collapsible-toggle {
      display: flex; align-items: center; gap: 6px;
      background: none; border: none; cursor: pointer;
      font-size: 0.78rem; color: var(--accent); padding: 0; margin-bottom: 6px;
      -webkit-tap-highlight-color: transparent;
    }
    .arrow { transition: transform 0.2s; display: inline-block; font-size: 9px; }
    .collapsible-toggle.open .arrow { transform: rotate(90deg); }
    .collapsible-body { display: none; }
    .collapsible-body.open { display: block; }

    .info-box {
      background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px;
      padding: 10px 13px; font-size: 0.77rem; color: #1e40af; line-height: 1.7;
    }
    .info-box ol { padding-left: 16px; margin-top: 5px; }
    .info-box li { margin-bottom: 3px; }
    .info-box a { color: #1d4ed8; }
    .info-box code { background: #dbeafe; padding: 1px 4px; border-radius: 3px; font-family: monospace; font-size: 0.85em; word-break: break-all; }

    /* ── Steps & log ── */
    .steps { display: none; margin-bottom: 1rem; }
    .step {
      display: flex; align-items: flex-start; gap: 10px;
      padding: 9px 0; border-bottom: 1px solid #f0f0f0; font-size: 0.84rem; color: #555;
    }
    .step:last-child { border-bottom: none; }
    .step-body { flex: 1; }
    .step-detail { font-size: 0.73rem; color: var(--text3); margin-top: 2px; }
    .dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; background: #ddd; margin-top: 4px; }
    .dot.done   { background: var(--green); }
    .dot.active { background: var(--accent); animation: pulse 1s infinite; }
    .dot.error  { background: var(--red); }
    .dot.skip   { background: #d1d5db; }
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }

    .log-wrap { margin-top: 0.875rem; }
    .log-toggle {
      background: none; border: none; cursor: pointer;
      font-size: 0.75rem; color: var(--text3); padding: 0;
      display: flex; align-items: center; gap: 5px; margin-bottom: 5px;
      -webkit-tap-highlight-color: transparent;
    }
    .log-box {
      background: #1a1a1a; color: #d4d4d4; border-radius: 8px;
      padding: 10px 13px; font-family: monospace; font-size: 0.72rem;
      line-height: 1.6; max-height: 200px; overflow-y: auto; display: none;
    }
    .log-box.open { display: block; }
    .log-line.ok   { color: #4ade80; }
    .log-line.warn { color: #facc15; }
    .log-line.err  { color: #f87171; }
    .log-line.muted{ color: #555; }

    /* ── Results ── */
    .result { margin-top: 0.875rem; }
    .success-box {
      background: var(--green-l); border: 1px solid var(--green-b); border-radius: 10px;
      padding: 12px 15px; font-size: 0.84rem; color: #166534; line-height: 1.6;
    }
    .success-box a { color: #15803d; font-weight: 500; }
    .success-box .ttl { font-weight: 600; margin-bottom: 4px; }
    .success-box hr { border-color: #bbf7d0; margin: 8px 0; border: none; border-top: 1px solid #bbf7d0; }
    .error-box {
      background: var(--red-l); border: 1px solid var(--red-b); border-radius: 10px;
      padding: 12px 15px; font-size: 0.84rem; color: #991b1b; line-height: 1.6;
    }

    /* ── Prompt textarea ── */
    #promptEditor { min-height: 260px; font-family: monospace; font-size: 0.78rem; line-height: 1.6; background: #fafafa; resize: vertical; }
    @media (max-width: 720px) { #promptEditor { font-size: 13px; min-height: 200px; } }

    /* ── Install banner ── */
    #installBanner {
      display: none; position: fixed; bottom: calc(var(--safe-bot) + 1rem); left: 1rem; right: 1rem;
      background: #111; color: #fff; border-radius: 12px; padding: 12px 16px;
      font-size: 0.84rem; z-index: 100; align-items: center; gap: 12px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.3);
    }
    #installBanner.show { display: flex; }
    #installBanner .ib-text { flex: 1; line-height: 1.4; }
    #installBanner .ib-btn {
      background: #fff; color: #111; border: none; border-radius: 8px;
      padding: 8px 14px; font-size: 0.82rem; font-weight: 600; cursor: pointer; white-space: nowrap;
    }
    #installBanner .ib-close { background: none; border: none; color: #888; font-size: 18px; cursor: pointer; padding: 0 4px; }

    .save-hint { margin-top: 1rem; font-size: 0.72rem; color: var(--text4); text-align: center; }
  </style>
</head>
<body>
<div class="page">

  <header>
    <div class="header-icon">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="9" y="2" width="6" height="11" rx="3"/>
        <path d="M5 10a7 7 0 0 0 14 0"/>
        <line x1="12" y1="19" x2="12" y2="22"/>
        <line x1="8" y1="22" x2="16" y2="22"/>
      </svg>
    </div>
    <div>
      <h1>AI Podcast Generator</h1>
      <p>Claude &rarr; script &rarr; Google Drive &rarr; NotebookLM</p>
    </div>
  </header>

  <div class="layout">

    <!-- LEFT -->
    <div class="col">

      <!-- CLAUDE -->
      <div class="card">
        <div class="card-title">Claude API</div>
        <div class="field">
          <label for="claudeKey">API key</label>
          <div class="input-wrap">
            <input type="password" id="claudeKey" placeholder="sk-ant-..." autocomplete="off" inputmode="text" />
            <button class="eye-btn" onclick="toggleVis('claudeKey')" aria-label="Show/hide">
              <svg id="eye-claudeKey" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
          </div>
          <p class="hint">Get a key at <a href="https://console.anthropic.com" target="_blank">console.anthropic.com</a></p>
          <div class="checkbox-row">
            <input type="checkbox" id="saveClaudeKey" />
            <label for="saveClaudeKey">Remember on this device</label>
          </div>
        </div>
        <div class="field">
          <label for="appPassword">App password</label>
          <div class="input-wrap">
            <input type="password" id="appPassword" placeholder="Password set in Cloudflare Worker" autocomplete="off" />
            <button class="eye-btn" onclick="toggleVis('appPassword')" aria-label="Show/hide">
              <svg id="eye-appPassword" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
          </div>
          <p class="hint">Prevents others from using your API key. Set once in Cloudflare secrets.</p>
          <div class="checkbox-row">
            <input type="checkbox" id="savePassword" />
            <label for="savePassword">Remember on this device</label>
          </div>
        </div>
        <div class="field">
          <label for="workerUrl">Cloudflare Worker URL</label>
          <input type="text" id="workerUrl" placeholder="https://your-worker.workers.dev/claude" />
          <p class="hint">Your deployed Worker URL ending in <code>/claude</code></p>
          <div class="checkbox-row">
            <input type="checkbox" id="saveWorkerUrl" checked />
            <label for="saveWorkerUrl">Remember on this device</label>
          </div>
        </div>
        <div class="field">
          <label for="modelSelect">Model</label>
          <select id="modelSelect">
            <option value="claude-sonnet-4-5">Claude Sonnet — recommended</option>
            <option value="claude-haiku-4-5-20251001">Claude Haiku — fastest &amp; cheapest</option>
            <option value="claude-opus-4-5">Claude Opus — highest quality</option>
          </select>
        </div>
      </div>

      <!-- GOOGLE DRIVE -->
      <div class="card">
        <div class="card-title">Google Drive</div>
        <div id="authStatus" class="auth-status disconnected">
          <div class="auth-dot grey" id="authDot"></div>
          <span id="authLabel">Not connected</span>
          <span id="authEmail"></span>
        </div>
        <div class="field">
          <label for="clientId">OAuth Client ID</label>
          <div class="input-wrap">
            <input type="password" id="clientId" placeholder="123456789.apps.googleusercontent.com" autocomplete="off" />
            <button class="eye-btn" onclick="toggleVis('clientId')" aria-label="Show/hide">
              <svg id="eye-clientId" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
          </div>
          <div class="checkbox-row">
            <input type="checkbox" id="saveClientId" checked />
            <label for="saveClientId">Remember on this device</label>
          </div>
        </div>
        <button class="collapsible-toggle" id="setupToggle" onclick="toggleSetup()">
          <span class="arrow">&#9654;</span> Setup instructions
        </button>
        <div class="collapsible-body" id="setupBody">
          <div class="info-box">
            <strong>One-time Google Cloud setup:</strong>
            <ol>
              <li>Go to <a href="https://console.cloud.google.com/apis/credentials" target="_blank">Google Cloud Console → Credentials</a></li>
              <li>Create Credentials → OAuth client ID → Web application</li>
              <li>Authorised JavaScript origins: add your GitHub Pages URL, e.g.<br><code>https://yourusername.github.io</code></li>
              <li>Authorised redirect URIs: add<br><code>https://yourusername.github.io/podcast-generator.html</code></li>
              <li>Copy the Client ID and paste above</li>
              <li>OAuth consent screen → External → add your email as test user</li>
              <li><a href="https://console.cloud.google.com/apis/library/drive.googleapis.com" target="_blank">Enable Google Drive API</a></li>
            </ol>
          </div>
        </div>
        <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;">
          <button class="btn-google" id="connectBtn" onclick="connectDrive()">
            <svg width="16" height="16" viewBox="0 0 48 48"><path fill="#4285F4" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#34A853" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#EA4335" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
            Connect Google Drive
          </button>
          <button class="btn" id="disconnectBtn" onclick="disconnectDrive()" style="display:none;font-size:0.77rem;color:#999;border-color:#e5e7eb;">Disconnect</button>
        </div>
      </div>

      <!-- TOPICS -->
      <div class="card">
        <div class="card-title">Topics</div>
        <div id="topics">
          <div class="topic-row"><input type="text" value="AI and agentic software development" /><button class="btn-remove" onclick="removeTopic(this)">✕</button></div>
          <div class="topic-row"><input type="text" value="Cybersecurity" /><button class="btn-remove" onclick="removeTopic(this)">✕</button></div>
        </div>
        <button class="btn" onclick="addTopic()" style="margin-top:8px;font-size:0.78rem;">+ Add topic</button>
      </div>

      <!-- SETTINGS -->
      <div class="card">
        <div class="card-title">Podcast settings</div>
        <div class="field">
          <label for="showName">Show name</label>
          <input type="text" id="showName" value="The Weekly Tech Brief" />
        </div>
        <div class="field">
          <label for="storiesPerTopic">Stories per topic</label>
          <input type="text" id="storiesPerTopic" value="5" inputmode="numeric" style="max-width:72px;" />
        </div>
      </div>

    </div><!-- /col left -->

    <!-- RIGHT -->
    <div class="col">

      <!-- PROMPT -->
      <div class="card">
        <div class="card-title">
          <span>Prompt</span>
          <span style="display:flex;gap:6px;">
            <button class="btn" onclick="resetPrompt()" style="font-size:0.7rem;padding:3px 9px;color:#999;">Reset</button>
          </span>
        </div>
        <p style="font-size:0.73rem;color:var(--text3);margin-bottom:8px;line-height:1.5;">
          Exact prompt sent to Claude. <code>{{TOPICS}}</code>, <code>{{SHOW_NAME}}</code>, <code>{{STORIES}}</code>, <code>{{DATE}}</code> are substituted at run time.
        </p>
        <textarea id="promptEditor" spellcheck="false"></textarea>
      </div>

      <!-- GENERATE -->
      <div class="card">
        <button class="btn-primary" id="runBtn" onclick="run()">Generate &amp; upload ↗</button>

        <div class="steps" id="stepsWrap">
          <div class="step"><div class="dot" id="d1"></div><div class="step-body"><div id="t1">Calling Claude...</div><div class="step-detail" id="d1x"></div></div></div>
          <div class="step"><div class="dot" id="d2"></div><div class="step-body"><div id="t2">Formatting script...</div><div class="step-detail" id="d2x"></div></div></div>
          <div class="step"><div class="dot" id="d3"></div><div class="step-body"><div id="t3">Uploading to Drive...</div><div class="step-detail" id="d3x"></div></div></div>
        </div>

        <div class="log-wrap" id="logWrap" style="display:none;">
          <button class="log-toggle" onclick="toggleLog()">
            <span id="logArrow" style="display:inline-block;transition:transform 0.2s;">&#9654;</span>&nbsp;Activity log
          </button>
          <div class="log-box" id="logBox"></div>
        </div>

        <div class="result" id="result"></div>
      </div>

    </div><!-- /col right -->

  </div><!-- /layout -->

  <p class="save-hint">All data stored locally on this device only.</p>

</div>

<!-- Install banner -->
<div id="installBanner">
  <div class="ib-text"><strong>Install as app</strong><br>Add to your home screen for quick access</div>
  <button class="ib-btn" onclick="installApp()">Install</button>
  <button class="ib-close" onclick="dismissInstall()">✕</button>
</div>

<script>
// ── PWA install ────────────────────────────────────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  deferredPrompt = e;
  if (!LS.get('install_dismissed')) {
    document.getElementById('installBanner').classList.add('show');
  }
});

function installApp() {
  document.getElementById('installBanner').classList.remove('show');
  if (deferredPrompt) { deferredPrompt.prompt(); deferredPrompt = null; }
}
function dismissInstall() {
  document.getElementById('installBanner').classList.remove('show');
  LS.set('install_dismissed', '1');
}

// ── localStorage ──────────────────────────────────────────────────────
const LS = {
  get: k     => { try { return localStorage.getItem(k); }  catch(e){ return null; } },
  set: (k,v) => { try { localStorage.setItem(k, v); }      catch(e){} },
  del: k     => { try { localStorage.removeItem(k); }      catch(e){} }
};

// ── State ─────────────────────────────────────────────────────────────
let accessToken = null;

// ── Eye toggle ────────────────────────────────────────────────────────
const EYE_OPEN  = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
const EYE_SLASH = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>';
function toggleVis(id) {
  const inp = document.getElementById(id);
  const eye = document.getElementById('eye-' + id);
  const show = inp.type === 'password';
  inp.type = show ? 'text' : 'password';
  eye.innerHTML = show ? EYE_SLASH : EYE_OPEN;
  ['fill','none','stroke','currentColor','stroke-width','2','stroke-linecap','round','stroke-linejoin','round'].forEach((v,i,a) => { if(i%2===0) eye.setAttribute(v, a[i+1]); });
}

// ── Collapsible ───────────────────────────────────────────────────────
function toggleSetup() {
  const t = document.getElementById('setupToggle');
  const b = document.getElementById('setupBody');
  const open = b.classList.toggle('open');
  t.classList.toggle('open', open);
}

// ── Log ───────────────────────────────────────────────────────────────
function toggleLog() {
  const box = document.getElementById('logBox');
  const arr = document.getElementById('logArrow');
  const open = box.classList.toggle('open');
  arr.style.transform = open ? 'rotate(90deg)' : '';
}
function log(msg, type='info') {
  document.getElementById('logWrap').style.display = 'block';
  const box  = document.getElementById('logBox');
  const line = document.createElement('div');
  line.className = 'log-line ' + type;
  const ts = new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
  line.textContent = '['+ts+'] '+msg;
  box.appendChild(line);
  box.scrollTop = box.scrollHeight;
}
function clearLog() {
  document.getElementById('logBox').innerHTML = '';
  document.getElementById('logWrap').style.display = 'none';
  const box = document.getElementById('logBox');
  const arr = document.getElementById('logArrow');
  box.classList.remove('open');
  arr.style.transform = '';
}

// ── Prompt ────────────────────────────────────────────────────────────
function buildDefaultPrompt() {
  return 'You are a podcast script writer. Research and write a full, engaging weekly podcast script for the show "{{SHOW_NAME}}", covering the LATEST NEWS and developments from the past 7 days on these topics:\n{{TOPICS}}\n\nToday\'s date is {{DATE}}.\n\nStructure:\n- Warm, conversational intro setting the tone for the week\n- One clearly labelled segment per topic\n- {{STORIES}} specific recent stories per segment. For each: a clear headline, what happened, why it matters, interesting context\n- A wrap-up tying the main themes together\n- Tone: natural spoken-word audio — engaging, not too formal\n- Mark [HOST] at the start of each main section\n- Use --- STORY TITLE --- for each story\n- Target: ~1800 words\n\nWrite the complete script now:';
}
function resetPrompt() {
  document.getElementById('promptEditor').value = buildDefaultPrompt();
  LS.del('saved_prompt');
}
function resolvePrompt(show, topics, stories, date) {
  return document.getElementById('promptEditor').value
    .replace(/\{\{SHOW_NAME\}\}/g, show).replace(/\{\{TOPICS\}\}/g, topics)
    .replace(/\{\{STORIES\}\}/g, stories).replace(/\{\{DATE\}\}/g, date);
}

// ── On load ───────────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  const pairs = [
    ['claudeKey','claude_key','saveClaudeKey'],
    ['appPassword','app_password','savePassword'],
    ['clientId','goog_client_id','saveClientId'],
    ['workerUrl','worker_url','saveWorkerUrl'],
  ];
  pairs.forEach(([elId, lsKey, cbId]) => {
    const v = LS.get(lsKey);
    if (v) { document.getElementById(elId).value = v; document.getElementById(cbId).checked = true; }
    document.getElementById(elId).addEventListener('input', e => {
      if (document.getElementById(cbId).checked) LS.set(lsKey, e.target.value.trim());
    });
    document.getElementById(cbId).addEventListener('change', e => {
      e.target.checked ? LS.set(lsKey, document.getElementById(elId).value.trim()) : LS.del(lsKey);
    });
  });

  document.getElementById('promptEditor').value = LS.get('saved_prompt') || buildDefaultPrompt();
  document.getElementById('promptEditor').addEventListener('input', e => LS.set('saved_prompt', e.target.value));

  handleOAuthCallback();
});

// ── Auth ──────────────────────────────────────────────────────────────
function setAuthConnected(email) {
  accessToken = accessToken;
  document.getElementById('authDot').className    = 'auth-dot green';
  document.getElementById('authLabel').textContent = 'Connected';
  document.getElementById('authEmail').textContent = email || '';
  document.getElementById('authStatus').className  = 'auth-status connected';
  document.getElementById('connectBtn').style.display    = 'none';
  document.getElementById('disconnectBtn').style.display = 'inline-flex';
}
function setAuthDisconnected() {
  accessToken = null;
  document.getElementById('authDot').className    = 'auth-dot grey';
  document.getElementById('authLabel').textContent = 'Not connected';
  document.getElementById('authEmail').textContent = '';
  document.getElementById('authStatus').className  = 'auth-status disconnected';
  document.getElementById('connectBtn').style.display    = 'inline-flex';
  document.getElementById('disconnectBtn').style.display = 'none';
}
function disconnectDrive() { setAuthDisconnected(); }

function connectDrive() {
  const clientId = document.getElementById('clientId').value.trim();
  if (!clientId) { alert('Please enter your OAuth Client ID first.'); return; }
  LS.set('goog_client_id', clientId);
  const redirectUri = window.location.href.split('?')[0].split('#')[0];
  window.location.href = 'https://accounts.google.com/o/oauth2/v2/auth?' + new URLSearchParams({
    client_id: clientId, redirect_uri: redirectUri, response_type: 'token',
    scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email',
    prompt: 'consent'
  });
}
function handleOAuthCallback() {
  const hash = window.location.hash;
  if (!hash || !hash.includes('access_token')) {
    const cid = LS.get('goog_client_id'); if (cid) trySilentAuth(cid); return;
  }
  const token = new URLSearchParams(hash.substring(1)).get('access_token');
  if (!token) return;
  history.replaceState(null, '', window.location.pathname);
  accessToken = token;
  fetch('https://www.googleapis.com/oauth2/v1/userinfo?alt=json', { headers: { Authorization: 'Bearer '+token } })
    .then(r => r.json()).then(i => setAuthConnected(i.email||'')).catch(() => setAuthConnected(''));
}
function trySilentAuth(clientId) {
  const redirectUri = window.location.href.split('?')[0].split('#')[0];
  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'display:none;width:0;height:0;';
  iframe.src = 'https://accounts.google.com/o/oauth2/v2/auth?' + new URLSearchParams({
    client_id: clientId, redirect_uri: redirectUri, response_type: 'token',
    scope: 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email',
    prompt: 'none'
  });
  document.body.appendChild(iframe);
  const cleanup = () => { try { document.body.removeChild(iframe); } catch(e){} };
  const t = setTimeout(cleanup, 8000);
  iframe.onload = () => {
    try {
      const h = iframe.contentWindow.location.hash;
      if (h && h.includes('access_token')) {
        const tok = new URLSearchParams(h.substring(1)).get('access_token');
        if (tok) {
          clearTimeout(t); cleanup(); accessToken = tok;
          fetch('https://www.googleapis.com/oauth2/v1/userinfo?alt=json', { headers: { Authorization: 'Bearer '+tok } })
            .then(r => r.json()).then(i => setAuthConnected(i.email||'')).catch(() => setAuthConnected(''));
          return;
        }
      }
    } catch(e) {}
    clearTimeout(t); cleanup();
  };
}

// ── Topics ────────────────────────────────────────────────────────────
function addTopic() {
  const d = document.createElement('div'); d.className = 'topic-row';
  d.innerHTML = '<input type="text" placeholder="Enter a topic..." /><button class="btn-remove" onclick="removeTopic(this)">✕</button>';
  document.getElementById('topics').appendChild(d); d.querySelector('input').focus();
}
function removeTopic(btn) {
  if (document.querySelectorAll('.topic-row').length > 1) btn.parentElement.remove();
}

// ── Steps ─────────────────────────────────────────────────────────────
function setStep(n, state, text, detail) {
  document.getElementById('d'+n).className = 'dot '+state;
  if (text)   document.getElementById('t'+n).textContent  = text;
  if (detail !== undefined) document.getElementById('d'+n+'x').textContent = detail;
}
function resetSteps() {
  [[1,'Calling Claude...'],[2,'Formatting script...'],[3,'Uploading to Drive...']].forEach(([n,t]) => {
    document.getElementById('d'+n).className = 'dot';
    document.getElementById('t'+n).textContent = t;
    document.getElementById('d'+n+'x').textContent = '';
  });
}

// ── Main ──────────────────────────────────────────────────────────────
async function run() {
  const claudeKey  = document.getElementById('claudeKey').value.trim();
  const password   = document.getElementById('appPassword').value.trim();
  const workerUrl  = document.getElementById('workerUrl').value.trim();
  const showName   = document.getElementById('showName').value.trim() || 'The Weekly Tech Brief';
  const stories    = parseInt(document.getElementById('storiesPerTopic').value) || 5;
  const model      = document.getElementById('modelSelect').value || 'claude-sonnet-4-5';
  const topics     = [...document.querySelectorAll('#topics input')].map(i => i.value.trim()).filter(Boolean);

  if (!claudeKey)  { alert('Please enter your Claude API key.'); return; }
  if (!password)   { alert('Please enter your app password.'); return; }
  if (!workerUrl)  { alert('Please enter your Cloudflare Worker URL.'); return; }
  if (!topics.length) { alert('Please add at least one topic.'); return; }

  const btn = document.getElementById('runBtn');
  btn.disabled = true;
  document.getElementById('stepsWrap').style.display = 'block';
  document.getElementById('result').innerHTML = '';
  resetSteps(); clearLog();

  const today   = new Date();
  const dateStr = today.toISOString().slice(0,10).replace(/-/g,'');
  const fileName = 'ai-podcast'+dateStr+'.txt';

  log('Starting: '+topics.join(', '));
  log('Model: '+model);

  // Step 1 — Claude
  setStep(1,'active','Calling Claude...','Sending to Worker — takes 20–40 seconds...');
  log('Connecting to Cloudflare Worker...');
  let script = '';
  try {
    const topicList = topics.map((t,i) => (i+1)+'. '+t).join('\n');
    const prompt    = resolvePrompt(showName, topicList, stories, today.toDateString());
    log('Prompt: '+prompt.length+' chars');

    const t0   = Date.now();
    const resp = await fetch(workerUrl, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json', 'X-Api-Key': claudeKey, 'X-App-Password': password },
      body:    JSON.stringify({ model, max_tokens: 4096, messages: [{ role: 'user', content: prompt }] })
    });

    const elapsed = ((Date.now()-t0)/1000).toFixed(1);
    log('HTTP '+resp.status+' after '+elapsed+'s');

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Worker error '+resp.status);
    }

    const data = await resp.json();
    const raw  = data.content?.[0]?.text;
    if (!raw) throw new Error('No content returned. Check your API key and password.');

    const words = raw.trim().split(/\s+/).length;
    log('~'+words+' words received', 'ok');
    if (data.usage) log('Tokens — in: '+data.usage.input_tokens+' out: '+data.usage.output_tokens, 'muted');
    setStep(1,'done','Claude complete.','~'+words+' words');

    // Step 2 — Format
    setStep(2,'active','Formatting...','');
    const sep = '='.repeat(56);
    script = showName.toUpperCase()+'\nEpisode date: '+today.toDateString()+'\nPrepared for Google NotebookLM\n'+sep+'\n\n'+raw+'\n\n'+sep+'\nGenerated by AI Podcast Generator\nTopics: '+topics.join(', ')+'\n';
    log('Formatted. Total: '+script.length+' chars', 'ok');
    setStep(2,'done','Script formatted.',script.length+' chars');

  } catch(e) {
    log('ERROR: '+e.message, 'err');
    setStep(1,'error','Error.',e.message);
    setStep(2,'error'); setStep(3,'error');
    document.getElementById('result').innerHTML = '<div class="error-box"><strong>Error:</strong> '+e.message+'</div>';
    if (!document.getElementById('logBox').classList.contains('open')) toggleLog();
    btn.disabled = false;
    return;
  }

  // Step 3 — Upload or download
  if (accessToken) {
    setStep(3,'active','Uploading to Drive...','');
    log('Uploading '+fileName+'...');
    try {
      const meta     = JSON.stringify({ name: fileName, mimeType: 'text/plain' });
      const boundary = 'podcast_boundary';
      const body     = '--'+boundary+'\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n'+meta+'\r\n--'+boundary+'\r\nContent-Type: text/plain; charset=UTF-8\r\n\r\n'+script+'\r\n--'+boundary+'--';
      const up = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer '+accessToken, 'Content-Type': 'multipart/related; boundary='+boundary },
        body
      });
      if (!up.ok) { const e = await up.json().catch(()=>({})); throw new Error(e.error?.message || 'Drive error '+up.status); }
      const file = await up.json();
      log('Uploaded. ID: '+file.id, 'ok');
      setStep(3,'done','Uploaded to Drive.',file.name);
      document.getElementById('result').innerHTML =
        '<div class="success-box"><div class="ttl">&#10003; '+file.name+' uploaded</div>'+
        (file.webViewLink ? '<div><a href="'+file.webViewLink+'" target="_blank">Open in Google Drive &rarr;</a></div>' : '')+
        '<hr><strong>Next:</strong> Open <a href="https://notebooklm.google.com" target="_blank">NotebookLM</a> &rarr; Add source &rarr; Google Drive &rarr; select the file &rarr; Generate Audio Overview.</div>';
    } catch(e) {
      log('Drive failed: '+e.message, 'err');
      setStep(3,'error','Upload failed.','Downloading instead');
      downloadFile(script, fileName);
      document.getElementById('result').innerHTML = '<div class="error-box"><strong>Drive upload failed:</strong> '+e.message+'<br><br>File downloaded instead.</div>';
    }
  } else {
    log('No Drive connection — downloading.', 'warn');
    setStep(3,'skip','Downloaded locally.','');
    downloadFile(script, fileName);
    document.getElementById('result').innerHTML =
      '<div class="success-box"><div class="ttl">&#10003; '+fileName+' downloaded</div><div>Upload to <a href="https://drive.google.com" target="_blank">Google Drive</a> then add as source in <a href="https://notebooklm.google.com" target="_blank">NotebookLM</a>.</div></div>';
  }

  log('Done.', 'ok');
  btn.disabled = false;
}

function downloadFile(content, name) {
  const blob = new Blob([content], {type:'text/plain;charset=utf-8'});
  const url  = URL.createObjectURL(blob);
  const a    = Object.assign(document.createElement('a'), {href:url, download:name});
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
</script>
</body>
</html>
