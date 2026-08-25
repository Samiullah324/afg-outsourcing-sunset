# AFG Outsourcing Sunset — Full‑Stack Monorepo (Django + React + Docker)

A full-stack monorepo for the AFG Outsourcing Sunset project: a **Django** REST API backend, a **React** (Vite + TypeScript) frontend, and **Docker Compose** orchestration with **dev**, **UAT**, and **production** profiles. An **Nginx** reverse proxy fronts the application in all three deployed profiles, routing traffic to the frontend and API and serving static/media assets.

## Table of Contents

- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Quick Start (Docker)](#quick-start-docker)
- [Environment Configuration](#environment-configuration)
- [Local Development Without Docker](#local-development-without-docker)
- [Testing](#testing)
- [Linting & Formatting](#linting--formatting)
- [Makefile Cheatsheet](#makefile-cheatsheet)
- [Deployment (via Docker Compose)](#deployment-via-docker-compose)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

## Architecture

### Monorepo layout

| Directory | Description |
|-----------|-------------|
| `backend/` | Django REST API (`core` project), Celery workers, and backend Docker assets |
| `frontend/` | React 19 + Vite + TypeScript SPA |
| `nginx/` | Nginx configs for dev, UAT, and production reverse-proxy profiles |
| `.github/` | GitHub Actions and repository automation |

### Services

Base services are defined in `docker-compose.yml`. Environment-specific compose files add frontend, Nginx, and profile overrides.

**`docker-compose.yml` (base)**

| Service | Ports (host:container) | Purpose |
|---------|------------------------|---------|
| `postgres` | `${POSTGRES_PORT:-5432}:5432` | PostgreSQL 16 database |
| `redis` | `${REDIS_PORT:-6379}:6379` | Redis 7 cache and Celery broker |
| `backend` | `${BACKEND_PORT:-8000}:8000` | Django API (Gunicorn/runserver per profile) |
| `celery_worker` | — | Celery background task worker |
| `celery_beat` | — | Celery periodic task scheduler |

**`docker-compose.dev.yml` additions/overrides**

| Service | Ports (host:container) | Purpose |
|---------|------------------------|---------|
| `postgres` | `${POSTGRES_PORT:-5433}:5432` | Dev PostgreSQL (`horizon_digital_dev`) |
| `redis` | `${REDIS_PORT:-6380}:6379` | Dev Redis |
| `backend` | `${BACKEND_PORT:-8001}:8000` | Django dev server (`runserver`) |
| `celery_worker` | — | Celery worker (debug logging) |
| `celery_beat` | — | Celery beat scheduler |
| `frontend` | `${FRONTEND_PORT:-3001}:3000` | Vite dev server with HMR |
| `nginx` | `${NGINX_HTTP_PORT:-8080}:80` | Reverse proxy to frontend + API |

**`docker-compose.uat.yml`**

| Service | Ports (host:container) | Purpose |
|---------|------------------------|---------|
| `postgres` | `${POSTGRES_PORT:-5434}:5432` | UAT PostgreSQL |
| `redis` | `${REDIS_PORT:-6381}:6379` | UAT Redis (password required) |
| `backend` | `${BACKEND_PORT:-8002}:8000` | Django via Gunicorn |
| `celery_worker` / `celery_beat` | — | Celery worker and scheduler |
| `frontend` | `${FRONTEND_PORT:-3002}:3000` | Production-built React app |
| `nginx` | `${NGINX_HTTP_PORT:-8081}:80`, `${NGINX_HTTPS_PORT:-8443}:443` | Reverse proxy (HTTP + HTTPS) |

**`docker-compose.prod.yml`**

| Service | Ports (host:container) | Purpose |
|---------|------------------------|---------|
| `postgres` | — (internal only) | Production PostgreSQL |
| `redis` | — (internal only) | Production Redis (password required) |
| `backend` | — (internal only) | Django via Gunicorn (4 workers) |
| `celery_worker` / `celery_beat` | — | Celery worker and scheduler |
| `frontend` | — (internal only) | Production React app |
| `nginx` | `80:80`, `443:443` | Public reverse proxy with SSL volume mounts |

## Prerequisites

**Docker path (recommended)**

- Docker 20.10+
- Docker Compose v2+
- Make (optional; simplifies commands via the root `Makefile`)

**Local (non-Docker) path**

- Python 3.12+ (matches `backend/Dockerfile`)
- Node.js LTS or 24.x (matches `frontend/Dockerfile`; no `engines` field in `frontend/package.json`)
- npm (lockfile: `frontend/package-lock.json`)
- PostgreSQL and Redis running locally, or reachable instances configured in `.env`

## Quick Start (Docker)

### One-liner bootstrap

`setup.sh` verifies Docker, creates `.env` (via `env-switch.sh development` if missing), creates `nginx/ssl`, `nginx/logs`, and `backups`, builds images, starts the dev stack, runs migrations and `collectstatic`, and optionally prompts for a superuser:

```bash
./setup.sh
```

### Start by environment

Each profile can be started with its compose file. The root `Makefile` merges `docker-compose.yml` with the profile file (`make dev`, `make uat`, `make prod`); the commands below use the profile file directly.

**Development**

```bash
cp env.example .env          # or: ./env-switch.sh development
docker compose -f docker-compose.dev.yml up -d --build
```

**UAT**

```bash
./env-switch.sh uat
docker compose -f docker-compose.uat.yml up -d --build
```

**Production**

```bash
./env-switch.sh production
docker compose -f docker-compose.prod.yml up -d --build
```

### Post-start setup

```bash
# Migrations
docker compose -f docker-compose.dev.yml exec backend python manage.py migrate

# Optional: create admin user
docker compose -f docker-compose.dev.yml exec backend python manage.py createsuperuser
```

Replace `docker-compose.dev.yml` with `docker-compose.uat.yml` or `docker-compose.prod.yml` for other profiles.

### Default URLs (development)

Via Nginx (primary entry point):

| URL | Description |
|-----|-------------|
| http://localhost:8080 | Frontend (proxied) |
| http://localhost:8080/api | Backend REST API |
| http://localhost:8080/admin | Django admin |
| http://localhost:8080/api/docs/ | Swagger UI (if server is running) |

Direct service ports (dev defaults):

| URL | Description |
|-----|-------------|
| http://localhost:8001 | Backend (direct) |
| http://localhost:3001 | Frontend Vite dev server (direct) |

**UAT (defaults):** http://localhost:8081 (Nginx), http://localhost:8002 (backend), http://localhost:3002 (frontend)

**Production (defaults):** http://localhost (HTTP), https://localhost (HTTPS — requires certs in `nginx/ssl/`)

## Environment Configuration

Copy the template and edit values for your target profile:

```bash
cp env.example .env
```

All root compose files read the single root **`.env`** file (`env_file: .env` on services; the `Makefile` passes `--env-file .env`).

### Key variables (`env.example`)

| Variable | Description |
|----------|-------------|
| `PROJECT_NAME` / `COMPOSE_PROJECT_NAME` | Docker container and network naming prefix |
| `ENVIRONMENT` | Active profile: `development`, `uat`, or `production` |
| `DEBUG` | Django debug mode (`True`/`False`; default in template: `True`) |
| `SECRET_KEY` | Django secret key |
| `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_HOST`, `POSTGRES_PORT` | PostgreSQL connection settings |
| `DATABASE_URL` | Full PostgreSQL URL (used inside containers) |
| `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`, `REDIS_URL` | Redis connection settings |
| `CELERY_BROKER_URL`, `CELERY_RESULT_BACKEND` | Celery broker and result backend |
| `VITE_API_BASE_URL` | Frontend API base URL (build-time for Vite) |
| `VITE_APP_NAME` | Frontend display name |
| `NODE_ENV` | Node environment for frontend builds |
| `NGINX_HTTP_PORT`, `NGINX_HTTPS_PORT` | Host ports published by Nginx |
| `BACKEND_PORT`, `FRONTEND_PORT` | Host ports for direct backend/frontend access |
| `ALLOWED_HOSTS` | Django allowed hosts (comma-separated) |
| `CORS_ALLOWED_ORIGINS` | CORS allowed origins |
| `CSRF_TRUSTED_ORIGINS` | CSRF trusted origins |
| `EMAIL_BACKEND`, `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USE_TLS`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD` | Email configuration |
| `LOG_LEVEL`, `DJANGO_LOG_LEVEL` | Application logging levels |
| `SECURE_SSL_REDIRECT`, `SECURE_HSTS_*`, `SESSION_COOKIE_SECURE`, `CSRF_COOKIE_SECURE` | Production security toggles |

Django reads settings from `backend/src/core/settings/base.py`: `SECRET_KEY`, `DEBUG` (default `False`), `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, and related keys via `django-environ`.

### Environment switching

`env-switch.sh` creates or updates the root `.env` from `env.example` with profile-specific values:

```bash
./env-switch.sh development   # alias: dev
./env-switch.sh uat
./env-switch.sh production    # alias: prod
```

The script sets `ENVIRONMENT`, database name, ports, `VITE_API_BASE_URL`, `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, security flags, and other Django-related keys. It writes a `.env.bak` backup during edits and removes it on success. Review and update secrets (especially `POSTGRES_PASSWORD` and `REDIS_PASSWORD` for UAT/production) before starting services.

Equivalent via Make:

```bash
make env-switch ENV=development
make setup                    # switches to development and prints next steps
```

## Local Development Without Docker

### Backend

```bash
cd backend
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Copy and configure environment (root or backend env.example)
cp ../env.example ../.env     # or: cp env.example .env

export PYTHONPATH=src
export DATABASE_URL=postgresql://postgres:postgres@localhost:5432/horizon_digital_dev
export REDIS_URL=redis://localhost:6379/0

python manage.py migrate
python manage.py runserver 8000
```

`manage.py` lives at `backend/manage.py`; application code is under `backend/src/`.

### Frontend

```bash
cd frontend
npm install
export VITE_API_BASE_URL=http://localhost:8000
export VITE_APP_NAME="AFG Outsourcing Sunset"
npm run dev
```

Vite serves on port **5173** by default unless configured otherwise. Set `VITE_API_BASE_URL` to your backend origin before building or running dev; for Docker/Nginx deployments use the proxied origin (e.g. `http://localhost:8080`) so the built bundle does not hardcode localhost.

## Testing

### Backend

Tests use Django's test runner (`authentication` app tests under `backend/src/authentication/tests/`). `pytest` and `pytest-django` are listed in `requirements.txt` but no `pytest.ini` or `pyproject.toml` pytest config is present.

**Via Docker (dev stack running):**

```bash
make test-backend ENV=development
# or
docker compose -f docker-compose.dev.yml exec backend python manage.py test
```

**Locally:**

```bash
cd backend
source .venv/bin/activate
export PYTHONPATH=src
python manage.py test
```

**Coverage (Docker):**

```bash
make test-coverage ENV=development
```

### Frontend

No test runner or `test` script is configured in `frontend/package.json`. Frontend tests are not set up yet.

## Linting & Formatting

### Frontend

```bash
cd frontend
npm run lint          # ESLint
```

Via root Makefile (requires a running frontend container for the frontend Makefile path):

```bash
make lint             # delegates to backend/ and frontend/ Makefiles
```

### Backend

No Python linter or formatter (ruff, flake8, black) is configured in the monorepo root or `backend/Makefile`.

## Makefile Cheatsheet

Run `make help` for the full list. Common root targets (`ENV=development|dev|uat|production|prod`):

| Target | Description |
|--------|-------------|
| `help` | Show all targets and descriptions |
| `setup` | Switch to development env via `env-switch.sh` |
| `env-switch` | Run `./env-switch.sh` for the given `ENV` |
| `env-check` | Verify `.env` exists |
| `dev` / `uat` / `prod` | Build and start the selected profile |
| `build` | Build Docker images |
| `start` | Start services (`up -d`) |
| `stop` / `down` | Stop and remove containers |
| `restart` | Stop then start |
| `status` / `ps` | Show container status |
| `logs` | Follow all service logs |
| `logs-backend` / `logs-frontend` / `logs-nginx` | Follow service-specific logs |
| `migrate` | Run Django migrations |
| `makemigrations` | Create new migrations |
| `collectstatic` | Collect Django static files |
| `createsuperuser` | Create Django admin user |
| `shell` / `shell-backend` | Django shell or backend bash |
| `test` / `test-backend` / `test-coverage` | Run backend tests (and frontend via `test`) |
| `lint` / `format` | Lint/format via submodule Makefiles |
| `health` | Curl backend and Nginx health endpoints |
| `backup` / `restore` | Database backup and restore |
| `clean` / `clean-all` | Prune Docker resources |
| `ssl-setup` | Print SSL certificate placement instructions (prod) |

## Deployment (via Docker Compose)

1. Configure production secrets:

```bash
./env-switch.sh production
# Edit .env: SECRET_KEY, POSTGRES_PASSWORD, REDIS_PASSWORD, ALLOWED_HOSTS, etc.
```

2. Place TLS certificates in `nginx/ssl/` (`cert.pem`, `key.pem`, `chain.pem`).

3. Build and start:

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

4. Post-deploy:

```bash
docker compose -f docker-compose.prod.yml exec backend python manage.py migrate
docker compose -f docker-compose.prod.yml exec backend python manage.py collectstatic --noinput
docker compose -f docker-compose.prod.yml exec backend python manage.py createsuperuser
```

**Notable prod differences vs dev:** `DEBUG=False`, Gunicorn with gevent workers, Redis password required, Postgres/Redis/backend/frontend not published on host ports (Nginx on 80/443 only), named volumes `postgres_prod_data`, `redis_prod_data`, `static_prod_volume`, `media_prod_volume`, and `restart: unless-stopped` on services.

## Troubleshooting

**Port already in use** — Dev defaults use 8080 (Nginx), 8001 (backend), 3001 (frontend), 5433 (Postgres), 6380 (Redis). Change the corresponding `*_PORT` values in `.env`, or stop conflicting containers: `docker compose -f docker-compose.dev.yml down`.

**Reset database volumes** — Remove dev volumes for a clean start:

```bash
docker compose -f docker-compose.dev.yml down -v
# Named volumes: postgres_dev_data, redis_dev_data, static_dev_volume, media_dev_volume
docker compose -f docker-compose.dev.yml up -d --build
docker compose -f docker-compose.dev.yml exec backend python manage.py migrate
```

**Migrations fail** — Ensure the stack for the correct profile is running and you exec into the `backend` service with the matching compose file: `docker compose -f docker-compose.dev.yml exec backend python manage.py migrate`.

**Frontend cannot reach the API** — Set `VITE_API_BASE_URL` to the same origin the browser uses (e.g. `http://localhost:8080` behind Nginx, not an internal Docker hostname). Rebuild or restart the frontend container after changing env vars.

**Backend health check fails** — Confirm Postgres and Redis are healthy: `docker compose -f docker-compose.dev.yml ps`. Check logs: `make logs-backend ENV=development`.

**Wrong environment active** — Re-run `./env-switch.sh <profile>` and restart: `make restart ENV=development`.

## Contributing

Pull requests are welcome. Please keep changes focused, match existing code style, and run available tests before submitting:

```bash
make test-backend ENV=development
cd frontend && npm run lint
```

For backend- or frontend-only work, see `backend/README.md` and `frontend/README.md`.
