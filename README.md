# 🌅 AFG Outsourcing Sunset

A production-ready full-stack monorepo featuring a Django backend and React frontend with comprehensive Docker orchestration, Nginx reverse proxy, and multi-environment support (dev/uat/prod).

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [Environments](#environments)
- [Project Structure](#project-structure)
- [Troubleshooting](#troubleshooting)

## Overview

**AFG Outsourcing Sunset** is a production-ready monorepo that combines:

- **Django** backend (REST API, PostgreSQL, Celery, JWT auth)
- **React** frontend (TypeScript, Vite, atomic design components)
- **Nginx** as the reverse proxy
- **Docker Compose** for dev, UAT, and production stacks

Use the compose files and `.env` for service ports, credentials, and environment-specific settings.

## Architecture

- **Backend (Django)** — API, authentication, background work via Celery (`backend/src/core/celery.py`), settings under `backend/src/core/settings/`
- **Frontend (React)** — SPA built with Vite; UI components under `frontend/src/components/`
- **Reverse proxy (Nginx)** — Terminates HTTP/HTTPS and routes traffic to frontend and backend (`nginx/`)
- **Task queue (Celery)** — Workers and beat scheduler defined in Docker Compose alongside Redis
- **Data & cache** — PostgreSQL and Redis as backing services
- **Orchestration** — Layered Compose files (`docker-compose.yml` plus environment overrides) for consistent multi-environment deployments

## Quick Start

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose (v2)
- Optional for local (non-container) work: Node.js and Python matching `frontend/package.json` and `backend/requirements.txt`

### Steps

1. **Environment file**

   ```bash
   cp env.example .env
   ```

   Edit `.env` for database credentials, API URLs, and project naming. Align values with the compose file you plan to use.

2. **Bootstrap (optional)**

   ```bash
   ./setup.sh
   ```

   Runs project setup helpers when present; safe to skip if you configure `.env` manually.

3. **Start development stack**

   ```bash
   docker compose -f docker-compose.dev.yml up -d
   ```

   On older installs, use `docker-compose` instead of `docker compose`.

4. **Ports and access**

   Service ports, host bindings, and default credentials are defined in `docker-compose.dev.yml` and `.env` — refer to those files rather than hard-coded URLs here.

5. **Make shortcuts**

   The root `Makefile` may define helpful targets (setup, migrate, tests, logs). Run `make help` when available instead of memorizing commands.

## Environments

| File | Role |
|------|------|
| `docker-compose.yml` | Base service definitions shared across environments |
| `docker-compose.dev.yml` | Local development overrides |
| `docker-compose.uat.yml` | User acceptance / staging-like stack |
| `docker-compose.prod.yml` | Production-oriented configuration |

Switch or regenerate environment variables for a target stack with:

```bash
./env-switch.sh
```

See script usage in the repo for supported environment names (`dev`, `uat`, `prod`, etc.).

## Project Structure

Illustrative layout (not exhaustive):

```
.
├── backend/
│   ├── manage.py
│   ├── requirements.txt
│   └── src/
│       ├── core/
│       │   ├── celery.py
│       │   └── settings/
│       │       └── base.py
│       └── authentication/
├── frontend/
│   ├── package.json
│   └── src/
│       └── components/
│           └── atoms/
│               └── Button/
│                   └── Button.tsx
├── nginx/
├── docker-compose.yml
├── docker-compose.dev.yml
├── docker-compose.uat.yml
├── docker-compose.prod.yml
├── env.example
├── env-switch.sh
├── setup.sh
└── Makefile
```

Backend and frontend may also ship their own READMEs and compose snippets under `backend/` and `frontend/`.

## Troubleshooting

- **Stale containers or volumes** — After changing compose files or `.env`, stop stacks and remove orphaned containers/volumes as needed, then bring the environment up again.
- **`.env` mismatch** — Ensure `.env` matches the compose file you start (dev vs UAT vs prod) and run `./env-switch.sh` when switching targets.
- **Service health** — Inspect logs with `docker compose` for the file you used; use `make help` for Makefile log/health targets if defined.
- **Deeper guides** — See `backend/README.md` and `frontend/README.md` for stack-specific development notes.

---

**Built for modern full-stack delivery with Docker and multi-environment workflows**
