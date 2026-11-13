# Task #24: Add version endpoint to the API

## Scope
- Add `GET /api/health/version/` returning `{"version": "<value>"}` from `APP_VERSION` or `"dev"`.
- No authentication (same as health check).
- Django tests for env set / unset.

## Decisions
- Reuse health check patterns in `backend/src/core/urls.py` (`api_view`, `AllowAny`, `extend_schema`).
- Read `APP_VERSION` via `os.environ.get("APP_VERSION", "dev")` at request time.
- Tests live in `backend/src/core/tests/` with `core` registered in `INSTALLED_APPS` for discovery.

## Files changed
- `backend/src/core/urls.py` — version view and URL route
- `backend/src/core/apps.py` — app config for test discovery
- `backend/src/core/settings/base.py` — register `core` app
- `backend/src/core/tests/test_version.py` — acceptance tests

## Open questions
- None.
