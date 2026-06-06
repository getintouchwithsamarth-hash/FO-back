Below is the **end-to-end role flow design** for the finance SaaS project.

I am assuming:

| Role       | Meaning                                                                                                                 |
| ---------- | ----------------------------------------------------------------------------------------------------------------------- |
| **User**   | Company Owner / primary customer account holder                                                                         |
| **Admin**  | Workspace Admin who manages company operations, users, settings, and workflows                                          |
| **Member** | Regular team member / employee who can submit expenses, create records, or perform limited actions based on permissions |

---

# 1. High-Level Role Access

| Module / Action              | User / Owner |              Admin |                    Member |
| ---------------------------- | -----------: | -----------------: | ------------------------: |
| Sign up                      |          Yes |    Usually invited |           Usually invited |
| Create workspace             |          Yes | No, unless allowed |                        No |
| Manage company profile       |          Yes |                Yes |                        No |
| Manage subscription/billing  |          Yes | Limited / optional |                        No |
| Invite users                 |          Yes |                Yes |                        No |
| Manage roles                 |          Yes |                Yes |                        No |
| Create expenses              |          Yes |                Yes |                       Yes |
| Submit expenses for approval |          Yes |                Yes |                       Yes |
| Approve expenses             |          Yes |                Yes | Only if assigned approver |
| Create quotes                |          Yes |                Yes |       Optional permission |
| Send quotes                  |          Yes |                Yes |       Optional permission |
| Convert quote to invoice     |          Yes |                Yes |       Optional permission |
| Create invoices              |          Yes |                Yes |       Optional permission |
| Send invoices                |          Yes |                Yes |       Optional permission |
| View analytics               |          Yes |                Yes |   Limited / own data only |
| Export reports               |          Yes |                Yes |       Optional permission |
| Manage tax/currency/settings |          Yes |                Yes |                        No |
| Manage integrations          |          Yes |                Yes |                        No |
| View audit logs              |          Yes |      Yes / limited |                        No |
| Delete workspace             |          Yes |                 No |                        No |

---

# 2. Common Flow for All Roles

This applies to **User, Admin, and Member**.

## Flow: Login / Access App

```txt
Open app
→ Login using email/password, Google, or SSO
→ System verifies user
→ System checks workspace access
→ System checks role and permissions
→ User lands on allowed dashboard
```

## Possible Actions

After login, every role can usually:

| Action               | Description                                     |
| -------------------- | ----------------------------------------------- |
| View own profile     | Name, email, avatar, password, MFA              |
| Update profile       | Change personal details                         |
| Manage notifications | Email, in-app, approval alerts, payment alerts  |
| Switch workspace     | If user belongs to multiple companies           |
| Search records       | Depending on access                             |
| View notifications   | Expense updates, approvals, invoices, reminders |
| Logout               | End session                                     |
| Request support      | Contact support or raise ticket                 |

---

# 3. User / Owner End-to-End Flows

The **User / Owner** is the primary company account holder. This role has the highest company-level permissions.

---

## 3.1 Owner Signup and Workspace Creation Flow

```txt
Visit landing page
→ Click Sign Up
→ Enter name, email, password
→ Verify email
→ Create company workspace
→ Enter company name
→ Select country
→ Select base currency
→ Select timezone
→ Select fiscal year
→ Select tax configuration
→ Choose plan or start trial
→ App creates workspace
→ App creates default roles
→ App creates default categories
→ App creates default invoice/quote templates
→ Owner lands on Finance Overview
```

## Owner Can Do

| Area            | Capabilities                                           |
| --------------- | ------------------------------------------------------ |
| Workspace       | Create, edit, archive, or delete company workspace     |
| Company profile | Add logo, legal name, address, tax ID, contact details |
| Currency        | Set base currency and enable multi-currency            |
| Tax             | Configure tax rates, GST/VAT/sales tax rules           |
| Billing         | Choose plan, upgrade, downgrade, cancel                |
| Users           | Invite, remove, suspend users                          |
| Roles           | Create custom roles and permissions                    |
| Security        | Enable MFA, SSO, session controls                      |
| Data            | Export company data, request deletion                  |
| Audit           | View all sensitive activity                            |

---

## 3.2 Owner Dashboard Flow

```txt
Owner logs in
→ Opens Finance Overview
→ System loads company financial summary
→ Owner views revenue, expenses, profit, invoices, payments, pending approvals
→ Owner filters by date, currency, client, category, department
→ Owner clicks any metric
→ System opens detailed records behind that metric
```

## Dashboard Data Owner Can See

