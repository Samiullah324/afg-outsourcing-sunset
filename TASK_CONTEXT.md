# Task Context: Update README project name

## Scope
Documentation-only change on this branch: rename the project in the root `README.md` from "Horizon Digital" to "AFG Outsourcing Sunset" while preserving structure, commands, paths, and technical identifiers.

## Key decisions
- Updated only the H1 title; the opening description paragraph already described the stack without the old product name.
- Left technical identifiers unchanged (`horizon-digital`, `horizon_digital_*`, URLs, Docker network names) per task instructions to avoid altering operational docs.

## Files changed
| File | Why |
|------|-----|
| `README.md` | H1 renamed to "AFG Outsourcing Sunset Monorepo". |
| `TASK_CONTEXT.md` | Branch context for resume/reassign (engineering discipline). |

## Verification
- Grep confirmed no remaining "Horizon Digital" in `README.md` after edit.
- Documentation-only: no application test suite applicable for this change.

## Open questions / follow-ups
- Broader rebranding (frontend content, env defaults, Makefile/setup scripts) was out of scope for this ticket; only root README was requested.
