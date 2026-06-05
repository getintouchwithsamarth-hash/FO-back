1. Product Scope
   Core Modules
1. Finance Overview

The overview page should show high-level financial health.

Required data:

Total expenses
Monthly expenses
Expense trend compared to previous period
Top spending categories
Recent expenses
Currency-adjusted summaries
Monthly chart data
Category distribution chart data

Functional behavior:

User can switch currency.
User can change currency conversion rate. Now we only have USD, EUR AND INR
Dashboard values should update based on selected currency.
Dashboard should support date filters such as current month, last month, quarter, year, and custom range.
All financial values must be calculated from backend data, not hardcoded frontend mock data. 2. Expenses

The expenses module should allow users to manage all business or personal expenses.

Required features:

Add expense
Edit expense
Delete expense
View expense list
Search expenses
Filter by category
Filter by date range
Filter by payment method
Filter by currency
Upload receipt attachment
Add notes
Assign category
Mark as recurring or one-time
Export expenses as CSV/PDF

Expense fields:

Title
Description
Amount
Currency
Converted amount
Exchange rate used
Category
Payment method
Vendor or merchant
Expense date
Receipt attachment
Tags
Created by
Created at
Updated at 3. Analytics

Analytics should provide visual reports based on expense data.

Required reports:

Monthly expense trend
Category-wise expense breakdown
Payment method breakdown
Currency-wise spending
Top merchants/vendors
Recurring vs one-time expenses
Expense comparison by date range
Year-over-year or month-over-month comparison

Functional behavior:

Analytics should support filters.
Charts should be generated from backend aggregation APIs.
Frontend should not manually calculate large analytics datasets.
Backend should expose clean reporting endpoints. 4. Settings

Settings should allow users and organizations to configure preferences.

Required sections:

Profile settings
Organization/workspace settings
Default currency
Supported currencies
Expense categories
Payment methods
Notification preferences
Team member management
Role permissions
Billing/subscription placeholder
API key management placeholder 5. Admin Operations

Admin users should be able to manage platform-level operations.

Required admin capabilities:

View all users
View all organizations/workspaces
View system metrics
View audit logs
Manage blocked/suspended accounts
Manage default expense categories
View API usage
View failed jobs
View payment/subscription status if billing is added
Trigger data export
Manage feature flags 2. User Roles and Permissions

Use role-based access control.

Roles
Owner

Can:

Manage workspace
Invite/remove users
Manage billing
Manage expenses
Manage settings
Export data
View audit logs
Admin

Can:

Manage expenses
Manage categories
Invite users
View analytics
Export reports
Member

Can:

Add expenses
Edit own expenses
View shared dashboard
Upload receipts
Viewer

Can:

View dashboard
View analytics
Export only if allowed
Cannot create, edit, or delete records
Platform Super Admin

Internal platform role.

Can:

View all organizations
Manage accounts
Inspect system health
Review audit logs
Suspend workspaces
Manage global configs