| Dashboard Card         | Description                                   |
| ---------------------- | --------------------------------------------- |
| Total Revenue          | Paid and unpaid invoice revenue               |
| Total Expenses         | Approved and pending expenses                 |
| Net Profit             | Revenue minus expenses                        |
| Outstanding Invoices   | Sent but unpaid invoices                      |
| Overdue Invoices       | Invoices past due date                        |
| Pending Approvals      | Expenses, quotes, or invoices awaiting action |
| Cash Flow              | Month-wise inflow and outflow                 |
| Top Clients            | Clients by revenue                            |
| Top Expense Categories | Category-wise spending                        |
| Currency Summary       | Base and foreign currency values              |

---

## 3.3 Owner Expense Flow

```txt
Open Expenses
→ Click Add Expense
→ Enter merchant, amount, date, category, currency
→ Upload receipt
→ Add notes, department, project, tags
→ Save as draft or submit
→ System checks approval rules
→ If approval required, route to approver
→ If no approval required, mark approved
→ Expense appears in reports
```

## Owner Can Do in Expenses

| Action                 | Description                                |
| ---------------------- | ------------------------------------------ |
| Create expense         | Add manual expense                         |
| Upload receipt         | Attach image/PDF                           |
| Edit expense           | Modify draft or allowed records            |
| Delete expense         | Remove draft or unreconciled expense       |
| Submit expense         | Send for approval                          |
| Approve expense        | Approve own or others’ expenses if allowed |
| Reject expense         | Reject with reason                         |
| Request changes        | Send back to submitter                     |
| Reimburse expense      | Mark as reimbursed                         |
| Categorize expense     | Assign category, tag, department           |
| Bulk import            | Upload CSV/XLSX expenses                   |
| Export expenses        | CSV, Excel, PDF                            |
| View expense analytics | Category, monthly, department spend        |

---

## 3.4 Owner Quote Flow

```txt
Open Quotes
→ Click Create Quote
→ Select or create client
→ Add line items
→ Add tax, discount, terms, expiry date
→ Preview quote
→ Save as draft
→ Submit for approval if required
→ Send quote to client
→ Client views quote
→ Client accepts, rejects, or requests changes
→ Owner receives notification
```

## Owner Can Do in Quotes

| Action             | Description                                      |
| ------------------ | ------------------------------------------------ |
| Create quote       | Create estimate/proposal                         |
| Edit quote         | Modify draft or requested-change quote           |
| Send quote         | Email or portal link                             |
| Duplicate quote    | Reuse existing quote                             |
| Approve quote      | If approval workflow exists                      |
| Reject quote       | Reject internally                                |
| Convert to invoice | Generate invoice from accepted quote             |
| Expire quote       | Manually expire quote                            |
| Download PDF       | Export quote                                     |
| Track status       | Draft, sent, viewed, accepted, rejected, expired |

---

## 3.5 Owner Invoice Flow

```txt
Open Invoices
→ Click Create Invoice
→ Select client
→ Add line items
→ Add tax, discount, due date, payment terms
→ Preview invoice
→ Save as draft or send
→ System generates invoice number
→ Client receives invoice
→ Client pays online or offline
→ Payment webhook updates invoice status
→ Receipt is generated
→ Revenue dashboard updates
```

## Owner Can Do in Invoices

| Action                   | Description                        |
| ------------------------ | ---------------------------------- |
| Create invoice           | Manual or from quote               |
| Edit invoice             | Draft or allowed invoices          |
| Send invoice             | Email or portal link               |
| Resend invoice           | Send reminder                      |
| Mark as paid             | For offline payments               |
| Record partial payment   | Track part payments                |
| Cancel invoice           | Void invoice                       |
| Refund invoice           | Mark refund or issue credit        |
| Write off invoice        | Mark as uncollectible              |
| Download PDF             | Export invoice                     |
| Duplicate invoice        | Reuse invoice                      |
| Create recurring invoice | Auto-generate on schedule          |
| Track status             | Draft, sent, viewed, paid, overdue |

---

## 3.6 Owner Client Management Flow

```txt
Open Clients
→ Add new client
→ Enter client name, email, phone, billing address, tax ID
→ Save client
→ Use client in quotes and invoices
→ Track client revenue, outstanding invoices, payment history
```

## Owner Can Do with Clients

| Action              | Description                |
| ------------------- | -------------------------- |
| Add client          | Create customer profile    |
| Edit client         | Update details             |
| Archive client      | Hide inactive client       |
| View client ledger  | Quotes, invoices, payments |
| View unpaid balance | Outstanding receivables    |
| Send statement      | Client account summary     |
| Add contacts        | Multiple billing contacts  |
| Add tax details     | GST/VAT/tax registration   |

