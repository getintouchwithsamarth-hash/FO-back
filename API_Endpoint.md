6. API Endpoints
Auth APIs
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/logout
POST   /api/v1/auth/refresh-token
POST   /api/v1/auth/forgot-password
POST   /api/v1/auth/reset-password
GET    /api/v1/auth/me
User APIs
GET    /api/v1/users/me
PATCH  /api/v1/users/me
PATCH  /api/v1/users/me/password
Organization APIs
GET    /api/v1/organizations
POST   /api/v1/organizations
GET    /api/v1/organizations/:id
PATCH  /api/v1/organizations/:id
DELETE /api/v1/organizations/:id
Team Member APIs
GET    /api/v1/organizations/:id/members
POST   /api/v1/organizations/:id/members/invite
PATCH  /api/v1/organizations/:id/members/:memberId/role
DELETE /api/v1/organizations/:id/members/:memberId
Expense APIs
GET    /api/v1/expenses
POST   /api/v1/expenses
GET    /api/v1/expenses/:id
PATCH  /api/v1/expenses/:id
DELETE /api/v1/expenses/:id
POST   /api/v1/expenses/:id/attachments
DELETE /api/v1/expenses/:id/attachments/:attachmentId

Expense list query params:

page
limit
search
category_id
currency
payment_method
date_from
date_to
status
sort_by
sort_order

Example response:

{
  "data": [
    {
      "id": "exp_123",
      "title": "Adobe Subscription",
      "amount": 49.99,
      "currency": "USD",
      "convertedAmount": 4170.25,
      "baseCurrency": "INR",
      "category": {
        "id": "cat_123",
        "name": "Software"
      },
      "expenseDate": "2026-06-01",
      "paymentMethod": "card",
      "vendorName": "Adobe",
      "status": "approved"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 120,
    "totalPages": 6
  }
}
Category APIs
GET    /api/v1/expense-categories
POST   /api/v1/expense-categories
PATCH  /api/v1/expense-categories/:id
DELETE /api/v1/expense-categories/:id
Currency APIs
GET    /api/v1/currencies
GET    /api/v1/currency-rates
POST   /api/v1/currency/convert

Example:

{
  "from": "USD",
  "to": "INR",
  "amount": 100
}

Response:

{
  "from": "USD",
  "to": "INR",
  "amount": 100,
  "rate": 83.42,
  "convertedAmount": 8342
}
Analytics APIs
GET /api/v1/analytics/overview
GET /api/v1/analytics/monthly-expenses
GET /api/v1/analytics/category-breakdown
GET /api/v1/analytics/payment-method-breakdown
GET /api/v1/analytics/vendor-breakdown
GET /api/v1/analytics/currency-breakdown
GET /api/v1/analytics/recurring-expenses

Common query params:

date_from
date_to
currency
category_id
group_by

Example overview response:

{
  "totalExpenses": 128000,
  "currency": "INR",
  "monthlyChangePercent": 12.4,
  "topCategory": "Software",
  "expenseCount": 82,
  "averageExpense": 1560.98
}
Reports APIs
POST /api/v1/reports/export
GET  /api/v1/reports
GET  /api/v1/reports/:id

Supported export types:

expenses_csv
expenses_pdf
analytics_pdf
tax_summary_csv
Attachment APIs
POST   /api/v1/attachments/upload
GET    /api/v1/attachments/:id
DELETE /api/v1/attachments/:id

Rules:

Validate file type.
Enforce max file size.
Store files in S3-compatible storage.
Store only metadata in database.
Use signed URLs for private files.
Admin APIs
GET    /api/v1/admin/users
GET    /api/v1/admin/users/:id
PATCH  /api/v1/admin/users/:id/status

GET    /api/v1/admin/organizations
GET    /api/v1/admin/organizations/:id
PATCH  /api/v1/admin/organizations/:id/status

GET    /api/v1/admin/audit-logs
GET    /api/v1/admin/system-health
GET    /api/v1/admin/jobs
POST   /api/v1/admin/jobs/:id/retry

GET    /api/v1/admin/feature-flags
PATCH  /api/v1/admin/feature-flags/:key