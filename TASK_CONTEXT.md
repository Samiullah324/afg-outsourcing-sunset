# Task context: README refresh (AFG Outsourcing Sunset)

## Scope
Documentation-only update to the repository root `README.md` for the **AFG Outsourcing Sunset** monorepo (Django backend, React frontend, Docker Compose, Nginx, multi-environment).

No application code, Docker configs, or submodule changes.

## Key decisions
- Replaced legacy “Horizon Digital” README with a shorter, emoji-forward structure aligned with existing repo style and `.cursor/rules/rule-1.mdc` (changes limited to documented scope at repo root).
- Did not hardcode service ports; documentation points readers to `docker-compose.*.yml` for port mappings and service details.
- Project layout tree lists paths verified in this repository. Root-level `package.json` and `requirements.txt` are not present; layout references `frontend/package.json` and `backend/requirements.txt` instead of the draft template paths at repo root.

## Files changed
| File | Why |
|------|-----|
| `README.md` | Primary deliverable: overview, architecture, quick start, environments, layout, developer notes, contributing. |
| `TASK_CONTEXT.md` | Branch-local record for handoff/resume per engineering discipline requirements. |

## Verification
- Docs-only: no backend/frontend test suites run (no runtime behavior changed).
- No root-level Markdown formatter or markdownlint script in `Makefile` or root `package.json`; README reviewed manually for structure and anchors.

## Open questions / follow-ups
- None for this ticket. Future docs could link to `backend/README.md` and `frontend/README.md` if a longer guide is desired.
