# AFG Outsourcing Sunset

AFG Outsourcing Sunset is a full-stack monorepo: a **Django 5** REST API and **React 19** (TypeScript, Vite) frontend, orchestrated with **Docker Compose**, fronted by **Nginx** as the primary HTTP entry point, with **PostgreSQL**, **Redis**, and **Celery** (worker + beat) for persistence, caching, and background jobs. Environment-specific behavior is selected by combining `docker-compose.yml` with `docker-compose.dev.yml`, `docker-compose.uat.yml`, or `docker-compose.prod.yml`, and a single root `.env` file (see `env.example` and `env-switch.sh`).

## Table of Contents

- [Architecture](#architecture)
- [Environments](#environments)
- [Prerequisites](#prerequisites)
- [Quick start (Docker)](#quick-start-docker)
- [Local development without Docker](#local-development-without-docker)
- [Environment variables](#environment-variables)
- [Common commands](#common-commands)
- [Testing](#testing)
- [Migrations and data](#migrations-and-data)
- [Deployment notes](#deployment-notes)
- [Troubleshooting](#troubleshooting)
- [License and credits](#license-and-credits)

## Architecture

### Monorepo layout

```
afg-outsourcing-sunset/
├── backend/                 # Django project (manage.py, src/core, apps)
├── frontend/                # React + Vite + TypeScript SPA
├── nginx/                   # Reverse-proxy configs (dev / uat / prod)
├── docker-compose.yml       # Base services (postgres, redis, backend, Celery)
├── docker-compose.dev.yml   # Dev overrides + frontend + nginx
├── docker-compose.uat.yml   # UAT stack
├── docker-compose.prod.yml  # Production stack
├── Makefile                 # Root orchestration (build, up, migrate, test, …)
├── env.example              # Template for root `.env`
├── env-switch.sh            # Writes environment-specific values into `.env`
├── setup.sh                 # First-time Docker setup helper
└── README.md
```

`backend/` and `frontend/` also ship their own `Makefile` and `compose*.yml` files for working on each app in isolation; the root Makefile is the usual entry point for the full stack.

### Services and relationships

| Service | Role |
|--------|------|
| **nginx** | Public HTTP(S) entry; proxies `/` → frontend, `/api/` and `/admin/` → backend, serves `/static/` and `/media/` |
| **frontend** | React SPA (Vite dev server in development; built assets in UAT/prod images) |
| **backend** | Django + DRF API (`/api/…`), admin, OpenAPI docs |
| **postgres** | Primary database |
| **redis** | Cache and Celery broker/result backend |
| **celery_worker** | Executes background tasks (`celery -A core worker`) |
| **celery_beat** | Periodic tasks (`django_celery_beat` database scheduler) |

There is **no Flower** (or other Celery monitoring UI) service in the current Compose files.

### Request flow (development)

```
Browser → nginx (:NGINX_HTTP_PORT) → frontend (/) or backend (/api/, /admin/)
                ↓
         postgres, redis ← backend, celery_worker, celery_beat
```

### External ports (defaults in Compose)

Values below are **Compose file defaults** when a variable is unset. After `./env-switch.sh` or editing `.env`, host ports follow your `.env` values instead.

| Service | Dev (`docker-compose.dev.yml`) | UAT (`docker-compose.uat.yml`) | Prod (`docker-compose.prod.yml`) |
|--------|--------------------------------|----------------------------------|----------------------------------|
| **nginx (HTTP)** | `${NGINX_HTTP_PORT:-8080}` → 80 | `${NGINX_HTTP_PORT:-8081}` → 80 | `80` → 80 |
| **nginx (HTTPS)** | — | `${NGINX_HTTPS_PORT:-8443}` → 443 | `443` → 443 |
| **backend** (direct) | `${BACKEND_PORT:-8001}` → 8000 | `${BACKEND_PORT:-8002}` → 8000 | not published |
| **frontend** (direct) | `${FRONTEND_PORT:-3001}` → 3000 | `${FRONTEND_PORT:-3002}` → 3000 | not published |
| **postgres** | `${POSTGRES_PORT:-5433}` → 5432 | `${POSTGRES_PORT:-5434}` → 5432 | not published |
| **redis** | `${REDIS_PORT:-6380}` → 6379 | `${REDIS_PORT:-6381}` → 6379 | not published |

**Primary entry in development:** Nginx at `http://localhost:8080` (when `NGINX_HTTP_PORT` is 8080).

**API base path:** routes are under `/api/` (e.g. health `GET /api/health/`, auth `/api/auth/`, schema `/api/schema/`, Swagger `/api/docs/`).

## Environments

Compose is layered:

- **Base:** `docker-compose.yml` — postgres, redis, backend, `celery_worker`, `celery_beat`
- **Development:** `-f docker-compose.dev.yml` — debug `runserver`, bind-mounted code, Vite HMR, dev nginx config
- **UAT:** `-f docker-compose.uat.yml` — Gunicorn, Redis password, optional SSL volume mount, stricter defaults
- **Production:** `-f docker-compose.prod.yml` — Gunicorn, no host DB/Redis ports, nginx on 80/443, `restart: unless-stopped`

Select an environment with the root Makefile (`ENV=development|uat|production`, or aliases `dev` / `uat` / `prod`) or explicitly:

```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml --env-file .env up -d --build
```

**Configuration:** one root `.env` file. Use `cp env.example .env` or `./env-switch.sh development|uat|production` to populate environment-specific ports, database names, and URLs.

| Environment | Typical DB name (default) | Notes |
|-------------|---------------------------|--------|
| Development | `horizon_digital_dev` | `DEBUG=True`, console email, dev nginx on port 8080 |
| UAT | `horizon_digital_uat` | `DEBUG=False`, Redis `requirepass`, nginx 8081/8443 |
| Production | `horizon_digital_prod` | No debug, SSL under `nginx/ssl/`, only nginx ports exposed |

## Prerequisites

- **Docker** and **Docker Compose** (v2 CLI; the scripts also check for the `docker-compose` command)
- **Make** (recommended; `setup.sh` and the Makefile wrap Compose)
- **Node.js** — frontend Docker image uses **Node 24**; for local frontend work, use a current Node LTS compatible with Vite 6
- **Python 3.12** — backend Docker image uses Python 3.12; match this for local backend work

## Quick start (Docker)

1. **Clone and enter the repository**

   ```bash
   git clone https://github.com/Samiullah324/afg-outsourcing-sunset.git
   cd afg-outsourcing-sunset
   ```

2. **Create `.env`**

   ```bash
   cp env.example .env
   # optional: merge dev-friendly values
   ./env-switch.sh development
   ```

   Set at least `SECRET_KEY` and, for UAT/production, strong `POSTGRES_PASSWORD` and `REDIS_PASSWORD`.

3. **Start development (first run builds images)**

   ```bash
   make dev
   # or: ./setup.sh   (also runs migrate + collectstatic)
   # or:
   docker-compose -f docker-compose.yml -f docker-compose.dev.yml --env-file .env up -d --build
   ```

4. **Apply migrations** (if you did not use `setup.sh`)

   ```bash
   make migrate ENV=development
   ```

5. **Open the app** (with default dev nginx port 8080)

   | URL | Purpose |
   |-----|---------|
   | http://localhost:8080 | Frontend (via nginx) |
   | http://localhost:8080/api/ | Backend API prefix |
   | http://localhost:8080/api/health/ | API health check |
   | http://localhost:8080/admin/ | Django admin |
   | http://localhost:8080/api/docs/ | Swagger UI |
   | http://localhost:8080/health | Nginx health |

6. **Create an admin user**

   ```bash
   make createsuperuser ENV=development
   ```

## Local development without Docker

PostgreSQL and Redis must be reachable at the hosts/ports you configure (see `env.example` and `backend/env.example`).

### Backend

```bash
cd backend
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp env.example .env   # or symlink/use root .env with DJANGO_ENV=local
export PYTHONPATH=src
export DJANGO_ENV=local
# set DB_* / CELERY_* / REDIS_* to your local services
python manage.py migrate
python manage.py runserver
```

Celery (separate terminals, same env):

```bash
celery -A core worker -l info
celery -A core beat -l info --scheduler django_celery_beat.schedulers:DatabaseScheduler
```

Django settings module: `core.settings` (see `backend/manage.py`). Application code lives under `backend/src/`.

### Frontend

```bash
cd frontend
npm install
# Point at nginx (same origin) or direct backend, e.g.:
export VITE_API_BASE_URL=http://localhost:8080
npm run dev
```

For production-like builds locally: `npm run build` then `npm run preview`.

Prefer **same-origin** API access through nginx in Docker (`VITE_API_BASE_URL` set to the nginx origin, without hard-coding backend port in production builds). The frontend reads `VITE_API_BASE_URL` at build time (see `frontend/Dockerfile` and Compose `environment` blocks).

## Environment variables

Copy `env.example` to `.env` at the repository root. Grouped by concern:

### Project

| Variable | Description |
|----------|-------------|
| `PROJECT_NAME` | Docker container name prefix (default `horizon-digital`; set e.g. `afg-outsourcing-sunset` if desired) |
| `COMPOSE_PROJECT_NAME` | Compose project name (default `horizon-digital`) |
| `ENVIRONMENT` | Logical env: `development`, `uat`, or `production` |
| `DEBUG` | Django debug flag (`True` in dev template) |
| `SECRET_KEY` | Django secret (**required**; change in real deployments) |

### Database

| Variable | Description |
|----------|-------------|
| `POSTGRES_DB` | Database name |
| `POSTGRES_USER` | PostgreSQL user (default `postgres`) |
| `POSTGRES_PASSWORD` | PostgreSQL password (**required** for UAT/prod) |
| `POSTGRES_HOST` | Hostname inside Compose (`postgres`) |
| `POSTGRES_PORT` | Host port mapped to Postgres |
| `DATABASE_URL` | Full URL used by backend in Docker |

### Redis and Celery

| Variable | Description |
|----------|-------------|
| `REDIS_HOST` | Redis hostname (`redis` in Compose) |
| `REDIS_PORT` | Host port mapped to Redis |
| `REDIS_PASSWORD` | Required for UAT/prod Redis (`requirepass`) |
| `REDIS_URL` | Redis URL for Django/cache |
| `CELERY_BROKER_URL` | Celery broker (Redis) |
| `CELERY_RESULT_BACKEND` | Celery results backend |

### Frontend

| Variable | Description |
|----------|-------------|
| `VITE_API_BASE_URL` | API origin for the SPA (dev example: `http://localhost:8080/`) |
| `VITE_APP_NAME` | Display name in the UI |
| `NODE_ENV` | Node environment (`development` / `production`) |

### Nginx and service ports

| Variable | Description |
|----------|-------------|
| `NGINX_HTTP_PORT` | Host port → nginx :80 |
| `NGINX_HTTPS_PORT` | Host port → nginx :443 (UAT/prod) |
| `BACKEND_PORT` | Optional direct backend access on the host |
| `FRONTEND_PORT` | Optional direct frontend access on the host |

### Django / HTTP security

| Variable | Description |
|----------|-------------|
| `ALLOWED_HOSTS` | Comma-separated hosts |
| `CORS_ALLOWED_ORIGINS` | Allowed CORS origins |
| `CSRF_TRUSTED_ORIGINS` | CSRF trusted origins |
| `SECURE_SSL_REDIRECT` | Force HTTPS (production template) |
| `SECURE_HSTS_*`, `SESSION_COOKIE_SECURE`, `CSRF_COOKIE_SECURE` | Hardening flags |

### Email (optional)

| Variable | Description |
|----------|-------------|
| `EMAIL_BACKEND` | e.g. console backend in dev |
| `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USE_TLS`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD` | SMTP settings |

### Logging

| Variable | Description |
|----------|-------------|
| `LOG_LEVEL` | General log level |
| `DJANGO_LOG_LEVEL` | Django logger level |

Optional blocks in `env.example` (commented): AWS S3, Sentry, analytics, backups.

**Seeding:** deploy automation may run `seed_demo`; it uses `DEMO_ADMIN_PASSWORD` (not in `env.example`) for the demo user `demo@sunset.dev`.

## Common commands

Root `Makefile` (append `ENV=development`, `ENV=uat`, or `ENV=production` where needed):

| Target | Action |
|--------|--------|
| `make help` | List targets |
| `make dev` / `make uat` / `make prod` | Switch `.env` if missing, build, start |
| `make build` | Build images |
| `make start` / `make stop` / `make restart` | Compose up/down |
| `make logs`, `make logs-backend`, `make logs-frontend`, `make logs-nginx` | Follow logs |
| `make migrate`, `make makemigrations`, `make collectstatic` | Django maintenance |
| `make createsuperuser`, `make shell`, `make dbshell` | Admin and shells |
| `make test`, `make test-backend`, `make test-coverage` | Tests |
| `make lint`, `make format` | Code quality (delegates to `backend/` and `frontend/`) |
| `make health`, `make backup`, `make restore` | Health check and DB backup |
| `make env-switch ENV=…` | Run `env-switch.sh` |

Frontend (`frontend/package.json`): `npm run dev`, `npm run build`, `npm run lint`, `npm run preview`.

## Testing

### Backend

- **In Docker (matches CI-style stack):** `make test-backend ENV=development` → `python manage.py test` in the backend container.
- **From repo root:** `make test` runs `backend` and `frontend` Make targets; backend tests use the backend submodule Makefile’s Docker test when invoked via `cd backend && make test`.
- **Dependencies:** `pytest` and `pytest-django` are listed in `backend/requirements.txt`; the Makefile uses Django’s `manage.py test` runner (see `backend/src/authentication/tests/`).

### Frontend

There is **no** `test` script in `frontend/package.json`. Use `npm run lint` and `npm run build` (includes `tsc -b`) for static checks until a test runner is added.

## Migrations and data

```bash
make migrate ENV=development
make makemigrations ENV=development
```

Inside a running backend container:

```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml exec backend python manage.py migrate
```

**Demo seed** (idempotent):

```bash
DEMO_ADMIN_PASSWORD='your-password' python manage.py seed_demo
# or via make exec-backend:
make exec-backend ENV=development CMD="python manage.py seed_demo"
```

Creates demo login `demo@sunset.dev` and sample users (see `backend/src/authentication/management/commands/seed_demo.py`).

## Deployment notes

- **UAT:** configure `.env` (often via `./env-switch.sh uat`), place SSL material under `nginx/ssl/` if terminating TLS on nginx, then `make uat` or `make start ENV=uat`.
- **Production:** `./env-switch.sh production`, strong secrets, SSL in `nginx/ssl/`, then `make prod`. Backend runs Gunicorn; frontend image is built with `VITE_API_BASE_URL` and `VITE_APP_NAME` from the environment at **image build** time (`frontend/Dockerfile`).
- **Static/media:** collected to Docker volumes mounted into nginx (`static_*` / `media_*` volumes per environment).
- **Deploy contract:** `.sunset/deploy.yaml` describes automated deploy stages (including `seed_demo`).

## Troubleshooting

| Issue | What to try |
|-------|-------------|
| Port already in use | Change `NGINX_HTTP_PORT`, `BACKEND_PORT`, etc. in `.env`; `make stop ENV=development` |
| DB connection errors | `make logs-backend`; ensure postgres is healthy; `make migrate ENV=development` |
| Pending migrations | `make migrate ENV=development` |
| Celery not processing | Check redis URL/password matches env; `make logs` and filter worker/beat containers |
| Frontend cannot reach API | Use nginx origin in `VITE_API_BASE_URL`; rebuild frontend if you changed env at build time |
| Permission errors on volumes | `make exec-backend ENV=development CMD="chown -R django:django /app"` (adjust user as needed) |

Inspect logs:

```bash
make logs ENV=development
docker-compose -f docker-compose.yml -f docker-compose.dev.yml logs backend
```

Reset dev stack (destructive to named volumes for that compose project):

```bash
make stop ENV=development
docker-compose -f docker-compose.yml -f docker-compose.dev.yml down -v
make dev
```

## License and credits

This repository does **not** include a `LICENSE` file; treat it as **private / all rights reserved** unless the owner publishes a license.

Related docs:

- [backend/README.md](./backend/README.md)
- [frontend/README.md](./frontend/README.md)
