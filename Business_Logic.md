7. Business Logic Rules
Expense Rules
Amount must be greater than 0.
Currency must be valid.
Expense date cannot be far in the future unless explicitly allowed.
Deleted expenses should use soft delete.
Converted amount should be stored when expense is created.
Exchange rate used should be stored for historical accuracy.
Updating currency or amount should recalculate converted amount.
Users can only access expenses from their active organization.
Members can edit their own expenses unless admin permission allows otherwise.
Currency Rules
Organization has one default/base currency.
Expenses can be created in any supported currency.
Backend should convert expense amount to organization base currency.
Historical exchange rate should not be overwritten.
Currency rate provider should be replaceable.
Analytics Rules
Analytics should exclude soft-deleted records.
Analytics should respect user organization scope.
Analytics should use converted/base currency values.
Analytics should support date ranges.
Large aggregations should be optimized with indexes and caching.
8. Security Requirements

Implement:

Password hashing using bcrypt or Argon2
JWT access tokens
Refresh tokens
HTTP-only cookies if web session auth is used
Role-based access control
Organization-level data isolation
Input validation
Rate limiting
File upload validation
Audit logging
CORS configuration
SQL injection protection through ORM
Request size limits
Secure error handling
Environment-based secrets
Admin route protection

Important rule:

Never trust organization_id, user_id, role, amount, or permissions from the frontend without backend validation.
## Business Logic

### Authentication

- Registration creates the first workspace and assigns the first user as `OWNER`.
- Login records audit events for success and failure.
- Refresh tokens are stored hashed on the user record.
- Password reset tokens are generated, time-bound, and single-use.

### Organizations and roles

- Roles: `OWNER`, `ADMIN`, `MEMBER`, `VIEWER`, plus platform `SUPER_ADMIN`.
- Owners and admins can manage workspace settings and membership.
- Members can create expenses and modify their own records.
- Viewers are restricted to read-oriented endpoints.

### Expenses

- Every expense belongs to one organization and one creator.
- Important finance records use soft deletes instead of hard deletes.
- The exchange rate used at creation/update time is stored with the expense.
- Converted amount is persisted so analytics stay historically accurate.
- Tags are reusable per organization.

### Analytics and reports

- Dashboard KPIs come from aggregation APIs, not frontend math.
- Breakdown endpoints support category, payment-method, vendor, and currency views.
- Reports are created as persisted jobs and completed asynchronously.

### Attachments

- Only metadata is stored in PostgreSQL.
- Files are uploaded directly to S3-compatible storage through presigned URLs.
- Supported uploads are restricted by MIME type and max file size.

### Audit and admin

- Sensitive operations write audit events with actor, entity, and metadata.
- Super-admin routes are isolated under `/api/v1/admin`.
- Background jobs are tracked and exposed for operations visibility and retry.
