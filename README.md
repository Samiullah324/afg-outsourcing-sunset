# AFG Outsourcing — Sunset Monorepo

Full-stack monorepo for the AFG Outsourcing sunset project: Django REST API, React frontend, and multi-environment Docker orchestration.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Repository Layout](#repository-layout)
- [Requirements](#requirements)
- [Quick Start (Docker — Development)](#quick-start-docker--development)
- [Local Development (Optional)](#local-development-optional)
- [Environment & Configuration](#environment--configuration)
- [Common Tasks](#common-tasks)
- [Testing](#testing)
- [Linting & Formatting](#linting--formatting)
- [Deployment (UAT / Production)](#deployment-uat--production)
- [Troubleshooting](#troubleshooting)

## Overview

This repository provides a complete full-stack application with:

- **Django backend** — REST API with JWT authentication, PostgreSQL, Celery background tasks, and Redis
- **React frontend** — React 19 + TypeScript, Vite, Redux Toolkit
- **Nginx reverse proxy** — single entrypoint routing `/` to the frontend and `/api/` to the backend
- **Docker Compose** — base plus environment-specific overlays for **development**, **UAT**, and **production**
- **Makefile & helper scripts** — `Makefile`, `setup.sh`, and `env-switch.sh` for common workflows

## Architecture

Nginx is the primary entrypoint in dev, UAT, and production. The frontend talks to the backend through the reverse proxy at `/api/...` (confirmed in `backend/src/core/urls.py`).

```
┌─────────────────────────────────────────────────────────────┐
│                    nginx (reverse proxy)                    │
│              Primary entrypoint (see ports below)           │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │
      ┌────────▼────────┐            ┌────────▼────────┐
      │     frontend    │            │     backend     │
      │  React + Vite   │            │  Django + DRF   │
      └─────────────────┘            └────────┬────────┘
                                              │
                         ┌────────────────────┼────────────────────┐
                         │                    │                    │
                  ┌──────▼──────┐      ┌──────▼──────┐      ┌──────▼──────┐
                  │  postgres   │      │    redis    │      │celery_worker│
                  │  PostgreSQL │      │ cache/queue │      │ celery_beat │
                  └─────────────┘      └─────────────┘      └─────────────┘
```

### Services (Docker Compose)

The root stack merges `docker-compose.yml` with an environment overlay (`docker-compose.dev.yml`, `docker-compose.uat.yml`, or `docker-compose.prod.yml`).

| Service | Description | Dev ports (host:container) | UAT ports | Prod ports |
|---------|-------------|----------------------------|-----------|------------|
| **nginx** | Reverse proxy — **primary entrypoint** | `${NGINX_HTTP_PORT:-8080}:80` | `${NGINX_HTTP_PORT:-8081}:80`, `${NGINX_HTTPS_PORT:-8443}:443` | `80:80`, `443:443` |
| **frontend** | React application (Vite dev server or preview) | `${FRONTEND_PORT:-3001}:3000` | `${FRONTEND_PORT:-3002}:3000` | internal only |
| **backend** | Django API (runserver or Gunicorn) | `${BACKEND_PORT:-8001}:8000` | `${BACKEND_PORT:-8002}:8000` | internal only |
| **postgres** | PostgreSQL 16 database | `${POSTGRES_PORT:-5433}:5432` | `${POSTGRES_PORT:-5434}:5432` | internal only |
| **redis** | Redis 7 cache and Celery broker | `${REDIS_PORT:-6380}:6379` | `${REDIS_PORT:-6381}:6379` | internal only |
| **celery_worker** | Celery task worker | — | — | — |
| **celery_beat** | Celery periodic task scheduler | — | — | — |

After running `./env-switch.sh development`, typical dev host ports are **8080** (nginx), **8000** (backend), **3000** (frontend), **5455** (postgres), and **6380** (redis).

### API routing

- All REST endpoints are served under **`/api/`** (e.g. `/api/auth/`, `/api/health/`, `/api/docs/`).
- Django admin is at **`/admin/`**.
- Health checks: **`/health/`** and **`/api/health/`** on the backend; **`/health`** on nginx.

## Repository Layout

```
afg-outsourcing-sunset/
├── backend/                 # Django project (src/core/, authentication/)
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── manage.py
│   └── Makefile             # Backend-only Docker helpers
├── frontend/                # React + Vite app
│   ├── Dockerfile
│   ├── package.json
│   └── Makefile             # Frontend-only Docker helpers
├── nginx/                   # Reverse-proxy configs (dev/uat/prod)
├── docker-compose.yml       # Base services (postgres, redis, backend, celery)
├── docker-compose.dev.yml   # Dev overrides (+ frontend, nginx)
├── docker-compose.uat.yml   # UAT overrides
├── docker-compose.prod.yml  # Production overrides
├── Makefile                 # Root orchestration (all environments)
├── env.example              # Environment variable template
├── env-switch.sh            # Switch .env for dev / uat / production
├── setup.sh                 # First-time dev bootstrap script
└── README.md
```

## Requirements

- **Docker Desktop** (latest stable) or Docker Engine **20.10+**
- **Docker Compose** v2+
- **Make** (optional; compose commands work without it)
- For optional local (non-Docker) development:
  - **Python 3.12+** (matches `backend/Dockerfile`)
  - **Node.js 18+** (Docker image uses Node 24; local dev should work on 18+)
  - **PostgreSQL** and **Redis** running locally

## Quick Start (Docker — Development)

### 1. Clone the repository

```bash
git clone https://github.com/Samiullah324/afg-outsourcing-sunset.git
cd afg-outsourcing-sunset
```

### 2. Configure environment

The project uses a **single root `.env` file**. Either copy the template manually or use the helper scripts:

```bash
# Option A — automated first-time setup (recommended)
./setup.sh

# Option B — manual setup
cp env.example .env
./env-switch.sh development   # or: ./env-switch.sh dev
```

Review `.env` and update secrets (`SECRET_KEY`, database passwords, etc.) before UAT/production use.

### 3. Build and start (development)

```bash
# Via Makefile (uses docker-compose.yml + docker-compose.dev.yml)
make dev

# Or directly with Docker Compose
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

### 4. Access the application

With nginx running (default dev setup):

| URL | Purpose |
|-----|---------|
| http://localhost:8080 | Frontend (via nginx) |
| http://localhost:8080/api/ | Backend API |
| http://localhost:8080/admin/ | Django admin |
| http://localhost:8080/api/docs/ | Swagger UI |
| http://localhost:8080/api/redoc/ | ReDoc |

Direct service ports (if needed): frontend `http://localhost:3000`, backend `http://localhost:8000`.

### 5. Initial database setup

Migrations and static file collection run automatically via the backend `entrypoint.sh` on container start. For manual steps:

```bash
make migrate ENV=development
make createsuperuser ENV=development
```

Or with Docker Compose directly:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend python manage.py migrate
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend python manage.py createsuperuser
```

### 6. Seed demo data (optional)

```bash
DEMO_ADMIN_PASSWORD=your-password docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend python manage.py seed_demo
```

Creates a demo admin user (`demo@sunset.dev`) and sample users. Safe to re-run.

## Local Development (Optional)

Docker is the primary workflow. To run services locally without containers:

### Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp env.example .env   # configure for local Postgres/Redis
export DJANGO_ENV=local
python manage.py migrate
python manage.py runserver
```

Ensure PostgreSQL and Redis are reachable at the host/port configured in `.env`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend uses **npm** (`package-lock.json` is present). Docker images may use **bun** when available, with npm as fallback.

Set `VITE_API_BASE_URL` in the root `.env` (e.g. `http://localhost:8000`) if not using nginx locally.

## Environment & Configuration

Configuration is loaded from the root **`.env`** file (see `env.example`). Key variables:

| Variable | Purpose |
|----------|---------|
| `PROJECT_NAME` | Docker container/network name prefix (default: `horizon-digital`) |
| `COMPOSE_PROJECT_NAME` | Docker Compose project name |
| `ENVIRONMENT` | Active environment: `development`, `uat`, or `production` |
| `DEBUG` | Django debug mode (`True`/`False`) |
| `SECRET_KEY` | Django secret key |
| `ALLOWED_HOSTS` | Comma-separated allowed hosts |
| `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_HOST`, `POSTGRES_PORT` | PostgreSQL connection |
| `DATABASE_URL` | Full database URL (used by Django via `django-environ`) |
| `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`, `REDIS_URL` | Redis connection |
| `CELERY_BROKER_URL`, `CELERY_RESULT_BACKEND` | Celery broker and result backend |
| `VITE_API_BASE_URL`, `VITE_APP_NAME` | Frontend build-time configuration |
| `NGINX_HTTP_PORT`, `NGINX_HTTPS_PORT` | Nginx host port mappings |
| `BACKEND_PORT`, `FRONTEND_PORT` | Direct service port mappings |
| `CORS_ALLOWED_ORIGINS`, `CSRF_TRUSTED_ORIGINS` | CORS and CSRF settings |
| `EMAIL_BACKEND`, `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USE_TLS`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD` | Email configuration |
| `LOG_LEVEL`, `DJANGO_LOG_LEVEL` | Logging verbosity |
| `SECURE_SSL_REDIRECT`, `SECURE_HSTS_*`, `SESSION_COOKIE_SECURE`, `CSRF_COOKIE_SECURE` | Production security flags |
| `DEMO_ADMIN_PASSWORD` | Password for the demo admin user created by `seed_demo` |

### Environment switching

`env-switch.sh` updates `.env` for the selected target:

```bash
./env-switch.sh development   # aliases: dev
./env-switch.sh uat
./env-switch.sh production    # aliases: prod
```

Equivalent Makefile target:

```bash
make env-switch ENV=development
```

## Common Tasks

Root `Makefile` targets (use `ENV=development|uat|production` or aliases `dev|uat|prod`):

| Target | Description |
|--------|-------------|
| `make help` | Show all available commands |
| `make dev` / `make uat` / `make prod` | Quick-start an environment |
| `make setup` | Switch to development env via `env-switch.sh` |
| `make build` | Build all services |
| `make start` / `make stop` / `make down` | Start or stop services |
| `make restart` | Restart all services |
| `make status` / `make ps` | Show container status |
| `make logs` | Follow logs for all services |
| `make logs-backend` / `make logs-frontend` / `make logs-nginx` | Service-specific logs |
| `make migrate` / `make makemigrations` | Database migrations |
| `make collectstatic` | Collect Django static files |
| `make createsuperuser` | Create Django admin user |
| `make shell` / `make dbshell` | Django or database shell |
| `make shell-backend` / `make shell-frontend` / `make shell-nginx` | Container shells |
| `make test` / `make test-backend` / `make test-coverage` | Run backend tests |
| `make lint` / `make format` | Lint/format (delegates to backend & frontend) |
| `make health` / `make monitor` | Health checks and resource usage |
| `make backup` / `make restore BACKUP_FILE=...` | Database backup/restore |
| `make clean` / `make clean-all` | Remove Docker resources |
| `make ssl-setup ENV=prod` | Prepare SSL certificate directory |
| `make docs` / `make schema` | API documentation URLs and OpenAPI schema |

Run `make help` for the full categorized list.

## Testing

### Backend

Django tests exist under `backend/src/authentication/tests/`. Run them inside the backend container:

```bash
make test-backend ENV=development
# or
make test ENV=development
```

With coverage:

```bash
make test-coverage ENV=development
```

`pytest` and `pytest-django` are listed in `backend/requirements.txt`, but the Makefile uses Django's `manage.py test` runner.

### Frontend

`frontend/package.json` does **not** define a `test` script. No automated frontend tests are currently configured.

## Linting & Formatting

### Frontend

```bash
cd frontend
npm run lint        # ESLint
```

Or via root Makefile (runs inside the frontend container when services are up):

```bash
make lint ENV=development
```

Husky and lint-staged run ESLint on staged files during git commits.

### Backend

No Python linters (ruff, flake8, black, isort) are configured. The root `make format` target delegates to subproject Makefiles, but the backend Makefile does not define `lint` or `format` targets yet.

## Deployment (UAT / Production)

### UAT

```bash
./env-switch.sh uat
# Update .env: POSTGRES_PASSWORD, REDIS_PASSWORD, domain names, email settings
make uat
# or
docker compose -f docker-compose.yml -f docker-compose.uat.yml up -d --build
```

Default UAT entrypoint: **http://localhost:8081** (nginx).

Place SSL certificates in `nginx/ssl/` for HTTPS on port **8443**.

### Production

```bash
./env-switch.sh production
# Set strong SECRET_KEY, POSTGRES_PASSWORD, REDIS_PASSWORD, and production domains
make ssl-setup ENV=prod   # creates nginx/ssl/ — add cert.pem, key.pem, chain.pem
make prod
# or
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

Production nginx listens on **80** and **443**. Postgres, Redis, backend, and frontend are not exposed to the host.

### Post-deploy notes

- **Migrations** and **`collectstatic`** run automatically via `backend/entrypoint.sh` when the backend container starts.
- The frontend production image runs `npm run build` (or `bun run build`) during the Docker build; the container serves the built app with `vite preview`.
- Create an admin user after first deploy: `make createsuperuser ENV=production`

## Troubleshooting

**Port already in use**

```bash
make stop ENV=development
docker ps    # find conflicting containers
```

**Reset database and volumes**

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml down -v
make dev
make migrate ENV=development
```

**Migration conflicts**

```bash
make migrate ENV=development
make makemigrations ENV=development
```

**View logs**

```bash
make logs ENV=development
make logs-backend ENV=development
```

**Service health**

```bash
make health ENV=development
curl http://localhost:8080/health
curl http://localhost:8080/api/health/
```

**Complete Docker cleanup** (removes containers, images, and volumes):

```bash
make clean-all ENV=development
```

**Frontend dependency issues** (inside container):

```bash
make shell-frontend ENV=development
npm install   # or bun install if available
```

---

**AFG Outsourcing — Sunset Monorepo** · Django + React · Docker Compose