---

## 3.7 Owner Reports and Analytics Flow

```txt
Open Analytics
→ Select report type
→ Select date range
→ Apply filters
→ System generates charts and tables
→ Owner reviews insights
→ Export or schedule report
```

## Owner Can Generate

| Report                | Description                   |
| --------------------- | ----------------------------- |
| Expense report        | Detailed expense records      |
| Revenue report        | Invoice and payment revenue   |
| Profit/loss summary   | Income minus expenses         |
| Tax report            | Tax collected and tax paid    |
| Invoice aging report  | Unpaid invoices by age        |
| Client revenue report | Revenue by client             |
| Category spend report | Expenses by category          |
| Department report     | Team/department spend         |
| Reimbursement report  | Employee reimbursements       |
| Currency report       | Multi-currency exposure       |
| Audit report          | Sensitive actions and changes |

---

## 3.8 Owner Billing and Subscription Flow

```txt
Open Billing
→ View current plan
→ Add or update payment method
→ Upgrade/downgrade plan
→ View invoices from SaaS provider
→ Download subscription invoices
→ Cancel subscription if needed
```

## Owner Can Do in Billing

| Action                | Description                         |
| --------------------- | ----------------------------------- |
| View plan             | Current subscription                |
| Upgrade plan          | Move to higher tier                 |
| Downgrade plan        | Move to lower tier                  |
| Cancel plan           | Stop subscription                   |
| Update card           | Change payment method               |
| View invoices         | SaaS billing invoices               |
| Download receipts     | Payment receipts                    |
| Handle failed payment | Retry payment                       |
| View usage            | Users, storage, invoices, API usage |

---

## 3.9 Owner Settings Flow

```txt
Open Settings
→ Configure company profile
→ Configure finance rules
→ Configure invoice/quote templates
→ Configure tax and currency
→ Configure approvals
→ Configure integrations
→ Save settings
→ System applies rules across workspace
```

## Owner Can Configure

| Setting            | Description                      |
| ------------------ | -------------------------------- |
| Company profile    | Name, logo, address, tax ID      |
| Base currency      | Main reporting currency          |
| Exchange rates     | Auto/manual rates                |
| Tax rates          | GST, VAT, sales tax              |
| Expense categories | Travel, meals, software, rent    |
| Departments        | Sales, marketing, engineering    |
| Projects           | Project-level tracking           |
| Approval rules     | Amount-based or department-based |
| Invoice numbering  | Prefix, sequence, reset rules    |
| Quote numbering    | Prefix and sequence              |
| Templates          | PDF/email templates              |
| Payment methods    | Stripe, Razorpay, bank transfer  |
| Notifications      | Email and in-app alerts          |
| Data retention     | Archive/delete policies          |
| Security           | MFA, session timeout, SSO        |

---

## 3.10 Owner Team Management Flow

```txt
Open Users & Roles
→ Invite user by email
→ Select role
→ Assign department/project
→ Set permissions
→ Send invite
→ User accepts invite
→ Owner monitors activity
```

## Owner Can Do with Users

| Action             | Description                            |
| ------------------ | -------------------------------------- |
| Invite user        | Add employee/admin/accountant          |
| Remove user        | Revoke workspace access                |
| Suspend user       | Temporarily disable access             |
| Change role        | Member, Admin, Finance Manager, Viewer |
| Create custom role | Permission-based role                  |
| Assign department  | Department-level access                |
| Assign approver    | Approval routing                       |
| Reset access       | Force logout or reset MFA              |
| View activity      | Audit log and last active              |

---

## 3.11 Owner Data and Account Closure Flow

```txt
Open Settings
→ Go to Data & Privacy
→ Export company data
→ Review deletion impact
→ Confirm workspace deletion
→ System schedules deletion or immediate archive
→ Access is revoked according to policy
```

## Owner Can Do

| Action              | Description                           |
| ------------------- | ------------------------------------- |
| Export all data     | Full workspace export                 |
| Export finance data | Expenses, invoices, clients, payments |
| Download files      | Receipts, invoice PDFs, quote PDFs    |
| Archive workspace   | Disable active use but preserve data  |
| Delete workspace    | Permanent deletion after confirmation |
| Transfer ownership  | Move owner role to another user       |

---

# 4. Admin End-to-End Flows

The **Admin** manages the workspace but may not own subscription billing or legal ownership unless granted.

