# App CI/CD

## Goal

Build and verify the Expo web app in GitHub Actions, then deploy successful
production builds to the existing Nginx host without relying on a checkout or
Node tooling on that host.

## Locked decisions

1. **D-A — Production source:** pushes to `master` deploy automatically. The
   workflow can also be started manually for recovery or an intentional
   redeploy.
2. **D-B — Build location:** GitHub Actions runs the data check and Expo web
   export. It deliberately does not run the Vercel-specific post-build step, so
   the Expo application is served directly at `/`, matching the existing VPS
   deployment.
3. **D-C — CI gates:** pull requests and `master` pushes must pass TypeScript,
   content integrity, English/Finnish i18n parity, and the production build.
4. **D-D — Transport:** the runner connects with `APP_HOST`, `APP_USER`, and
   `APP_SSH_PRIVATE_KEY`, uploads one compressed release, and stages it under
   `/tmp` on the server.
5. **D-E — Publish:** the remote deploy uses `rsync --delete` to publish into
   `/var/www/taxipilot`. Static file changes do not require an Nginx reload.
6. **D-F — Concurrency:** only one production deployment runs at a time; a newer
   run supersedes an older in-progress run.
7. **D-G — Server prerequisites:** `/var/www/taxipilot` exists and is writable
   by `APP_USER`. This is configured once on the server instead of granting the
   CI user passwordless sudo.

## Verification

- Run `npm run check:i18n`.
- Run `npx tsc --noEmit`.
- Run `npm run check:data`.
- Run the production Expo export.
- Validate the workflow YAML structure locally.
