# VR AUTO DM — VR Developments

Instagram comment-to-private-reply starter with a GitHub Pages-compatible dashboard and a separate Node.js webhook service.

## What is included

- Responsive futuristic dashboard (`public/`) suitable for GitHub Pages.
- Node/Express webhook receiver (`server.js`) for Meta Instagram comment events.
- Private reply request for eligible comments using the Instagram Graph API.
- Optional keyword filter and customizable message template.
- Environment-based secrets; access tokens are never placed in frontend code.

## Important: what this project can and cannot do

**The selected workflow (A)** is: someone comments on a post, and the system sends a private reply to that comment.

The requested automatic follow check is **not implemented**. Meta's supported Instagram APIs do not provide a general endpoint to determine whether an arbitrary commenter follows your account. Do not present the workflow as verified. You can invite the commenter to follow in the private reply, but this project cannot confirm the follow and unlock another message.

Instagram private replies are subject to Meta's eligibility, permission, messaging-window, and rate-limit rules. The API generally permits one private reply to a comment, within the applicable time window. Check the current Meta documentation and app review requirements before production use.

## Architecture

- **GitHub Pages:** serves the static dashboard only.
- **Node server:** must be deployed to a public HTTPS host that supports a persistent web service and environment variables. It receives Meta webhooks and calls the Graph API.
- **Meta Developer app:** connects an eligible Instagram professional account and subscribes to comment webhooks.

GitHub Pages cannot run the webhook server or background automation. The dashboard settings are currently stored in that browser's local storage; the webhook service uses server environment variables for its active rule. To change the server's active keyword/message, set `TRIGGER_KEYWORD` and `DM_TEMPLATE` in the backend host environment and redeploy/restart.

## 1. Configure the backend

1. Install Node.js 18 or newer.
2. Copy `.env.example` to `.env`.
3. Fill in the values:
   - `META_VERIFY_TOKEN`: any long random string you choose.
   - `META_ACCESS_TOKEN`: token issued through Meta's supported authorization flow.
   - `IG_USER_ID`: Instagram professional account ID used by the API.
   - `GRAPH_API_VERSION`: a currently supported Graph API version from Meta docs (replace `vXX.X`).
4. Install and run:

```bash
npm install
npm start
```

Do not commit `.env`. Never put the access token in `public/app.js`, HTML, or GitHub Pages settings.

Optional backend environment settings:
- `AUTO_REPLY_ENABLED=false` disables replies.
- `TRIGGER_KEYWORD=guide` only triggers when a comment contains `guide` (case-insensitive). Leave unset for all comment text.
- `DM_TEMPLATE=Hey {{username}}! Thanks for commenting.`

## 2. Configure Meta webhooks

In Meta for Developers, create/configure an app for the Instagram API product supported by your account and follow the current official setup flow.

- Configure the webhook callback URL as `https://YOUR-BACKEND-HOST/webhook`.
- Use the exact `META_VERIFY_TOKEN` value as the webhook verification token.
- Subscribe to the Instagram `comments` webhook field.
- Complete the required account connection, permissions, access-level/app-review steps, and test with an account eligible under Meta's rules.
- Confirm the exact webhook payload shape and private-reply endpoint requirements against the current Meta docs; Meta may change API versions and permissions.

This starter accepts `object: "instagram"` comment changes and extracts a comment ID and text. If Meta's current payload differs for your app/API version, adapt the parser in `server.js`.

## 3. Publish the dashboard on GitHub Pages

The dashboard is in `public/`. For a simple repository setup:
1. Copy the contents of `public/` into the root of a dedicated GitHub repository, or configure a Pages workflow to publish the `public/` directory.
2. Enable GitHub Pages in repository Settings → Pages.
3. Open the published site.

The dashboard is a control-panel prototype. It does not remotely control the backend yet. Its ON/OFF button is a visual UI state, and its settings are local to the browser. For a production control panel, add authenticated backend endpoints and proper user authentication before connecting these controls.

## Security and reliability notes

- Use only accounts you own or are authorized to manage.
- Do not collect Instagram passwords or automate browser login.
- Keep tokens in server-side environment variables and rotate/revoke them if exposed.
- The in-memory duplicate set resets when the server restarts. Use a persistent database for durable deduplication in production.
- Add request signature validation, structured logs, durable event processing, rate-limit handling, monitoring, and authenticated settings before production deployment.
- Do not send unsolicited bulk DMs. Respect Meta policies and recipient expectations.

## Project status

Starter implementation — dashboard and webhook skeleton included. Production deployment requires Meta app configuration, API permissions, a publicly reachable backend, and end-to-end testing.
