# Task context: Update root README (AFG Outsourcing Sunset)

## Scope

- **Ticket**: Replace template README with accurate, repo-specific documentation for `Samiullah324/afg-outsourcing-sunset`.
- **Classification**: Documentation-only (root `README.md` + this file). No application code, compose, or config behavior changes.

## Key decisions

- Title and branding use **AFG Outsourcing Sunset** per ticket; noted that `env.example` / compose defaults still use `horizon-digital` for `PROJECT_NAME` until `.env` is customized.
- Documented Docker commands from actual compose files and root `Makefile` (merge pattern `docker-compose.yml` + overlay, plus standalone dev overlay).
- Omitted Git submodule workflow: no `.gitmodules` in this repo.
- Omitted MIT license reference: no `LICENSE` file found.
- Port tables use compose defaults and call out that `env-switch.sh` overrides many port variables.

## Files changed

| File | Why |
|------|-----|
| `README.md` | Full rewrite with verified architecture, ports, scripts, Makefile, testing, troubleshooting |
| `TASK_CONTEXT.md` | Branch-local record for handoff |

## Verification

- **Markdown lint**: No markdownlint/prettier config found at repo root; manual review only.
- **Backend tests**: `python3 manage.py test authentication` attempted locally; **blocked** — PostgreSQL not running in the cloud agent VM (`connection refused` on 127.0.0.1:5432). Tests exist (`backend/src/authentication/tests/`); run via `make test-backend ENV=development` when the Compose stack is up.
- **Frontend tests**: No test script in `frontend/package.json`.
- **No new tests**: Docs-only change; no behavior to cover.

## Open questions / follow-ups

- Consider aligning `PROJECT_NAME` / `VITE_APP_NAME` defaults in `env.example` with “AFG Outsourcing Sunset” in a future non-docs change.
- Add a `test` script to `frontend/package.json` or remove frontend from root `make test` if it should not invoke a missing target.

## Branch

- `cursor/docs-update-readme-846a`
