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
2. Start PostgreSQL, Redis, and S3-compatible storage locally.
3. Set `DATABASE_URL`, `REDIS_URL`, and the S3 env vars in `.env`.
4. Run `npm install`.
5. Run `npx prisma generate`.
6. Run `npx prisma migrate dev --name init`.
7. Run `npm run prisma:seed`.
8. Run `npm run start:dev`.

### Local dependencies

- PostgreSQL 16+
- Redis 7+
- S3-compatible object storage such as MinIO
- Node.js 22+ recommended

### Demo credentials

- Email: `demo@finance.local`
- Password: `DemoPass123!`
- Workspace slug: `demo-workspace`

### Quick commands

- `npm run db:up`: starts the local Docker dependencies if Docker is available
- `npm run db:setup`: generates Prisma client, migrates, and seeds
- `npm run build`: production compile check

## Deployment

### Backend on Render

1. Connect this backend folder as a Render service.
2. Use [render.yaml](</Users/samarthvyas/Library/Mobile Documents/com~apple~CloudDocs/Codemastr/Finance/FO Back/render.yaml>) as the blueprint.
3. Set the non-generated env vars:
   - `APP_URL`
   - `CORS_ORIGINS`
   - `S3_ENDPOINT`
   - `S3_BUCKET`
   - `S3_ACCESS_KEY`
   - `S3_SECRET_KEY`
4. Ensure the PostgreSQL database and Redis instance are attached.
5. Run `npm run prisma:migrate:deploy` on deploy startup, which is already part of the Render start command.

### Frontend on Vercel

1. Deploy the frontend folder separately on Vercel.
2. Set `VITE_API_BASE_URL` to the Render backend URL with `/api/v1`.
3. Set the demo auth env vars from the seeded backend user.
4. Add the Vercel domain to backend `CORS_ORIGINS`.

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
