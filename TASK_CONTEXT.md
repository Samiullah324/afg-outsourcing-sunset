# Task context — README update (Task #8)

## Scope

Documentation-only: rewrite root `README.md` for **AFG Outsourcing Sunset Monorepo** with accurate Docker, Compose, Makefile, and environment setup. No application code changes.

## Key decisions

- Removed legacy **Horizon Digital** / submodule boilerplate; the repo is a single monorepo (no `.gitmodules`).
- Documented Compose as **base + overlay** (`docker-compose.yml` + `docker-compose.{dev,uat,prod}.yaml`), matching the root `Makefile` (not dev-only file).
- Ports and URLs taken from `docker-compose.dev.yml`, `env-switch.sh`, and Nginx dev config; noted that dev compose defaults differ until `./env-switch.sh development` runs.
- API base path **`/api`** documented from `backend/src/core/urls.py`; same-origin guidance aligned with Nginx routing and frontend `/api/...` paths.
- Testing section reflects actual scripts: Django tests via Make/Docker; no frontend `test` script in `package.json`.
- License marked **TBD** (no root `LICENSE` file).

## Files changed

| File | Why |
|------|-----|
| `README.md` | Accurate monorepo documentation per acceptance criteria |
| `TASK_CONTEXT.md` | Branch resume notes (engineering discipline) |

## Verification

- `cd frontend && npm ci && npm run lint` — passed (docs-only sanity check).
- No new automated tests (docs-only change by design).

## Open questions / follow-ups

- `env-switch.sh` sets `VITE_API_BASE_URL` to `http://localhost:8080/api` while frontend service paths already include `/api/`; operators may prefer origin-only (`http://localhost:8080`) or empty string for production—README calls this out without changing scripts (out of scope).
- Root `make lint` / `make install` reference backend Make targets that are not implemented; README points to working frontend commands.
