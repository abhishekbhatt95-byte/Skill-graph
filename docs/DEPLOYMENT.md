# Deployment, Operations & Recovery

## Prerequisites & Dependencies
- Node.js 20+
- PostgreSQL 15+ (when using relational database backend)
- Supabase Project or local JWT signing key

## Environment Setup
1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Set `SUPABASE_URL` and `SUPABASE_JWT_SECRET` for production token verification.
3. For persistent storage on Replit, configure private object storage (`STORAGE_PROVIDER="s3"` or `"supabase"`). If running in local development mode without persistent storage, documents are safely handled within the local sandbox.

## Health & Readiness Checks
- Endpoint: `GET /api/health`
- Response: Status 200 with `{ "status": "ok", "db_connected": true, "scoring_version": "1.0-deterministic" }`.

## Rollback & Backup Considerations
- Ensure database backups are run on a recurring schedule.
- When rolling back, migrations should be reverted in reverse dependency order (`alembic downgrade`).
