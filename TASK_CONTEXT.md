# Task #8 — Update README

## Scope

Documentation-only change for the **afg-outsourcing-sunset** monorepo. Replace the generic “Horizon Digital” starter README with an accurate **AFG Outsourcing Sunset Monorepo** guide. No backend, frontend, or config edits.

## Key decisions

- **Title**: “AFG Outsourcing Sunset Monorepo” per ticket; legacy `PROJECT_NAME` / container defaults (`horizon-digital`) remain documented as in `env.example` and compose files.
- **No root `Dockerfile` or root `package.json`**: Document per-service Dockerfiles under `backend/` and `frontend/`.
- **Submodules**: No `.gitmodules` in this repo; README describes an in-repo monorepo layout, not Git submodules.
- **Local backend `.env`**: Django `base.py` reads `backend/.env`; monorepo orchestration uses repo-root `.env` — optional local section notes copying/symlinking when not using Docker.
- **Frontend tests**: No `test` script in `frontend/package.json`; documented as not configured at the monorepo frontend level.
- **Root `make lint` / `make install`**: Delegates to `backend/` and `frontend/` Makefiles; backend Makefile has no `lint`/`format`/`install` targets (only declared in `.PHONY`) — documented root targets that exist and noted backend gap where relevant.

## Files changed

| File | Why |
|------|-----|
| `README.md` | Full rewrite aligned with Makefile, compose files, env scripts, nginx routing, and stack versions. |
| `TASK_CONTEXT.md` | Ticket context for branch handoff (this file). |

## Sources used

`Makefile`, `docker-compose.yml`, `docker-compose.dev.yml`, `docker-compose.uat.yml`, `docker-compose.prod.yml`, `env.example`, `env-switch.sh`, `setup.sh`, `backend/requirements.txt`, `backend/Dockerfile`, `frontend/package.json`, `frontend/Dockerfile`, `nginx/conf.d/dev.conf`, `backend/src/core/urls.py`, `backend/src/core/settings/base.py`.

## Open questions / follow-ups

- Consider renaming `PROJECT_NAME` / branding in `env.example` and scripts from `horizon-digital` to match AFG Outsourcing Sunset (out of scope for this docs ticket).
- Root `make install` / `make lint` may fail on backend until backend Makefile defines `install` and `lint` targets.

## Verification

- Docs-only: no application tests added.
- No markdown linter configured in repo (N/A).
