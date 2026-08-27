# AFG Outsourcing Sunset — Django + React Monorepo

A full-stack monorepo for **afg-outsourcing-sunset** with a Django REST API backend, React (Vite) frontend, PostgreSQL, Redis, Celery background workers, and Nginx reverse proxy — orchestrated via Docker Compose across dev, UAT, and production environments.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Repository Structure](#repository-structure)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Environment Configuration](#environment-configuration)
- [Makefile Commands](#makefile-commands)
- [Running in Different Environments](#running-in-different-environments)
- [Common Tasks](#common-tasks)
- [Testing & Linting](#testing--linting)
- [Troubleshooting](#troubleshooting)

## Overview

This repository is a monorepo that coordinates a Django backend and a React frontend as first-class applications under one root-level Docker Compose stack.

| Layer | Stack |
|-------|-------|
| **Backend** | Django 5.x, Django REST Framework, JWT auth, Celery, Gunicorn (UAT/prod) |
| **Frontend** | React 19, TypeScript, Vite 6, Redux Toolkit, atomic-design components |
| **Data** | PostgreSQL 16, Redis 7 |
| **Proxy** | Nginx (dev/UAT/prod compose overlays) |
| **Orchestration** | Root `docker-compose*.yml`, `Makefile`, `setup.sh`, `env-switch.sh` |

The backend exposes a REST API under `/api`. In deployed setups, Nginx serves the frontend and proxies API traffic to the backend on the same origin — the frontend should call `/api` rather than hardcoding host URLs. Docker Compose wires the same pattern locally.

Each app (`backend/`, `frontend/`) also ships its own Dockerfile, Makefile, and compose files for standalone development, but the **root Makefile** is the primary entry point for running the full stack.

## Architecture

```
                    ┌─────────────────────────────────┐
                    │   Nginx (dev / UAT / prod)      │
                    │   same-origin: /  and  /api     │
                    └──────────┬──────────┬───────────┘
                               │          │
                    ┌──────────▼──┐  ┌────▼──────────┐
                    │   frontend  │  │    backend    │
                    │  React/Vite │  │ Django + DRF  │
                    └─────────────┘  └───────┬───────┘
                                             │
              ┌──────────────────────────────┼──────────────────────────┐
              │                              │                          │
     ┌────────▼────────┐           ┌─────────▼────────┐       ┌─────────▼────────┐
     │    postgres     │           │      redis       │       │ celery_worker    │
     │   (database)    │           │ cache + broker   │       │ celery_beat      │
     └─────────────────┘           └──────────────────┘       └──────────────────┘
```

Celery (`backend/src/core/celery.py`) uses **Redis** as both the message broker and result backend (`CELERY_BROKER_URL`, `CELERY_RESULT_BACKEND`). Beat uses `django_celery_beat` with a database-backed scheduler. There is no Flower service in this stack.

### Services and ports

Base `docker-compose.yml` defines **postgres**, **redis**, **backend**, **celery_worker**, and **celery_beat**. Environment overlays add **frontend** and **nginx** where applicable.

| Service | Purpose | Host ports (defaults) |
|---------|---------|------------------------|
| **nginx** | Reverse proxy — serves frontend, proxies `/api`, `/admin`, static/media | Dev: `8080`; UAT: `8081`, `8443`; Prod: `80`, `443` |
| **frontend** | React app (Vite dev server or `vite preview` in prod) | Dev: `3001`; UAT: `3002`; Prod: internal only |
| **backend** | Django REST API (`core.wsgi` / `core.asgi`) | Base: `8000`; Dev: `8001`; UAT: `8002` |
| **postgres** | Primary database | Base: `5432`; Dev: `5433`; UAT: `5434`; Prod: internal |
| **redis** | Cache and Celery broker | Base: `6379`; Dev: `6380`; UAT: `6381`; Prod: internal |
| **celery_worker** | Async task worker (`celery -A core worker`) | — |
| **celery_beat** | Periodic task scheduler (`celery -A core beat`) | — |

Port values are driven by `.env` variables (`NGINX_HTTP_PORT`, `BACKEND_PORT`, etc.). Running `./env-switch.sh` updates those values per environment.

**Recommended local URLs (development via Nginx):**

| Resource | URL |
|----------|-----|
| Application | http://localhost:8080 |
| API | http://localhost:8080/api/ |
| Django Admin | http://localhost:8080/admin/ |
| API docs (Swagger) | http://localhost:8080/api/docs/ |
| Health (Nginx) | http://localhost:8080/health |
| Health (Backend) | http://localhost:8080/api/health/ |

## Repository Structure

```
afg-outsourcing-sunset/
├── backend/                    # Django API
│   ├── manage.py               # Django CLI entry point
│   ├── requirements.txt        # Python dependencies (Django ~5.0, Celery, pytest, …)
│   ├── Dockerfile              # Python 3.12-slim image
│   └── src/
│       └── core/
│           ├── settings/base.py
│           ├── asgi.py         # ASGI application
│           ├── wsgi.py         # WSGI application (Gunicorn target)
│           └── celery.py       # Celery app (`core`)
├── frontend/                   # React SPA
│   ├── package.json            # Vite 6, React 19, ESLint
│   ├── Dockerfile              # Node 24-alpine image
│   └── src/components/         # Atomic design (atoms → templates)
├── nginx/                      # Reverse-proxy configs
│   ├── nginx.dev.conf
│   ├── nginx.uat.conf
│   ├── nginx.prod.conf
│   └── conf.d/                 # Per-environment server blocks
├── docker-compose.yml          # Base services (postgres, redis, backend, celery)
├── docker-compose.dev.yml      # Dev overrides (+ frontend, nginx)
├── docker-compose.uat.yml      # UAT overrides (+ frontend, nginx, gunicorn)
├── docker-compose.prod.yml     # Production overrides
├── Makefile                    # Root orchestration commands
├── setup.sh                    # First-time Docker setup script
├── env-switch.sh               # Switch .env per environment
└── env.example                 # Environment variable template
```

## Prerequisites

| Tool | Version / notes |
|------|-----------------|
| **Docker** | 20.10+ |
| **Docker Compose** | v2 (`docker compose` or `docker-compose`) |
| **Make** | Recommended — wraps compose commands (optional) |
| **Node.js** | 24 (used in `frontend/Dockerfile`; local dev: 18+ with npm) |
| **Python** | 3.12 (used in `backend/Dockerfile`) |

## Quick Start

### With Docker (recommended)

1. **Clone the repository**

```bash
git clone https://github.com/Samiullah324/afg-outsourcing-sunset.git
cd afg-outsourcing-sunset
```

2. **Create environment configuration**

```bash
cp env.example .env
# or let the switcher populate environment-specific values:
./env-switch.sh development
```

3. **Start the development stack**

```bash
# Automated first-time setup (build, start, migrate, collectstatic):
./setup.sh

# or via Makefile:
make dev
```

Equivalent manual compose command:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml --env-file .env up --build -d
```

Use `--build` on the first run or after Dockerfile changes.

4. **Access the application**

| Resource | URL |
|----------|-----|
| App (via Nginx) | http://localhost:8080 |
| API | http://localhost:8080/api/ |
| Admin | http://localhost:8080/admin/ |

5. **Create an admin user**

```bash
make createsuperuser ENV=development
```

### Without Docker

Local development is supported via backend settings (`DJANGO_ENV=local` in `backend/src/core/settings/__init__.py`) but requires PostgreSQL and Redis running on the host.

**Backend** (`backend/`):

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
export PYTHONPATH=src DJANGO_ENV=local SECRET_KEY=dev-key DEBUG=True
python manage.py migrate
python manage.py runserver          # default http://localhost:8000
```

**Celery** (separate terminals, with Redis on `localhost:6379`):

```bash
celery -A core worker -l info
celery -A core beat -l info --scheduler django_celery_beat.schedulers:DatabaseScheduler
```

**Frontend** (`frontend/`):

```bash
npm install
npm run dev                         # default http://localhost:5173 (Vite)
```

When not using Nginx/Compose, configure `CORS_ALLOWED_ORIGINS` and `VITE_API_BASE_URL` in `.env` to match your local ports. Cross-origin requests will fail unless these align.

## Environment Configuration

All compose services read from a single root **`.env`** file. Copy `env.example` as a starting point.

### Key variables

| Variable | Meaning |
|----------|---------|
| `PROJECT_NAME` | Docker container/network name prefix (default: `horizon-digital`) |
| `ENVIRONMENT` | Active environment: `development`, `uat`, or `production` |
| `DEBUG` | Django debug mode |
| `SECRET_KEY` | Django secret key — **change in non-dev environments** |
| `POSTGRES_DB` / `POSTGRES_USER` / `POSTGRES_PASSWORD` | PostgreSQL credentials |
| `POSTGRES_PORT` | Host port mapped to Postgres |
| `DATABASE_URL` | Full database connection string (used by backend in Docker) |
| `REDIS_HOST` / `REDIS_PORT` / `REDIS_PASSWORD` | Redis connection (password required in UAT/prod) |
| `REDIS_URL` | Redis connection URL |
| `CELERY_BROKER_URL` | Celery message broker (Redis) |
| `CELERY_RESULT_BACKEND` | Celery result store (Redis) |
| `VITE_API_BASE_URL` | Frontend API base URL (use same-origin path in deployed setups) |
| `VITE_APP_NAME` | Display name in the frontend |
| `NGINX_HTTP_PORT` / `NGINX_HTTPS_PORT` | Nginx listener ports |
| `BACKEND_PORT` / `FRONTEND_PORT` | Direct service host ports |
| `ALLOWED_HOSTS` | Django allowed hostnames |
| `CORS_ALLOWED_ORIGINS` | CORS origins for the backend |
| `CSRF_TRUSTED_ORIGINS` | CSRF trusted origins |
| `EMAIL_BACKEND` / `EMAIL_HOST` / … | Email configuration |
| `SECURE_SSL_REDIRECT` / `SECURE_HSTS_*` | Production security headers |

See `env.example` for the full list and environment-specific commented blocks.

### env-switch.sh

Switches the root `.env` to environment-specific values. Creates `.env` from `env.example` if missing.

```bash
./env-switch.sh development   # aliases: dev
./env-switch.sh uat
./env-switch.sh production    # aliases: prod
```

The script updates database name, ports, API URL, debug flag, security settings, and other environment-specific variables. Review the generated `.env` and replace placeholder passwords before starting UAT or production.

## Makefile Commands

Run from the repository root. Pass `ENV=development|uat|production` (aliases `dev`, `prod` also work).

### Environment management

| Command | Description |
|---------|-------------|
| `make setup` | Run `./env-switch.sh development` for initial config |
| `make env-check` | Verify `.env` exists |
| `make env-switch ENV=uat` | Switch environment via `env-switch.sh` |
| `make dev` | Quick-start development (env + build + start) |
| `make uat` | Quick-start UAT |
| `make prod` | Quick-start production |
| `make info` | Show current environment and compose file info |
| `make help` | List all targets |

### Docker operations

| Command | Description |
|---------|-------------|
| `make build ENV=development` | Build all service images |
| `make start ENV=development` | Start all services (`up -d`) |
| `make stop` / `make down` | Stop and remove containers |
| `make restart` | Stop then start |
| `make status` / `make ps` | Show running containers |
| `make logs` | Follow all service logs |
| `make logs-backend` / `logs-frontend` / `logs-nginx` | Follow specific service logs |
| `make up-logs` | Start services in foreground with logs |

### Individual services

| Command | Description |
|---------|-------------|
| `make start-backend` | Start postgres, redis, backend, celery_worker, celery_beat |
| `make start-frontend` | Start frontend only |
| `make start-nginx` | Start nginx only |

### Database

| Command | Description |
|---------|-------------|
| `make migrate` | Run `python manage.py migrate` in backend container |
| `make makemigrations` | Create new migrations |
| `make collectstatic` | Collect Django static files |
| `make createsuperuser` | Interactive superuser creation |
| `make dbshell` | Open Django database shell |
| `make backup` | Dump database to `backups/` |
| `make restore BACKUP_FILE=…` | Restore database from SQL file |

### Development tools

| Command | Description |
|---------|-------------|
| `make shell` | Django shell |
| `make shell-backend` / `shell-frontend` / `shell-nginx` / `shell-postgres` / `shell-redis` | Container shells |
| `make schema` | Generate OpenAPI schema (`schema.yml`) |
| `make docs` | Print API documentation URLs |
| `make exec-backend CMD="…"` | Run arbitrary command in backend container |

### Code quality & testing

| Command | Description |
|---------|-------------|
| `make test` | Run backend + frontend tests via sub-Makefiles |
| `make test-backend` | Run Django tests in backend container |
| `make test-coverage` | Backend tests with coverage report |
| `make lint` | Lint backend and frontend |
| `make format` | Format backend and frontend code |
| `make install` | Install backend and frontend dependencies |

### Maintenance & monitoring

| Command | Description |
|---------|-------------|
| `make health` | Curl backend and nginx health endpoints |
| `make monitor` | `docker stats` for running containers |
| `make clean` | Prune unused Docker resources |
| `make clean-all` | Remove all containers, images, and volumes (interactive confirm) |
| `make update` | Pull images and rebuild |
| `make ssl-setup ENV=prod` | Create `nginx/ssl/` and print certificate instructions |

## Running in Different Environments

All environments combine the base compose file with an environment overlay and the root `.env`.

### Development

```bash
./env-switch.sh development
docker compose -f docker-compose.yml -f docker-compose.dev.yml --env-file .env up --build -d
# or: make dev
```

- Nginx entry point: http://localhost:8080
- Backend runs `runserver`; frontend runs Vite dev server with HMR
- Database: `horizon_digital_dev`

### UAT

```bash
./env-switch.sh uat
docker compose -f docker-compose.yml -f docker-compose.uat.yml --env-file .env up --build -d
# or: make uat
```

- Nginx: http://localhost:8081 (HTTPS: https://localhost:8443)
- Backend runs Gunicorn; set `POSTGRES_PASSWORD` and `REDIS_PASSWORD` in `.env`
- Place SSL certificates in `nginx/ssl/` for HTTPS
- Database: `horizon_digital_uat`

### Production

```bash
./env-switch.sh production
docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env up --build -d
# or: make prod
```

- Nginx listens on ports `80` and `443` (only nginx is exposed externally)
- Backend runs Gunicorn with 4 gevent workers
- Database: `horizon_digital_prod`
- Post-deploy: `make migrate ENV=production`, `make collectstatic ENV=production`

## Common Tasks

### Database migrations

```bash
make makemigrations ENV=development
make migrate ENV=development
```

Direct compose equivalent:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend python manage.py migrate
```

### Create superuser

```bash
make createsuperuser ENV=development
```

### Celery workers and beat

Celery services start automatically with the stack. Inspect logs:

```bash
make logs ENV=development
docker compose -f docker-compose.yml -f docker-compose.dev.yml logs celery_worker celery_beat
```

Restart only backend-side workers:

```bash
make start-backend ENV=development
```

### Frontend production build

Inside the frontend container, production mode runs:

```bash
npm run build          # outputs to frontend/dist/
npm run preview        # serves dist/ on port 3000
```

Nginx proxies `/` to the frontend container and serves `/static/` and `/media/` from shared volumes populated by the backend's `collectstatic`.

### API documentation

```bash
make docs ENV=development
```

- Swagger UI: http://localhost:8080/api/docs/
- ReDoc: http://localhost:8080/api/redoc/
- OpenAPI schema: http://localhost:8080/api/schema/

## Testing & Linting

### Frontend

ESLint is configured. No test runner script is defined in `frontend/package.json`.

```bash
cd frontend
npm install
npm run lint
```

Via Docker (with stack running):

```bash
cd frontend && make lint
```

### Backend

Django's test runner is the primary test command. `pytest` and `pytest-django` are listed in `requirements.txt` but no `pytest.ini` is configured — use Django's runner.

```bash
make test-backend ENV=development
# or inside backend container:
python manage.py test
```

Coverage:

```bash
make test-coverage ENV=development
```

Root `make test` delegates to both sub-project Makefiles. The backend sub-Makefile's `lint` and `format` targets are declared but not implemented — use root-level tooling or add targets in `backend/` as needed.

## Troubleshooting

| Issue | What to check |
|-------|---------------|
| **Port already in use** | Stop conflicting services: `make stop ENV=development`. Inspect with `docker ps` or `make ps`. Dev nginx defaults to `8080`. |
| **`.env` not loaded** | Confirm `.env` exists at repo root. Run `make env-check` or `./env-switch.sh development`. Compose commands must include `--env-file .env`. |
| **Database connection refused** | Ensure postgres is healthy: `make status ENV=development`. Backend entrypoint waits for DB — check `make logs-backend`. |
| **Migrations out of date** | Run `make migrate ENV=development`. |
| **Static files missing** | Run `make collectstatic ENV=development`. Nginx serves static from the shared volume at `/static/`. |
| **Frontend cannot reach API** | Use same-origin `/api` through Nginx (http://localhost:8080/api). Verify `VITE_API_BASE_URL` in `.env`. |
| **CORS errors (non-Docker dev)** | Align `CORS_ALLOWED_ORIGINS` in `.env` with your frontend origin. |
| **UAT/prod Redis auth failures** | Set `REDIS_PASSWORD` in `.env`; UAT/prod compose passes it to Redis and Celery URLs. |
| **Complete reset** | `make stop ENV=development && make clean`. For a full wipe: `make clean-all` (destroys volumes). |

### Useful debug commands

```bash
make health ENV=development
make logs-backend ENV=development
make shell-backend ENV=development
make info
```
