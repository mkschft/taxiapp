# Marketing landing (served at `/`)

These are the static marketing pages. They are **not** part of the Expo bundle — they're plain
HTML/CSS copied into the web build output at deploy time.

## How it fits together (one repo, one deploy)

- `npx expo export --platform web` builds the app to `dist/`, with assets prefixed `/app`
  (`experiments.baseUrl: "/app"` in `app.json`).
- `scripts/postbuild-web.js` then:
  1. moves the whole app build under `dist/app/`  → served at **`/app`**
  2. copies this `landing/` folder into `dist/` root → served at **`/`**
- `vercel.json` rewrites send `/app/*` (client routes) to the app's SPA entry. `/`, `/practice-test`,
  `/guide/...`, `/robots.txt`, `/sitemap.xml`, `/llms.txt` are served as static files.

So: `yourdomain/` = this landing, `yourdomain/app` = the app. The landing's CTAs link to `/app`.

## Editing
- Pure HTML/CSS, inline styles, no build step. Edit the files directly.
- Canonical/OG/sitemap URLs use `https://taxipilot.fi`; update if the production domain differs.
- Add `landing/hero.jpg` to give the hero a background photo (otherwise it shows clean navy).