---

## 4.1 Admin Invitation and Access Flow

```txt
Owner invites admin
→ Admin receives email invite
→ Admin accepts invite
→ Admin creates password or signs in
→ System assigns Admin role
→ Admin lands on admin-enabled dashboard
```

## Admin Can Usually Access

| Area       | Access                               |
| ---------- | ------------------------------------ |
| Dashboard  | Full or operational dashboard        |
| Expenses   | Full management                      |
| Quotes     | Full management                      |
| Invoices   | Full management                      |
| Users      | Invite/manage users                  |
| Settings   | Most company settings                |
| Reports    | View/export reports                  |
| Billing    | Limited or view-only                 |
| Audit logs | Limited or full, based on permission |

---

## 4.2 Admin User Management Flow

```txt
Open Users & Roles
→ View all users
→ Invite new user
→ Assign role
→ Assign department
→ Assign permissions
→ Save user
→ System sends invite
→ Admin monitors status
```

## Admin Can Do

| Action                 | Description                        |
| ---------------------- | ---------------------------------- |
| Invite members         | Add employees                      |
| Invite accountants     | Add finance users                  |
| Invite approvers       | Add managers                       |
| Edit user details      | Name, department, role             |
| Suspend users          | Disable access                     |
| Remove users           | Revoke access                      |
| Resend invite          | Send invitation again              |
| Change permissions     | Update module access               |
| Assign approval limits | Example: can approve up to ₹50,000 |
| View user status       | Invited, active, suspended         |

---

## 4.3 Admin Role and Permission Flow

```txt
Open Roles & Permissions
→ Select existing role or create custom role
→ Choose module access
→ Choose actions allowed
→ Save role
→ System applies permissions to assigned users
```

## Admin Can Configure Permissions For

| Module     | Possible Permissions                                |
| ---------- | --------------------------------------------------- |
| Expenses   | View, create, edit, approve, reject, delete, export |
| Quotes     | View, create, edit, send, approve, convert, delete  |
| Invoices   | View, create, edit, send, mark paid, cancel, export |
| Clients    | View, create, edit, archive, delete                 |
| Reports    | View, export, schedule                              |
| Settings   | View, edit                                          |
| Users      | Invite, edit, suspend, delete                       |
| Audit logs | View, export                                        |
| Billing    | View, manage, restricted                            |

---

## 4.4 Admin Finance Configuration Flow

```txt
Open Finance Settings
→ Configure expense categories
→ Configure tax rates
→ Configure currencies
→ Configure approval rules
→ Configure templates
→ Save settings
```

## Admin Can Configure

| Area               | Actions                                    |
| ------------------ | ------------------------------------------ |
| Expense categories | Add, edit, disable categories              |
| Tax rates          | Add GST/VAT/sales tax                      |
| Currencies         | Enable foreign currencies                  |
| Exchange rates     | Auto or manual rates                       |
| Invoice templates  | Branding, footer, terms                    |
| Quote templates    | Branding, terms, expiry                    |
| Numbering rules    | Invoice/quote sequence                     |
| Payment terms      | Due on receipt, Net 7, Net 15, Net 30      |
| Reminder rules     | Before due, after due, recurring reminders |
| Approval workflows | Amount, category, department, role-based   |

---

## 4.5 Admin Approval Workflow Flow

```txt
Open Approval Settings
→ Create approval rule
→ Select trigger condition
→ Select approver
→ Set approval limit
→ Save rule
→ System applies rule to future records
```

## Possible Approval Rules

| Rule Type            | Example                                      |
| -------------------- | -------------------------------------------- |
| Amount-based         | Expenses above ₹10,000 need approval         |
| Department-based     | Marketing expenses go to Marketing Head      |
| Category-based       | Travel expenses go to Travel Manager         |
| Project-based        | Project Alpha expenses go to Project Manager |
| Multi-level approval | Manager → Finance Manager → Owner            |
| Auto-approval        | Expenses below threshold are auto-approved   |

---

## 4.6 Admin Expense Management Flow

```txt
Open Expenses
→ View all expenses or department expenses
→ Filter by status
→ Review pending expenses
→ Approve, reject, or request changes
→ Mark approved expenses as reimbursed
→ Export expense records
```

## Admin Can Do in Expenses

| Action                | Description                        |
| --------------------- | ---------------------------------- |
| View all expenses     | If permitted                       |
| Edit expense category | Correct categorization             |
| Approve expense       | Approve pending requests           |
| Reject expense        | Add rejection reason               |
| Request changes       | Send back to submitter             |
| Mark reimbursed       | Confirm employee reimbursement     |
| Bulk update           | Categorize or approve in bulk      |
| Export                | CSV, PDF, Excel                    |
| Lock records          | Prevent edits after reconciliation |

