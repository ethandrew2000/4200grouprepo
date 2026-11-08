# 4200 Arcade

A responsive frontend for the IT 4200 Fall 2026 class API. Includes 20 activities, category filters, search, favorites, recent activity, accessible activity dialogs, and live API responses.

## Run locally

Requires Node.js 20 or newer. No dependency installation needed.

```sh
npm start
```

Open http://localhost:3000. Run `npm run check` for JavaScript syntax checks.

The Node server serves the frontend and forwards GET requests through `/api/backend/` to https://two026-it4200-fall.onrender.com. This same-origin proxy is required because the backend does not return cross-origin access headers. Deploy the entire Node app, rather than only the `public` folder. The server respects the `PORT` environment variable.

Favorites and recent activities are stored in the visitor's browser. Game outcomes come from the live API; no accounts, real-money wagering, or score submission are included. The Render backend may need up to a minute to wake up. Errors and timeouts are displayed in the activity dialog.

Activity definitions and input fields live in `public/app.js`; styling is in `public/style.css`. Fonts load from Google Fonts, with system fallbacks.

## Deployment

Railway runs `npm start` from `main`; `npm run check` validates syntax. The app supports both `/` locally and `/classproject/` in production. `/classproject` redirects to the trailing slash so relative assets, home links, and same-origin API requests resolve correctly. Cloudflare routes only `croftfamily.us/classproject` and `croftfamily.us/classproject/*` to the dedicated Railway service. Existing DNS and other routes are preserved.

## Leaderboard

Open **Leaderboard** under Games, then select **Show leaderboard** to fetch the
class API's `/leaderboard` endpoint through the existing same-origin proxy.
The dialog displays each player's rank, name, and highest score, with an empty
state when no scores exist. Loading and request errors use the standard activity
feedback. Both the new `entries` response and the previous `top` response are
supported so this UI can ship before the major API release is deployed.

Run all frontend tests with `npm test`.
