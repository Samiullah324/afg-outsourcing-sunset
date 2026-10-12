# AFG Outsourcing Sunset Monorepo

Production-ready full-stack monorepo for the AFG Outsourcing Sunset project: a **Django** REST API backend, **React + TypeScript** frontend (Vite), **Docker Compose** orchestration across **development**, **UAT**, and **production**, with **Nginx** as the reverse proxy and shared **PostgreSQL**, **Redis**, and **Celery** services.

## Table of Contents

- [Monorepo structure](#monorepo-structure)
- [Tech stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Environment configuration](#environment-configuration)
- [Quick start (Docker)](#quick-start-docker)
- [Local development without Docker](#local-development-without-docker)
- [Makefile commands](#makefile-commands)
- [Testing and code quality](#testing-and-code-quality)
- [Nginx and networking](#nginx-and-networking)
- [Deployment notes](#deployment-notes)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

## Monorepo structure

```
afg-outsourcing-sunset/
├── backend/                 # Django API (manage.py, Dockerfile, requirements.txt)
├── frontend/                # React + Vite app (package.json, Dockerfile)
├── nginx/                   # Reverse-proxy configs (dev / uat / prod)
├── docker-compose.yml       # Base services: postgres, redis, backend, Celery
├── docker-compose.dev.yml   # Dev overrides + frontend + nginx
├── docker-compose.uat.yml   # UAT stack (Gunicorn, nginx, SSL mount)
├── docker-compose.prod.yml  # Production stack
├── Makefile                 # Primary developer commands (all environments)
├── env.example              # Environment variable template
├── env-switch.sh            # Generate/update root .env per environment
├── setup.sh                 # First-time dev bootstrap (Docker)
├── .sunset/                 # Deploy contract validation (CI)
└── README.md
```

| Path | Purpose |
|------|---------|
| `backend/` | Django project (`core` settings, DRF API under `/api/`, Celery app `core`, JWT auth). |
| `frontend/` | SPA served by Vite in dev; production image builds static assets and runs `vite preview`. |
| `nginx/` | Terminates HTTP(S), routes `/` to frontend and `/api/` (and `/admin/`) to backend. |
| `docker-compose*.yml` | Layered Compose files: base + environment-specific overrides. |
| `Makefile` | Wraps `docker-compose` with `ENV=development\|uat\|production` (aliases `dev`, `prod`). |

## Tech stack

### Backend

- **Django** `~=5.0.0` (`backend/requirements.txt`)
- **Django REST Framework**, **SimpleJWT**, **drf-spectacular**, **django-celery-beat**
- **PostgreSQL** (driver: `psycopg`), **Redis**, **Celery**
- **Gunicorn** (UAT/production compose commands)
- **WSGI**: `core.wsgi:application` (production/UAT)
- **ASGI**: `core.asgi` (available for async deployment)
- **Python**: 3.12 (from `backend/Dockerfile`)
- **API prefix**: routes live under `/api/` (e.g. `/api/health/`, `/api/auth/`, `/api/docs/`)

### Frontend

- **React** `^19.1.0`, **TypeScript** `~5.7.2`, **Vite** `^6.0.7`
- **Redux Toolkit**, **React Router**, **Axios**
- **Node.js** 24 Alpine in `frontend/Dockerfile` (Bun installed when available; npm fallback)

### Tooling

- **Docker** and **docker-compose** (Compose v2 CLI invoked as `docker-compose` in the root Makefile)
- **Nginx** Alpine images for dev/UAT/prod reverse proxy
- **Make** for scripted workflows at the repository root

## Prerequisites

Install on the host before using Docker workflows:

| Tool | Notes |
|------|--------|
| **Docker** | Required by `setup.sh` and all Compose flows. |
| **Docker Compose** | v2-compatible CLI (`docker-compose` command used in Makefile). |
| **Make** | Optional but recommended; `setup.sh` falls back to raw Compose if missing. |
| **Git** | Clone this repository (submodules are not used in this repo). |

For optional local (non-Docker) runs: **Python 3.12+**, **Node.js** (aligned with frontend Docker image, Node 24), and **npm** or **Bun**.

## Environment configuration

### Create `.env`

```bash
cp env.example .env
# or let env-switch create/update .env:
./env-switch.sh development
```

Orchestration uses a **single repo-root `.env`** file (`Makefile` sets `ENV_FILE = .env`).

### Variable reference (from `env.example`)

| Variable | Purpose |
|----------|---------|
| `PROJECT_NAME` | Docker container name prefix (default: `horizon-digital`). |
| `COMPOSE_PROJECT_NAME` | Compose project name (default: `horizon-digital`). |
| `ENVIRONMENT` | Active profile: `development`, `uat`, or `production`. |
| `DEBUG` | Django debug flag (`True` / `False`). |
| `SECRET_KEY` | Django secret key (change for non-local use). |
| `POSTGRES_DB` | PostgreSQL database name. |
| `POSTGRES_USER` | PostgreSQL user (default: `postgres`). |
| `POSTGRES_PASSWORD` | PostgreSQL password. |
| `POSTGRES_HOST` | DB host inside Compose network (default: `postgres`). |
| `POSTGRES_PORT` | Host port mapped to Postgres (see env-switch per environment). |
| `DATABASE_URL` | SQLAlchemy-style URL for Django (`postgresql://...`). |
| `REDIS_HOST` | Redis hostname in Compose (default: `redis`). |
| `REDIS_PORT` | Host port mapped to Redis. |
| `REDIS_PASSWORD` | Required for UAT/production Redis (`requirepass` in compose). |
| `REDIS_URL` | Redis URL for caching. |
| `CELERY_BROKER_URL` | Celery broker (Redis). |
| `CELERY_RESULT_BACKEND` | Celery result backend (Redis). |
| `VITE_API_BASE_URL` | Frontend API base (use same-origin `/api` path via nginx in dev). |
| `VITE_APP_NAME` | Display name in the frontend. |
| `NODE_ENV` | `development` or `production` for frontend container behavior. |
| `NGINX_HTTP_PORT` | Host HTTP port for nginx (dev default `8080`, UAT `8081`, prod `80`). |
| `NGINX_HTTPS_PORT` | Host HTTPS port (UAT `8443`, prod `443`). |
| `BACKEND_PORT` | Host port mapped to Django (when exposed). |
| `FRONTEND_PORT` | Host port mapped to Vite/preview (when exposed). |
| `EMAIL_BACKEND` | Django email backend class. |
| `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USE_TLS` | SMTP settings when used. |
| `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD` | SMTP credentials. |
| `ALLOWED_HOSTS` | Comma-separated Django allowed hosts. |
| `CORS_ALLOWED_ORIGINS` | CORS origins for the API. |
| `CSRF_TRUSTED_ORIGINS` | CSRF trusted origins. |
| `LOG_LEVEL`, `DJANGO_LOG_LEVEL` | Logging verbosity. |
| `SECURE_SSL_REDIRECT`, `SECURE_HSTS_*` | Production security headers / HTTPS behavior. |
| `SESSION_COOKIE_SECURE`, `CSRF_COOKIE_SECURE` | Secure cookie flags. |

Optional commented blocks in `env.example` cover AWS S3, Sentry, analytics, and backups.

### `env-switch.sh`

Rewrites environment-specific values in `.env` for **development** (alias `dev`), **uat**, or **production** (alias `prod`):

```bash
./env-switch.sh development   # dev: DB horizon_digital_dev, nginx :8080, DEBUG=True
./env-switch.sh uat           # UAT: sets Redis/Postgres placeholders, nginx :8081
./env-switch.sh production    # prod: nginx 80/443, stricter security defaults
```

If `.env` is missing, the script copies `env.example` first, then updates keys such as `ENVIRONMENT`, `POSTGRES_DB`, `POSTGRES_PORT`, `REDIS_PORT`, `VITE_API_BASE_URL`, `NGINX_HTTP_PORT`, `BACKEND_PORT`, `FRONTEND_PORT`, `ALLOWED_HOSTS`, and related Django security settings.

Equivalent Make target:

```bash
make env-switch ENV=development
```

### `setup.sh`

One-time **development** bootstrap:

1. Verifies Docker and Docker Compose.
2. Runs `./env-switch.sh development` if `.env` is absent.
3. Creates `nginx/ssl`, `nginx/logs`, and `backups`.
4. `make build ENV=development` and `make start ENV=development`.
5. Runs migrations and `collectstatic` in the backend container.
6. Optionally prompts for `createsuperuser`.

## Quick start (Docker)

### Development

**Recommended:**

```bash
./setup.sh
```

**Or manually:**

```bash
./env-switch.sh development   # if .env does not exist or you want dev defaults
make dev                      # build + start (uses docker-compose.yml + docker-compose.dev.yml)
```

**Service management:**

```bash
make start ENV=development    # up -d
make stop ENV=development     # down
make restart ENV=development
make build ENV=development    # rebuild images
make logs ENV=development     # follow all logs
make up-logs ENV=development  # up in foreground with logs
```

**Development Compose services:** `postgres`, `redis`, `backend`, `celery_worker`, `celery_beat`, `frontend`, `nginx`.

**URLs (via nginx — preferred):**

| Service | URL |
|---------|-----|
| Frontend | `http://localhost:8080/` (default `NGINX_HTTP_PORT`) |
| Backend API | `http://localhost:8080/api/` |
| Django admin | `http://localhost:8080/admin/` |
| API docs (Swagger) | `http://localhost:8080/api/docs/` |
| Nginx health | `http://localhost:8080/health` |
| Backend health | `http://localhost:8080/api/health/` |

Direct host ports (when set by `.env` / `env-switch.sh`): backend `BACKEND_PORT` (e.g. `8000`), frontend `FRONTEND_PORT` (e.g. `3000`), Postgres `POSTGRES_PORT`, Redis `REDIS_PORT`.

**First admin user:**

```bash
make createsuperuser ENV=development
make migrate ENV=development     # if setup.sh was skipped
```

Raw Compose equivalent:

```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml --env-file .env up -d --build
```

### UAT

```bash
./env-switch.sh uat
# Set POSTGRES_PASSWORD and REDIS_PASSWORD in .env
make uat                        # or: make build ENV=uat && make start ENV=uat
```

**UAT highlights** (`docker-compose.uat.yml`):

- Backend: Gunicorn with gevent workers.
- Frontend: production `NODE_ENV`; image serves built assets via entrypoint.
- Nginx: HTTP `NGINX_HTTP_PORT` default **8081**, HTTPS **8443**; SSL certs from `nginx/ssl/`.
- Default DB name: `horizon_digital_uat`.

### Production

```bash
./env-switch.sh production
# Set strong SECRET_KEY, POSTGRES_PASSWORD, REDIS_PASSWORD, domains, email, SSL files
make prod                       # or: make build ENV=production && make start ENV=production
```

**Production highlights** (`docker-compose.prod.yml`):

- Nginx publishes **80** and **443** on the host; backend and frontend are not published directly.
- Gunicorn (4 workers), Celery worker/beat, Redis auth, no bind-mount of application source.
- Place TLS material under `nginx/ssl/` (see `make ssl-setup ENV=prod`).

**Runtime pattern:** dependency install and frontend **build** run in **image build** (`backend/Dockerfile`, `frontend/Dockerfile`). At container start, entrypoints wait for dependencies, migrate/collectstatic (backend), then start servers (runserver/dev, Gunicorn/uat/prod, Vite dev or preview).

## Local development without Docker

Docker is the supported path. For partial local work:

### Backend

```bash
cd backend
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
export PYTHONPATH=src
cp ../.env .env    # Django reads backend/.env per core.settings.base
python manage.py migrate
python manage.py runserver
```

Requires local PostgreSQL and Redis matching `DATABASE_URL` and Celery settings, or adjust `.env` accordingly.

### Frontend

```bash
cd frontend
npm install        # or bun install if Bun is available
npm run dev
```

Scripts from `frontend/package.json`: `dev`, `build`, `lint`, `preview`. Point `VITE_API_BASE_URL` at your API (e.g. `http://localhost:8080/api` when nginx is running in Docker).

## Makefile commands

Root `Makefile` targets (run `make help` for the full list). Default `ENV` is `development`; aliases: `dev`, `uat`, `prod`, `production`.

| Target | Description |
|--------|-------------|
| `help` | Show categorized targets. |
| `setup` | Run `env-switch.sh development` and print next steps. |
| `env-check` | Fail if `.env` is missing. |
| `env-switch` | Run `./env-switch.sh $(ENV)`. |
| `build` | `docker-compose build` for selected environment. |
| `start` / `stop` / `down` / `restart` | Compose up/down. |
| `status` / `ps` | Container status. |
| `logs`, `logs-backend`, `logs-frontend`, `logs-nginx` | Tail logs. |
| `up-logs` | Foreground `up` with logs. |
| `start-backend`, `start-frontend`, `start-nginx` | Start service subsets. |
| `migrate`, `makemigrations`, `collectstatic`, `createsuperuser` | Django management via backend container. |
| `schema`, `docs` | OpenAPI schema and doc URLs. |
| `shell`, `dbshell`, `shell-backend`, `shell-frontend`, `shell-nginx`, `shell-postgres`, `shell-redis` | Shell access. |
| `install`, `lint`, `format`, `test` | Delegate to `backend/` and `frontend/` Makefiles. |
| `test-backend`, `test-coverage` | Backend tests inside Compose backend container. |
| `clean`, `clean-all` | Docker prune / destructive reset. |
| `update` | Pull and rebuild images. |
| `ssl-setup` | Production SSL directory hints (`ENV=prod` only). |
| `backup`, `restore` | Postgres dump/restore (requires `BACKUP_FILE` for restore). |
| `dev`, `uat`, `prod` | Quick start: ensure `.env`, build, start. |
| `exec-backend` | Run command in backend (`CMD="..."`). |
| `health`, `monitor` | curl health endpoints / `docker stats`. |
| `info` | Show compose files and `.env` hints. |

Environment selector examples:

```bash
make logs ENV=uat
make migrate ENV=production
```

## Testing and code quality

### Backend

Inside running dev stack:

```bash
make test-backend ENV=development
make test-coverage ENV=development
```

Uses `python manage.py test` in the backend container. **pytest** and **pytest-django** are listed in `requirements.txt`; the Makefile wired test command is Django’s test runner. Sample tests live under `backend/src/authentication/tests/`.

From repo root (delegates to backend’s own Makefile / Compose — separate from monorepo compose):

```bash
make test-backend ENV=development   # monorepo compose (recommended)
```

### Frontend

- **Lint:** `cd frontend && npm run lint` (ESLint), or `make lint` at repo root (runs frontend lint inside frontend Compose when that Makefile path is used).
- **Build/typecheck:** `npm run build` runs `tsc -b && vite build`.
- **Automated tests:** no `test` script in `frontend/package.json`; frontend unit tests are not configured in this repo.

### Monorepo

```bash
make test ENV=development    # runs backend then frontend Makefiles’ test targets
make lint ENV=development
make format ENV=development
```

## Nginx and networking

Nginx is the single entry point in dev, UAT, and production compose overlays.

- **`/`** → `frontend` (Vite dev server or preview).
- **`/api/`** → `backend` (Django/DRF). Backend defines routes such as `/api/health/`, `/api/auth/`, `/api/docs/`.
- **`/admin/`** → Django admin.
- **`/static/`**, **`/media/`** → shared volumes from backend.

Development config: `nginx/conf.d/dev.conf` (HMR/WebSocket proxy to frontend).

**Same-origin API calls:** configure the frontend to call **`/api`** on the nginx host (e.g. `VITE_API_BASE_URL=http://localhost:8080/api` in development). Avoid hardcoding direct backend ports in production builds.

Compose network name pattern: `${PROJECT_NAME:-horizon-digital}_dev_network` (dev), `_uat_network`, `_prod_network`.

## Deployment notes

1. Configure production `.env` (`./env-switch.sh production` plus secrets).
2. Add TLS certificates to `nginx/ssl/` (`make ssl-setup ENV=prod`).
3. Build and start:

   ```bash
   make build ENV=production
   make start ENV=production
   ```

4. Post-deploy (if not already applied by entrypoint):

   ```bash
   make migrate ENV=production
   make collectstatic ENV=production
   make createsuperuser ENV=production
   ```

Images:

- `backend/Dockerfile` — Python deps, `entrypoint.sh` (wait for DB/Redis, migrate, collectstatic).
- `frontend/Dockerfile` — install deps and **build** during `docker build`; entrypoint runs dev server or preview based on `NODE_ENV`.

There is **no** Dockerfile at the repository root; build context is per service.

Deploy contract validation (`.sunset/deploy.yaml`) runs in CI on changes under `.sunset/`.

## Troubleshooting

### Missing or wrong `.env`

Symptoms: `make env-check` fails or containers exit immediately.

```bash
./env-switch.sh development
make env-check ENV=development
```

### Port already in use

Dev nginx defaults to **8080**; UAT to **8081**. Another process or stale container may hold the port.

```bash
make stop ENV=development
docker ps
# change NGINX_HTTP_PORT / BACKEND_PORT / FRONTEND_PORT in .env if needed
make start ENV=development
```

### Database connection / migration errors

Ensure Postgres is healthy and credentials match `.env`:

```bash
make status ENV=development
make migrate ENV=development
make shell-postgres ENV=development
```

Reset dev DB volume (destroys data):

```bash
make stop ENV=development
docker volume ls | grep postgres_dev
docker volume rm <volume_name>
make start ENV=development
make migrate ENV=development
```

### Frontend `node_modules` / stale build in Docker

Dev compose mounts `./frontend` and an anonymous volume for `/app/node_modules`. Rebuild if dependencies drift:

```bash
make build ENV=development
make restart ENV=development
make shell-frontend ENV=development
# inside container: npm install  (or bun install)
```

### UAT/production Redis auth failures

UAT and prod Redis use `REDIS_PASSWORD`. Set it in `.env` after `./env-switch.sh uat` or `production` and ensure `CELERY_BROKER_URL` / `REDIS_URL` include the password (compose templates use `redis://:password@redis:6379/...`).

### Health checks

```bash
make health ENV=development
curl -s http://localhost:8080/health
curl -s http://localhost:8080/api/health/
```

## Contributing

1. Create a feature branch from `main`.
2. Keep changes focused; use Docker-based workflows for integration testing.
3. For backend API changes, update or add tests under `backend/src/**/tests/`.
4. Run `make lint` / `make test-backend ENV=development` when touching application code.

No `LICENSE` file is present in this repository; add one at the repo root if you need to publish under a specific license.
