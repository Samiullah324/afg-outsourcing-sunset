# AFG Outsourcing Sunset Monorepo

Production-oriented full-stack monorepo for the **AFG Outsourcing Sunset** application: Django REST API, React 19 frontend, PostgreSQL, Redis, Celery, and Nginx reverse proxy. Docker Compose drives **development**, **UAT**, and **production** stacks from a single `.env` file with environment switching.

## Table of Contents

- [Overview](#overview)
- [Monorepo structure](#monorepo-structure)
- [Prerequisites](#prerequisites)
- [Quick start (Docker)](#quick-start-docker)
- [Quick start (local, without Docker)](#quick-start-local-without-docker)
- [Environment configuration](#environment-configuration)
- [Makefile targets](#makefile-targets)
- [Testing](#testing)
- [Deployment notes](#deployment-notes)
- [Troubleshooting](#troubleshooting)
- [Contributing and code style](#contributing-and-code-style)
- [License](#license)

## Overview

| Layer | Stack |
|-------|--------|
| Backend | Django 5.x, Django REST Framework, JWT (`simplejwt`), Celery, drf-spectacular |
| Frontend | React 19, TypeScript, Vite 6, Redux Toolkit |
| Data | PostgreSQL 16, Redis 7 |
| Edge | Nginx (routes `/api/` and `/admin/` to Django; serves SPA for other paths) |
| Orchestration | Root `docker-compose.yml` + `docker-compose.{dev,uat,prod}.yml`, root `Makefile` |

**Same-origin API:** In Docker, the browser should talk to Nginx on one host/port. Nginx proxies `/api/` to the backend so cookies, CSRF, and CORS stay consistent. Health and auth live under `/api/` (for example `/api/health/`, `/api/auth/`).

Sunset deployment metadata for hosted environments is defined in [`.sunset/deploy.yaml`](.sunset/deploy.yaml) and validated in CI.

## Monorepo structure

```
afg-outsourcing-sunset/
├── backend/                 # Django project (manage.py, src/core, src/authentication)
│   └── src/
│       ├── core/            # settings, urls, wsgi/asgi
│       └── authentication/  # auth app and tests
├── frontend/                # Vite + React (src/components, Redux, etc.)
├── nginx/                   # Reverse-proxy configs (dev/uat/prod)
├── docker-compose.yml       # Shared services (postgres, redis, backend, celery)
├── docker-compose.dev.yml   # Dev overrides (+ frontend, nginx, hot reload)
├── docker-compose.uat.yml   # UAT stack (+ nginx, gunicorn)
├── docker-compose.prod.yml  # Production stack (+ nginx, gunicorn)
├── env.example              # Environment template
├── env-switch.sh            # Writes environment-specific values into .env
├── setup.sh                 # First-time Docker bootstrap (build, migrate, collectstatic)
├── Makefile                 # Primary command surface for the monorepo
└── .sunset/                 # Deploy contract for Sunset hosting
```

Deeper docs: [backend/README.md](./backend/README.md), [frontend/README.md](./frontend/README.md).

## Prerequisites

- **Docker** 20.10+ and **Docker Compose** v2 (CLI `docker-compose` or `docker compose`)
- **Make** (recommended; scripts fall back to raw Compose commands)
- **Local-only (optional):** Python 3.12+, Node.js 20+ (frontend README recommends 24+), npm or Bun

## Quick start (Docker)

### 1. Clone and configure environment

```bash
git clone https://github.com/Samiullah324/afg-outsourcing-sunset.git
cd afg-outsourcing-sunset

# Create or refresh .env for development
cp env.example .env   # optional if you use env-switch only
./env-switch.sh development
```

Set **`PROJECT_NAME`** and **`VITE_APP_NAME`** in `.env` for this product (defaults in templates still say `horizon-digital` / `Horizon Digital` until you change them). Example:

```bash
PROJECT_NAME=afg-outsourcing-sunset
VITE_APP_NAME=AFG Outsourcing Sunset
```

### 2. Bootstrap (recommended first run)

```bash
chmod +x setup.sh env-switch.sh
./setup.sh
```

`setup.sh` checks Docker, ensures `.env`, creates `nginx/ssl`, `nginx/logs`, and `backups`, builds images, starts the dev stack, runs migrations and `collectstatic`, and prints URLs.

Alternatively:

```bash
make dev          # build + start development (creates .env via env-switch if missing)
# or
make setup        # env-switch development only
make build ENV=development
make start ENV=development
make migrate ENV=development
```

### 3. Create an admin user

```bash
make createsuperuser ENV=development
```

Demo seeding (optional): see `backend/src/authentication/management/commands/seed_demo.py` (`demo@sunset.dev`).

### 4. URLs and ports (development defaults)

Access the app **through Nginx** (same-origin):

| Resource | URL |
|----------|-----|
| Application (SPA) | http://localhost:8080 |
| API | http://localhost:8080/api/ |
| Health | http://localhost:8080/api/health/ |
| Django admin | http://localhost:8080/admin/ |
| OpenAPI | http://localhost:8080/api/docs/ |

Direct service ports (host → container) when using `docker-compose.dev.yml` defaults:

| Service | Host port | Notes |
|---------|-----------|--------|
| nginx | 8080 → 80 | Primary entrypoint |
| frontend (Vite) | 3001 → 3000 | HMR; use via nginx in normal dev |
| backend (runserver) | 8001 → 8000 | Debug API without nginx |
| postgres | 5433 → 5432 | DB name default `horizon_digital_dev` |
| redis | 6380 → 6379 | No password in dev |

### 5. UAT and production

Switch environment variables, then build and start:

```bash
./env-switch.sh uat
make uat
# UAT nginx: http://localhost:8081 (HTTPS host port 8443 if configured)

./env-switch.sh production
make prod
# Production nginx: ports 80 and 443 on the host
```

Raw Compose equivalents:

```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml --env-file .env up -d --build
docker-compose -f docker-compose.yml -f docker-compose.uat.yml --env-file .env up -d --build
docker-compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env up -d --build
```

UAT/production require strong **`POSTGRES_PASSWORD`** and **`REDIS_PASSWORD`** in `.env` (placeholders are added by `env-switch.sh`).

### 6. Everyday Docker commands

```bash
make status ENV=development
make logs ENV=development
make stop ENV=development          # same as make down
make restart ENV=development
make ps ENV=development
```

`ENV` accepts: `development`, `dev`, `uat`, `production`, `prod`.

## Quick start (local, without Docker)

Use this for focused work on one tier; full-stack integration still matches Docker best when nginx terminates `/api/`.

### Backend

```bash
cd backend
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
export PYTHONPATH=src
export DJANGO_SETTINGS_MODULE=core.settings
# Configure DATABASE_URL / Postgres and Redis to reachable hosts (see backend/env.example)
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

API locally: http://localhost:8000/api/health/

### Frontend

```bash
cd frontend
npm install    # or bun install
# Point at nginx or backend; for local Vite only, set VITE_API_BASE_URL to your API origin
export VITE_API_BASE_URL=http://localhost:8080
npm run dev
```

Build for production:

```bash
npm run build
npm run lint
```

There is no root `package.json`; run scripts from `frontend/`.

## Environment configuration

Single **`.env`** at the repository root is used by Compose and `make` (`ENV_FILE = .env`).

| Variable | Purpose |
|----------|---------|
| `PROJECT_NAME` / `COMPOSE_PROJECT_NAME` | Docker container and network prefixes |
| `ENVIRONMENT` | `development`, `uat`, or `production` |
| `SECRET_KEY`, `DEBUG` | Django security and debug mode |
| `POSTGRES_*`, `DATABASE_URL` | PostgreSQL connection |
| `REDIS_*`, `CELERY_*` | Cache, broker, results |
| `VITE_API_BASE_URL`, `VITE_APP_NAME` | Frontend build-time API base and title |
| `NGINX_HTTP_PORT`, `NGINX_HTTPS_PORT` | Published nginx ports |
| `BACKEND_PORT`, `FRONTEND_PORT` | Optional direct service ports on the host |
| `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, `CSRF_TRUSTED_ORIGINS` | Django host/CORS/CSRF |

Copy [`env.example`](env.example) as a reference. **`./env-switch.sh`** (or `make env-switch ENV=…`) overwrites environment-specific keys in `.env` for development, UAT, or production.

Production SSL: place certificates under `nginx/ssl/` and use `make ssl-setup ENV=prod` for layout instructions.

## Makefile targets

Run `make help` for the full list. Summary by category:

| Category | Targets |
|----------|---------|
| Environment | `setup`, `env-check`, `env-switch` |
| Docker | `build`, `start`, `stop`, `down`, `restart`, `status`, `logs`, `logs-backend`, `logs-frontend`, `logs-nginx`, `up-logs` |
| Services | `start-backend`, `start-frontend`, `start-nginx` |
| Database | `migrate`, `makemigrations`, `collectstatic`, `createsuperuser`, `schema`, `docs` |
| Shells | `shell`, `dbshell`, `shell-backend`, `shell-frontend`, `shell-nginx`, `shell-postgres`, `shell-redis` |
| Quality | `install`, `lint`, `format`, `test`, `test-backend`, `test-coverage` |
| Maintenance | `clean`, `clean-all`, `update`, `backup`, `restore`, `ssl-setup` |
| Quick start | `dev`, `uat`, `prod` |
| Utility / monitoring | `ps`, `images`, `exec-backend`, `health`, `monitor`, `info` |

Backend- and frontend-specific Makefiles under `backend/` and `frontend/` target **standalone** Compose files in those directories; prefer the **root** Makefile for the full monorepo stack.

## Testing

| Scope | Command | Notes |
|-------|---------|--------|
| Backend (monorepo Docker) | `make test-backend ENV=development` | Runs `python manage.py test` in the backend container |
| Backend coverage | `make test-coverage ENV=development` | Uses `coverage` inside the container |
| Backend (local) | `cd backend && PYTHONPATH=src python manage.py test` | Requires configured DB/settings |
| Frontend | — | **`package.json` has no `test` script**; no Jest/Vitest runner configured |
| Root `make test` | Delegates to `backend/` and `frontend/` Makefiles | Frontend has no `test` target; use `make test-backend` for backend-only CI-style runs |

Backend tests today live under `backend/src/authentication/tests/`.

CI also runs [`python .sunset/validate_deploy_contract.py`](.sunset/validate_deploy_contract.py) on changes to `.sunset/deploy.yaml`.

## Deployment notes

- **Build time vs runtime:** Images build application dependencies; containers start Gunicorn (UAT/prod) or `runserver`/Vite (dev) via Compose overrides.
- **Routing:** Nginx sends `/api/` and `/admin/` to Django and other paths to the frontend (see `nginx/conf.d/dev.conf`).
- **Health:** Backend exposes `/health/` and `/api/health/`; Sunset contract expects `/api/health/` on port 8000 for the backend service.
- **Environments:** Use `env-switch.sh` and the matching Compose override file; never commit secrets in `.env`.
- **Post-deploy:** `make migrate`, `make collectstatic`, and `make createsuperuser` with the appropriate `ENV=`.

## Troubleshooting

| Issue | What to try |
|-------|-------------|
| Port already in use | Change `NGINX_HTTP_PORT` / `BACKEND_PORT` / `FRONTEND_PORT` in `.env`, or `make stop ENV=development` and inspect `docker ps` |
| Missing `.env` | `./env-switch.sh development` or `make env-check` |
| Database errors | `make migrate ENV=development`, check `make logs-backend ENV=development`, verify `POSTGRES_*` |
| API 404 from browser | Use nginx URL (`http://localhost:8080/api/…`), not the raw backend port, unless CORS/base URL is set for direct access |
| Stale containers | `make restart ENV=development` or `make clean` (prunes unused Docker resources) |
| Frontend install in container | `make shell-frontend ENV=development` then `npm install` |
| Legacy template names | Update `PROJECT_NAME`, database names, and domains in `.env` if you still see `horizon-digital` in container names |

Health checks:

```bash
make health ENV=development
curl -s http://localhost:8080/api/health/
curl -s http://localhost:8080/health
```

## Contributing and code style

- Scope changes to the areas requested (see [`.cursor/rules/rule-1.mdc`](.cursor/rules/rule-1.mdc): work only in the folder or surface specified for the task).
- Format and lint when touching code: root `make lint` / `make format` (frontend ESLint via `npm run lint` in `frontend/`).
- Prefer feature branches and pull requests against `main`.

## License

No `LICENSE` file is present in this repository. Treat the codebase as **proprietary / all rights reserved** unless your organization supplies separate licensing terms.

---

**Built for AFG Outsourcing Sunset — Django + React, Docker-first, multi-environment.**