---

## 4.7 Admin Quote and Invoice Operations Flow

```txt
Open Quotes or Invoices
→ Review drafts and pending records
→ Approve if needed
→ Send to client
→ Track status
→ Follow up on unpaid invoices
→ Export or reconcile
```

## Admin Can Do

| Area            | Actions                                 |
| --------------- | --------------------------------------- |
| Quotes          | Create, approve, send, revise, expire   |
| Invoices        | Create, send, remind, cancel, mark paid |
| Payments        | View, reconcile, record offline payment |
| Clients         | Create and maintain client records      |
| Reminders       | Send manual reminders                   |
| PDFs            | Download or regenerate documents        |
| Status tracking | Viewed, accepted, paid, overdue         |

---

## 4.8 Admin Reports Flow

```txt
Open Reports
→ Select report
→ Apply filters
→ Generate report
→ Export or schedule report
```

## Admin Can Generate

| Report         | Description                     |
| -------------- | ------------------------------- |
| Expenses       | All or department-wise expenses |
| Revenue        | Invoice revenue                 |
| Payments       | Paid, failed, partial payments  |
| Tax            | Tax summaries                   |
| Aging          | Outstanding invoice aging       |
| Reimbursements | Employee reimbursement status   |
| User activity  | Operational activity            |
| Audit          | Permission-based audit report   |

---

## 4.9 Admin Integration Flow

```txt
Open Integrations
→ Choose integration
→ Connect account
→ Authorize app
→ Map fields
→ Test connection
→ Enable sync
```

## Admin Can Manage

| Integration         | Purpose                  |
| ------------------- | ------------------------ |
| Payment gateway     | Collect invoice payments |
| Bank feed           | Import transactions      |
| Accounting software | Export records           |
| Email provider      | Send documents           |
| Cloud storage       | Store receipts/PDFs      |
| Slack/Teams         | Send alerts              |
| Currency API        | Exchange rates           |

---

## 4.10 Admin Audit and Security Flow

```txt
Open Audit Logs
→ Filter by user, module, action, date
→ Review sensitive activity
→ Export if allowed
→ Investigate suspicious changes
```

## Admin Can Review

| Event                 | Example                       |
| --------------------- | ----------------------------- |
| User invited          | Who invited whom              |
| Role changed          | Permission changes            |
| Expense approved      | Approval trail                |
| Invoice sent          | Sender and timestamp          |
| Payment marked paid   | Manual payment action         |
| Settings changed      | Tax/currency/template edits   |
| Integration connected | Who connected external system |
| Data exported         | Export activity               |

---

## 4.11 Admin Restrictions

Unless explicitly granted, Admin should **not** be able to:

| Restricted Action             | Reason                        |
| ----------------------------- | ----------------------------- |
| Delete workspace              | Owner-only destructive action |
| Transfer ownership            | Owner-only control            |
| Cancel subscription           | Owner-only billing control    |
| View platform-level tenants   | Platform admin only           |
| Access other workspaces       | Tenant isolation              |
| Permanently delete audit logs | Compliance protection         |

---

# 5. Member End-to-End Flows

The **Member** is a normal invited user. Their access is usually limited to their own records, assigned tasks, or department-level records.

---

## 5.1 Member Invitation and Onboarding Flow

```txt
Admin or Owner invites member
→ Member receives invite email
→ Member opens invite link
→ Member signs up or logs in
→ Member joins workspace
→ Member completes profile
→ Member lands on limited dashboard
```

## Member Can Usually See

| Area          | Access                              |
| ------------- | ----------------------------------- |
| Own dashboard | Own expenses, reimbursements, tasks |
| Expenses      | Create and view own expenses        |
| Approvals     | Only if assigned approver           |
| Quotes        | Only if permission granted          |
| Invoices      | Only if permission granted          |
| Reports       | Usually no, or own records only     |
| Settings      | Own profile only                    |
| Notifications | Own updates and assigned actions    |

---

## 5.2 Member Dashboard Flow

```txt
Member logs in
→ Opens dashboard
→ Views own pending expenses
→ Views approval status
→ Views reimbursements
→ Views assigned tasks
→ Takes required action
```

## Member Dashboard Can Show

