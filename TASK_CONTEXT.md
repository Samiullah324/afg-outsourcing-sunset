# Task context — Issue #3: Update README

## Scope

- **Ticket:** Update the root README for the AFG Outsourcing Sunset monorepo (documentation only).
- **Branch:** `cursor/docs-update-readme-afg-outsourcing-sunset-49a9` (renamed from `docs/update-readme-afg-outsourcing-sunset` for PR tooling)
- **In scope files:** `README.md`, this `TASK_CONTEXT.md`
- **Out of scope:** Backend/frontend code, Compose, Makefile, or env template renames (legacy `horizon-digital` defaults remain in those files).

## Implementation decisions

- Replaced generic “Horizon Digital Monorepo” / starter clone instructions with **AFG Outsourcing Sunset** naming and GitHub clone URL.
- Removed **Git submodules** section: this repo ships `backend/` and `frontend/` in-tree (no `.gitmodules`).
- Documented **actual** Compose file layout, nginx `/api/` routing, and port defaults from `docker-compose*.yml` (not only `env-switch.sh`, which can differ on host Postgres port).
- Called out **legacy template values** in `env.example` / `PROJECT_NAME` so developers know to set `afg-outsourcing-sunset` locally.
- Testing section reflects reality: backend tests via `make test-backend`; **no frontend test script**; root `make test` is incomplete for frontend.
- License: no `LICENSE` file → documented proprietary / all rights reserved.
- Linked `.sunset/deploy.yaml` and CI validator for Sunset hosting context.

## Verification performed

- `make help` — confirmed documented targets exist.
- `python .sunset/validate_deploy_contract.py` — deploy contract validation (repo CI gate).
- No Markdown linter or Prettier config at repo root for README; manual review of fences and anchors.

## Tests

- **Not added:** documentation-only change; no Markdown test harness in the repo.

## Open questions / follow-ups

- Optional repo-wide rename of `PROJECT_NAME`, database defaults, and `env-switch.sh` display strings from `horizon-digital` to `afg-outsourcing-sunset` (separate from README task).
- Add frontend `test` script and Make target if automated UI tests are desired.
- Add an explicit `LICENSE` file if legal requires one.
