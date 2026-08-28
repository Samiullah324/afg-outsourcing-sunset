# AFG Outsourcing Sunset — Full‑Stack Monorepo (Django + React)

A production-ready monorepo for **AFG Outsourcing Sunset** (`afg-outsourcing-sunset`) with a Django REST API backend, React frontend, Docker Compose orchestration across **development**, **UAT**, and **production**, an Nginx reverse proxy (dev/UAT/prod), PostgreSQL, Redis, and Celery workers for background tasks.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Quick Start (Development)](#quick-start-development)
- [Other Environments](#other-environments)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [Makefile Commands](#makefile-commands)
- [Common Workflows](#common-workflows)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

## Overview

This repository is a single-repo, monorepo-style full-stack application. The **Django** backend (`backend/`) exposes a REST API with JWT authentication, OpenAPI documentation, and Celery-backed background jobs (`backend/src/core/celery.py`). The **React** frontend (`frontend/`) is built with Vite and TypeScript. **Docker Compose** files at the repo root define the service topology for each environment, and **Nginx** fronts the stack in dev, UAT, and production—proxying `/api/` and `/admin/` to the backend and `/` to the frontend.

Helper scripts and a root **Makefile** wrap common Docker, database, and environment-switching tasks so you can bootstrap and operate the stack without memorizing long compose commands.

## Architecture

Compose is layered: `docker-compose.yml` defines the shared backend stack; environment-specific files (`docker-compose.dev.yml`, `docker-compose.uat.yml`, `docker-compose.prod.yml`) add frontend, Nginx, and per-environment overrides.

### Services

| Service | Purpose | Published ports (compose defaults) |
|---------|---------|-------------------------------------|
| **nginx** | Reverse proxy; routes `/api/` and `/admin/` to backend, `/` to frontend | **Dev:** `${NGINX_HTTP_PORT:-8080}` → 80 · **UAT:** `${NGINX_HTTP_PORT:-8081}` → 80, `${NGINX_HTTPS_PORT:-8443}` → 443 · **Prod:** 80 → 80, 443 → 443 |
| **frontend** | React application (Vite dev server in dev; built assets in UAT/prod) | **Dev:** `${FRONTEND_PORT:-3001}` → 3000 · **UAT:** `${FRONTEND_PORT:-3002}` → 3000 · **Prod:** internal only |
| **backend** | Django API server (`runserver` in dev; Gunicorn in UAT/prod) | **Base/Dev:** `${BACKEND_PORT:-8001}` → 8000 · **UAT:** `${BACKEND_PORT:-8002}` → 8000 · **Prod:** internal only |
| **postgres** | Primary PostgreSQL database | **Base:** `${POSTGRES_PORT:-5432}` → 5432 · **Dev:** `${POSTGRES_PORT:-5433}` → 5432 · **UAT:** `${POSTGRES_PORT:-5434}` → 5432 · **Prod:** internal only |
| **redis** | Cache and Celery message broker | **Base:** `${REDIS_PORT:-6379}` → 6379 · **Dev:** `${REDIS_PORT:-6380}` → 6379 · **UAT:** `${REDIS_PORT:-6381}` → 6379 · **Prod:** internal only |
| **celery_worker** | Celery worker for async tasks | none (internal) |
| **celery_beat** | Celery beat scheduler (`django_celery_beat`) | none (internal) |

> **Note:** Port numbers above are the defaults embedded in the compose files (`${VAR:-default}`). When a root `.env` file is present (recommended), those values override the defaults. Use `./env-switch.sh` or edit `.env` directly.

### Routing (Nginx)

In development (`nginx/conf.d/dev.conf`):

- `/api/` → Django backend
- `/admin/` → Django admin
- `/static/`, `/media/` → static and media volumes
- `/` → React frontend (with HMR/WebSocket support)
- `/health` → Nginx health check

**Primary access pattern:** use the Nginx HTTP port for each environment (e.g. `http://localhost:8080` in dev) rather than direct backend/frontend ports unless debugging a specific service.

## Prerequisites

- **Docker** (20.10+) and **Docker Compose** (v2+)
- **Make** (recommended; Makefile wraps compose commands)
- **Bash** (for `setup.sh` and `env-switch.sh`)

Runtime versions are defined per app:

- **Python:** Django ~5.0 (`backend/requirements.txt`)
- **Node.js:** compatible with Vite 6 and React 19 (`frontend/package.json`)

## Quick Start (Development)

### 1. Clone the repository

```bash
git clone https://github.com/Samiullah324/afg-outsourcing-sunset.git
cd afg-outsourcing-sunset
```

### 2. Configure environment

Copy or generate a root `.env` file:

```bash
cp env.example .env
# or let the switcher create/update .env for development
./env-switch.sh development
```

Review `.env` and set `PROJECT_NAME`, database credentials, and API URLs as needed.

### 3. Bootstrap (optional but recommended)

`setup.sh` verifies Docker/Docker Compose, creates `.env` for development if missing, creates `nginx/ssl`, `nginx/logs`, and `backups` directories, builds images, starts the dev stack, runs migrations and `collectstatic`, and optionally prompts for a superuser:

```bash
./setup.sh
```

### 4. Start development

Using Make (builds, starts, and prints URLs):

```bash
make dev
```

Or with Docker Compose directly:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml --env-file .env up -d --build
```

Equivalent step-by-step via Make:

```bash
make build ENV=development
make start ENV=development
```

### 5. Access the application

With default compose port fallbacks (no conflicting `.env` overrides):

| Endpoint | URL |
|----------|-----|
| **Frontend (via Nginx)** | http://localhost:8080 |
| **Backend API (via Nginx)** | http://localhost:8080/api/ |
| **Django Admin** | http://localhost:8080/admin/ |
| **Nginx health** | http://localhost:8080/health |
| **Backend (direct)** | http://localhost:8001 |
| **Frontend (direct)** | http://localhost:3001 |

Create an admin user:

```bash
make createsuperuser ENV=development
```

## Other Environments

All environments use the same pattern: base compose file plus an environment overlay, with variables loaded from the root `.env` via `env_file: .env` on services and `--env-file .env` in the Makefile.

### Switch environment context

`env-switch.sh` updates the single root `.env` for the target environment:

```bash
./env-switch.sh <environment>
```

Available environments:

- `development` (alias: `dev`) — local development
- `uat` — user acceptance testing
- `production` (alias: `prod`) — production

Examples from the script:

```bash
./env-switch.sh development
./env-switch.sh uat
./env-switch.sh production
```

Or via Make:

```bash
make env-switch ENV=development
make env-switch ENV=uat
make env-switch ENV=production
```

### UAT

```bash
make uat
# or
docker compose -f docker-compose.yml -f docker-compose.uat.yml --env-file .env up -d --build
```

Default access (compose fallbacks):

| Endpoint | URL |
|----------|-----|
| **Application (Nginx HTTP)** | http://localhost:8081 |
| **Application (Nginx HTTPS)** | https://localhost:8443 |
| **Backend (direct)** | http://localhost:8002 |
| **Frontend (direct)** | http://localhost:3002 |

Post-start:

```bash
make migrate ENV=uat
make collectstatic ENV=uat
```

### Production

```bash
make prod
# or
docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env up -d --build
```

Default access:

| Endpoint | URL |
|----------|-----|
| **Application (HTTP)** | http://localhost:80 |
| **Application (HTTPS)** | https://localhost:443 |

Place SSL certificates in `nginx/ssl/` before serving HTTPS (`make ssl-setup ENV=prod` creates the directory and prints expected filenames).

Post-start:

```bash
make migrate ENV=production
make collectstatic ENV=production
make createsuperuser ENV=production
```

## Environment Variables

Configuration lives in a **single root `.env` file**. Copy `env.example` to `.env` or run `./env-switch.sh <environment>`.

Compose services load it via `env_file: - .env` (see `backend`, `frontend`, `celery_worker`, and `celery_beat` in the compose files). The Makefile always passes `--env-file .env`.

### Core variables

| Variable | Description |
|----------|-------------|
| `PROJECT_NAME` | Docker container and network name prefix |
| `COMPOSE_PROJECT_NAME` | Docker Compose project name |
| `ENVIRONMENT` | Active environment: `development`, `uat`, or `production` |
| `DEBUG` | Django debug mode |
| `SECRET_KEY` | Django secret key (change in non-dev environments) |

### Database

| Variable | Description |
|----------|-------------|
| `POSTGRES_DB` | PostgreSQL database name |
| `POSTGRES_USER` | PostgreSQL user |
| `POSTGRES_PASSWORD` | PostgreSQL password |
| `POSTGRES_HOST` | Database host (typically `postgres` inside Docker) |
| `POSTGRES_PORT` | Host port mapped to PostgreSQL |
| `DATABASE_URL` | Full database connection URL |

### Redis & Celery

| Variable | Description |
|----------|-------------|
| `REDIS_HOST` | Redis host |
| `REDIS_PORT` | Host port mapped to Redis |
| `REDIS_PASSWORD` | Redis password (required for UAT/prod) |
| `REDIS_URL` | Redis connection URL |
| `CELERY_BROKER_URL` | Celery broker URL |
| `CELERY_RESULT_BACKEND` | Celery result backend URL |

### Frontend

| Variable | Description |
|----------|-------------|
| `VITE_API_BASE_URL` | API base URL exposed to the React app |
| `VITE_APP_NAME` | Application display name |
| `NODE_ENV` | Node environment (`development` or `production`) |

### Nginx & service ports

| Variable | Description |
|----------|-------------|
| `NGINX_HTTP_PORT` | Host port for Nginx HTTP |
| `NGINX_HTTPS_PORT` | Host port for Nginx HTTPS (UAT/prod) |
| `BACKEND_PORT` | Host port mapped to Django |
| `FRONTEND_PORT` | Host port mapped to React |

### Django, email, security, logging

| Variable | Description |
|----------|-------------|
| `ALLOWED_HOSTS` | Comma-separated allowed hosts |
| `CORS_ALLOWED_ORIGINS` | CORS allowed origins |
| `CSRF_TRUSTED_ORIGINS` | CSRF trusted origins |
| `EMAIL_BACKEND` | Django email backend |
| `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USE_TLS` | SMTP settings |
| `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD` | SMTP credentials |
| `LOG_LEVEL`, `DJANGO_LOG_LEVEL` | Logging verbosity |
| `SECURE_SSL_REDIRECT`, `SECURE_HSTS_*` | Production security headers |
| `SESSION_COOKIE_SECURE`, `CSRF_COOKIE_SECURE` | Secure cookie flags |

Optional blocks for AWS S3, Sentry, Google Analytics, and backups are commented in `env.example`.

## Project Structure

```
afg-outsourcing-sunset/
├── backend/                    # Django backend
│   ├── src/core/               # Project settings, URLs, Celery app
│   │   ├── celery.py
│   │   ├── settings/
│   │   └── urls.py
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/                   # React + Vite frontend
│   ├── src/
│   │   ├── components/         # Atomic design components
│   │   ├── pages/
│   │   ├── services/
│   │   └── store/
│   ├── package.json
│   └── Dockerfile
├── nginx/                      # Nginx configs per environment
│   ├── conf.d/
│   └── ssl/
├── docker-compose.yml          # Base services (postgres, redis, backend, celery)
├── docker-compose.dev.yml      # Development overrides + frontend + nginx
├── docker-compose.uat.yml      # UAT configuration
├── docker-compose.prod.yml     # Production configuration
├── Makefile                    # Convenience commands
├── env.example                 # Environment template
├── env-switch.sh               # Switch .env for dev/uat/production
├── setup.sh                    # First-time development bootstrap
└── README.md
```

## Makefile Commands

Run `make help` for the full categorized list. Default environment is `development`; pass `ENV=development|dev|uat|production|prod` where noted.

| Target | Description |
|--------|-------------|
| `help` | Display all targets with descriptions |
| `info` | Show current environment, compose files, and Docker versions |
| `setup` | Run `./env-switch.sh development` for initial setup |
| `env-check` | Verify `.env` exists |
| `env-switch` | Switch environment via `./env-switch.sh $(ENV)` |
| `build` | Build all services |
| `start` | Start all services in detached mode |
| `stop` / `down` | Stop and remove containers |
| `restart` | Stop then start services |
| `status` | Show service status (`docker compose ps`) |
| `logs` | Follow logs for all services |
| `logs-backend` | Follow backend logs |
| `logs-frontend` | Follow frontend logs |
| `logs-nginx` | Follow Nginx logs |
| `start-backend` | Start postgres, redis, backend, celery_worker, celery_beat |
| `start-frontend` | Start frontend only |
| `start-nginx` | Start nginx only |
| `migrate` | Run Django migrations |
| `makemigrations` | Create new Django migrations |
| `collectstatic` | Collect Django static files |
| `createsuperuser` | Create a Django superuser |
| `schema` | Generate OpenAPI schema to `schema.yml` |
| `docs` | Print API documentation URLs |
| `shell` | Django shell |
| `dbshell` | Database shell |
| `shell-backend` | Bash in backend container |
| `shell-frontend` | Shell in frontend container |
| `shell-nginx` | Shell in nginx container |
| `shell-postgres` | Bash in postgres container |
| `shell-redis` | Redis CLI |
| `install` | Install backend and frontend dependencies locally |
| `lint` | Run backend and frontend linters |
| `format` | Format backend and frontend code |
| `test` | Run backend and frontend tests |
| `test-backend` | Run Django tests in container |
| `test-coverage` | Run backend tests with coverage report |
| `clean` | Prune unused Docker resources and volumes |
| `clean-all` | Remove all containers, images, and volumes (interactive confirm) |
| `update` | Pull images and rebuild |
| `ssl-setup` | Prepare `nginx/ssl/` for production certificates |
| `backup` | Dump PostgreSQL database to `backups/` |
| `restore` | Restore database from `BACKUP_FILE=...` |
| `dev` | Quick-start development (env, build, start) |
| `uat` | Quick-start UAT |
| `prod` | Quick-start production |
| `ps` | List running containers |
| `images` | List Docker images |
| `exec-backend` | Run `CMD="..."` inside backend container |
| `up-logs` | Start services in foreground with logs |
| `health` | Curl backend and nginx health endpoints |
| `monitor` | Show live container resource usage |

## Common Workflows

### Run migrations

```bash
make migrate ENV=development
```

### Create a superuser

```bash
make createsuperuser ENV=development
```

### View logs

```bash
make logs ENV=development
make logs-backend ENV=development
```

### Rebuild after dependency changes

```bash
make stop ENV=development
make build ENV=development
make start ENV=development
```

### Reset volumes (database/cache)

```bash
make stop ENV=development
docker compose -f docker-compose.yml -f docker-compose.dev.yml --env-file .env down -v
make dev
make migrate ENV=development
```

### API documentation

```bash
make docs ENV=development
# Swagger UI: http://localhost:8080/api/docs/
# ReDoc:      http://localhost:8080/api/redoc/
```

## Troubleshooting

### Port conflicts

If a service fails to bind, check which process is using the port and adjust `NGINX_HTTP_PORT`, `BACKEND_PORT`, `FRONTEND_PORT`, `POSTGRES_PORT`, or `REDIS_PORT` in `.env`, then restart:

```bash
make stop ENV=development
make start ENV=development
```

### Services not starting

```bash
make status ENV=development
make logs ENV=development
make health ENV=development
```

### Database connection issues

```bash
make shell-postgres ENV=development
make dbshell ENV=development
make migrate ENV=development
```

### Clean Docker state

```bash
make clean
# Nuclear reset (removes all containers/images/volumes):
make clean-all
make dev
```

### Check environment configuration

```bash
make env-check ENV=development
make info
```

## Contributing

1. Fork the repository and create a feature branch from `main`.
2. Make your changes in `backend/` or `frontend/` as appropriate.
3. Run tests and linting: `make test ENV=development` and `make lint ENV=development`.
4. Commit with a clear message and open a pull request against `main`.

---

**AFG Outsourcing Sunset** — Django + React monorepo with Docker multi-environment support.
