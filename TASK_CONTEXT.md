# TASK_CONTEXT — README refresh

## Scope

Documentation-only ticket: rewrite root `README.md` for **Samiullah324/afg-outsourcing-sunset** so it describes the real monorepo layout, Docker flows, environments, and Makefile commands. No application code or config changes.

## Key decisions

- Title and overview use **AFG Outsourcing Sunset** (repository name/purpose), not the legacy “Horizon Digital” / starter template naming still present in env defaults.
- **No Git submodules section**: `backend/` and `frontend/` live in this repo (no `.gitmodules`).
- Ports and service names taken from `docker-compose.yml`, `docker-compose.{dev,uat,prod}.yml`, `env-switch.sh`, and root `Makefile`.
- Document `seed_demo` management command (exists under `backend/src/authentication/management/commands/seed_demo.py`).
- **License**: no root `LICENSE` file — README states proprietary/internal rather than MIT.
- Root `make lint` / `make install` delegate to backend targets that are not fully implemented in `backend/Makefile`; README documents commands that exist in manifests (`npm run lint`, `manage.py test`, `pytest` in `requirements.txt`).

## Files changed

| File | Why |
|------|-----|
| `README.md` | Full rewrite per ticket sections |
| `TASK_CONTEXT.md` | Branch resume notes (this file) |

## Sources read for accuracy

- `docker-compose.yml`, `docker-compose.dev.yml`, `docker-compose.uat.yml`, `docker-compose.prod.yml`
- `Makefile`, `env-switch.sh`, `env.example`, `setup.sh`
- `backend/requirements.txt`, `backend/manage.py`, `backend/Dockerfile`, `backend/src/core/urls.py`, `backend/src/core/settings/base.py`
- `frontend/package.json`, `frontend/Dockerfile`
- `.cursor/rules/rule-1.mdc`

## Verification

- Docs-only: no tests or build required for runtime code.
- Self-review: compose service names, API prefix `/api/`, and `make`/`env-switch.sh` environment names cross-checked against sources above.

## Open questions / follow-ups

- Consider aligning `PROJECT_NAME` / branding in `env.example` and scripts with “AFG Outsourcing Sunset” (out of scope for this docs ticket).
- Root `make backup` uses database name pattern `horizon_digital_$(ENV)` which may not match `POSTGRES_DB` after `env-switch.sh` (e.g. `horizon_digital_dev`); README points to `POSTGRES_DB` for manual `psql`/`pg_dump`.
