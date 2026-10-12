# AFG Outsourcing Sunset Monorepo

Django backend + React (Vite + TypeScript) frontend, Nginx reverse proxy, and multi-environment Docker Compose (dev / UAT / prod).

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Monorepo structure](#monorepo-structure)
- [Prerequisites](#prerequisites)
- [Quick start (Docker)](#quick-start-docker)
- [Environment management](#environment-management)
- [Local development without Docker](#local-development-without-docker)
- [Testing](#testing)
- [Linting and type-checking](#linting-and-type-checking)
- [Build and production](#build-and-production)
- [Troubleshooting](#troubleshooting)
- [Security and secrets](#security-and-secrets)
- [License and contributing](#license-and-contributing)

## Overview

This repository is a full-stack monorepo for **AFG Outsourcing Sunset**. It packages:

- **backend/** — Django REST API (JWT auth, Celery, PostgreSQL, Redis)
- **frontend/** — React 19 SPA built with Vite and TypeScript
- **nginx/** — Reverse-proxy configuration for dev, UAT, and production
- **Root orchestration** — Docker Compose overlays, `Makefile`, and environment scripts

The recommended workflow is Docker Compose with Nginx as the single browser entry point. The API is exposed under **`/api`** on the same origin as the frontend.

## Architecture

| Component | Role |
|-----------|------|
| **nginx** | Public HTTP(S) entry; proxies `/` to the frontend, `/api/` and `/admin/` to Django, serves static/media volumes |
| **frontend** | React + Vite dev server (dev) or production build served via Nginx |
| **backend** | Django app; WSGI entry `core.wsgi:application`, ASGI `core.asgi:application`, settings in `backend/src/core/settings/` |
| **postgres** | Primary database |
| **redis** | Cache and Celery broker |
| **celery_worker** / **celery_beat** | Background tasks (`celery -A core worker`, beat with `django_celery_beat`) |

**API routing:** Django mounts REST endpoints under `/api/` (for example `/api/auth/`, `/api/health/`). See `backend/src/core/urls.py`.

**Frontend ↔ backend networking:** The SPA calls paths such as `/api/auth/login/`. Prefer **same-origin** requests through Nginx: set `VITE_API_BASE_URL` to the public site origin (for example `http://localhost:8080` in local Docker dev) or an empty string for relative URLs in production builds. Do not hard-code `localhost` API hosts in production images.

```
Browser → Nginx (:8080 dev) → /        → frontend:3000
                            → /api/*   → backend:8000
                            → /admin/* → backend:8000
```

Compose files:

- `docker-compose.yml` — base services (postgres, redis, backend, Celery)
- `docker-compose.dev.yml` — development overrides (runserver, Vite HMR, Nginx dev config)
- `docker-compose.uat.yml` — UAT (Gunicorn, Nginx on alternate ports)
- `docker-compose.prod.yml` — production (Gunicorn, Nginx on 80/443)

## Monorepo structure

```
.
├── backend/
│   ├── manage.py
│   ├── requirements.txt
│   └── src/core/          # settings, urls, wsgi, asgi, celery
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   └── src/
├── nginx/
│   ├── conf.d/            # dev.conf, uat.conf, prod.conf
│   └── nginx.*.conf
├── docker-compose.yml
├── docker-compose.dev.yml
├── docker-compose.uat.yml
├── docker-compose.prod.yml
├── Makefile               # Primary commands (make help)
├── env.example
├── env-switch.sh
├── setup.sh
└── README.md
```

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose (v2; the Makefile invokes `docker-compose`)
- **Make** (optional but recommended; matches documented shortcuts)
- For non-Docker work: **Python 3.12+** (see `backend/Dockerfile`) and **Node.js** with **npm** (lockfile: `frontend/package-lock.json`)

## Quick start (Docker)

### 1. Environment

```bash
# Option A — full bootstrap (build, start, migrate, collectstatic)
./setup.sh

# Option B — manual
cp env.example .env          # or: ./env-switch.sh development
./env-switch.sh development   # sets ports, DB name, and env-specific values
```

Review `.env` for `PROJECT_NAME`, `SECRET_KEY`, database credentials, and `VITE_*` variables. Do not commit `.env`.

### 2. Start development

Preferred (build + detached start):

```bash
make dev
```

Equivalent Compose invocation (always merge **base + dev**):

```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml --env-file .env build
docker-compose -f docker-compose.yml -f docker-compose.dev.yml --env-file .env up -d
```

Foreground with logs:

```bash
make up-logs ENV=development
```

### 3. URLs and ports (development)

After `./env-switch.sh development`, typical **host** mappings are:

| Access | URL / port |
|--------|------------|
| **Application (use this)** | http://localhost:8080 |
| **API** | http://localhost:8080/api/ |
| **Django admin** | http://localhost:8080/admin/ |
| **OpenAPI** | http://localhost:8080/api/docs/ |
| Backend (direct, optional) | http://localhost:8000 (`BACKEND_PORT`) |
| Frontend Vite (direct, optional) | http://localhost:3000 (`FRONTEND_PORT`) |
| PostgreSQL | localhost:5455 (`POSTGRES_PORT`) |
| Redis | localhost:6380 (`REDIS_PORT`) |

Defaults in `docker-compose.dev.yml` differ until `.env` is applied (for example `BACKEND_PORT` default `8001`, `FRONTEND_PORT` default `3001`). Run `./env-switch.sh development` or set variables explicitly.

### 4. Admin user and routine commands

```bash
make createsuperuser ENV=development
make migrate ENV=development
make logs ENV=development
make stop ENV=development    # alias: make down ENV=development
make clean                   # prune unused Docker resources
make clean-all               # destructive: removes volumes (prompts for confirmation)
```

Run `make help` for the full command list.

## Environment management

### `env-switch.sh`

Switches the single root `.env` for **development**, **uat**, or **production**:

```bash
./env-switch.sh development   # accepts: dev
./env-switch.sh uat
./env-switch.sh production    # accepts: prod
```

The script creates `.env` from `env.example` if missing, then updates environment-specific keys (`ENVIRONMENT`, `DEBUG`, `POSTGRES_DB`, port variables, `VITE_API_BASE_URL`, `ALLOWED_HOSTS`, and related Django settings).

### Per-environment Compose

| Environment | `ENV` for Make | Compose files |
|-------------|----------------|---------------|
| Development | `development` or `dev` | `docker-compose.yml` + `docker-compose.dev.yml` |
| UAT | `uat` | `docker-compose.yml` + `docker-compose.uat.yml` |
| Production | `production` or `prod` | `docker-compose.yml` + `docker-compose.prod.yml` |

Examples:

```bash
make build ENV=uat && make start ENV=uat
make uat                    # quick start UAT

make build ENV=production && make start ENV=production
make prod                   # quick start production
```

**UAT (after `./env-switch.sh uat`):** Nginx http://localhost:8081 (`NGINX_HTTP_PORT`), HTTPS mapped to host `8443` (`NGINX_HTTPS_PORT`), backend host port `8002`, frontend host port `3002`.

**Production:** Nginx publishes `80:80` and `443:443`. Place TLS material under `nginx/ssl/` (`make ssl-setup ENV=prod` creates the directory and prints expected filenames).

### `setup.sh`

Checks Docker/Compose, runs `./env-switch.sh development` when `.env` is missing, creates `nginx/ssl`, `nginx/logs`, and `backups`, builds and starts dev, runs migrations and `collectstatic`, and optionally creates a superuser.

## Local development without Docker

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
export PYTHONPATH=src
export DJANGO_ENV=local
# Provide backend/.env (django-environ reads backend/.env) or export DATABASE_URL, SECRET_KEY, etc.
python manage.py migrate
python manage.py runserver
```

Celery (requires local Redis):

```bash
celery -A core worker -l info
celery -A core beat -l info --scheduler django_celery_beat.schedulers:DatabaseScheduler
```

API locally: http://127.0.0.1:8000/api/ (health: `/health/` or `/api/health/`).

### Frontend

```bash
cd frontend
npm ci
npm run dev
```

Vite listens on port **3000** (`vite.config.ts`). For API calls during local Vite dev, set `VITE_API_BASE_URL` in `frontend/.env` (see `frontend/env.example`) or rely on the dev-server proxy for `/api` to the backend target.

Production build:

```bash
npm run build    # runs `tsc -b && vite build`
npm run preview
```

## Testing

| Scope | Command |
|-------|---------|
| Backend (Docker, recommended) | `make test-backend ENV=development` |
| Backend (local, from `backend/`) | `python manage.py test` |
| Backend with coverage (Docker) | `make test-coverage ENV=development` |
| Monorepo wrapper | `make test ENV=development` (runs backend + frontend Make targets) |
| Frontend | No `test` script in `frontend/package.json`; frontend automated tests are not configured at the package level |

`pytest` and `pytest-django` are listed in `backend/requirements.txt` for optional use; the Makefile uses Django’s `manage.py test`.

## Linting and type-checking

| Scope | Command |
|-------|---------|
| Frontend | `cd frontend && npm run lint` (ESLint) |
| Frontend types + build | `cd frontend && npm run build` (`tsc -b` then Vite) |
| Root wrapper | `make lint` / `make format` delegate to `backend/` and `frontend/` Makefiles; use the frontend commands above directly. Backend local lint/format targets are not defined in `backend/Makefile`. |

No root-level Python linter configuration (ruff/flake8/black) is required for this repo layout.

## Build and production

- **Frontend artifacts:** `npm run build` in `frontend/`; Docker images for UAT/prod build static assets at image build time—container entrypoints start servers only.
- **Static files:** `make collectstatic ENV=<env>` inside running backend containers.
- **Production stack:** configure `.env` via `./env-switch.sh production`, then `make prod` or `make build ENV=production && make start ENV=production`.
- **Post-deploy:** `make migrate ENV=production`, `make collectstatic ENV=production`, `make createsuperuser ENV=production` as needed.

Serve users through Nginx; the browser should call the API at **same-origin** `/api/...`.

## Troubleshooting

**Port conflicts** — Another process may be using `8080`, `8000`, or `3000`. Run `make stop ENV=development`, inspect `docker ps`, adjust `NGINX_HTTP_PORT`, `BACKEND_PORT`, or `FRONTEND_PORT` in `.env`, then restart.

**Missing or stale `.env`** — Run `./env-switch.sh development` or `make env-check ENV=development`.

**Database / migrations** — `make migrate ENV=development`; use `make dbshell ENV=development` or `make shell-postgres ENV=development` to inspect Postgres.

**Services unhealthy** — `make logs ENV=development`, `make health ENV=development`, or `curl http://localhost:8080/api/health/`.

**Reset dev stack** — `make down ENV=development`, then `make clean` or `make clean-all` (removes volumes; data loss).

**Frontend in container** — `make shell-frontend ENV=development` then `npm install` if modules are missing.

## Security and secrets

- Never commit secrets. Use `.env` (gitignored) and environment variables.
- Replace placeholder `SECRET_KEY`, database passwords, and `REDIS_PASSWORD` (required for UAT/prod Compose) before deploying.
- Keep production TLS certificates in `nginx/ssl/` only on deployment hosts.

## License and contributing

**License:** TBD (no `LICENSE` file in this repository yet).

**Contributing:** Fork the repository, create a feature branch, commit changes, and open a pull request. For day-to-day development commands, see `make help` and component READMEs under `backend/` and `frontend/` when present.
