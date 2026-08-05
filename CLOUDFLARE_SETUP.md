# LogiLedger Cloudflare deployment

LogiLedger runs as a Cloudflare Pages application. Pages Functions provide the API and Cloudflare D1 stores each company's workspace data.

## Production resources

- Pages project: `logiledger`
- Current Pages domain: `z-l-logistics-revenue-monitoring.pages.dev`
- D1 binding: `DB`
- D1 database: `logiledger-db`
- D1 database ID: `8aac259e-c962-42ef-82ac-cd6192e0993c`
- Production branch: `main`
- Build command: `npm run build`
- Build output directory: `dist`

The existing domain may keep its old name. Changing the application and project name does not require deleting the working domain.

## Deploying a database change

Always apply pending D1 migrations before deploying application code that depends on them:

```bash
npm run cf:db:migrate:remote
```

Review the migrations Wrangler lists, confirm the prompt, and then push the code to `main`. The connected Pages project automatically builds and deploys commits from `main`.

For an occasional manual deployment:

```bash
npm run cf:deploy
```

## Cloudflare Dashboard configuration

Open **Workers & Pages > logiledger > Settings** and verify the following.

### Variables and Secrets

Add these encrypted secrets to Production. Add them to Preview too when preview branch deployments need to be usable.

- `SESSION_SECRET`: a random value containing at least 32 characters. Generate one with `openssl rand -hex 32`.
- `GEOAPIFY_API_KEY`: the Geoapify project key used by server-side route estimates and maps.
- `APP_PIN`: legacy-only PIN for the original Z&L workspace. Keep this temporarily only while that company's database record still uses the legacy PIN. After successfully changing its PIN from LogiLedger Settings, this secret can be removed.

Never place secret values in `wrangler.toml`, source files, screenshots, or Git.

### Bindings

The Wrangler configuration manages the D1 binding. Verify that it shows:

- Type: D1 database
- Variable name: `DB`
- Database: `logiledger-db`

If the Dashboard says the binding is managed through `wrangler.toml`, that is expected. Update the file in Git instead of creating a duplicate Dashboard binding.

### Builds and deployments

Verify:

- Production branch: `main`
- Automatic deployments: enabled
- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: blank, unless the repository is later moved into a subdirectory

Redeploy after adding or changing a secret.

## Local development

Create `.dev.vars` from `.dev.vars.example` and replace the placeholder values. Then apply local migrations:

```bash
npm run cf:db:migrate:local
```

Run the complete frontend, Pages Functions, and local D1 environment:

```bash
npm run dev
```

The application starts at `http://localhost:8790`. `npm run dev:vite` only starts the frontend and cannot serve authentication or database APIs.

## Authentication behavior

Each company has a separate workspace and salted PIN hash in D1. A browser remembers the last company, so normal sign-in only requires its six-digit PIN. Use **Switch company workspace** to sign in to another company from a new or shared device.

Sessions last seven days. Five incorrect PIN attempts from one address trigger a 15-minute lockout. Workspace registration is limited to three attempts per address per hour. Changing a PIN invalidates all earlier sessions and creates a replacement session for the browser that performed the change.

For a public launch, Cloudflare Turnstile or an invitation workflow is still recommended in addition to the server-side registration limit.

## Backups

SQL backups are intentionally ignored by Git because they contain private company and operational data. Store production backups outside the repository and encrypt them before uploading to cloud storage.

Example export to the parent directory:

```bash
npx wrangler d1 export logiledger-db --remote --output ../logiledger-backup.sql
```

Test a backup by restoring it into a temporary local SQLite database before depending on it for recovery.

## Route estimates and maps

`GEOAPIFY_API_KEY` is used only by Pages Functions and is not returned to the browser. A trip route starts at the Starting Location, continues to Pick Up, visits each numbered drop-off, and finishes at the Ending Location. Distance, delivery distance, duration, waypoints, and route geometry are cached in D1 when the trip is saved.

Existing trips receive an estimate the next time they are edited and saved. If Geoapify is unavailable or cannot locate an address, the trip still saves and its route estimate remains unavailable.

## Legacy Z&L data

The original Z&L records remain assigned to the `z-l-palm-line-logistic` company workspace. The one-time browser localStorage trip importer is restricted to that workspace so old records cannot be uploaded into another company.