| Widget                 | Description                          |
| ---------------------- | ------------------------------------ |
| My Expenses            | Draft, submitted, approved, rejected |
| Pending Reimbursements | Approved but unpaid expenses         |
| Assigned Approvals     | If member is an approver             |
| Recent Notifications   | Status updates                       |
| Quick Add Expense      | Shortcut to submit expense           |
| Assigned Quotes        | If sales permission exists           |
| Assigned Invoices      | If finance permission exists         |

---

## 5.3 Member Expense Submission Flow

```txt
Open My Expenses
→ Click Add Expense
→ Enter amount, merchant, date, category
→ Upload receipt
→ Add notes
→ Save draft or submit
→ System routes expense to approver
→ Member receives approval/rejection notification
```

## Member Can Do in Expenses

| Action                | Description                          |
| --------------------- | ------------------------------------ |
| Create expense        | Add own expense                      |
| Save draft            | Continue later                       |
| Upload receipt        | Attach proof                         |
| Submit expense        | Send for approval                    |
| Edit draft            | Modify before submission             |
| Edit rejected expense | Fix and resubmit                     |
| View status           | Draft, submitted, approved, rejected |
| Delete draft          | Remove unsent expense                |
| Add comments          | Respond to approver                  |
| Download own records  | If allowed                           |

---

## 5.4 Member Expense Rejection / Change Request Flow

```txt
Member submits expense
→ Approver requests changes or rejects
→ Member receives notification
→ Member opens expense
→ Reads comment
→ Updates amount/category/receipt/notes
→ Resubmits expense
→ Approval cycle restarts
```

## Possible Member Expense Statuses

| Status            | Meaning                 |
| ----------------- | ----------------------- |
| Draft             | Not submitted yet       |
| Submitted         | Sent for review         |
| Pending Approval  | Waiting for approver    |
| Changes Requested | Needs member correction |
| Approved          | Accepted                |
| Rejected          | Declined                |
| Reimbursed        | Paid back to member     |

---

## 5.5 Member as Approver Flow

A Member may also be assigned approval responsibility.

```txt
Member receives approval notification
→ Opens Approval Queue
→ Reviews submitted expense
→ Checks receipt and notes
→ Approves, rejects, or requests changes
→ System notifies submitter
→ Audit log records decision
```

## Member Approver Can Do

| Action                  | Description                       |
| ----------------------- | --------------------------------- |
| View assigned approvals | Only assigned records             |
| Approve                 | Accept request                    |
| Reject                  | Decline with reason               |
| Request changes         | Ask submitter to fix              |
| Add comments            | Explain decision                  |
| View receipt            | Check attachment                  |
| Escalate                | Send to higher approver if needed |

---

## 5.6 Member Quote Flow

This should be permission-based. Useful for sales employees.

```txt
Open Quotes
→ Click Create Quote
→ Select client
→ Add line items
→ Save draft
→ Submit for approval
→ Admin/Owner approves
→ Member sends quote if allowed
→ Client accepts or rejects
```

## Member Quote Permissions

| Permission          | Description                |
| ------------------- | -------------------------- |
| View own quotes     | See quotes created by self |
| Create quote        | Draft new quote            |
| Edit draft quote    | Modify unsent quote        |
| Submit for approval | Send internally            |
| Send quote          | Only if allowed            |
| Convert to invoice  | Usually restricted         |
| View all quotes     | Usually not allowed        |

---

## 5.7 Member Invoice Flow

This should also be permission-based. Useful for finance team members.

```txt
Open Invoices
→ Create invoice
→ Select client
→ Add line items
→ Save draft
→ Submit for approval
→ Admin/Owner reviews
→ Invoice is sent after approval
```

## Member Invoice Permissions

| Permission           | Description            |
| -------------------- | ---------------------- |
| View own invoices    | If created by member   |
| Create draft invoice | Add invoice draft      |
| Submit invoice       | Send for approval      |
| Edit draft invoice   | Modify before approval |
| Send invoice         | Optional permission    |
| Mark as paid         | Usually restricted     |
| Cancel invoice       | Usually restricted     |
| Export invoices      | Usually restricted     |

---

## 5.8 Member Client Flow

If the member has sales permissions:

```txt
Open Clients
→ Add client or contact
→ Enter client details
→ Save client
→ Use client in quote or invoice
```

## Member Client Permissions

| Permission             | Description                           |
| ---------------------- | ------------------------------------- |
| View assigned clients  | Clients linked to own quotes/invoices |
| Add client             | Optional                              |
| Edit client            | Optional                              |
| Archive client         | Usually restricted                    |
| View client financials | Usually restricted                    |

---

## 5.9 Member Notification Flow

