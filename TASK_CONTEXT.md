# Task context: README branding (AFG Outsourcing Sunset)

## Scope

Documentation-only update to root `README.md` for repository **Samiullah324/afg-outsourcing-sunset**. No backend, frontend, Docker, or CI code changes.

## Goals

- Rebrand from “Horizon Digital Monorepo” to **AFG Outsourcing Sunset**
- Provide a concise overview, architecture summary, quick start, environments, project structure, and troubleshooting
- Reference only verified repo files (compose files, `env.example`, `setup.sh`, `env-switch.sh`, `Makefile`, known backend/frontend paths)
- Avoid unverified port numbers and exhaustive Make target lists; point readers to compose files and `make help`

## Implementation decisions

- Replaced the long legacy README with a focused document matching the ticket TOC (Overview, Architecture, Quick Start, Environments, Project Structure, Troubleshooting)
- Used `docker compose -f docker-compose.dev.yml up -d` (with note for `docker-compose` alias) per ticket; did not duplicate port tables from the old README
- Preserved emoji-style heading tone where appropriate (🌅 title, 📋 TOC)
- Did not add external images or links absent from the repo

## Files changed

| File | Why |
|------|-----|
| `README.md` | Branding and structured documentation per ticket |
| `TASK_CONTEXT.md` | Branch-local record for handoff/resume |

## Verification

- Docs-only: no application test suite run (no Markdown test runner configured in repo)
- Manual review: valid Markdown, TOC anchors match headings, no remaining “Horizon Digital” references in `README.md`

## Open questions / follow-ups

- None for this ticket. Submodule-specific workflows remain documented in `backend/README.md` and `frontend/README.md` if needed later.
