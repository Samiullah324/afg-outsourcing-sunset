# 🌅 AFG Outsourcing Sunset Monorepo

A production-ready full-stack monorepo featuring a Django backend and a React frontend with comprehensive Docker orchestration, optional Nginx reverse proxy, and multi-environment support (dev/uat/prod).

## 📋 Table of Contents
- [🎯 Overview](#-overview)
- [🏗️ Architecture](#️-architecture)
- [🚀 Quick Start](#-quick-start)
- [🧩 Environments](#-environments)
- [🗂️ Project Layout](#️-project-layout)
- [🧰 Developer Notes](#-developer-notes)
- [🙋 Support & Contributing](#-support--contributing)

## 🎯 Overview
This repository hosts both the backend (Django) and frontend (React) in a single monorepo. It includes Docker Compose files for local development and environment-specific stacks (UAT/Prod), a sample environment file, and helper scripts to simplify bootstrapping and environment switching.

Key features:
- Django backend (ASGI/WSGI ready, Celery wiring present)
- React frontend with a component-driven structure
- Multi-environment Docker Compose: development, UAT, and production
- Centralized environment management via env.example and helper scripts
- Optional Nginx reverse proxy fronting the app stack (see compose files)

## 🏗️ Architecture
- Backend (Django)
  - Entrypoints and settings under `backend/src/core/` (ASGI/WSGI, settings, URLs, Celery)
- Frontend (React)
  - Component library under `frontend/src/components/` (atoms/molecules, etc.)
- Orchestration
  - Root-level Docker Compose files for each environment
  - Environment template at `env.example` and bootstrap scripts at the root

## 🚀 Quick Start
Prerequisites:
- Docker and Docker Compose (v2 recommended: `docker compose`)
- Bash-compatible shell (for the helper scripts)

Bootstrap:
1. Clone this repository
2. Copy the environment template and adjust as needed:
   - `cp env.example .env`
3. (Optional) Run the setup script if your workflow uses it:
   - `./setup.sh`

Start the development stack (builds on first run):
- `docker compose -f docker-compose.dev.yml up --build`

For UAT or Prod stacks (adjust as needed for your environment):
- UAT: `docker compose -f docker-compose.uat.yml up --build -d`
- Prod: `docker compose -f docker-compose.prod.yml up --build -d`

Tear down:
- `docker compose -f docker-compose.dev.yml down` (or substitute the respective compose file)

Notes:
- Exposed ports and service details are defined in the corresponding `docker-compose.*.yml` files.
- If an Nginx reverse proxy is enabled in your chosen stack, all traffic is routed via the gateway container.

## 🧩 Environments
- Environment template: `env.example` — copy to `.env` and customize per environment.
- Quick environment switcher: `./env-switch.sh <dev|uat|prod>`
  - This helper can export or switch common variables. Review the script to fit your local conventions.

Compose files:
- `docker-compose.yml` (base or shared pattern)
- `docker-compose.dev.yml`
- `docker-compose.uat.yml`
- `docker-compose.prod.yml`

## 🗂️ Project Layout
Abridged structure (key paths only):
```
.
├── backend/
│   └── src/core/
│       ├── asgi.py
│       ├── wsgi.py
│       ├── celery.py
│       ├── settings/
│       └── urls.py
├── frontend/
│   └── src/components/
│       ├── atoms/
│       └── molecules/
├── docker-compose.dev.yml
├── docker-compose.uat.yml
├── docker-compose.prod.yml
├── docker-compose.yml
├── env.example
├── env-switch.sh
├── setup.sh
├── Makefile
├── frontend/package.json
└── backend/requirements.txt
```

## 🧰 Developer Notes
- Same-origin API access: when front-end calls the back-end, prefer same-origin (`/api/...`) and avoid hard-coded `http://localhost:<port>` in any production build.
- Type/lint/format: if formatters/linters are configured in `package.json` or Python tooling, run them before pushing changes.
- Celery/worker processes: review `backend/src/core/celery.py` and your compose file for how/when workers are started.

## 🙋 Support & Contributing
- Follow any repository rules in `.cursor/rules/` when proposing changes.
- Open an issue or PR with a clear description of the change and environment you tested against.
