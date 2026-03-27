# Zero-Cost Live Streaming + Private Group Video Archive

This project is a **free-first live streaming app starter** that uses:

- **Jitsi Meet (free)** for real-time group video sessions
- A **Cloudflare Worker (free tier)** as a secure upload bridge
- A **private Telegram group** as the permanent-ish archive/chat where videos are uploaded and downloadable by group members

## Important reality check (so you can plan correctly)

No platform can guarantee truly infinite storage forever at absolute zero cost. This setup is the closest practical option with free resources, but it still depends on third-party platform policies over time.

What this starter gives you:

- ✅ Zero paid infrastructure to start
- ✅ Private participant-only access via Telegram private group membership
- ✅ Large video upload support (within Telegram limits)
- ⚠️ "Forever" means "kept until provider policy/account retention changes"

## Architecture

1. Participants join a room in this web app.
2. The app embeds a Jitsi meeting for live video communication.
3. A participant can record video locally in-browser (`MediaRecorder`).
4. The recording uploads to a Cloudflare Worker endpoint.
5. Worker forwards file to Telegram Bot API `sendDocument` into a private group chat.
6. Group members can view/download the video inside Telegram.

## Prerequisites (all free)

- Telegram account
- Telegram private group
- Telegram bot token (via BotFather)
- Cloudflare account (free tier)
- Node.js 20+

## Step 1: Telegram setup

1. Create a **private Telegram group**.
2. Add only approved participants.
3. Create bot with `@BotFather`, get `BOT_TOKEN`.
4. Add bot to private group and give permission to post files.
5. Get the group `CHAT_ID`:
   - Send a test message in group.
   - Call:
     - `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
   - Find `chat.id` for the group message.

## Step 2: Cloudflare Worker setup

`worker/index.js` is the upload bridge.

Set Worker secrets:

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`
- `UPLOAD_SHARED_KEY` (a strong secret participants must know)

Deploy worker (example with Wrangler):

```bash
cd worker
npm install
npx wrangler login
npx wrangler secret put TELEGRAM_BOT_TOKEN
npx wrangler secret put TELEGRAM_CHAT_ID
npx wrangler secret put UPLOAD_SHARED_KEY
npx wrangler deploy
```

Copy deployed Worker URL, e.g. `https://stream-upload.<subdomain>.workers.dev`.

## Step 3: Frontend setup

Serve `app/` as static files (Cloudflare Pages / GitHub Pages / Netlify free tier / local).

Set in `app/main.js`:

- `UPLOAD_ENDPOINT` = your Worker URL + `/upload`

Then open app in browser.

## Local run

```bash
cd app
python3 -m http.server 8080
# open http://localhost:8080
```

## Security model

- Live room access is by room name sharing (you can distribute only to group participants).
- Archive access is controlled by Telegram private group membership.
- Upload endpoint requires shared key (`X-Upload-Key`) so outsiders cannot upload.

## Practical limits

- Jitsi quality depends on participant bandwidth.
- Browser recording quality/file size depends on codec and device.
- Telegram upload size limits vary by account/platform policy.

## Recommended hardening (still free)

- Rotate `UPLOAD_SHARED_KEY` monthly.
- Add short-lived JWT in Worker if you later add your own auth service.
- Add file-size guardrails in Worker.
- Add malware scanning before upload (ClamAV on free runner if needed).

## Files

- `app/index.html` - UI
- `app/main.js` - Jitsi embed + recording + upload flow
- `app/styles.css` - styling
- `worker/index.js` - secure upload proxy to Telegram Bot API

