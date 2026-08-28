# 🌟 AFG Outsourcing Sunset

A production-ready full-stack monorepo with a Django backend, React frontend, Docker Compose orchestration, Nginx reverse proxy, and multi-environment support (dev / UAT / prod).

## 📋 Table of Contents

- [🎯 Overview](#-overview)
- [🏗️ Architecture](#️-architecture)
- [🛠️ Tech Stack](#️-tech-stack)
- [📁 Repository Structure](#-repository-structure)
- [🌍 Environments and Configuration](#-environments-and-configuration)
- [🚀 Quick Start (Docker)](#-quick-start-docker)
- [🔧 Local Development Workflows](#-local-development-workflows)
- [⚙️ Running Background Workers](#️-running-background-workers)
- [🧪 Testing and Linting](#-testing-and-linting)
- [🚀 Deployment](#-deployment)
- [🛠️ Troubleshooting](#️-troubleshooting)
- [📄 License and Contributions](#-license-and-contributions)

## 🎯 Overview

This repository provides a complete full-stack application platform for **AFG Outsourcing Sunset**:

| Layer | Services |
|-------|----------|
| **Frontend** | React 19 + TypeScript + Vite (Redux Toolkit, React Router) |
| **Backend API** | Django 5 + Django REST Framework + JWT auth |
| **Data** | PostgreSQL 16, Redis 7 |
| **Background jobs** | Celery worker + Celery Beat (`django-celery-beat`) |
| **Reverse proxy** | Nginx (routes `/api/` and `/admin/` to backend; everything else to frontend) |

**Supported environments** (via Docker Compose overlays):

| Environment | Compose files | Public entry (Nginx) |
|-------------|---------------|----------------------|
| **Development** | `docker-compose.yml` + `docker-compose.dev.yml` | http://localhost:8080 |
| **UAT** | `docker-compose.yml` + `docker-compose.uat.yml` | http://localhost:8081 (HTTPS: 8443) |
| **Production** | `docker-compose.yml` + `docker-compose.prod.yml` | http://localhost:80 / https://localhost:443 |

Environment configuration is managed through a single root `.env` file. Use `./env-switch.sh` or `make env-switch` to apply environment-specific defaults.

## 🏗️ Architecture

```
                    ┌─────────────────────────────────────┐
                    │         Nginx (public entry)        │
                    │   dev:8080  uat:8081  prod:80/443   │
                    └──────────────┬──────────────────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              │                    │                    │
     /api/*  │                    │  /* (all other)     │
     /admin/*│                    │                     │
              ▼                    ▼                     │
     ┌─────────────────┐  ┌─────────────────┐          │
     │ Django Backend  │  │ React Frontend  │          │
     │  (port 8000)    │  │  (port 3000)    │          │
     └────────┬────────┘  └─────────────────┘          │
              │                                         │
     ┌────────┴────────────────────────┐                │
     │                                 │                │
     ▼                                 ▼                │
┌──────────┐  ┌──────────┐  ┌──────────────┐  ┌──────────────┐
│PostgreSQL│  │  Redis   │  │Celery Worker │  │ Celery Beat  │
└──────────┘  └──────────┘  └──────────────┘  └──────────────┘
```

**Request routing**

- Nginx proxies **`/api/`** and **`/admin/`** to the Django backend.
- All other paths go to the React frontend (Vite dev server in development; `vite preview` in UAT/prod).
- Static files are served at **`/static/`**; media at **`/media/`**.

**Same-origin API rule**

The frontend should call the API through the **Nginx public URL**, not a hardcoded backend port. Set `VITE_API_BASE_URL` to the origin (e.g. `http://localhost:8080` in development). Service modules append paths such as `/api/auth/login/` — see `frontend/src/services/authService.ts`.

When running the Vite dev server **outside** Docker, its proxy forwards `/api` to the backend (see `frontend/vite.config.ts`).

**API base path**

All REST endpoints live under **`/api/`**:

- Health: `/api/health/` and `/health/`
- Auth: `/api/auth/`
- OpenAPI schema: `/api/schema/`
- Swagger UI: `/api/docs/`
- ReDoc: `/api/redoc/`

## 🛠️ Tech Stack

### Backend

| Package | Purpose |
|---------|---------|
| Django ~5.0 | Web framework |
| djangorestframework | REST API |
| djangorestframework-simplejwt | JWT authentication |
| drf-spectacular | OpenAPI / Swagger docs |
| psycopg[binary] | PostgreSQL driver |
| django-cors-headers | CORS handling |
| whitenoise | Static file serving |
| django-environ | Environment variable loading |
| gunicorn (+ gevent worker in UAT/prod) | Production WSGI server |
| celery + django-celery-beat | Background tasks and scheduling |
| redis | Cache and Celery broker |
| pytest, pytest-django, coverage | Testing (optional dev deps) |

### Frontend

| Package | Purpose |
|---------|---------|
| React 19 | UI library |
| TypeScript | Type safety |
| Vite 6 | Build tool and dev server |
| Redux Toolkit + react-redux | State management |
| React Router 7 | Routing |
| Axios | HTTP client |
| ESLint + typescript-eslint | Linting |

Package manager: **npm** (`package-lock.json` present). Docker images also support **bun** when available.

### Infrastructure

- Docker Compose (base + environment overlays)
- Nginx reverse proxy with environment-specific configs in `nginx/`
- Multi-stage Dockerfiles for backend and frontend

## 📁 Repository Structure

```
afg-outsourcing-sunset/
├── backend/
│   ├── Dockerfile
│   ├── Makefile
│   ├── requirements.txt
│   └── src/
│       ├── authentication/     # Custom user model & auth API
│       └── core/
│           ├── settings/       # Django settings (base + env overrides)
│           ├── urls.py           # API routes under /api/
│           └── celery.py         # Celery app configuration
├── frontend/
│   ├── Dockerfile
│   ├── Makefile
│   ├── package.json
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── services/           # API client (axios, same-origin base URL)
│       └── store/
├── nginx/
│   ├── conf.d/                 # dev.conf, uat.conf, prod.conf
│   ├── nginx.dev.conf
│   ├── nginx.uat.conf
│   └── nginx.prod.conf
├── docker-compose.yml            # Base services (postgres, redis, backend, celery)
├── docker-compose.dev.yml        # Dev overrides (+ frontend, nginx)
├── docker-compose.uat.yml        # UAT overrides
├── docker-compose.prod.yml       # Production overrides
├── Makefile                      # Root orchestration commands
├── env.example                   # Environment variable template
├── env-switch.sh                 # Switch .env for dev / uat / prod
└── setup.sh                      # First-time bootstrap script
```

## 🌍 Environments and Configuration

### Compose files

| File | Role |
|------|------|
| `docker-compose.yml` | Base stack: PostgreSQL, Redis, Django backend, Celery worker, Celery Beat |
| `docker-compose.dev.yml` | Development: Django `runserver`, Vite HMR, Nginx on port 8080, host port mappings |
| `docker-compose.uat.yml` | UAT: Gunicorn (gevent), production-like frontend build, Nginx on 8081/8443 |
| `docker-compose.prod.yml` | Production: Gunicorn (gevent), optimized workers, Nginx on 80/443, no host DB/Redis ports |

The root `Makefile` always combines the base file with the environment overlay:

```bash
# Development
docker-compose -f docker-compose.yml -f docker-compose.dev.yml ...

# UAT
docker-compose -f docker-compose.yml -f docker-compose.uat.yml ...

# Production
docker-compose -f docker-compose.yml -f docker-compose.prod.yml ...
```

### Service ports (host → container)

Defaults shown; override via `.env` (`POSTGRES_PORT`, `REDIS_PORT`, `BACKEND_PORT`, `FRONTEND_PORT`, `NGINX_HTTP_PORT`, `NGINX_HTTPS_PORT`).

#### Development (`docker-compose.dev.yml`)

| Service | Host port (default) | Container port |
|---------|---------------------|----------------|
| **nginx** | 8080 | 80 |
| **frontend** | 3001 | 3000 |
| **backend** | 8001 | 8000 |
| **postgres** | 5433 | 5432 |
| **redis** | 6380 | 6379 |
| celery_worker | — | — |
| celery_beat | — | — |

#### UAT (`docker-compose.uat.yml`)

| Service | Host port (default) | Container port |
|---------|---------------------|----------------|
| **nginx** | 8081 (HTTP), 8443 (HTTPS) | 80, 443 |
| **frontend** | 3002 | 3000 |
| **backend** | 8002 | 8000 |
| **postgres** | 5434 | 5432 |
| **redis** | 6381 | 6379 |

#### Production (`docker-compose.prod.yml`)

| Service | Host port | Notes |
|---------|-----------|-------|
| **nginx** | 80, 443 | Only public-facing ports exposed |
| backend, frontend, postgres, redis | — | Internal network only |

### Environment variables

Copy the template and configure values:

```bash
cp env.example .env
# or use the switcher (recommended)
./env-switch.sh development
```

#### Required / core variables

| Variable | Description |
|----------|-------------|
| `PROJECT_NAME` | Docker container and network prefix (default: `horizon-digital`) |
| `COMPOSE_PROJECT_NAME` | Docker Compose project name |
| `ENVIRONMENT` | Active environment: `development`, `uat`, or `production` |
| `DEBUG` | Django debug mode (`True` for dev, `False` for uat/prod) |
| `SECRET_KEY` | Django secret key — **change in non-dev environments** |
| `POSTGRES_DB` | Database name (e.g. `horizon_digital_dev`) |
| `POSTGRES_USER` | Database user |
| `POSTGRES_PASSWORD` | Database password — **required for UAT/prod** |
| `POSTGRES_HOST` | Database host (`postgres` inside Docker) |
| `POSTGRES_PORT` | Host-side Postgres port mapping |
| `DATABASE_URL` | Full PostgreSQL connection URL |
| `REDIS_HOST` | Redis host (`redis` inside Docker) |
| `REDIS_PORT` | Host-side Redis port mapping |
| `REDIS_PASSWORD` | Redis password — **required for UAT/prod** |
| `REDIS_URL` | Redis connection URL |
| `CELERY_BROKER_URL` | Celery message broker URL |
| `CELERY_RESULT_BACKEND` | Celery result backend URL |
| `VITE_API_BASE_URL` | Frontend API origin (same-origin URL, e.g. `http://localhost:8080`) |
| `VITE_APP_NAME` | Application display name |
| `NODE_ENV` | Node environment (`development` or `production`) |
| `NGINX_HTTP_PORT` | Nginx HTTP host port |
| `NGINX_HTTPS_PORT` | Nginx HTTPS host port (UAT/prod) |
| `BACKEND_PORT` | Backend host port mapping |
| `FRONTEND_PORT` | Frontend host port mapping |
| `ALLOWED_HOSTS` | Comma-separated Django allowed hosts |
| `CORS_ALLOWED_ORIGINS` | Comma-separated CORS origins |
| `CSRF_TRUSTED_ORIGINS` | Comma-separated CSRF trusted origins |

#### Optional variables

| Variable | Description |
|----------|-------------|
| `EMAIL_BACKEND`, `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USE_TLS`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD` | Email configuration |
| `LOG_LEVEL`, `DJANGO_LOG_LEVEL` | Logging verbosity |
| `SECURE_SSL_REDIRECT`, `SECURE_HSTS_*`, `SESSION_COOKIE_SECURE`, `CSRF_COOKIE_SECURE` | Production security headers |
| `AWS_*`, `USE_S3` | Optional S3 file storage |
| `SENTRY_DSN`, `GOOGLE_ANALYTICS_ID` | Monitoring and analytics |

### Environment switching

`./env-switch.sh` updates `.env` with environment-specific defaults:

```bash
./env-switch.sh development   # aliases: dev
./env-switch.sh uat
./env-switch.sh production    # aliases: prod
```

**What it does**

- Creates `.env` from `env.example` if missing
- Sets database name, ports, `VITE_API_BASE_URL`, security flags, and Django settings per environment
- For UAT/prod, adds placeholder passwords if not already set

**Caveats**

- Overwrites environment-specific keys in `.env`; review the file after switching
- Creates a `.env.bak` backup during edits (removed automatically)
- Restart services after switching: `make restart ENV=<env>`

## 🚀 Quick Start (Docker)

### Prerequisites

- [Docker Engine](https://docs.docker.com/get-docker/) 20.10+
- [Docker Compose](https://docs.docker.com/compose/install/) v2.0+ (the Makefile invokes `docker-compose`)
- **Make** (optional, for convenience targets)

### Steps

**1. Clone the repository**

```bash
git clone https://github.com/Samiullah324/afg-outsourcing-sunset.git
cd afg-outsourcing-sunset
```

**2. Configure environment**

```bash
cp env.example .env
./env-switch.sh development
```

Review `.env` and update `SECRET_KEY`, database credentials, and `PROJECT_NAME` as needed.

**3. Bootstrap (optional but recommended)**

```bash
chmod +x setup.sh env-switch.sh
./setup.sh
```

`setup.sh` automates:

- Verifies Docker and Docker Compose are installed
- Creates `.env` via `env-switch.sh development` if missing
- Creates `nginx/ssl`, `nginx/logs`, and `backups` directories
- Builds and starts the development stack
- Runs `migrate` and `collectstatic`
- Optionally prompts to create a Django superuser

**4. Start the development stack manually**

```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up --build -d
# or
make dev
```

**5. First-run Django tasks**

```bash
make migrate ENV=development
make collectstatic ENV=development
make createsuperuser ENV=development
```

Equivalent direct commands:

```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml exec backend python manage.py migrate
docker-compose -f docker-compose.yml -f docker-compose.dev.yml exec backend python manage.py collectstatic --noinput
docker-compose -f docker-compose.yml -f docker-compose.dev.yml exec backend python manage.py createsuperuser
```

### Access URLs (development)

| Resource | URL |
|----------|-----|
| **Application (via Nginx)** | http://localhost:8080 |
| **Backend API** | http://localhost:8080/api/ |
| **API health check** | http://localhost:8080/api/health/ |
| **Django admin** | http://localhost:8080/admin/ |
| **Swagger UI** | http://localhost:8080/api/docs/ |
| **ReDoc** | http://localhost:8080/api/redoc/ |
| **Nginx health** | http://localhost:8080/health |

Direct service access (bypassing Nginx, default host ports):

| Service | URL |
|---------|-----|
| Frontend (Vite) | http://localhost:3001 |
| Backend (runserver) | http://localhost:8001 |
| PostgreSQL | localhost:5433 |
| Redis | localhost:6380 |

## 🔧 Local Development Workflows

### Root Makefile commands

All commands accept `ENV=development|dev|uat|production|prod` (default: `development`).

| Category | Command | Description |
|----------|---------|-------------|
| **Quick start** | `make dev` | Bootstrap `.env` if missing, build, and start development |
| | `make uat` | Build and start UAT |
| | `make prod` | Build and start production |
| **Environment** | `make setup` | Run `env-switch.sh development` |
| | `make env-switch ENV=uat` | Switch `.env` to UAT |
| | `make env-check` | Verify `.env` exists |
| **Docker** | `make build` | Build all services |
| | `make start` | Start all services (detached) |
| | `make stop` / `make down` | Stop services |
| | `make restart` | Restart services |
| | `make status` / `make ps` | Show container status |
| | `make logs` | Follow all logs |
| | `make up-logs` | Start and follow logs (foreground) |
| **Individual services** | `make start-backend` | Start postgres, redis, backend, celery |
| | `make start-frontend` | Start frontend only |
| | `make start-nginx` | Start nginx only |
| **Database** | `make migrate` | Run migrations |
| | `make makemigrations` | Create migrations |
| | `make collectstatic` | Collect static files |
| | `make createsuperuser` | Create admin user |
| | `make dbshell` | Django database shell |
| **Shells** | `make shell` | Django shell |
| | `make shell-backend` | Bash in backend container |
| | `make shell-frontend` | Shell in frontend container |
| | `make shell-nginx` | Shell in nginx container |
| | `make shell-postgres` | Bash in postgres container |
| | `make shell-redis` | Redis CLI |
| **Docs** | `make schema` | Generate OpenAPI schema |
| | `make docs` | Print API documentation URLs |
| **Monitoring** | `make health` | Curl backend and nginx health endpoints |
| | `make monitor` | Docker stats |
| **Maintenance** | `make backup` | Database backup to `backups/` |
| | `make restore BACKUP_FILE=...` | Restore database |
| | `make clean` | Prune Docker resources |
| | `make clean-all` | Remove all containers, images, volumes |
| | `make ssl-setup ENV=prod` | Create `nginx/ssl/` and show certificate instructions |
| **Utility** | `make exec-backend CMD="..."` | Run command in backend container |
| | `make help` | Show all targets |
| | `make info` | Show environment information |

### Frontend npm scripts

Run from `frontend/` (or inside the frontend container):

```bash
cd frontend
npm install
npm run dev       # Vite dev server (port 3000)
npm run build     # TypeScript check + production build
npm run lint      # ESLint
npm run preview   # Preview production build
```

When running Vite locally, use the dev-server proxy for `/api` or set `VITE_API_BASE_URL` to your Nginx origin. **Do not hardcode backend ports in production builds** — deployed assets must use the same-origin public URL.

### Backend Makefile

The backend has its own `Makefile` for standalone Docker workflows (`backend/compose.*.yml`). When using the root monorepo stack, prefer the root `Makefile` targets above.

## ⚙️ Running Background Workers

Celery worker and Celery Beat are defined in all compose configurations and start automatically with the stack.

| Service | Command (inside container) | Scheduler |
|---------|---------------------------|-----------|
| `celery_worker` | `celery -A core worker` | — |
| `celery_beat` | `celery -A core beat` | `django_celery_beat.schedulers:DatabaseScheduler` |

**Start only backend workers** (without frontend/nginx):

```bash
make start-backend ENV=development
```

**View worker logs**:

```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml logs -f celery_worker celery_beat
```

**Broker**: Redis (`CELERY_BROKER_URL` / `CELERY_RESULT_BACKEND` in `.env` and compose environment blocks).

Scheduled tasks are configured in `backend/src/core/settings/base.py` (`CELERY_BEAT_SCHEDULE`).

There is **no Flower** monitoring service in the current compose files.

## 🧪 Testing and Linting

### Backend tests

Django tests exist under `backend/src/authentication/tests/`. Run via the root Makefile (requires running containers):

```bash
make test-backend ENV=development
# or with coverage
make test-coverage ENV=development
```

Direct command:

```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml exec backend python manage.py test
```

`pytest` and `pytest-django` are listed in `backend/requirements.txt` but the project uses Django's `manage.py test` runner.

### Frontend tests

No frontend test runner is configured in `frontend/package.json` (no `test` script).

### Linting

| Scope | Command | Notes |
|-------|---------|-------|
| Frontend | `cd frontend && npm run lint` | ESLint |
| Frontend (Docker) | `cd frontend && make lint` | Runs lint inside container |
| Root | `make lint` | Delegates to backend and frontend Makefiles |

**Note:** The backend `Makefile` declares `lint` and `format` in `.PHONY` but does not define those targets. Use Django's built-in checks or add tooling as needed:

```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml exec backend python manage.py check
```

No Python linter (ruff, black, isort) or markdown linter is configured at the repository root.

## 🚀 Deployment

### UAT

```bash
./env-switch.sh uat
# Update POSTGRES_PASSWORD, REDIS_PASSWORD, and domain settings in .env
make build ENV=uat
make start ENV=uat
make migrate ENV=uat
make collectstatic ENV=uat
```

- Access: http://localhost:8081 (HTTPS: https://localhost:8443)
- Place SSL certificates in `nginx/ssl/` (`cert.pem`, `key.pem`, `chain.pem`)
- Frontend image builds assets at **image build time**; the container runs `vite preview` via `entrypoint.sh`

### Production

```bash
./env-switch.sh production
# Set strong SECRET_KEY, POSTGRES_PASSWORD, REDIS_PASSWORD, and domain values
make ssl-setup ENV=prod
# Place certificates in nginx/ssl/
make build ENV=production
make start ENV=production
make migrate ENV=production
make collectstatic ENV=production
make createsuperuser ENV=production
```

- Nginx listens on ports **80** and **443**
- Backend runs **Gunicorn** with gevent workers (4 workers in prod, 2 in UAT)
- Postgres and Redis are not exposed to the host

### Build-time environment variables

Set `VITE_API_BASE_URL` in `.env` **before** building frontend images so Vite embeds the correct API origin:

| Environment | Example `VITE_API_BASE_URL` |
|-------------|----------------------------|
| Development | `http://localhost:8080` |
| UAT | `https://uat-api.horizondigital.com` (or your UAT domain) |
| Production | `https://api.horizondigital.com` (or your production domain) |

For same-origin deployments where the browser and API share one host, set `VITE_API_BASE_URL` to that public origin (e.g. `https://yourdomain.com`), not an internal Docker hostname.

## 🛠️ Troubleshooting

### Port conflicts

```bash
make stop ENV=development
docker ps                          # find conflicting containers
# Adjust POSTGRES_PORT, REDIS_PORT, BACKEND_PORT, FRONTEND_PORT, or NGINX_HTTP_PORT in .env
make start ENV=development
```

### Missing or invalid `.env`

```bash
make env-check
./env-switch.sh development        # regenerate defaults
```

### Database connection / migration errors

```bash
make logs-backend ENV=development
make shell-postgres ENV=development
make migrate ENV=development
```

Reset development database (destroys data):

```bash
make stop ENV=development
docker volume rm $(docker volume ls -q | grep postgres_dev)
make start ENV=development
make migrate ENV=development
```

### Frontend build or HMR issues

```bash
make logs-frontend ENV=development
make shell-frontend ENV=development
# inside container: npm install
docker-compose -f docker-compose.yml -f docker-compose.dev.yml build frontend
```

### Nginx configuration

```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml exec nginx nginx -t
docker-compose -f docker-compose.yml -f docker-compose.dev.yml exec nginx nginx -s reload
```

### Health checks

```bash
make health ENV=development
curl http://localhost:8080/api/health/
curl http://localhost:8080/health
```

### Complete reset

```bash
make clean-all                     # WARNING: removes all Docker resources
./setup.sh                         # fresh bootstrap
```

## 📄 License and Contributions

**License:** No `LICENSE` file is present in this repository. License terms are TBD.

**Contributing:** Pull requests are welcome. Follow existing patterns in the codebase and the guidance in `.cursor/rules/`.

---

**Built with ❤️ for modern full-stack development**
