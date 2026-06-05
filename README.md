# Finance SaaS Backend

Multi-tenant finance backend built with NestJS, Fastify, Prisma, PostgreSQL, Redis, and S3-compatible storage.

## Modules

- `auth`: JWT auth, refresh tokens, password reset flow
- `users`: profile management and password updates
- `organizations`: workspaces, members, invitations, roles
- `expenses`: CRUD, soft deletes, filters, pagination, exchange-rate capture
- `categories`: organization-scoped expense categories
- `currency`: supported currencies and stored rate conversion
- `analytics`: overview and expense breakdown endpoints
- `reports`: export job creation and downloadable report metadata
- `attachments`: private upload/download flow with signed URLs
- `audit-logs`: sensitive action tracking
- `admin`: super-admin user/org/job/feature-flag operations
- `jobs`: BullMQ queue + scheduled cleanup
- `health`: liveness/readiness probes

## Local setup

1. Copy `.env.example` to `.env`.
2. Run `docker-compose up -d postgres redis minio`.
3. Run `npm install`.
4. Run `npx prisma generate`.
5. Run `npx prisma migrate dev --name init`.
6. Run `npm run prisma:seed`.
7. Run `npm run start:dev`.

## Request conventions

- All APIs are served under `/api/v1`.
- Organization-scoped endpoints require `x-organization-id`.
- Controllers stay thin; business rules live in services and repositories.
- Protected routes use JWT auth and role checks.
- API responses are wrapped in a consistent envelope.

## Frontend integration

- Frontend should call backend through dedicated API client/service files and hooks.
- Do not call REST endpoints directly from UI components.
- All dashboard, analytics, and expense totals should come from backend data.
