# 🌟 AFG Outsourcing Sunset

A production-ready full-stack monorepo with a **Django** REST API backend and **React** (Vite + TypeScript) frontend, orchestrated with **Docker Compose**, **Nginx** as a reverse proxy, and separate compose overlays for **development**, **UAT**, and **production**.

This README replaces the previous template (“Horizon Digital Monorepo”) with details verified against this repository’s compose files, scripts, and manifests.

## 📋 Table of Contents

- [🎯 Overview](#-overview)
- [🏗️ Architecture](#️-architecture)
- [📁 Repository layout](#-repository-layout)
- [🚀 Quickstart with Docker Compose](#-quickstart-with-docker-compose)
- [💻 Running locally without Docker](#-running-locally-without-docker)
- [🌍 Environment configuration](#-environment-configuration)
- [📖 Makefile targets](#-makefile-targets)
- [🔧 Development conventions](#-development-conventions)
- [🧪 Testing](#-testing)
- [🛠️ Troubleshooting](#️-troubleshooting)
- [🤝 Contributing](#-contributing)

## 🎯 Overview

**AFG Outsourcing Sunset** is a Dockerized monorepo that runs:

| Layer | Stack |
|-------|--------|
| **Backend** | Django ~5.0, Django REST Framework, JWT (`rest_framework_simplejwt`), Celery, PostgreSQL, Redis |
| **Frontend** | React 19, TypeScript, Vite 6, Redux Toolkit, React Router |
| **Edge** | Nginx reverse proxy (dev / UAT / prod configs under `nginx/`) |
| **Orchestration** | Root `docker-compose.yml` plus environment-specific overrides |

The root `Makefile`, `setup.sh`, and `env-switch.sh` automate environment setup and common Docker workflows. Default container naming still uses `PROJECT_NAME=horizon-digital` from `env.example`; set `PROJECT_NAME` in `.env` to match this project if you prefer different container names.

## 🏗️ Architecture

### Services (by compose file)

**`docker-compose.yml` (base)** — backend stack only (no frontend or Nginx):

| Service | Role |
|---------|------|
| `postgres` | PostgreSQL 16 primary database |
| `redis` | Cache and Celery broker |
| `backend` | Django API (Gunicorn in base file; dev override uses `runserver`) |
| `celery_worker` | Celery worker (`celery -A core worker`) |
| `celery_beat` | Celery beat with `django_celery_beat` database scheduler |

**`docker-compose.dev.yml`** — full dev stack (can be used alone or merged with the base file):

| Service | Role |
|---------|------|
| `postgres`, `redis`, `backend`, `celery_worker`, `celery_beat` | Same roles as base, with dev-specific settings and volumes |
| `frontend` | React dev server (`npm run dev -- --host 0.0.0.0`) |
| `nginx` | Reverse proxy to frontend and backend |

**`docker-compose.uat.yml`** and **`docker-compose.prod.yml`** — UAT and production stacks with Gunicorn backend, production frontend build, Nginx, Celery, PostgreSQL, and Redis.

### Host ports (defaults in compose when `.env` is unset)

Values below are **compose file defaults** (`${VAR:-default}`). After `./env-switch.sh` or editing `.env`, host ports follow your `.env` (for example, development switching sets `NGINX_HTTP_PORT=8080`, `BACKEND_PORT=8000`, `FRONTEND_PORT=3000`).

#### Development (`docker-compose.dev.yml`)

| Service | Default host port | Notes |
|---------|-------------------|--------|
| **Nginx** (app entry) | `8080` → container 80 | Main URL: `http://localhost:8080` |
| **Backend API** (direct) | `8001` → 8000 | Via Nginx: `http://localhost:8080/api` |
| **Frontend** (direct) | `3001` → 3000 | Vite listens on 3000 inside the container |
| **PostgreSQL** | `5433` → 5432 | DB name default: `horizon_digital_dev` |
| **Redis** | `6380` → 6379 | |

#### UAT (`docker-compose.uat.yml`)

| Service | Default host port |
|---------|-------------------|
| **Nginx** | `8081` (HTTP), `8443` (HTTPS) |
| **Backend** (direct) | `8002` → 8000 |
| **Frontend** (direct) | `3002` → 3000 |
| **PostgreSQL** | `5434` → 5432 |
| **Redis** | `6381` → 6379 |

#### Production (`docker-compose.prod.yml`)

| Service | Default host port |
|---------|-------------------|
| **Nginx** | `80`, `443` |
| **Backend / frontend** | Not published on the host; reached via Nginx on the Docker network |

### Request flow (typical)

```
Browser → Nginx (e.g. :8080 in dev) → / → frontend (Vite :3000)
                                      → /api → backend (Django :8000)
```

Backend health check path used in compose: `/health/`.

## 📁 Repository layout

Key paths in this repo:

- `backend/` — Django project (`manage.py`, `requirements.txt`, `src/core/`, `src/authentication/`)
- `frontend/` — React + Vite app (`package.json`, `src/`, `vite.config.ts`)
- `nginx/` — Nginx configs (`nginx.dev.conf`, `nginx.uat.conf`, `nginx.prod.conf`, `conf.d/`)
- `docker-compose.yml`, `docker-compose.dev.yml`, `docker-compose.uat.yml`, `docker-compose.prod.yml`
- `Makefile` — root orchestration for all environments
- `env.example` — template for root `.env`
- `env-switch.sh` — writes environment-specific values into `.env`
- `setup.sh` — first-time dev setup (env, build, migrate, collectstatic)
- `.cursor/rules/rule-1.mdc` — repository convention (scope of changes)

`backend/` and `frontend/` also ship their own `Makefile` and compose files for working inside those directories; the root `Makefile` is the primary entry point for the full stack.

## 🚀 Quickstart with Docker Compose

### Prerequisites

- Docker (20.10+)
- Docker Compose v2 (`docker compose` or `docker-compose`)
- **Make** (optional; shortcuts in root `Makefile`)

### 1. Environment file

```bash
cp env.example .env
# Edit .env as needed — see env.example for all variables
```

Or generate a development-oriented `.env`:

```bash
./env-switch.sh development
```

### 2. Start stacks

The root `Makefile` merges the base file with an overlay (`docker-compose.yml` + `docker-compose.<env>.yml`). Equivalent raw commands:

**Development**

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml --env-file .env up --build -d
# Or use the dev overlay only (defines the full dev stack):
docker compose -f docker-compose.dev.yml --env-file .env up --build -d
# Or:
make dev
# Or first-time bootstrap:
./setup.sh
```

**UAT**

```bash
docker compose -f docker-compose.yml -f docker-compose.uat.yml --env-file .env up --build -d
# Or:
make uat
```

**Production**

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env up --build -d
# Or:
make prod
```

**Base file only** (PostgreSQL, Redis, backend, Celery — no frontend/Nginx):

```bash
docker compose -f docker-compose.yml --env-file .env up --build -d
```

### 3. Access (development, via Nginx)

After `./env-switch.sh development` or with default dev Nginx port:

- **Application**: http://localhost:8080
- **API**: http://localhost:8080/api/
- **Django admin**: http://localhost:8080/admin/
- **API docs** (when services are up): http://localhost:8080/api/docs/

Create an admin user:

```bash
make createsuperuser ENV=development
```

### 4. Logs and stop

```bash
# Follow logs (example: development)
docker compose -f docker-compose.yml -f docker-compose.dev.yml logs -f backend
make logs ENV=development

# Stop and remove containers (add -v to drop volumes)
docker compose -f docker-compose.yml -f docker-compose.dev.yml down
make stop ENV=development
```

## 💻 Running locally without Docker

### Backend (Django)

From `backend/`:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp env.example .env   # if backend/env.example exists; otherwise symlink or copy root .env
export PYTHONPATH=src
export DJANGO_ENV=local
python manage.py migrate
python manage.py runserver
```

Settings load from `backend/.env` via `django-environ` (`core.settings` uses `DJANGO_ENV`: `local`, `dev`, `uat`, `prod`). Local mode expects PostgreSQL (see `backend/src/core/settings/__init__.py`).

### Frontend (React)

From `frontend/`:

```bash
npm install
npm run dev
```

Vite dev server default port: **3000** (`frontend/vite.config.ts`). Other scripts: `npm run build`, `npm run lint`, `npm run preview`.

## 🌍 Environment configuration

- **Template**: copy `env.example` to `.env` at the repository root. Compose services use `env_file: .env`; Django reads environment variables from the container environment / backend `.env` as configured in settings.
- **Do not commit** secrets; replace placeholders in `.env` for UAT/production (`POSTGRES_PASSWORD`, `REDIS_PASSWORD`, `SECRET_KEY`, etc.).

### `env-switch.sh`

Usage from the script:

```text
Usage: ./env-switch.sh <environment>

Available environments:
  development  - Development environment
  uat         - User Acceptance Testing environment
  production  - Production environment

Examples:
  ./env-switch.sh development
  ./env-switch.sh uat
  ./env-switch.sh production
```

Aliases: `dev` → `development`, `prod` → `production`.

Equivalent Make target:

```bash
make env-switch ENV=development
```

## 📖 Makefile targets

Run `make help` for the full list. Main root targets (all support `ENV=development|dev|uat|production|prod` unless noted):

| Target | Description |
|--------|-------------|
| `help` | Show categorized commands |
| `setup` | Run `./env-switch.sh development` |
| `env-check` | Verify `.env` exists |
| `env-switch` | Run `./env-switch.sh $(ENV)` |
| `build`, `start`, `stop`, `down`, `restart`, `status` | Docker Compose build / lifecycle |
| `logs`, `logs-backend`, `logs-frontend`, `logs-nginx` | Tail service logs |
| `start-backend`, `start-frontend`, `start-nginx` | Start service subsets |
| `migrate`, `makemigrations`, `collectstatic`, `createsuperuser` | Django management via backend container |
| `schema`, `docs` | OpenAPI schema generation / doc URLs |
| `shell`, `dbshell`, `shell-backend`, `shell-frontend`, `shell-nginx`, `shell-postgres`, `shell-redis` | Shells and CLI access |
| `install`, `lint`, `format`, `test`, `test-backend`, `test-coverage` | Delegates to backend/frontend Makefiles or container tests |
| `clean`, `clean-all`, `update`, `backup`, `restore` | Maintenance |
| `ssl-setup` | Production SSL directory hints (`ENV=prod`) |
| `dev`, `uat`, `prod` | Quick start per environment |
| `ps`, `images`, `exec-backend`, `up-logs` | Utilities |
| `health`, `monitor`, `info` | Health checks and environment info |

## 🔧 Development conventions

- **Same-origin API in Docker**: Nginx routes `/api` to the Django backend. Prefer relative `/api/...` calls or set `VITE_API_BASE_URL` for build-time configuration (used in `frontend/src/services/api.ts` and `frontend/vite.config.ts` proxy). Avoid hardcoding host-specific API URLs in production builds unless your deployment requires it.
- **Scope of changes**: follow [.cursor/rules/rule-1.mdc](.cursor/rules/rule-1.mdc) — only change files in the folder or area agreed for each task.
- **Apps**: local Django app `authentication` is registered in `core.settings.base`; API schema is provided via `drf_spectacular`.

## 🧪 Testing

| Area | Runner | Command |
|------|--------|---------|
| **Backend** | Django test runner | `make test-backend ENV=development` (requires running Compose stack and PostgreSQL), or from `backend/`: `make test` (uses backend’s own Docker compose files) |
| **Backend (coverage)** | coverage + Django tests | `make test-coverage ENV=development` |
| **Frontend** | — | No `test` script in `frontend/package.json`; root `make test` invokes `frontend` Makefile, which has no `test` target |

Backend tests live under `backend/src/authentication/tests/`. `pytest` is listed in `backend/requirements.txt` but the project uses Django’s `manage.py test` via the Makefiles above.

## 🛠️ Troubleshooting

| Issue | What to try |
|-------|-------------|
| **Port already in use** | Adjust `NGINX_HTTP_PORT`, `BACKEND_PORT`, `FRONTEND_PORT`, `POSTGRES_PORT`, or `REDIS_PORT` in `.env`, or stop conflicting containers (`docker ps`). |
| **Missing `.env`** | `cp env.example .env` or `./env-switch.sh development`; `make env-check` validates presence. |
| **Database errors** | `make migrate ENV=development`; ensure Postgres container is healthy. |
| **Services not starting** | `make logs ENV=development`; `make restart ENV=development`; for a clean dev reset: `make stop ENV=development` then `make start ENV=development`. |
| **Backend health** | `curl http://localhost:8080/api/health/` (via Nginx in dev) or `make health ENV=development`. |
| **UAT/production Redis** | UAT/prod compose require `REDIS_PASSWORD` in `.env`. |

## 🤝 Contributing

- Follow [.cursor/rules/rule-1.mdc](.cursor/rules/rule-1.mdc) for change scope and conventions.
- Component-level docs: [backend/README.md](./backend/README.md), [frontend/README.md](./frontend/README.md).

No `LICENSE` or `CONTRIBUTING.md` file is present in this repository at the time of this README update.

---

**Built with ❤️ for modern full-stack development**
