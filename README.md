# AI Podcast Generator

A tool that automatically researches the week's news using Claude AI, formats it as a podcast script, and uploads it to Google Drive — where NotebookLM turns it into an audio podcast you can listen to on your phone.

Works from any device with a browser — desktop, laptop, or Android phone (installed as a home screen app).

---

## How it all works together

```
┌─────────────────────────────────────────────────────────────┐
│                        YOUR DEVICES                         │
│                                                             │
│   Any browser (Windows, Mac, Android)                       │
│   https://epiphonesgcustom.github.io/AIPodcast/             │
│              podcast-generator.html                         │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           │ POST /claude
                           │ POST /auth/token
                           ▼
┌─────────────────────────────────────────────────────────────┐
│               CLOUDFLARE WORKER (free, no server)           │
│         misty-mud-5a13.epiphonesgcustom.workers.dev         │
│                                                             │
│  • Checks APP_PASSWORD on every request                     │
│  • /claude        → forwards to Anthropic API               │
│  • /auth/login    → redirects to Google sign-in             │
│  • /auth/callback → exchanges code for tokens, stores in KV │
│  • /auth/token    → returns fresh access token from KV      │
│  • /auth/logout   → deletes stored token                    │
└──────┬───────────────────────────────────┬───────────────────┘
       │                                   │
       ▼                                   ▼
┌─────────────────┐             ┌──────────────────────────────┐
│  Anthropic API  │             │  Cloudflare KV Storage       │
│  (Claude AI)    │             │  Stores your Google refresh  │
│                 │             │  token permanently and       │
│  Generates the  │             │  securely — this is why you  │
│  podcast script │             │  never need to log in again  │
└─────────────────┘             └──────────────────────────────┘
                                           │
                                           │ access token
                                           ▼
                               ┌──────────────────────────────┐
                               │       Google Drive API       │
                               │  Receives the uploaded .txt  │
                               │  script file                 │
                               └──────────────┬───────────────┘
                                              │
                                              ▼
                               ┌──────────────────────────────┐
                               │  Google NotebookLM           │
                               │  Add the file as a source,   │
                               │  generate Audio Overview,    │
                               │  listen in the mobile app    │
                               └──────────────────────────────┘
```

---

## The pieces explained

### 1. The app (GitHub Pages)

URL: `https://epiphonesgcustom.github.io/AIPodcast/podcast-generator.html`
Repository: `https://github.com/epiphonesgcustom/AIPodcast`

A single HTML file hosted as a static website on GitHub Pages — free, always on. Works in any browser on any device. On Android it can be installed as a home screen app (PWA) so it looks and behaves like a native app.

Five files live in the GitHub repository:

| File | Purpose |
|------|---------|
| `podcast-generator.html` | The entire app UI and logic |
| `manifest.json` | Tells Android Chrome this is an installable app |
| `sw.js` | Service worker — caches the app for fast loading |
| `icons/icon-192.png` | App icon (home screen) |
| `icons/icon-512.png` | App icon (large) |

---

### 2. Cloudflare Worker

URL: `https://misty-mud-5a13.epiphonesgcustom.workers.dev`

A small piece of JavaScript running permanently in Cloudflare's cloud — free, always on, no server to manage. It does three things:

**Acts as a secure proxy for Claude** — browsers can't call the Anthropic API directly (CORS restriction), so the app calls the Worker instead. The Worker forwards the request with your API key attached. Your API key never touches the browser.

**Handles Google authentication** — manages the full OAuth flow so you only ever sign in to Google once. After that it silently fetches a fresh access token on every app load using a stored refresh token.

**Enforces password protection** — every request must include your `APP_PASSWORD`. Without it the Worker returns a 403 error. This prevents anyone from using your API key even if they find your GitHub Pages URL.

**Secrets stored in Cloudflare (encrypted, never visible after saving):**

| Secret | What it is |
|--------|-----------|
| `ANTHROPIC_API_KEY` | Your Claude API key |
| `APP_PASSWORD` | Password you chose to protect the app |
| `GOOGLE_CLIENT_ID` | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | From Google Cloud Console |