```txt
System event occurs
→ Member receives notification
→ Member opens notification
→ System routes member to exact record
→ Member takes action if required
```

## Member Notifications

| Notification       | Example                             |
| ------------------ | ----------------------------------- |
| Expense approved   | “Your expense was approved”         |
| Expense rejected   | “Your expense was rejected”         |
| Changes requested  | “Please update receipt”             |
| Reimbursement done | “Your expense was reimbursed”       |
| Quote approved     | “Your quote is ready to send”       |
| Invoice approved   | “Your invoice is ready”             |
| Approval assigned  | “Expense waiting for your approval” |

---

## 5.10 Member Profile and Preferences Flow

```txt
Open Profile
→ Update name, avatar, phone
→ Change password
→ Configure notifications
→ Enable MFA
→ Save changes
```

## Member Can Manage

| Area          | Action                    |
| ------------- | ------------------------- |
| Profile       | Name, avatar, phone       |
| Password      | Change password           |
| MFA           | Enable/disable if allowed |
| Notifications | Email/in-app preferences  |
| Sessions      | Logout active devices     |
| Language      | Optional                  |
| Timezone      | Optional                  |

---

## 5.11 Member Restrictions

Members should usually **not** be able to:

| Restricted Action           | Reason              |
| --------------------------- | ------------------- |
| Invite users                | Admin/Owner control |
| Change roles                | Security            |
| Edit company settings       | Admin control       |
| Configure tax/currency      | Finance control     |
| Connect integrations        | Admin control       |
| View all company financials | Data privacy        |
| Export full reports         | Sensitive data      |
| Delete invoices/payments    | Financial integrity |
| Access audit logs           | Admin-only          |
| Manage billing              | Owner-only          |

---

# 6. Complete User Journey Map by Role

## User / Owner Full Journey

```txt
Sign up
→ Verify email
→ Create workspace
→ Configure company
→ Select plan
→ Land on dashboard
→ Invite admins/members
→ Configure finance settings
→ Add clients
→ Create expenses
→ Create quotes
→ Send quotes
→ Convert accepted quotes to invoices
→ Send invoices
→ Collect payments
→ Review analytics
→ Export reports
→ Manage billing
→ Review audit logs
→ Manage workspace lifecycle
```

---

## Admin Full Journey

```txt
Accept invite
→ Login
→ Access workspace dashboard
→ Manage users
→ Configure roles
→ Configure expense categories
→ Configure tax/currency/templates
→ Set approval workflows
→ Manage expenses
→ Approve/reject records
→ Manage quotes and invoices
→ Track payments
→ Generate reports
→ Manage integrations
→ Review audit logs
→ Support daily operations
```

---

## Member Full Journey

```txt
Accept invite
→ Login
→ Complete profile
→ View personal dashboard
→ Add expense
→ Upload receipt
→ Submit for approval
→ Track approval status
→ Respond to change requests
→ Receive reimbursement updates
→ Create quote/invoice if permitted
→ Approve assigned records if assigned
→ Manage own profile and notifications
```

---

# 7. Recommended RBAC Structure

Instead of hardcoding only three roles, build permissions like this:

```txt
Role
  → Permissions
      → Module
          → Action
```

Example:

```txt
Admin
  expenses.view_all = true
  expenses.create = true
  expenses.approve = true
  expenses.export = true

Member
  expenses.view_own = true
  expenses.create = true
  expenses.submit = true
  expenses.approve = false

Owner
  workspace.manage = true
  billing.manage = true
  users.manage = true
  audit.view = true
```

---

# 8. Suggested Permission Groups

## Workspace Permissions

| Permission                   | Owner | Admin | Member |
| ---------------------------- | ----: | ----: | -----: |
| workspace.view               |   Yes |   Yes |    Yes |
| workspace.edit               |   Yes |   Yes |     No |
| workspace.delete             |   Yes |    No |     No |
| workspace.transfer_ownership |   Yes |    No |     No |

## User Permissions

| Permission    | Owner |    Admin | Member |
| ------------- | ----: | -------: | -----: |
| users.view    |   Yes |      Yes |     No |
| users.invite  |   Yes |      Yes |     No |
| users.edit    |   Yes |      Yes |     No |
| users.suspend |   Yes |      Yes |     No |
| users.delete  |   Yes | Optional |     No |
| roles.manage  |   Yes |      Yes |     No |

## Expense Permissions

