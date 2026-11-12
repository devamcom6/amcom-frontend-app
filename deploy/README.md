# Deploying the Amcom frontend to the VPS

Every push to `main` builds the app and publishes it to the VPS automatically.
The frontend goes into its own folder next to the backend:

```text
/var/www/apps/amcom/                 DEPLOY_PATH secret (backend root)
├── releases/  shared/  current      backend (amcom-backend-api), never touched
└── frontend/                        this app
    ├── releases/<time>-<commit>/    one folder per deploy (last 5 kept)
    └── current -> releases/...      what nginx serves
```

A deploy uploads a new release folder and then switches `current` to it in one step,
so visitors never see a half-finished upload. If the health check fails, the previous
release is restored automatically.

The script refuses to deploy into `/var/www/apps/amcom` itself, or into any folder that
contains `artisan`, `composer.json` or `.env`. That protects the Laravel backend.

Files involved:

| File | Purpose |
| --- | --- |
| [`scripts/deploy.sh`](../scripts/deploy.sh) | Build, upload, activate, roll back. Used by CI and by hand. |
| [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml) | Runs the script on every push to `main`, or by hand. |
| [`nginx-amcom-frontend.conf.example`](nginx-amcom-frontend.conf.example) | nginx config to adapt. |

---

## One-time setup

The frontend reuses the backend's VPS access: the same server, SSH user, key and
`production` secrets. You **don't** need a new key, user or folder.

### 1. Copy the backend's secrets into the frontend repo

GitHub never shows a saved secret's value again, and one repo can't read another repo's
secrets. Re-enter them in the frontend repo from the same source you used for the backend
(the private key file, `ssh-keyscan` output, and so on).