**KV storage binding:**

| Variable name | Namespace | What it stores |
|---------------|-----------|----------------|
| `AUTH_KV` | `PODCAST_AUTH` | Your Google refresh token |

---

### 3. Google OAuth & Drive

The app uploads the generated script to your Google Drive as a `.txt` file.

**Why you only sign in once:**

Google OAuth has two token types:
- **Access token** — works for 1 hour, used to call the Drive API
- **Refresh token** — never expires, used to silently get new access tokens

The first time you click "Connect Google Drive", a popup opens, you sign in, and Google sends a refresh token to the Worker's `/auth/callback` endpoint. The Worker stores it permanently in Cloudflare KV.

Every time you open the app after that, it calls `/auth/token` on the Worker. The Worker fetches the stored refresh token, exchanges it with Google for a fresh access token, and returns it. Drive shows as "Connected" automatically — no login needed.

**Google Cloud OAuth settings:**

| Setting | Value |
|---------|-------|
| Authorised JavaScript origins | `https://epiphonesgcustom.github.io` |
| Authorised redirect URIs | `https://epiphonesgcustom.github.io/AIPodcast/podcast-generator.html` |
| Authorised redirect URIs | `https://misty-mud-5a13.epiphonesgcustom.workers.dev/auth/callback` |

---

### 4. NotebookLM

Once the script is uploaded to Google Drive:

