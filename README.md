# 🌅 AFG Outsourcing Sunset — Full‑Stack Monorepo

Production‑ready monorepo featuring a Django backend and a React (TypeScript) frontend, orchestrated with Docker Compose. Includes multi‑environment compose files (dev/uat/prod) and scripts to streamline setup.

## 📋 Table of Contents
- [Overview](#overview)
- [Architecture](#architecture)
- [Repository Layout](#repository-layout)
- [Prerequisites](#prerequisites)
- [Quick Start (Docker)](#quick-start-docker)
- [Common Operations](#common-operations)
- [Local Development (without Docker)](#local-development-without-docker)
- [Testing](#testing)
- [Environment & Configuration](#environment--configuration)
- [Makefile Shortcuts](#makefile-shortcuts)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## Overview
This repository hosts both the backend and frontend for AFG Outsourcing Sunset:
- Backend: Django application (ASGI/WSGI) with a Celery scaffold available (see backend/src/core/celery.py).
- Frontend: React + TypeScript component library and app structure.
- Orchestration: Docker Compose files for development, UAT, and production.

## Architecture
- Frontend (React/TS)
- Backend (Django)
- Optional worker (Celery) if enabled by the selected compose file
- Reverse proxy and other infra may be enabled depending on the selected compose file/environment

All services and wiring are defined via the docker-compose.*.yml files at the repo root.

## Repository Layout
```
/                          # repo root
├── backend/               # Django project (core, settings, urls, asgi/wsgi, celery)
│   └── src/core/          # core Django app and settings
├── frontend/              # React + TypeScript app and components
│   └── src/components/    # atoms/molecules etc.
├── docker-compose.yml
├── docker-compose.dev.yml
├── docker-compose.uat.yml
├── docker-compose.prod.yml
├── env.example            # sample environment variables
├── env-switch.sh          # helper for switching envs
├── setup.sh               # optional setup helper
├── Makefile               # convenience targets
└── README.md
```

## Prerequisites
- Docker (Compose v2)
- Bash (for scripts) and make (optional)
- For local (non‑Docker) runs:
  - Python 3.x with venv + pip
  - Node.js 18+ and npm or yarn/pnpm

## Quick Start (Docker)
Use the environment‑specific compose files. The following examples build and run services for each environment.

Development:
```
docker compose -f docker-compose.dev.yml up --build
```
UAT:
```
docker compose -f docker-compose.uat.yml up -d --build
```
Production:
```
docker compose -f docker-compose.prod.yml up -d --build
```
Stop and remove containers for a given environment:
```
docker compose -f docker-compose.dev.yml down
```

Tip: You can copy env.example to .env (at the repo root) to set environment variables consumed by Docker Compose and the apps.

## Common Operations
Run the following against the compose file for your environment (replace docker-compose.dev.yml as needed):

- Apply database migrations (Django):
```
docker compose -f docker-compose.dev.yml exec backend python manage.py migrate
```
- Create a Django superuser:
```
docker compose -f docker-compose.dev.yml exec backend python manage.py createsuperuser
```
- Collect static files (if configured):
```
docker compose -f docker-compose.dev.yml exec backend python manage.py collectstatic --noinput
```
- Tail service logs:
```
docker compose -f docker-compose.dev.yml logs -f backend
```
- Open a Django shell:
```
docker compose -f docker-compose.dev.yml exec backend python manage.py shell
```

## Local Development (without Docker)
Backend:
```
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
# set environment variables (see env.example)
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

Frontend:
```
cd frontend
npm install
npm run dev
```

Note: When running frontend and backend locally without Docker, prefer same‑origin API access in development (e.g., via a dev proxy) to avoid CORS issues.

## Testing
If tests are configured, you can typically run:
- Backend (Django):
```
# inside container
docker compose -f docker-compose.dev.yml exec backend python manage.py test
# or, if pytest is configured
docker compose -f docker-compose.dev.yml exec backend pytest
```
- Frontend (React):
```
cd frontend
npm test
```

## Environment & Configuration
- Copy env.example to .env at the repo root and adapt values as needed.
- Use env-switch.sh and the environment‑specific compose files (dev/uat/prod) to align services with your target environment.
- Sensitive values must not be committed to version control.

## Makefile Shortcuts
A Makefile is provided for convenience. Run the following to discover available targets:
```
make help
```
If present, common targets include dev environment spins, linting, formatting, and cleanup.

## Troubleshooting
- Port already in use: stop local services using the same port or change ports in the compose file.
- Changes not reflected: ensure you rebuilt images when Dockerfiles or lockfiles changed (`--build`).
- Environment variables not applied: confirm `.env` exists at the repo root and restart the affected service.

## Contributing
- Follow the existing code style and patterns in backend/src/core and frontend/src/components.
- Keep changes small and focused; update or add documentation when behaviour changes.

## License
Proprietary — all rights reserved (or update this section with the correct license for your project).