In the **frontend** repo: **Settings → Environments → New environment → `production`**
(the same name as the backend's). Then add these **environment secrets**, with the same
names and values as in `amcom-backend-api`:

| Secret | Value |
| --- | --- |
| `VPS_HOST` | same as backend |
| `VPS_USER` | same as backend |
| `VPS_PORT` | same as backend |
| `VPS_SSH_KEY` | same private key as backend |
| `VPS_KNOWN_HOSTS` | same as backend (or re-run `ssh-keyscan -p PORT HOST`) |
| `DEPLOY_PATH` | same as backend, e.g. `/var/www/apps/amcom` |

`DEPLOY_PATH` stays the **backend** root. The frontend deploys into `$DEPLOY_PATH/frontend`,
next to the backend's `releases/`, `shared/` and `current/`. The backend's release
cleanup only touches `$DEPLOY_PATH/releases`, so the two deploys never interfere.

> If `devamcom6` is a GitHub **organization**, you can instead move these to
> **organization secrets** and grant both repos access, so there's one copy to maintain.

### 2. Add the frontend's environment variable

Same page, **Environment variables**:

| Variable | Value |
| --- | --- |
| `APP_URL` | `https://amcomglobal.com/`, the frontend's public URL. It's health-checked after every deploy, and a failure rolls back automatically. Not the backend's `https://amcom.iterationplus.com`. |

`PHP_FPM_SERVICE` isn't needed: the frontend is static files.

### 3. Point nginx at the frontend

The frontend is served from `$DEPLOY_PATH/frontend/current`, e.g.
`/var/www/apps/amcom/frontend/current`. Open
[`nginx-amcom-frontend.conf.example`](nginx-amcom-frontend.conf.example) and pick one option:

- **Option A — `amcomglobal.com`** (the production setup). First point the DNS `A` records
  for `amcomglobal.com` and `www.amcomglobal.com` at the VPS IP. Then create the site:
  `sudo nano /etc/nginx/sites-available/amcomglobal`, paste Option A,
  `sudo ln -s /etc/nginx/sites-available/amcomglobal /etc/nginx/sites-enabled/`,
  and add HTTPS with `sudo certbot --nginx -d amcomglobal.com -d www.amcomglobal.com`.
  Then update the backend's `.env` (step 3b).
- **Option B — same domain as the API** (`amcom.iterationplus.com`). Merge Option B into
  the existing Laravel site. It keeps `/api` and `/up` on Laravel (`/up` is the backend
  deploy's health check, so it must keep working) and serves the SPA everywhere else.

Then:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

Until the first frontend deploy creates `current`, the new site returns 404. That's expected.

### 3b. Tell the backend about the frontend domain

The API only accepts browser requests from `FRONTEND_URLS` (CORS). It also builds email
links, the Google sign-in redirect and the Paystack callback from `FRONTEND_URL`. On the VPS,
edit the backend's shared env (`$DEPLOY_PATH/shared/.env`, e.g. `/var/www/apps/amcom/shared/.env`):

```dotenv
FRONTEND_URL=https://amcomglobal.com
FRONTEND_URLS=https://amcomglobal.com,https://www.amcomglobal.com
GOOGLE_REDIRECT_URI=https://amcomglobal.com/auth/google/callback
```

The backend caches its config at deploy time, so rebuild that cache and reload PHP-FPM:

```bash
cd /var/www/apps/amcom/current
php artisan optimize
sudo systemctl reload php8.3-fpm
```

In the Google Cloud console (OAuth client), add
`https://amcomglobal.com/auth/google/callback` to the authorised redirect URIs.

### 4. Check the production settings

`.env.production` is baked into the build. Before the first deploy, confirm:

- `VITE_API_BASE_URL` is the live API (currently `https://amcom.iterationplus.com/api/v1`).
- `VITE_APP_URL` is `https://amcomglobal.com`, the same as `APP_URL` above.
- `VITE_USE_MOCK_API=false`. The script refuses to deploy if this is `true`.

Commit any change to `main`. That push triggers the first deploy.

---

## Deploying

### Automatic

Push or merge to `main`. In GitHub → **Actions → Deploy** you'll see the run:
install → type-check → build → upload → switch `current` → health check.
It takes about 1–2 minutes. Pushes made while a deploy runs queue up behind it.

### By hand from GitHub

**Actions → Deploy → Run workflow**, choose `deploy`, then *Run workflow*.

### By hand from your machine

Use Git Bash on Windows, or any terminal on macOS/Linux:

```bash
export DEPLOY_HOST=YOUR_VPS_HOST DEPLOY_USER=<same as VPS_USER>
export APP_ROOT=/var/www/apps/amcom            # same as the DEPLOY_PATH secret
export SSH_KEY_FILE=~/.ssh/<the backend deploy key>
export HEALTHCHECK_URL=https://<frontend domain>/   # optional

bash scripts/deploy.sh            # build + deploy
bash scripts/deploy.sh releases   # list releases (* = live)
```

---

## Rolling back

- **GitHub:** Actions → Deploy → Run workflow → choose `rollback`.
- **Your machine:** `bash scripts/deploy.sh rollback`, which goes to the release before the
  live one. To pick a specific release: `bash scripts/deploy.sh rollback 20261112T101500-ab12cd3`.

Rollback only moves the `current` link, so it takes effect immediately. No rebuild is needed.

---

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| `Permission denied (publickey)` | `VPS_SSH_KEY` in the frontend repo isn't the same key the backend uses. |
| `Host key verification failed` | Regenerate `VPS_KNOWN_HOSTS` with `ssh-keyscan` (it changes if the server is rebuilt). |
| `Refusing to deploy into APP_ROOT` / `looks like the Laravel backend` | `FRONTEND_DEPLOY_PATH` (or a local `DEPLOY_PATH`) points at the backend. Leave it unset so the frontend uses `$DEPLOY_PATH/frontend`. |
| `is not empty and was not created by this script` | The target folder already holds other files. Use an empty folder. |
| `mkdir: Permission denied` | `VPS_USER` can't write to the backend root. Run `sudo mkdir /var/www/apps/amcom/frontend && sudo chown <VPS_USER>: /var/www/apps/amcom/frontend` once. |
| Deep links like `/properties/x` return 404 | nginx is missing `try_files $uri $uri/ /index.html;` (step 3). |
| Backend deploy starts failing its health check | With option B, `/up` must still go to Laravel. Check the `location ~ ^/(api\|up\|...)` block. |
| Site loads but API calls fail | Check `VITE_API_BASE_URL`, backend CORS, and the CSP `connect-src` in the nginx config. |
| Old version still showing | `index.html` is cached. Make sure the `no-cache` block from the example is in place. |