1. Open [notebooklm.google.com](https://notebooklm.google.com)
2. Create or open a notebook
3. Click **+ Add source** → **Google Drive** → select the `ai-podcastYYYYMMDD.txt` file
4. Click **Generate Audio Overview**
5. Listen in the NotebookLM mobile app

---

## The weekly workflow

1. Open the app (browser bookmark or Android home screen icon)
2. Google Drive connects automatically in the background
3. Click **Generate & upload**
4. Wait ~30 seconds
5. Open **NotebookLM** → Add source → the new file → Generate Audio Overview
6. Listen

---

## Where things are stored

| What | Where |
|------|-------|
| Claude API key | Cloudflare encrypted secret |
| App password | Browser localStorage on each device |
| Google refresh token | Cloudflare KV (encrypted at rest) |
| Google access token | App memory only (gone when you close the app) |
| Worker URL | Browser localStorage on each device |
| Generated scripts | Your Google Drive |
| Prompt customisations | Browser localStorage on each device |

---

## Costs

| Service | Cost |
|---------|------|
| GitHub Pages | Free |
| Cloudflare Worker | Free (100,000 requests/day limit — you use ~1/week) |
| Cloudflare KV | Free |
| Claude API | ~$0.01–0.03 per script (pay-as-you-go) |
| Google Drive | Free |
| NotebookLM | Free |

---

## Security model

- GitHub repository is **public** but contains no secrets — safe to be public
- Claude API key lives only as an **encrypted Cloudflare secret** — never in code, never in the browser
- `APP_PASSWORD` is your gate — without it no one can use your Worker even if they find the URL
- Google refresh token is stored in **Cloudflare KV** (encrypted at rest) — not in the browser, not in code
- Worst case if your GitHub Pages URL leaks: someone needs both the URL **and** your `APP_PASSWORD` to do anything

---

## Full setup guide (from scratch)

Follow these steps in order to rebuild everything from zero.

---

### Prerequisites

- A **GitHub account** (free)
- A **Cloudflare account** (free, no credit card — sign up at [cloudflare.com](https://cloudflare.com))
- A **Google account**
- A **Claude API key** with billing enabled (see Step 1)

---

### Step 1 — Get a Claude API key

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Sign up or log in
3. Go to **API Keys** → **Create Key** — copy it (`sk-ant-...`)
4. Go to **Billing** → add a payment method and some credits ($5 minimum — lasts a very long time at ~$0.02 per script)
5. Optionally set a **monthly spending limit** (e.g. $5) under Billing → Usage limits for peace of mind

---

### Step 2 — Set up Google Cloud

**Create a project:**
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Click the project dropdown at the top → **New Project**
3. Give it any name (e.g. "Podcast Generator") → **Create**

**Enable the Google Drive API:**
1. Go to [APIs & Services → Library](https://console.cloud.google.com/apis/library/drive.googleapis.com)
2. Click **Enable**

**Configure the OAuth consent screen:**
1. Go to [APIs & Services → OAuth consent screen](https://console.cloud.google.com/auth/audience)
2. User type: **External** → **Create**
3. Fill in App name (e.g. "Podcast Generator") and your email address
4. Click through to **Test users** → **+ Add users** → add your Google email → **Save**
5. Click through to the end

**Create an OAuth Client ID:**
1. Go to [APIs & Services → Credentials](https://console.cloud.google.com/apis/credentials)
2. Click **+ Create Credentials** → **OAuth client ID**
3. Application type: **Web application**
4. Under **Authorised JavaScript origins** → **+ Add URI**:
   - `https://YOURUSERNAME.github.io`
5. Under **Authorised redirect URIs** → **+ Add URI**:
   - `https://YOURUSERNAME.github.io/REPONAME/podcast-generator.html`
   - `https://YOUR-WORKER-URL/auth/callback` *(add this after Step 3)*
6. Click **Create** — copy the **Client ID** and **Client Secret** somewhere safe

---

### Step 3 — Set up Cloudflare Worker

**Create a Cloudflare account:**
1. Go to [cloudflare.com](https://cloudflare.com) → Sign up (free, no credit card required)

**Create a KV namespace:**
1. Go to **Storage and Databases** → **Workers KV**
2. Click **Create namespace**
3. Name: `PODCAST_AUTH` → **Add**

**Create the Worker:**
1. Go to **Workers & Pages** → **Create** → **Create Worker**
2. Give it a name → **Deploy**
3. Click **Edit code**
4. Delete all the default code
5. Open `worker.js` from this package in a text editor and find this line near the top:
   ```
   const REDIRECT = 'https://misty-mud-5a13.epiphonesgcustom.workers.dev/auth/callback';
   ```
   Replace it with your own Worker URL:
   ```
   const REDIRECT = 'https://YOUR-WORKER-NAME.YOUR-ACCOUNT.workers.dev/auth/callback';
   ```
6. Paste the entire updated `worker.js` into the Cloudflare editor
7. Click **Deploy**
8. Note your Worker URL shown at the top of the page

**Add secrets:**
1. Go to your Worker → **Settings** → **Variables and Secrets**
2. Add each of these as type **Secret**:

   | Name | Value |
   |------|-------|
   | `ANTHROPIC_API_KEY` | Your Claude API key (`sk-ant-...`) |
   | `APP_PASSWORD` | A password you choose (e.g. `PodcastGen2026!`) |
   | `GOOGLE_CLIENT_ID` | From Step 2 |
   | `GOOGLE_CLIENT_SECRET` | From Step 2 |

3. Click **Deploy** after adding all secrets

**Bind the KV namespace:**
1. Go to your Worker → **Bindings** tab
2. Click **Add binding** → **KV Namespace**
3. Variable name: `AUTH_KV`
4. KV Namespace: select `PODCAST_AUTH`
5. Click **Save**

**Go back to Google Cloud (Step 2) and add the callback URI:**
- Add to Authorised redirect URIs: `https://YOUR-WORKER-URL/auth/callback`

---

### Step 4 — Publish to GitHub Pages

**Update files with your details:**

Before uploading, open these files in a text editor and replace the placeholders:

`manifest.json` — update `start_url` and `scope`:
```json
"start_url": "/YOUR-REPO-NAME/podcast-generator.html",
"scope": "/YOUR-REPO-NAME/",
```

`sw.js` — update the cache paths:
```javascript
const SHELL = [
  '/YOUR-REPO-NAME/podcast-generator.html',
  '/YOUR-REPO-NAME/manifest.json',
  '/YOUR-REPO-NAME/icons/icon-192.png',
  '/YOUR-REPO-NAME/icons/icon-512.png',
];
```

**Create the GitHub repository:**
1. Go to [github.com](https://github.com) → **New repository**
2. Name it (e.g. `AIPodcast`)
3. Set to **Public** (required for free GitHub Pages)
4. Tick **Add a README file** → **Create repository**

**Upload the files:**
1. Click **Add file** → **Upload files**
2. Upload all five files: `podcast-generator.html`, `manifest.json`, `sw.js`, `icons/icon-192.png`, `icons/icon-512.png`
3. Click **Commit changes**

**Enable GitHub Pages:**
1. Go to repository **Settings** → **Pages**
2. Source: **Deploy from a branch** / Branch: **main** / folder: **/ (root)**
3. Click **Save**
4. Wait ~60 seconds — your app is live at:
   `https://YOURUSERNAME.github.io/REPONAME/podcast-generator.html`

---

### Step 5 — First-time configuration

Open your GitHub Pages URL in any browser and fill in these fields — tick "Remember on this device" for each:

| Field | Value |
|-------|-------|
| Claude API key | Your `sk-ant-...` key |
| App password | The `APP_PASSWORD` you set in Cloudflare |
| Cloudflare Worker base URL | `https://YOUR-WORKER-NAME.YOUR-ACCOUNT.workers.dev` (no `/claude` at the end) |

Then click **Connect Google Drive** — a popup opens, sign in with your Google account. This is the only time you'll ever need to sign in. After that Drive connects automatically on every visit.

---

### Step 6 — Install as Android app

1. Open **Chrome** on your Android phone
2. Visit your GitHub Pages URL
3. Tap the three-dot menu (⋮) → **Add to Home Screen** → **Add**
4. Tap the new home screen icon — fill in the same fields as Step 5 and connect Google Drive once

---

### Step 7 — Verify everything works

1. Open the app — Google Drive should show as **Connected**
2. Click **Generate & upload**
3. Wait ~30 seconds — check the activity log if you want to see what's happening
4. Check your Google Drive for a new `ai-podcastYYYYMMDD.txt` file
5. Open [notebooklm.google.com](https://notebooklm.google.com) → create a notebook → **+ Add source** → **Google Drive** → select the file → **Generate Audio Overview**

---

## Troubleshooting

**"Invalid password" error**
The APP_PASSWORD in the app doesn't match the secret in Cloudflare. Check both — passwords are case-sensitive.

**"Failed to fetch" / CORS error**
The Worker URL in the app is wrong. Check it has no trailing slash and no `/claude` at the end. Verify the Worker is Active in the Cloudflare dashboard.

**Drive shows "Not connected" on load**
No refresh token is stored yet — click "Connect Google Drive" to sign in (only needed once per Cloudflare Worker setup).

**"redirect_uri_mismatch" when connecting Drive**
The callback URL isn't in your Google OAuth client. Make sure `https://YOUR-WORKER-URL/auth/callback` is listed under Authorised redirect URIs.

**Mobile app showing old version after an update**
The service worker has cached the previous version. Uninstall the app from your home screen and reinstall by visiting the GitHub Pages URL in Chrome.

**Script generates but Drive upload fails**
The access token may have expired mid-session. Tap Disconnect then Connect Google Drive again.

**Claude API error 529 / overloaded**
Anthropic's servers are busy. Wait a minute and try again.

---

## What to do if you need to start over

1. **Cloudflare Worker** — paste updated `worker.js`, add the 4 secrets, bind `AUTH_KV`
2. **Google OAuth client** — recreate with the correct redirect URIs (GitHub Pages URL and Worker callback)
3. **GitHub repo** — upload the 5 files, enable Pages
4. Enter your keys and Worker URL in the app on each device, connect Google Drive once

Your Google Drive files and NotebookLM notebooks are unaffected — they live in your Google account independently.
