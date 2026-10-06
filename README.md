# AFG Outsourcing Sunset Monorepo

A production-ready full-stack monorepo with a **Django** backend, **React + TypeScript (Vite)** frontend, **Docker Compose** orchestration, **Nginx** reverse proxy, and separate compose stacks for development, UAT, and production.

## Table of Contents

- [Overview](#overview)
- [Architecture / Project Structure](#architecture--project-structure)
- [Quickstart](#quickstart)
- [Environments](#environments)
- [Local Development (without Docker)](#local-development-without-docker)
- [Makefile and Scripts](#makefile-and-scripts)
- [Networking and API Base](#networking-and-api-base)
- [Troubleshooting](#troubleshooting)
- [Additional Resources](#additional-resources)
- [Contributing](#contributing)
- [License](#license)
- [Support](#support)

## Overview

This repository bundles:

- **Backend (`backend/`)** — Django REST API, PostgreSQL, Redis, Celery (see `backend/requirements.txt` and `backend/README.md`).
- **Frontend (`frontend/`)** — React with TypeScript and Vite (see `frontend/package.json` and `frontend/README.md`).
- **Infrastructure** — Nginx configs under `nginx/`, root-level Docker Compose files, and helper scripts for environment setup and switching.

Ports, service names, and environment variables are defined in the compose files and `env.example`; prefer those sources over hardcoded values in this document.

## Architecture / Project Structure

High-level layout:

```
afg-outsourcing-sunset/
├── backend/                 # Django application
├── frontend/                # React + Vite + TypeScript
├── nginx/                   # Nginx reverse proxy configuration
├── docker-compose.yml       # Base / default compose stack
├── docker-compose.dev.yml   # Development stack
├── docker-compose.uat.yml   # UAT stack
├── docker-compose.prod.yml  # Production stack
├── Makefile                 # Convenience targets (see `make help`)
├── env-switch.sh            # Writes/updates `.env` for an environment
├── setup.sh                 # Bootstrap helper (Docker checks, env prep)
└── env.example              # Environment variable template
```

When running under Docker, Nginx typically terminates HTTP(S) and routes browser traffic to the frontend while proxying API traffic to the backend under `/api/` (see `nginx/conf.d/`).

## Quickstart

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose (v2 plugin: `docker compose`)
- Optional: [Make](https://www.gnu.org/software/make/) for Makefile shortcuts

### Environment files

If needed, copy the template and adjust values for your machine:

```bash
cp env.example .env
```

You can also generate or refresh environment-specific values with `./env-switch.sh` (see [Makefile and Scripts](#makefile-and-scripts)).

### Option A — Docker Compose (explicit compose file)

Use the compose file that matches the target environment. Service names, published ports, and volumes are defined inside each file.

**Development**

```bash
docker compose -f docker-compose.dev.yml up --build
```

**UAT**

```bash
docker compose -f docker-compose.uat.yml up --build
```

**Production**

```bash
docker compose -f docker-compose.prod.yml up --build
```

**Default / base stack**

```bash
docker compose -f docker-compose.yml up --build
```

The root `Makefile` often combines `docker-compose.yml` with an environment override (for example `docker-compose.yml` plus `docker-compose.dev.yml`). Either use explicit `-f` flags as above or follow `make help` when using Make.

### Option B — Environment switcher, then Compose

`env-switch.sh` updates `.env` (and related settings) for a named environment. Inspect the script before use in shared or production systems.

Running it with no argument prints usage. Accepted environment names include `development` / `dev`, `uat`, and `production` / `prod`.

```bash
./env-switch.sh dev
docker compose up --build
```

After switching, you can still pass `-f` explicitly (Option A) if you prefer a specific compose file over the default project configuration.

### Bootstrap helper

`setup.sh` checks for Docker, prepares `.env` when missing, and performs other bootstrap steps. Review the script before running it:

```bash
./setup.sh
```

## Environments

| Compose file | Typical use |
|--------------|-------------|
| `docker-compose.dev.yml` | Local development (hot reload, debug-friendly settings) |
| `docker-compose.uat.yml` | User acceptance testing, production-like configuration |
| `docker-compose.prod.yml` | Production deployment |
| `docker-compose.yml` | Base or default stack; may be combined with overrides via Make |

Switch active configuration with `./env-switch.sh` and/or by choosing the appropriate `-f` compose file when you run `docker compose`.

## Local Development (without Docker)

For day-to-day coding outside containers, use each app's own manifest and documentation.

**Backend**

- Python dependencies: `backend/requirements.txt`
- Django project under `backend/src/` with `backend/manage.py`
- Typical workflows include `runserver`, migrations (`migrate` / `makemigrations`), and tests — see `backend/README.md` and the backend `Makefile` if present

**Frontend**

- Node dependencies and scripts: `frontend/package.json`
- Common steps: install packages (`npm install` or the package manager you use), then `npm run dev` for the Vite dev server
- See `frontend/README.md` for authoritative script names (`lint`, `build`, `test`, etc.)

Exact commands and ports for bare-metal development vary; avoid assuming they match Docker-published ports without checking each app's config.

## Makefile and Scripts

**Makefile**

Run `make help` to list documented targets and usage (the help target is defined in the root `Makefile`). Common categories may include environment setup, compose up/down, logs, migrations, and tests — always confirm in the Makefile before relying on a target name.

**`env-switch.sh`**

Selects an environment and updates `.env` accordingly. Example:

```bash
./env-switch.sh uat
```

**`setup.sh`**

One-time or occasional bootstrap (Docker validation, initial `.env`, etc.). Read the script first; run `./setup.sh` when you want that automated setup.

## Networking and API Base

- **API path** — Backend HTTP APIs are exposed under **`/api/`** when accessed through Nginx (see `nginx/conf.d/*.conf`).
- **Same-origin** — In deployed or Docker-compose setups, configure the frontend so browser requests go through the same origin as the UI (via Nginx), not a hardcoded backend host. Set `VITE_API_BASE_URL` in `.env` / `env.example` to match your routing (often the public app URL including the `/api` prefix when using `env-switch.sh`). For local Vite-only development, see `frontend/env.example` and `frontend/README.md`.

Avoid baking `localhost` backend URLs into production builds; use environment variables and compose defaults instead.

## Troubleshooting

**Port already in use**

- Another process or container may be binding a published port from the compose file. Stop conflicting services (`docker compose down`) or change the host port variables in `.env` if the compose file supports overrides.

**Stale images or containers**

- Rebuild: `docker compose -f <your-compose-file> up --build --force-recreate`
- Remove unused resources cautiously: `docker system prune` (omits volumes unless you add `--volumes`)

**Environment / config mismatches**

- Regenerate or review `.env` with `./env-switch.sh <env>` or compare against `env.example`
- Ensure `PROJECT_NAME` / `COMPOSE_PROJECT_NAME` align so container names do not clash across projects

**Service logs**

- Follow logs for the stack you started: `docker compose -f <compose-file> logs -f` (add a service name to narrow output)

**Database or migration issues**

- Use Django management commands via the backend container or local `manage.py` — see `backend/README.md` and Makefile/database targets from `make help`

For Make-driven workflows, `make help` remains the index of supported debugging and maintenance commands.

## Additional Resources

- [Backend README](./backend/README.md)
- [Frontend README](./frontend/README.md)
- [Django documentation](https://docs.djangoproject.com/)
- [React documentation](https://react.dev/)

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-change`
3. Commit your changes with a clear message
4. Push to the branch and open a Pull Request

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

## Support

- Open an issue in the GitHub repository
- Use the [Troubleshooting](#troubleshooting) section above
- Consult `backend/` and `frontend/` documentation for component-specific behavior
