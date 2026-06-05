3. Backend Architecture

Use a modular backend architecture.

Recommended stack:

Backend: Node.js + NestJS or Express/Fastify
Database: PostgreSQL
ORM: Prisma
Cache: Redis
Queue: BullMQ or similar
Storage: S3-compatible object storage
Auth: JWT + refresh tokens / OAuth-ready
Validation: Zod or class-validator
API Style: REST first, GraphQL optional later
Deployment: Docker-ready

Recommended backend structure:

src/
  modules/
    auth/
      auth.controller.ts
      auth.service.ts
      auth.module.ts
      dto/
      guards/
      strategies/

    users/
      users.controller.ts
      users.service.ts
      users.module.ts

    organizations/
      organizations.controller.ts
      organizations.service.ts
      organizations.module.ts

    expenses/
      expenses.controller.ts
      expenses.service.ts
      expenses.repository.ts
      dto/

    categories/
      categories.controller.ts
      categories.service.ts

    analytics/
      analytics.controller.ts
      analytics.service.ts
      analytics.repository.ts

    currency/
      currency.controller.ts
      currency.service.ts
      currency-rate.provider.ts

    reports/
      reports.controller.ts
      reports.service.ts
      exporters/

    attachments/
      attachments.controller.ts
      attachments.service.ts
      storage.service.ts

    admin/
      admin.controller.ts
      admin.service.ts

    audit-logs/
      audit-log.service.ts
      audit-log.interceptor.ts

    notifications/
      notifications.service.ts

  common/
    guards/
    decorators/
    filters/
    interceptors/
    middleware/
    utils/

  config/
    database.config.ts
    redis.config.ts
    auth.config.ts
    storage.config.ts

  prisma/
    schema.prisma
    migrations/
## Backend Architecture

### Stack

- Framework: NestJS with Fastify adapter
- Runtime: Node.js + TypeScript
- Database: PostgreSQL + Prisma ORM
- Queue/cache: Redis + BullMQ
- File storage: S3-compatible signed URL flow
- Auth: JWT access and refresh tokens
- Validation: class-validator DTOs, Zod env validation

### Module boundaries

- `auth`: registration, login, logout, refresh, password reset, current user
- `users`: profile and password management
- `organizations`: workspace CRUD, members, invitations, role changes
- `expenses`: expense lifecycle, historical exchange-rate capture, tagging
- `categories`: org-specific category management
- `currency`: supported currencies and historical rates
- `analytics`: aggregation endpoints for dashboard charts and KPIs
- `reports`: async export requests with persisted report metadata
- `attachments`: private asset metadata and presigned upload/download URLs
- `audit-logs`: durable sensitive action trail
- `admin`: platform-wide internal operations
- `jobs`: background processors and scheduled cleanup
- `health`: liveness/readiness endpoints

### Multi-tenant isolation

- Organization membership is validated in `OrganizationScopeGuard`.
- Scoped endpoints require `x-organization-id` or explicit organization route params.
- Repositories always query with `organizationId` filters for tenant-owned data.
- Platform super admins bypass org scoping only on admin routes.

### Security model

- JWT guard protects all non-public endpoints.
- `Roles` metadata + `RolesGuard` enforce membership and platform roles.
- Soft deletes are applied to organizations, users, categories, expenses, attachments, and reports.
- Sensitive actions emit audit log events.
- File access uses signed URLs; the database stores metadata only.

### Extensibility

- Attachments are entity-based and can support invoices, quotes, and reports.
- Reports are queued, so future heavy exports stay off the request path.
- Currency rates are stored historically and linked into expense conversion data.
- The module/repository/service layout is ready for future invoices, billing, payments, and quotes.