| Permission         | Owner | Admin |   Member |
| ------------------ | ----: | ----: | -------: |
| expenses.view_all  |   Yes |   Yes |       No |
| expenses.view_own  |   Yes |   Yes |      Yes |
| expenses.create    |   Yes |   Yes |      Yes |
| expenses.edit_own  |   Yes |   Yes |      Yes |
| expenses.edit_all  |   Yes |   Yes |       No |
| expenses.submit    |   Yes |   Yes |      Yes |
| expenses.approve   |   Yes |   Yes | Optional |
| expenses.reject    |   Yes |   Yes | Optional |
| expenses.reimburse |   Yes |   Yes |       No |
| expenses.export    |   Yes |   Yes | Optional |

## Quote Permissions

| Permission                | Owner | Admin |   Member |
| ------------------------- | ----: | ----: | -------: |
| quotes.view_all           |   Yes |   Yes | Optional |
| quotes.view_own           |   Yes |   Yes | Optional |
| quotes.create             |   Yes |   Yes | Optional |
| quotes.edit               |   Yes |   Yes | Optional |
| quotes.send               |   Yes |   Yes | Optional |
| quotes.approve            |   Yes |   Yes | Optional |
| quotes.convert_to_invoice |   Yes |   Yes | Optional |
| quotes.delete             |   Yes |   Yes |       No |

## Invoice Permissions

| Permission         | Owner |    Admin |   Member |
| ------------------ | ----: | -------: | -------: |
| invoices.view_all  |   Yes |      Yes | Optional |
| invoices.create    |   Yes |      Yes | Optional |
| invoices.edit      |   Yes |      Yes | Optional |
| invoices.send      |   Yes |      Yes | Optional |
| invoices.mark_paid |   Yes |      Yes |       No |
| invoices.cancel    |   Yes |      Yes |       No |
| invoices.refund    |   Yes | Optional |       No |
| invoices.export    |   Yes |      Yes | Optional |

## Reports Permissions

| Permission       | Owner | Admin |   Member |
| ---------------- | ----: | ----: | -------: |
| reports.view_all |   Yes |   Yes |       No |
| reports.view_own |   Yes |   Yes | Optional |
| reports.export   |   Yes |   Yes | Optional |
| reports.schedule |   Yes |   Yes |       No |

## Settings Permissions

| Permission            | Owner | Admin | Member |
| --------------------- | ----: | ----: | -----: |
| settings.company      |   Yes |   Yes |     No |
| settings.tax          |   Yes |   Yes |     No |
| settings.currency     |   Yes |   Yes |     No |
| settings.templates    |   Yes |   Yes |     No |
| settings.approvals    |   Yes |   Yes |     No |
| settings.integrations |   Yes |   Yes |     No |

## Billing Permissions

| Permission                    | Owner |         Admin | Member |
| ----------------------------- | ----: | ------------: | -----: |
| billing.view                  |   Yes |      Optional |     No |
| billing.manage_plan           |   Yes | No / Optional |     No |
| billing.update_payment_method |   Yes | No / Optional |     No |
| billing.cancel_subscription   |   Yes |            No |     No |

## Audit Permissions

| Permission   | Owner |    Admin | Member |
| ------------ | ----: | -------: | -----: |
| audit.view   |   Yes | Optional |     No |
| audit.export |   Yes | Optional |     No |

---

# 9. Best Final Role Definition for Product

Use these three main product roles:

## 1. Owner

Full authority over the company workspace.

```txt
Owns company
Manages billing
Manages users
Manages settings
Controls data
Has all finance permissions
```

## 2. Admin

Operational manager.

```txt
Manages users
Manages finance configuration
Manages approvals
Manages invoices/quotes/expenses
Can export reports
Cannot delete workspace by default
Cannot transfer ownership
```

## 3. Member

Limited contributor.

```txt
Creates own expenses
Tracks own submissions
Uploads receipts
Receives notifications
Can create quotes/invoices only if given permission
Can approve records only if assigned as approver
Cannot manage workspace settings
```

---

# 10. Best MVP Flow Set

For the first build, prioritize these flows:

```txt
Owner:
Signup → Create Workspace → Configure Company → Invite Team → View Dashboard

Admin:
Accept Invite → Manage Users → Configure Categories/Tax/Currency → Manage Approvals

Member:
Accept Invite → Add Expense → Submit → Track Approval → Get Reimbursed

Finance:
Create Quote → Send Quote → Client Accepts → Convert to Invoice

Invoice:
Create Invoice → Send → Client Pays → Mark Paid → Update Reports

Reporting:
Dashboard → Analytics → Export Report
```

This gives you a clean foundation for **Figma screens, backend APIs, database schema, and permission logic**.
