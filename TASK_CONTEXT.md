# Task #27 — Readiness endpoint

## Scope
Add `GET /api/health/ready/` returning `{"ready": true}` when the database answers `SELECT 1`, or HTTP 503 with `{"ready": false}` when it does not. No authentication.

## Implementation
- Extended `backend/src/core/urls.py`: added `ready_check` beside `health_check`, using `django.db.connection` and DRF `AllowAny` (same pattern as existing health endpoint).
- Added `backend/src/core/tests/test_health.py` with ready and database-down cases (mock on `core.urls.connection.cursor`).

## Reuse
- Mirrored `health_check`: `@api_view`, `@permission_classes([AllowAny])`, `extend_schema` under Health tag.

## Files changed
- `backend/src/core/urls.py`
- `backend/src/core/tests/__init__.py` (new)
- `backend/src/core/tests/test_health.py` (new)

## Verification
- `python manage.py check`
- `python manage.py test core.tests.test_health`

## Open questions
- None
