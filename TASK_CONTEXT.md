# Task context — Update README (Task #3)

## Scope

Documentation-only: replace template “Horizon Digital Monorepo” branding with **AFG Outsourcing Sunset** and document the real monorepo, Docker Compose layers, services, ports, env vars, and commands grounded in repo files.

## Files changed

| File | Why |
|------|-----|
| `README.md` | Full rewrite per ticket outline (architecture, envs, quick start, manual dev, env vars, testing, deployment, troubleshooting) |
| `TASK_CONTEXT.md` | Branch-local record for handoff (this file) |

No source code or config beyond these docs.

## Key decisions

- Documented **no Git submodules** (no `.gitmodules`; `backend/` and `frontend/` are in-tree).
- Documented **no Flower** service (not present in Compose).
- Port tables use **Compose defaults** and note that `.env` / `env-switch.sh` overrides them (dev compose defaults differ from values written by `env-switch.sh development` for some ports).
- License: no `LICENSE` file → documented as private / all rights reserved.
- `seed_demo` and `DEMO_ADMIN_PASSWORD` documented from management command and `.sunset/deploy.yaml`.

## Verification (docs-only)

- **Frontend:** `npm ci`, `npm run lint`, and `npm run build` (includes `tsc -b`) — all passed.
- **Backend:** `python manage.py check` — passed. `manage.py test` not run to completion: no PostgreSQL or Docker in this cloud VM.
- **Root `make test` / `make lint`:** not run (Docker missing; backend `lint` target not implemented).
- No new tests added (documentation-only change).

## Open questions / follow-ups

- Consider aligning `env.example` / `env-switch.sh` / compose default ports so dev docs need fewer caveats.
- Root `make lint` references `backend` `lint`/`format` targets that are not implemented in `backend/Makefile` (PHONY only).
- Add frontend test runner and `npm test` when the team adopts one.
