# Task context — README update (Task #45)

## Scope

Documentation-only: replace the legacy Horizon Digital / Git submodule boilerplate in root `README.md` with accurate **AFG Outsourcing Sunset** monorepo documentation (Docker Compose, Makefile, `env-switch.sh`, same-origin `/api` routing). No application code changes.

## Key decisions

- Reused content aligned with prior draft work (PR #28 on this repo): single vendored monorepo layout after commit `e03ff76` (no `.gitmodules`).
- Plain heading anchors (no emoji) for stable GitHub TOC links.
- Ports and URLs verified against `env-switch.sh`, `docker-compose.dev.yml`, and root `Makefile`.
- Testing section reflects real scripts: Django via `manage.py test` / `make test-backend`; no frontend `test` script in `package.json`.
- License marked **TBD** (no root `LICENSE` file).

## Files changed

| File | Why |
|------|-----|
| `README.md` | Accurate project documentation per task #45 |
| `TASK_CONTEXT.md` | Branch resume notes (engineering discipline) |

## Verification

- `cd frontend && npm ci && npm run lint` — run on this branch before PR.
- No new automated tests (docs-only change by design).

## Open questions / follow-ups

- `env-switch.sh` sets `VITE_API_BASE_URL` with an `/api` suffix while frontend HTTP paths already include `/api/`; README notes same-origin guidance without changing scripts (out of scope for this task).
- Root `make lint` / `make install` delegate to backend Make targets without dedicated lint/format recipes; README documents working frontend commands explicitly.