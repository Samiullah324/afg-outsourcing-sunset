# Task Context — #6 Update README

## Scope
Documentation-only change: update root `README.md` branding from “Horizon Digital Monorepo” to “AFG Outsourcing Sunset”. No application code, config, or Docker changes.

## Implementation decisions
- Replaced the main title only; “Horizon Digital Monorepo” appeared once in `README.md`. Other references (e.g. `horizon-digital`, `horizon_digital_*` DB names) were left unchanged per task instructions (branding for the monorepo name only).
- Truncated heading “🚀 Qui” was not present in the current `README.md`; “🚀 Quick Start” is already complete—no heading edit required.
- External image path from the ticket (`tenants/.../image.png`) was not added; asset is not in the repository.

## Files changed
| File | Why |
|------|-----|
| `README.md` | Title/branding update |
| `TASK_CONTEXT.md` | Engineering discipline / resume context for this branch |

## Verification
- Markdown: no Prettier config at repo root; README edited manually.
- `python3 -m pytest` (backend): collection failed without `DJANGO_SETTINGS_MODULE`; with `core.settings`, requires `SECRET_KEY` and PostgreSQL-backed env (Docker/.env)—not runnable in this VM without full stack.
- Frontend `package.json`: no `test` script; root `make test` expects Docker Compose.
- Docs-only change: no new automated tests added.

## Open questions / follow-ups
- If a README hero image is desired, add it under a repo-local path (e.g. `docs/images/`) and reference that path in a follow-up PR.
