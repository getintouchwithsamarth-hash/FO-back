4. Database Schema

Use PostgreSQL with Prisma.

Main Tables
users

Stores user accounts.

Fields:

id
email
password_hash
full_name
avatar_url
status
last_login_at
created_at
updated_at
deleted_at

Status values:

active
invited
suspended
deleted
organizations

Stores workspaces or companies.

Fields:

id
name
slug
logo_url
default_currency
subscription_status
created_at
updated_at
deleted_at
organization_members

Connects users to organizations with roles.

Fields:

id
organization_id
user_id
role
status
invited_by
joined_at
created_at
updated_at

Roles:

owner
admin
member
viewer
expenses

Stores expenses.

Fields:

id
organization_id
created_by_user_id
category_id
title
description
vendor_name
amount
currency
converted_amount
base_currency
exchange_rate
expense_date
payment_method
is_recurring
recurring_frequency
receipt_url
status
created_at
updated_at
deleted_at

Status values:

draft
submitted
approved
rejected
archived
expense_categories

Stores categories.

Fields:

id
organization_id
name
icon
color
type
is_default
created_at
updated_at
deleted_at

Examples:

Software
Travel
Meals
Office Supplies
Marketing
Payroll
Rent
Utilities
Taxes
Other
expense_tags

Stores reusable tags.

id
organization_id
name
created_at
updated_at
expense_tag_links

Many-to-many relationship between expenses and tags.

expense_id
tag_id
attachments

Stores uploaded file metadata.

id
organization_id
uploaded_by_user_id
entity_type
entity_id
file_name
file_type
file_size
storage_url
created_at

Entity types:

expense
invoice
quote
report
currency_rates

Stores exchange rates.

id
base_currency
target_currency
rate
provider
rate_date
created_at
reports

Stores generated reports.

id
organization_id
created_by_user_id
report_type
filters_json
file_url
status
created_at
completed_at

Status values:

pending
processing
completed
failed
audit_logs

Tracks important user/system actions.

id
organization_id
user_id
action
entity_type
entity_id
metadata_json
ip_address
user_agent
created_at

Examples:

expense.created
expense.updated
expense.deleted
user.invited
settings.updated
report.exported
login.success
login.failed
admin_events

Platform-level internal events.

id
admin_user_id
action
target_type
target_id
metadata_json
created_at
