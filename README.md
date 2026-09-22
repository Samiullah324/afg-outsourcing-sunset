# 🌅 AFG Outsourcing Sunset Monorepo

Full-stack monorepo for the AFG Outsourcing Sunset application: **Django** REST API, **React** (TypeScript) UI, **PostgreSQL**, **Redis**, **Celery** worker and beat, fronted by **Nginx** in Docker. **Docker Compose** and the root **Makefile** support **development**, **UAT**, and **production** overlays via a single `.env` and `env-switch.sh`.

## 📋 Table of Contents

- [Architecture / Tech Stack](#-architecture--tech-stack)
- [Prerequisites](#-prerequisites)
- [Quick Start (Docker)](#-quick-start-docker-recommended)
- [Local Development (without Docker)](#-local-development-without-docker)
- [Environments](#-environments)
- [Makefile Targets](#-makefile-targets)
- [Testing & Linting](#-testing--linting)
- [Common Tasks](#-common-tasks)
- [Troubleshooting](#-troubleshooting)
- [License & Contributing](#-license--contributing)

## 🏗️ Architecture / Tech Stack

| Layer | Technology |
|-------|------------|
| API | Django 5.x, Django REST Framework, JWT (`rest_framework_simplejwt`), OpenAPI (`drf_spectacular`) |
| UI | React 19, TypeScript, Vite 6, Redux Toolkit, React Router |
| Data | PostgreSQL 16, Redis 7 |
| Async | Celery worker + Celery Beat (`django_celery_beat`) |
| Edge | Nginx reverse proxy (dev / UAT / prod compose overlays) |
| Ops | Docker Compose, Make, `.sunset/deploy.yaml` (deploy contract CI) |

### Repository layout

```
afg-outsourcing-sunset/
├── backend/                 # Django app (manage.py, src/, Dockerfile)
├── frontend/                # React + Vite (package.json, Dockerfile)
├── nginx/                   # Nginx configs and SSL mount points
├── docker-compose.yml       # Base services (postgres, redis, backend, celery)
├── docker-compose.dev.yml   # Dev: frontend, nginx, runserver, hot reload
├── docker-compose.uat.yml   # UAT: gunicorn, nginx, SSL volume
├── docker-compose.prod.yml  # Production: gunicorn, nginx 80/443
├── Makefile                 # Primary orchestration commands
├── env.example              # Template for .env
├── env-switch.sh            # Set .env for development | uat | production
├── setup.sh                 # First-time Docker bootstrap
└── .sunset/                 # Deploy contract validation (GitHub Actions)
```

Compose always merges **`docker-compose.yml`** with the environment file, for example:

`docker compose -f docker-compose.yml -f docker-compose.dev.yml --env-file .env …`

## 📦 Prerequisites

- **Docker** 20.10+ and **Docker Compose** v2 (`docker-compose` CLI is used by the Makefile)
- **Make** (recommended; `setup.sh` and most docs assume it)
- **Python** 3.12 (backend `Dockerfile` base image)
- **Node.js** 24 (frontend `Dockerfile`; local frontend dev uses npm per `frontend/package.json`)

Optional for non-Docker work: `pip`, virtualenv, and Node/npm on the host.

## 🚀 Quick Start (Docker, recommended)

### 1. Clone and enter the repo

```bash
git clone https://github.com/Samiullah324/afg-outsourcing-sunset.git
cd afg-outsourcing-sunset
```

### 2. Configure environment

Either copy the template:

```bash
cp env.example .env
```

Or switch to development settings (creates `.env` from `env.example` if missing, then updates ports, DB name, API URL, etc.):

```bash
./env-switch.sh development
# aliases: ./env-switch.sh dev
```

Review `.env`: `PROJECT_NAME`, `POSTGRES_PASSWORD`, `SECRET_KEY`, and `VITE_API_BASE_URL` (development uses `http://localhost:8080/api` via the switcher).

### 3. Bootstrap (optional)

`setup.sh` checks Docker, runs `./env-switch.sh development` when needed, creates `nginx/ssl`, `nginx/logs`, and `backups`, builds images, starts the stack, runs migrations and `collectstatic`, and optionally prompts for a superuser:

```bash
./setup.sh
```

### 4. Start development (typical daily flow)

```bash
make dev
```

Equivalent manual steps:

```bash
make build ENV=development
make start ENV=development
```

### 5. URLs (development, after `./env-switch.sh development`)

Traffic is normally via **Nginx** on the host port from `NGINX_HTTP_PORT` (8080):

| What | URL |
|------|-----|
| Application (UI + proxied API) | http://localhost:8080 |
| Backend API (via Nginx) | http://localhost:8080/api/ |
| Django admin (via Nginx) | http://localhost:8080/admin/ |
| Swagger UI | http://localhost:8080/api/docs/ |
| ReDoc | http://localhost:8080/api/redoc/ |
| OpenAPI schema | http://localhost:8080/api/schema/ |
| Health (API) | http://localhost:8080/api/health/ or http://localhost:8080/health/ |
| Nginx health | http://localhost:8080/health |

Direct service ports (from `.env` after env-switch; useful for debugging):

| Service | Default host port | Compose service name |
|---------|-------------------|----------------------|
| frontend | 3000 (`FRONTEND_PORT`) | `frontend` |
| backend | 8000 (`BACKEND_PORT`) | `backend` |
| postgres | 5455 (`POSTGRES_PORT`) | `postgres` |
| redis | 6380 (`REDIS_PORT`) | `redis` |

Dev database name: **`horizon_digital_dev`** (override with `POSTGRES_DB` in `.env`).

### 6. Migrations

```bash
make migrate ENV=development
```

Manual equivalent:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml --env-file .env exec backend python manage.py migrate
```

### 7. Admin / demo data

Interactive superuser:

```bash
make createsuperuser ENV=development
```

Idempotent demo seed (demo login `demo@sunset.dev`; password from `DEMO_ADMIN_PASSWORD`, default documented in the command help):

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml --env-file .env exec backend python manage.py seed_demo
```

Example with explicit password:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml --env-file .env exec -e DEMO_ADMIN_PASSWORD=secret123 backend python manage.py seed_demo
```

### 8. Background workers

**Celery worker** (`celery_worker`) and **Celery beat** (`celery_beat`) start automatically with the compose stack; no separate manual step is required for Docker.

## 💻 Local Development (without Docker)

Feasible for backend and frontend separately; you still need PostgreSQL and Redis reachable locally (or via published Docker ports).

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp env.example .env   # if needed; settings read backend/.env
export PYTHONPATH=src
export DJANGO_ENV=local
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

API base: http://localhost:8000/api/ (see `backend/src/core/urls.py`). Prefer configuring the frontend to call the same origin or env-based API URL—avoid hardcoding production URLs in code.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Default Vite dev server: http://localhost:5173 (Vite default). Point `VITE_API_BASE_URL` in `.env` at your backend or Nginx URL.

## 🌍 Environments

Single `.env` file; **`env-switch.sh`** accepts:

| Argument | Normalized `ENVIRONMENT` | Compose overlay | Notes |
|----------|--------------------------|-----------------|--------|
| `development`, `dev` | `development` | `docker-compose.dev.yml` | Nginx **8080**, debug runserver, DB `horizon_digital_dev` |
| `uat` | `uat` | `docker-compose.uat.yml` | Nginx **8081** (+ **8443** HTTPS mapping), gunicorn, Redis password required |
| `production`, `prod` | `production` | `docker-compose.prod.yml` | Nginx **80/443**, gunicorn, no host DB/Redis ports |

Switch and rebuild/start:

```bash
./env-switch.sh uat
make build ENV=uat
make start ENV=uat
```

Quick shortcuts:

```bash
make dev    # development
make uat    # UAT
make prod   # production
```

**UAT** example entry: http://localhost:8081 (when `NGINX_HTTP_PORT=8081`). **Production** expects TLS material under `nginx/ssl/` and public hostnames configured in `.env` (see `env-switch.sh` production block).

Makefile `ENV=` values: `development`, `dev`, `uat`, `production`, `prod`.

## 🛠️ Makefile Targets

Run `make help` for the full list. Common root targets:

| Target | Description |
|--------|-------------|
| `setup` | Run `./env-switch.sh development` |
| `env-check` | Verify `.env` exists |
| `env-switch` | Wrapper for `./env-switch.sh $(ENV)` |
| `build`, `start`, `stop`, `down`, `restart`, `status` | Docker Compose lifecycle |
| `logs`, `logs-backend`, `logs-frontend`, `logs-nginx` | Follow service logs |
| `start-backend`, `start-frontend`, `start-nginx` | Start service subsets |
| `migrate`, `makemigrations`, `collectstatic`, `createsuperuser` | Django management via `backend` container |
| `schema`, `docs` | OpenAPI schema / doc URLs |
| `shell`, `dbshell`, `shell-backend`, `shell-frontend`, `shell-nginx`, `shell-postgres`, `shell-redis` | Shells and REPLs |
| `test`, `test-backend`, `test-coverage` | Tests in containers / local backend Makefile |
| `lint`, `format`, `install` | Delegate to `backend/` and `frontend/` Makefiles |
| `clean`, `clean-all`, `update` | Docker cleanup and image pull |
| `backup`, `restore` | Postgres dump/restore (review `POSTGRES_DB` vs `ENV` before use) |
| `ssl-setup` | Production SSL directory hints (`ENV=prod`) |
| `dev`, `uat`, `prod` | Env switch (if needed), build, start |
| `ps`, `images`, `exec-backend`, `up-logs` | Utilities |
| `health`, `monitor`, `info` | Health curls and metadata |

Per-app Makefiles under `backend/` and `frontend/` target their own `compose*.yml` files for standalone service work; day-to-day full-stack flow uses the **root** Makefile.

## 🧪 Testing & Linting

### Frontend (`frontend/package.json`)

```bash
cd frontend
npm run lint          # ESLint
npm run build         # tsc -b && vite build
npm run dev           # Vite dev server
```

No `test` script is defined in `frontend/package.json`.

### Backend (`backend/requirements.txt`)

In Docker (recommended, matches CI-style isolation):

```bash
make test-backend ENV=development
# or
make test-coverage ENV=development
```

Local / container:

```bash
cd backend
python manage.py test
```

**pytest** and **pytest-django** are listed in `requirements.txt`; use `pytest` from `backend/` if you add/configure discovery (no `pytest.ini` in repo today).

Root wrapper (runs backend + frontend Make `test`; frontend has no test target):

```bash
make test ENV=development
```

## 📌 Common Tasks

**Migrations**

```bash
make makemigrations ENV=development
make migrate ENV=development
```

**Static files (UAT/prod-style)**

```bash
make collectstatic ENV=production
```

**Logs**

```bash
make logs ENV=development
make logs-backend ENV=development
```

**Postgres shell** (use `POSTGRES_DB` from `.env`, e.g. `horizon_digital_dev`):

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml --env-file .env exec postgres psql -U postgres -d horizon_digital_dev
```

**Redis CLI (development)**

```bash
make shell-redis ENV=development
```

**Restart one service**

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml --env-file .env up -d --build backend
```

**OpenAPI schema file**

```bash
make schema ENV=development
```

## 🛠️ Troubleshooting

- **Port already in use** — Stop stacks: `make stop ENV=development`. Check `docker ps` and host processes on `8080`, `8000`, `3000`, `5455`, `6380`.
- **Wrong environment** — Run `./env-switch.sh development|uat|production` and confirm `ENVIRONMENT=` in `.env`; use matching `make … ENV=development|uat|production`.
- **Database empty or stale** — `make migrate ENV=development`; for a full reset, `make stop`, remove dev volumes (e.g. `postgres_dev_data`), then `make dev` again (destroys dev DB data).
- **Containers unhealthy** — `make status ENV=development`, `make logs-backend ENV=development`, `curl http://localhost:8080/api/health/`.
- **Frontend deps in container** — `make shell-frontend ENV=development`, then `npm install` inside the container if volume mounts desync.
- **Clean Docker clutter** — `make clean` (prune) or `make clean-all` (destructive; prompts).

## 📄 License & Contributing

**License:** No open-source `LICENSE` file is included in this repository; treat the codebase as **proprietary / internal** unless your organization states otherwise.

**Contributing:** Use feature branches and pull requests. For Cursor/agent work, follow internal scope rules in [`.cursor/rules/rule-1.mdc`](.cursor/rules/rule-1.mdc) (change only the paths requested for each task).

Component-level docs: [`backend/README.md`](backend/README.md), [`frontend/README.md`](frontend/README.md) if present.

---

**Built for sunset operations and full-stack delivery with Docker.**
