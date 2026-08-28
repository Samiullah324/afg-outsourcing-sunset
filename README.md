# AFG Outsourcing Sunset — Full-Stack Monorepo

A Django + React monorepo for the AFG Outsourcing Sunset application, orchestrated with Docker Compose across development, UAT, and production environments. The backend lives under `backend/src/core`; the frontend is a React/TypeScript app under `frontend/src`. Nginx acts as the reverse proxy in non-local-direct-access setups.

## 📋 Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Monorepo Layout](#monorepo-layout)
- [Prerequisites](#prerequisites)
- [Quick Start (Docker)](#quick-start-docker)
- [Local Development (without Docker)](#local-development-without-docker)
- [Database and Migrations](#database-and-migrations)
- [Users and Seed Data](#users-and-seed-data)
- [Testing and Linting](#testing-and-linting)
- [Environments](#environments)
- [Make Targets and Helper Scripts](#make-targets-and-helper-scripts)
- [Environment Variables](#environment-variables)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## Overview

This repository combines a **Django REST API** (`backend/src/core`) with a **React frontend** (`frontend/src`). Docker Compose files define PostgreSQL, Redis, Celery workers, the Django backend, the Vite frontend, and Nginx per environment. A single `.env` file is used with `./env-switch.sh` to switch between development, UAT, and production settings.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Django, Django REST Framework, JWT (simplejwt), drf-spectacular |
| Frontend | React 19, TypeScript, Vite, Redux Toolkit, React Router |
| Database | PostgreSQL 16 |
| Cache / broker | Redis 7 |
| Background jobs | Celery + Celery Beat (`django-celery-beat`) |
| Reverse proxy | Nginx (dev, UAT, prod compose overlays) |
| Orchestration | Docker Compose v2, Make |

## Monorepo Layout

```
afg-outsourcing-sunset/
├── backend/
│   ├── manage.py                 # Django entrypoint
│   ├── requirements.txt
│   └── src/
│       ├── core/
│       │   ├── asgi.py
│       │   ├── wsgi.py
│       │   ├── urls.py
│       │   ├── celery.py
│       │   └── settings/
│       └── authentication/       # Auth app (models, views, seed_demo)
├── frontend/
│   ├── package.json
│   └── src/
│       ├── components/           # atoms, molecules, organisms, templates
│       ├── pages/
│       └── services/
├── nginx/                        # Nginx configs per environment
├── docker-compose.yml            # Base services (postgres, redis, backend, celery)
├── docker-compose.dev.yml        # Dev overrides (+ frontend, nginx)
├── docker-compose.uat.yml        # UAT overrides (+ frontend, nginx)
├── docker-compose.prod.yml       # Production overrides (+ frontend, nginx)
├── Makefile                      # Root orchestration commands
├── env.example                   # Environment variable template
├── setup.sh                      # One-time Docker bootstrap
└── env-switch.sh                 # Switch dev / uat / production in .env
```

There is **no root `package.json`**; frontend scripts live in `frontend/package.json`.

## Prerequisites

- **Docker** 20.10+ and **Docker Compose** v2
- **Make** (optional; compose commands work without it)
- **Node.js** LTS (for local frontend development; no `engines` field is pinned in `frontend/package.json`)
- **Python 3.x** (3.12 in the backend Dockerfile; for local backend development)

## Quick Start (Docker)

### 1. Configure environment

```bash
cp env.example .env
# Edit .env as needed, or let env-switch set development defaults:
./env-switch.sh development
```

### 2. One-time bootstrap (optional)

`./setup.sh` verifies Docker/Compose, creates `.env` via `env-switch.sh development` if missing, creates `nginx/ssl`, `nginx/logs`, and `backups`, builds images, starts the dev stack, runs migrations and `collectstatic`, and optionally prompts for a superuser.

```bash
./setup.sh
```

Alternatively, use Make:

```bash
make dev
```

### 3. Start development

Preferred (base + dev overlay, as used by the Makefile):

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build -d
```

Dev overlay only (includes its own postgres/redis/backend definitions):

```bash
docker compose -f docker-compose.dev.yml up --build -d
```

Base stack only (backend + postgres + redis + celery; no frontend/nginx):

```bash
docker compose up --build -d
```

### 4. URLs (development)

**Primary entrypoint** (via Nginx): `http://localhost:${NGINX_HTTP_PORT:-8080}`

| Service | Default host port | URL / notes |
|---------|-------------------|-------------|
| **App (Nginx)** | `8080` | http://localhost:8080 |
| Frontend (direct) | `3001` | http://localhost:3001 |
| Backend API (direct) | `8001` | http://localhost:8001/api/ |
| Django Admin (via Nginx) | — | http://localhost:8080/admin/ |
| PostgreSQL | `5433` | localhost:5433 |
| Redis | `6380` | localhost:6380 |

Ports are driven by `.env` variables (`NGINX_HTTP_PORT`, `FRONTEND_PORT`, `BACKEND_PORT`, `POSTGRES_PORT`, `REDIS_PORT`). `./env-switch.sh development` sets different values (e.g. `BACKEND_PORT=8000`, `POSTGRES_PORT=5455`); when present in `.env`, those override the compose defaults above.

Health checks:

```bash
curl http://localhost:8080/health        # Nginx
curl http://localhost:8080/api/health/   # Backend via proxy
```

### 5. Stop, logs, and clean up

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml stop
docker compose -f docker-compose.yml -f docker-compose.dev.yml down
docker compose -f docker-compose.yml -f docker-compose.dev.yml down -v   # remove volumes

docker compose -f docker-compose.yml -f docker-compose.dev.yml logs -f
docker compose -f docker-compose.yml -f docker-compose.dev.yml logs -f backend
```

Or with Make: `make stop ENV=development`, `make logs ENV=development`, `make clean`.

## Local Development (without Docker)

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

export PYTHONPATH=src          # required — settings live under src/core
export DATABASE_URL=postgresql://postgres:postgres@localhost:5432/horizon_digital_dev
export REDIS_URL=redis://localhost:6379/0

python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

API: http://localhost:8000/api/  
Admin: http://localhost:8000/admin/

Run Celery locally (optional):

```bash
celery -A core worker -l info
celery -A core beat -l info --scheduler django_celery_beat.schedulers:DatabaseScheduler
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Vite dev server runs on http://localhost:3000 (see `frontend/vite.config.ts`). Set `VITE_API_BASE_URL` in a local `.env` (or export it) to point at your backend, e.g. `http://localhost:8000/api/`.

**Frontend npm scripts** (`frontend/package.json`):

| Script | Purpose |
|--------|---------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Type-check and production build |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview production build locally |
| `npm run prepare` | Husky git hooks setup |

## Database and Migrations

### Via Docker

```bash
make migrate ENV=development
make makemigrations ENV=development

# Or directly:
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend python manage.py migrate
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend python manage.py makemigrations
```

### Locally

```bash
cd backend
export PYTHONPATH=src
python manage.py makemigrations
python manage.py migrate
```

Service name for exec commands is **`backend`**.

## Users and Seed Data

### Create a superuser

```bash
make createsuperuser ENV=development

# Or:
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend python manage.py createsuperuser
```

### Seed demo data

The backend includes an idempotent `seed_demo` management command:

```bash
DEMO_ADMIN_PASSWORD=secret123 python manage.py seed_demo
```

Via Docker:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend \
  env DEMO_ADMIN_PASSWORD=secret123 python manage.py seed_demo
```

Creates a demo user (`demo@sunset.dev`) and sample accounts. Safe to re-run.

## Testing and Linting

### Backend

Pytest and pytest-django are listed in `backend/requirements.txt`. The project also includes Django `TestCase` tests under `backend/src/authentication/tests/`.

```bash
# Root Makefile (runs backend + frontend make targets)
make test ENV=development

# Backend only (in container)
make test-backend ENV=development

# Locally
cd backend && export PYTHONPATH=src && python manage.py test
# or: pytest
```

### Frontend

No `test` script is defined in `frontend/package.json`. **No frontend tests configured yet.**

### Lint / format

```bash
make lint ENV=development    # backend + frontend
make format ENV=development  # backend + frontend

cd frontend && npm run lint  # ESLint
```

## Environments

Compose files stack as follows (Makefile convention):

| Environment | Compose files | Primary URL (Nginx) |
|-------------|---------------|-------------------|
| **Development** | `docker-compose.yml` + `docker-compose.dev.yml` | http://localhost:8080 |
| **UAT** | `docker-compose.yml` + `docker-compose.uat.yml` | http://localhost:8081 (HTTPS: 8443) |
| **Production** | `docker-compose.yml` + `docker-compose.prod.yml` | http://localhost:80, https://localhost:443 |

### Switch environment configuration

```bash
./env-switch.sh development   # or: dev
./env-switch.sh uat
./env-switch.sh production    # or: prod

make env-switch ENV=uat
```

`env-switch.sh` copies `env.example` to `.env` if needed, then rewrites environment-specific variables (database name, ports, API URLs, debug flags, CORS, etc.).

### Start UAT or production

```bash
docker compose -f docker-compose.yml -f docker-compose.uat.yml up --build -d
docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d

make uat
make prod
```

**UAT direct ports** (defaults): backend `8002`, frontend `3002`, postgres `5434`, redis `6381`.

**Production**: only Nginx exposes host ports (`80`, `443`); backend and frontend are internal to the Docker network.

Place SSL certificates in `nginx/ssl/` for UAT/production (`cert.pem`, `key.pem`, `chain.pem`). See `make ssl-setup ENV=prod`.

## Make Targets and Helper Scripts

Run `make help` for the full list. Common targets:

| Target | Description |
|--------|-------------|
| `make dev` | Quick-start development (env, build, start) |
| `make uat` / `make prod` | Quick-start UAT or production |
| `make setup` | Run `env-switch.sh development` |
| `make build` | Build all services |
| `make start` / `make stop` / `make restart` | Manage stack lifecycle |
| `make migrate` / `make makemigrations` | Database migrations |
| `make createsuperuser` | Interactive Django superuser |
| `make collectstatic` | Collect Django static files |
| `make logs` / `make logs-backend` / `make logs-frontend` / `make logs-nginx` | Tail service logs |
| `make shell` / `make shell-backend` / `make shell-frontend` | Container shells |
| `make test` / `make test-backend` / `make test-coverage` | Run tests |
| `make lint` / `make format` | Code quality |
| `make backup` / `make restore BACKUP_FILE=...` | Database backup/restore |
| `make health` / `make status` / `make ps` | Health and status |
| `make clean` / `make clean-all` | Prune Docker resources |

Pass `ENV=development|uat|production` (aliases `dev`, `prod` also work).

### `setup.sh`

One-time bootstrap: checks Docker/Compose, creates `.env`, required directories, builds images, starts dev stack, runs migrations and collectstatic, optionally creates a superuser.

### `env-switch.sh`

Usage: `./env-switch.sh <development|uat|production>`. Updates `.env` with environment-specific database names, ports, API URLs, security settings, and related Django configuration.

## Environment Variables

Copy `env.example` to `.env`. Grouped reference (names only — never commit secrets):

| Group | Variables | Purpose |
|-------|-----------|---------|
| **Project** | `PROJECT_NAME`, `COMPOSE_PROJECT_NAME`, `ENVIRONMENT`, `DEBUG`, `SECRET_KEY` | Project identity and runtime mode |
| **Database** | `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_HOST`, `POSTGRES_PORT`, `DATABASE_URL` | PostgreSQL connection |
| **Redis / Celery** | `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`, `REDIS_URL`, `CELERY_BROKER_URL`, `CELERY_RESULT_BACKEND` | Cache and task queue |
| **Frontend build** | `VITE_API_BASE_URL`, `VITE_APP_NAME`, `NODE_ENV` | Vite/React build-time config |
| **Nginx / ports** | `NGINX_HTTP_PORT`, `NGINX_HTTPS_PORT`, `BACKEND_PORT`, `FRONTEND_PORT` | Host port mappings |
| **Django** | `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, `CSRF_TRUSTED_ORIGINS`, `DJANGO_LOG_LEVEL`, `LOG_LEVEL` | Django security and logging |
| **Email** | `EMAIL_BACKEND`, `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USE_TLS`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD` | Outbound mail |
| **Security (prod)** | `SECURE_SSL_REDIRECT`, `SECURE_HSTS_*`, `SESSION_COOKIE_SECURE`, `CSRF_COOKIE_SECURE` | HTTPS hardening |
| **Optional** | `AWS_*`, `USE_S3`, `SENTRY_DSN`, `GOOGLE_ANALYTICS_ID`, `BACKUP_*` | Storage, monitoring, backups |

Seed command: `DEMO_ADMIN_PASSWORD` (used by `seed_demo`, not in `env.example`).

## Troubleshooting

1. **Port conflicts** — Another process may be using Nginx (`8080`/`8081`/`80`) or database ports. Run `docker ps`, stop conflicting containers with `make stop ENV=...`, or change port variables in `.env` and re-run `env-switch.sh`.

2. **`.env` not loaded or stale** — Ensure `.env` exists at the repo root. Re-run `./env-switch.sh development` and restart: `make restart ENV=development`.

3. **Migration errors** — After pulling new code: `make migrate ENV=development`. For a full reset (destroys data): `docker compose -f docker-compose.yml -f docker-compose.dev.yml down -v` then `./setup.sh`.

4. **Container failures** — Inspect logs: `make logs-backend ENV=development` or `make logs ENV=development`. Check health: `make health ENV=development`.

5. **Frontend cannot reach API** — Confirm `VITE_API_BASE_URL` matches the Nginx or backend URL for your environment. Rebuild frontend after changing Vite env vars.

## Contributing

1. Create a feature branch from `main`.
2. Make focused changes; follow existing code style in each package.
3. Run relevant tests and linters before opening a PR.
4. Open a pull request with a clear description of changes.

See `.cursor/rules/rule-1.mdc` for workspace conventions (changes should stay scoped to the relevant project folder).

## License

Proprietary — All rights reserved. No `LICENSE` file is present in this repository.
