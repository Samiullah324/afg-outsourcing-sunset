# Task context: README refresh (docs/update-readme-monorepo-envs)

## Scope

Documentation-only update to root `README.md` for the **AFG Outsourcing Sunset Monorepo** (`Samiullah324/afg-outsourcing-sunset`). No application code, Docker, CI, or config changes outside this ticket’s docs.

## Goals

- Replace generic **Horizon Digital** / starter-repo branding with **AFG Outsourcing Sunset Monorepo**.
- Document real root assets: compose files, `Makefile`, `env-switch.sh`, `setup.sh`, `env.example`, `backend/`, `frontend/`, `nginx/`.
- Provide conservative Quickstart (Option A: explicit `-f` compose files; Option B: `env-switch.sh` then compose).
- Add structure, environments, local dev pointers, Makefile/scripts, networking (`/api`, same-origin via env), and generic Docker troubleshooting.
- Remove or avoid unverified specifics (hardcoded ports, submodule workflow — this repo has no `.gitmodules`).

## Files changed

| File | Why |
|------|-----|
| `README.md` | Full refresh per product outline; retained License, Contributing, Support, and resource links where still accurate |
| `TASK_CONTEXT.md` | Engineering discipline record for this branch |

## Decisions

- **`env-switch.sh --help`**: Script has no `--help` flag; documented “no argument prints usage” and valid env names (`dev`, `uat`, `prod`, etc.) from script source.
- **Compose invocation**: Documented standalone `-f docker-compose.<env>.yml` as requested; noted Makefile may combine `docker-compose.yml` with overrides.
- **Networking**: Documented `/api/` via Nginx configs; `VITE_API_BASE_URL` from `env.example` / `env-switch.sh` without mandating a single port.
- **Makefile targets**: Not enumerated; pointed readers to `make help` (verified `help` target exists).

## Verification

- Docs-only: no automated tests added or required for Markdown.
- No repo-wide Markdown linter at root; manual review of headings, TOC anchors, and referenced paths.
- Confirmed on disk: `docker-compose.dev.yml`, `docker-compose.uat.yml`, `docker-compose.prod.yml`, `docker-compose.yml`, `env-switch.sh`, `setup.sh`, `Makefile`, `env.example`, `nginx/`.

## Open questions / follow-ups

- None blocking merge. Optional future pass: align `env.example` / script comments that still say “Horizon Digital” (out of scope for this README-only ticket).
