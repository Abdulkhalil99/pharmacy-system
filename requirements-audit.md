# Pharmacy Management System Requirements Audit

Date: 2026-05-24

Scope note: separate prompt documents for Steps 1-13 were not present in the workspace, so this audit is based on:
- the step titles you provided
- the current Prisma schema
- the current backend routes/services/controllers
- the current frontend pages/components

This makes the audit stricter than a prompt-title review: if a step title says a feature exists but the actual system is still incomplete, it is marked `⚠️` or `❌`.

## Part 1 - Requirements Coverage Check

| # | Requirement | Status | Step(s) | Audit finding |
|---|---|---|---|---|
| 1 | Medicine registration, required fields, stock decrease on sale, stock increase on return, barcode support | ✅ | Step 2, Step 5, Step 7 | Medicine fields exist in schema, barcode exists, sales decrement stock, returns increment stock, medicine search includes barcode. |
| 2 | Company/supplier accounts, purchase bills, debt tracking, payments, full company balance report | ⚠️ | Step 2, Step 6 | Company balances and transactions exist, but purchase bill line items are not stored in normalized tables. Purchase items are flattened into the `note` string, so full bill reconstruction/reporting is weak. |
| 3 | Sales reports: daily/weekly/monthly/yearly, sales amount, profit, expenses, losses/shortages, net profit, top/least medicines | ⚠️ | Step 7, Step 11 | Sales/profit/expense/net-profit/top/least reports exist. Losses/shortages are not tracked or reported anywhere. |
| 4 | Cash register, transfers, transfer history, daily cash report | ✅ | Step 8 | Daily register, open/close, transfers, transfer history, and daily cash report exist. |
| 5 | Customer debt system with debt, payments, remaining balance, full history | ✅ | Step 2, Step 9 | Customer ledger and per-customer debt history are implemented. |
| 6 | Prescription and sales, debt/partial/paid, return removes from sale and restores stock | ⚠️ | Step 7 | Backend supports prescription creation, paid/debt/partial flows, and sale-linked returns. Frontend has no return workflow to actually process those returns from the UI. |
| 7 | Expense recording and daily/monthly expense reports | ✅ | Step 10 | Expense categories and daily/monthly summaries exist. |
| 8 | Employee salary payments and salary reports | ✅ | Step 4.5, Step 10 | Salary payments, summaries, history, and employee salary pages exist. |
| 9 | Daily/weekly/monthly/yearly reports for sales, profit, debts, company accounts, cash register, expenses, inventory | ⚠️ | Step 11 | Sales/profit are strong. Debts and company accounts are current snapshots, not proper period reports. Cash register lacks weekly/yearly reporting. Inventory is current-state only, not historical period reporting. |
| 10 | Backup, multiple users, timestamps for all operations, fast medicine search, low stock alert, expiry alert | ⚠️ | Step 4, Step 4.5, Step 5, Step 13 | Users and medicine search exist. Backup only exists as a backend service, not as a usable feature. Alerts exist in pieces, but the alerts route is not mounted and there is no real alert center/banner. Timestamps exist on many records, but not a true "all operations" audit trail. |
| 11 | Dari RTL, Pashto RTL, English LTR | ✅ | Step 12 | `fa`, `ps`, `en` exist with RTL/LTR switching and locale-aware UI. |
| 12 | Multiple users, separate passwords, role-based permissions | ✅ | Step 4, Step 4.5 | JWT auth, user CRUD, employee linking, password change/reset, and role guards exist. |

## Part 2 - Database Schema Check

### 2.1 Overall schema verdict

- The step title says `14 tables`, but the schema currently defines `15` models:
  `User`, `Employee`, `Customer`, `Medicine`, `Company`, `CompanyTransaction`, `Prescription`, `PrescriptionItem`, `Sale`, `ReturnedMedicine`, `CustomerTransaction`, `CashRegister`, `CashTransfer`, `Expense`, `SalaryPayment`.
- Core business entities are mostly present.
- The biggest schema gaps are not "missing CRUD tables"; they are missing normalization and auditability.

### 2.2 Required fields check

| Area | Status | Finding |
|---|---|---|
| Medicine required fields | ✅ | `name`, `barcode`, `company`, `buyPrice`, `sellPrice`, `quantity`, `expiryDate`, `minQuantity` all exist. |
| Company account totals | ✅ | `totalPurchased`, `totalPaid`, `balance` exist. |
| Customer debt fields | ✅ | `totalDebt` plus `CustomerTransaction` ledger exist. |
| Prescription payment states | ✅ | `totalAmount`, `paidAmount`, `debtAmount`, `status` exist. |
| Expense categories | ✅ | Rent, electricity, salary, transport, other exist. |
| Salary records | ✅ | Salary payment model exists with employee and month/year fields. |
| Purchase bill detail fields | ⚠️ | Only `billNumber`, `amount`, and free-text `note` exist. Structured purchase line items do not exist. |
| Loss/shortage fields | ❌ | No schema for shortage, expired write-off, damaged stock, manual adjustment, or loss reporting. |
| Full operation audit fields | ⚠️ | Some tables have timestamps, but there is no general audit log and several operational tables do not store the acting user. |

### 2.3 Relationships check

#### Good relationships

- `User <-> Employee` one-to-one
- `Customer -> Prescription`
- `Prescription -> PrescriptionItem`
- `Prescription -> Sale`
- `PrescriptionItem -> Medicine`
- `ReturnedMedicine -> PrescriptionItem / Medicine / User`
- `CustomerTransaction -> Customer / Prescription`
- `CashTransfer -> User`
- `Expense -> User`
- `SalaryPayment -> User / Employee`

#### Weak or missing relationships

- `Medicine.company` is a plain string, not a foreign key to `Company`.
  - Impact: renaming a company can desync medicine records and supplier reports.
  - Impact: inventory-by-supplier is not relationally reliable.
- `CompanyTransaction` has no `userId`.
  - Impact: you cannot see who recorded a supplier purchase/payment.
- `CustomerTransaction` has no `userId`.
  - Impact: you cannot see who recorded a customer payment.
- `Prescription` and `Sale` have no `userId`.
  - Impact: sales are not attributable to a cashier/pharmacist.
- There is no normalized `Purchase` / `PurchaseItem` relation.
  - Impact: purchase bills are not queryable as structured documents.

### 2.4 Timestamp check

#### Have both `createdAt` and `updatedAt`

- `User`
- `Employee`
- `Medicine`

#### Have only `createdAt` or a business `date`

- `Customer`
- `Company`
- `CompanyTransaction`
- `Prescription`
- `Sale`
- `ReturnedMedicine`
- `CustomerTransaction`
- `CashTransfer`
- `Expense`
- `SalaryPayment`

#### Missing standard audit timestamps

- `PrescriptionItem` has neither `createdAt` nor `updatedAt`
- `CashRegister` uses `openedAt` and `closedAt`, but has no standard `createdAt` / `updatedAt`

Verdict: `❌ No, timestamps are not consistently present on every table.`

### 2.5 Missing tables or models needed by the requirements

#### Critical

- `PurchaseBill` / `SupplierPurchase`
- `PurchaseBillItem` / `SupplierPurchaseItem`
- `InventoryAdjustment` or `StockLoss`
- `AuditLog`

#### Important for real pharmacy accuracy

- `MedicineBatch`
- `LoginActivity`

## Part 3 - Backend API Check

### Existing API surface

- Auth: `/api/auth/*`
- Users: `/api/users/*`
- Employees: `/api/employees/*`
- Medicines: `/api/medicines/*`
- Companies: `/api/companies/*`
- Sales: `/api/sales/*`
- Cash: `/api/cash/*`
- Customers: `/api/customers/*`
- Expenses: `/api/expenses/*`
- Salaries: `/api/salaries/*`
- Reports: `/api/reports/*`

### Missing or incomplete backend routes

| Feature | Status | Finding |
|---|---|---|
| Database backup | ❌ | Backup service exists, but there is no mounted backup controller/route such as create/list/download. |
| Alerts API | ⚠️ | `alerts.routes.ts` exists, but it is not mounted in `backend/src/index.ts`, so the API is effectively unavailable. |
| Loss/shortage report | ❌ | No API route for stock losses, shortages, expired write-offs, or manual adjustment reporting. |
| Structured purchase bills | ❌ | No API for persisted purchase bills with line items. Current purchase endpoint only produces a `CompanyTransaction` and medicine stock updates. |
| Time-based debt reports | ⚠️ | `/reports/customers/debts` gives a current snapshot, not daily/weekly/monthly/yearly debt reporting. |
| Time-based company account reports | ⚠️ | `/reports/companies/accounts` gives a current snapshot, not period-based reporting. |
| Weekly/yearly cash register reports | ❌ | Cash module has daily and monthly only. |
| Historical inventory reports | ⚠️ | `/reports/medicines/inventory` is current-state only, not historical period reporting. |
| Salary reports inside reports module | ⚠️ | Salary APIs exist under `/api/salaries`, but there is no unified `/api/reports/salaries` endpoint. |
| Full operation audit/log APIs | ❌ | No API for operation logs, login activity history, or per-record actor history. |

## Part 4 - Frontend Page Check

### Strongly covered UI areas

- Login
- Dashboard
- Medicines
- Sales history
- New prescription
- Customers list and detail
- Companies list and detail
- Cash dashboard and transfers
- Expenses
- Salaries
- Users
- Employees
- Reports hub
- Profile settings

### Missing or incomplete UI pages/components

| Feature | Status | Finding |
|---|---|---|
| Sale return workflow | ❌ | Backend supports `/api/sales/return`, but the frontend only shows receipts; there is no return action screen/modal. |
| Backup management page | ❌ | Settings only renders `MyProfile`; there is no backup page, button, history, or download UI. |
| Global alert center/banner | ❌ | No alert center page, top banner, or sidebar alert entry. |
| Loss/shortage report page | ❌ | No page or section exists for losses/shortages. |
| Structured purchase bill detail page | ❌ | Company detail shows transaction history, but not real purchase bill detail/printing with line items. |
| Period debt report UI | ⚠️ | Reports page shows current debt snapshot, but not debt trend reporting by day/week/month/year. |
| Period company account report UI | ⚠️ | Reports page shows current company balances, but not time-based company account reports. |
| Weekly/yearly cash register report UI | ❌ | Cash UI focuses on today's dashboard and transfer history only. |
| Historical inventory trend UI | ❌ | Inventory report is current-state only. |
| Salary section inside reports hub | ⚠️ | Salaries have a dedicated page, but not a section in the main reports hub. |

## Part 5 - Important Real-Pharmacy Features Not Covered Well Enough

| Feature | Status | Audit note |
|---|---|---|
| Barcode printing / label generation | ❌ | No label generation or barcode printing workflow. |
| Invoice/receipt printing with thermal printer support | ⚠️ | Receipt modal supports browser print, but there is no thermal 80mm layout, printer selection, or POS print handling. |
| Opening stock / initial inventory setup | ⚠️ | You can create medicines with quantity or use supplier purchase flow, but there is no dedicated opening-stock process. |
| Medicine categories | ❌ | No category field or filters. |
| Unit of measure per medicine | ❌ | No strip/bottle/box/vial unit field. |
| Generic name vs brand name | ❌ | Only a single medicine name exists. |
| Batch number tracking per purchase | ❌ | No batch model or batch field. |
| Multiple purchase prices for different batches | ❌ | Only one `buyPrice` per medicine. |
| Supplier contact details | ✅ | Company phone and address exist. |
| Prescription discount (fixed or percentage) | ❌ | No discount fields or logic. |
| Partial medicine return handling | ⚠️ | Backend supports quantity-based partial returns, but there is no frontend action to use it. |
| Void / cancel prescription after creation | ❌ | No cancel/void route or UI. |
| Stock adjustment / manual correction | ❌ | No stock adjustment entity or UI. |
| End-of-day / shift closing process | ⚠️ | Daily cash open/close exists, but not shift-based close workflows or counted-vs-system reconciliation beyond one register/day. |
| Login activity log | ⚠️ | `lastLogin` exists on user, but there is no login history table or page. |
| Afghani currency formatting everywhere | ⚠️ | Some pages use `؋`, others only locale number formatting. Not consistent. |
| Mobile responsive design | ✅ | The UI uses responsive Tailwind layouts across major pages. |
| Dark mode | ❌ | No dark mode system. |
| Offline mode / local-network-first hosting | ❌ | No service worker, offline queue, or LAN deployment workflow in the app itself. |
| Search by generic name or brand name | ❌ | Search is by medicine name, barcode, company only. |
| Prescription number / serial number | ⚠️ | System uses unique IDs, but not pharmacy-friendly serial numbers. |

### Extra expert gaps worth adding

- Purchase returns to supplier: `❌`
- Expired/damaged stock write-off workflow: `❌`
- Stock count / stock take reconciliation: `❌`
- Historical cost snapshot per sold item: `⚠️`
  - Sale total profit is stored, but per-item historical cost is not snapshotted, so some item-level profit views can drift if `Medicine.buyPrice` changes later.

## Part 6 - Report Completeness Check

| Report type | Backend API | Frontend page | Status | Gap |
|---|---|---|---|---|
| Sales | Yes | Yes | ✅ | Good coverage. |
| Profit | Yes | Yes | ✅ | Good coverage. |
| Losses / shortages | No | No | ❌ | No data model, API, or UI. |
| Customer debts | Partial | Partial | ⚠️ | Current snapshot exists; proper period-based debt reports do not. |
| Company accounts | Partial | Partial | ⚠️ | Current snapshot exists; proper period-based company account reports do not. |
| Cash register | Partial | Partial | ⚠️ | Daily/monthly exists, weekly/yearly does not. Reports hub shows cash flow, not full register reporting. |
| Expenses | Yes | Yes | ✅ | Expense APIs and UI are present. |
| Medicine inventory | Partial | Partial | ⚠️ | Current inventory report exists; historical period inventory reporting does not. |
| Salary | Partial | Partial | ⚠️ | Separate salary module exists, but not as a complete reports-hub report family. |

## Part 7 - Gap Report Summary

### Critical

- No normalized purchase bill + purchase line item schema
- No loss/shortage tracking or reporting
- No exposed backup feature despite backup requirement
- No full audit trail for all operations
- Sales return workflow missing in frontend

### Important

- Reports are incomplete for debts, company accounts, cash register, inventory, and salary
- Alerts are fragmented and the alerts route is not mounted
- `Medicine` is linked to supplier by a plain string instead of a foreign key
- No batch / multiple purchase cost support
- No manual stock adjustment / stock count / expired write-off workflow
- No user attribution on sales, customer payments, supplier transactions

### Nice to have

- Discount support
- Friendly prescription serial numbers
- Barcode label printing
- Thermal printer support
- Dark mode
- Offline/PWA support

## Part 8 - New Build Prompts For The Gaps

I grouped related gaps into implementation steps so you do not end up with 20 tiny prompts.

### Step 2.5 - Audit Log, Operation Attribution, and Complete Timestamps

Goal: satisfy the requirement that date/time is recorded for all operations and make the system safe for real multi-user usage.

Build:
- Update Prisma schema:
  - Add `createdAt` and `updatedAt` consistently to business tables that do not have them yet.
  - Add `createdById` or `userId` to `Prescription`, `Sale`, `CompanyTransaction`, and `CustomerTransaction`.
  - Add new `AuditLog` table with:
    - `id`
    - `userId`
    - `entityType`
    - `entityId`
    - `action`
    - `beforeData` JSON
    - `afterData` JSON
    - `metadata` JSON
    - `createdAt`
  - Add `LoginActivity` table with:
    - `id`
    - `userId` nullable
    - `username`
    - `success`
    - `ipAddress`
    - `userAgent`
    - `createdAt`
- Backend:
  - Pass authenticated `req.user.userId` into all create/update actions that matter.
  - Log login success/failure in `LoginActivity`.
  - Write audit entries for medicine create/update/delete, supplier purchase/payment, customer payment, sale creation, sale return, cash actions, expense actions, salary actions, user actions.
  - Add admin-only APIs:
    - `GET /api/audit-logs`
    - `GET /api/audit-logs/:entityType/:entityId`
    - `GET /api/auth/login-activity`
- Frontend:
  - Add admin activity page with filters by user, entity type, action, date.
  - Show "recorded by" / "last updated by" on important detail pages where useful.

Acceptance criteria:
- Every major financial or stock-changing action stores actor + timestamp.
- Admin can review login history and operation history.
- Existing flows still work after migration.

### Step 6.5 - Structured Supplier Purchase Bills and Purchase Line Items

Goal: replace free-text purchase notes with real purchase bill records.

Build:
- Update Prisma schema:
  - Add `SupplierPurchase` table with:
    - `id`
    - `companyId`
    - `billNumber`
    - `purchaseDate`
    - `note`
    - `totalAmount`
    - `createdById`
    - `createdAt`
    - `updatedAt`
  - Add `SupplierPurchaseItem` table with:
    - `id`
    - `purchaseId`
    - `medicineId` nullable
    - `medicineNameSnapshot`
    - `barcodeSnapshot`
    - `quantity`
    - `buyPrice`
    - `sellPrice`
    - `minQuantity`
    - `expiryDate`
    - `createdAt`
    - `updatedAt`
- Keep `CompanyTransaction`, but create it alongside the purchase bill as the ledger entry.
- Backend:
  - Change `POST /api/companies/:id/purchase` so it creates:
    - supplier purchase header
    - supplier purchase items
    - company ledger transaction
    - stock updates
  - Add routes:
    - `GET /api/companies/:id/purchases`
    - `GET /api/companies/:id/purchases/:purchaseId`
    - `GET /api/companies/:id/purchases/:purchaseId/print`
- Frontend:
  - Add bill list section to company detail page.
  - Add bill detail page/modal with line items, totals, bill number, date, note, and recorder.
  - Add print-friendly purchase bill view.

Acceptance criteria:
- Purchase bill detail is queryable without parsing strings.
- Company balance still matches purchases and payments.
- Stock updates remain transactional.

### Step 7.5 - Sales Return Workflow Completion

Goal: make medicine return usable from the frontend and keep sales, debt, and stock in sync.

Build:
- Backend:
  - Keep the existing sale return logic.
  - Extend sale detail payload to include:
    - returnable quantity per prescription item
    - refund amount
    - debt reduction amount
  - Add optional return receipt payload for printing.
- Frontend:
  - Add a "Return Medicine" action from sales history and receipt modal.
  - Build a return modal that lets the user:
    - select a prescription item
    - choose a partial quantity
    - enter a return reason
    - preview refund vs debt reduction
  - After submit, refresh sale history and receipt totals.
  - Show return history in sale detail.

Acceptance criteria:
- User can process partial and full returns from the UI.
- Stock increases automatically.
- Sale total, debt, paid amount, and customer balance update correctly.

### Step 11.5 - Losses, Shortages, Expired Stock, and Inventory Adjustments

Goal: cover the missing losses/shortages requirement and add real pharmacy stock correction tools.

Build:
- Update Prisma schema:
  - Add `InventoryAdjustment` table with:
    - `id`
    - `medicineId`
    - `type` enum: `SHORTAGE`, `LOSS`, `DAMAGE`, `EXPIRED`, `MANUAL_CORRECTION`, `OPENING_STOCK`
    - `quantity`
    - `unitCost`
    - `totalCost`
    - `note`
    - `userId`
    - `date`
    - `createdAt`
    - `updatedAt`
- Backend:
  - Add stock adjustment APIs:
    - `POST /api/inventory-adjustments`
    - `GET /api/inventory-adjustments`
    - `GET /api/reports/losses`
  - Adjust medicine quantity when an adjustment is recorded.
  - Add daily/weekly/monthly/yearly loss summaries.
- Frontend:
  - Add inventory adjustment page with filters and create form.
  - Add losses/shortages cards and tables to the reports hub.
  - Show expired write-offs separately from manual shortages.

Acceptance criteria:
- Pharmacy can record damaged, expired, missing, and corrected stock.
- Loss totals appear in reports.
- Stock quantity always matches adjustment history.

### Step 11.6 - Reports Completion for Debts, Company Accounts, Cash Register, Inventory, and Salary

Goal: complete the reporting requirement so all major modules support real period-based reporting.

Build:
- Backend:
  - Add period-based report endpoints:
    - `GET /api/reports/customers/debts/timeline`
    - `GET /api/reports/companies/accounts/timeline`
    - `GET /api/reports/cash-register/daily`
    - `GET /api/reports/cash-register/weekly`
    - `GET /api/reports/cash-register/monthly`
    - `GET /api/reports/cash-register/yearly`
    - `GET /api/reports/inventory/history`
    - `GET /api/reports/salaries`
  - Support date filters and return chart-ready breakdowns.
- Frontend:
  - Extend reports hub to include:
    - debt trends
    - company account trends
    - full cash register period reporting
    - salary reporting
    - inventory trend reporting
  - Add print/export buttons for each section.

Acceptance criteria:
- Reports hub covers every report family requested in the original requirements.
- Debt/company/cash/inventory/salary can be filtered by period.

### Step 13.5 - Backup Management and Global Alert Center

Goal: turn backup and alerts into real usable features.

Build:
- Backend:
  - Add backup controller + routes:
    - `POST /api/backup/create`
    - `GET /api/backup`
    - `GET /api/backup/download/:filename`
  - Mount the alerts router in `backend/src/index.ts`.
  - Add optional `GET /api/alerts` filters for low-stock vs expiring.
- Frontend:
  - Add admin-only backup page under settings:
    - create backup
    - list backups
    - download backup
    - show latest backup date and size
  - Add global alert banner/dropdown in dashboard layout.
  - Add alert badges to sidebar/dashboard cards.

Acceptance criteria:
- Admin can create and download backups from the UI.
- Alerts are visible without needing to open the medicines page.
- Alerts API is reachable in production.

### Step 5.5 - Medicine Master Data Enhancements

Goal: cover missing real-pharmacy medicine metadata and search improvements.

Build:
- Update Prisma schema:
  - Add fields to `Medicine`:
    - `genericName` nullable
    - `brandName` nullable
    - `category` nullable
    - `unit` nullable
    - `strength` nullable
    - `form` nullable
    - `openingStockQuantity` nullable
    - `openingStockDate` nullable
- Backend:
  - Extend medicine CRUD validation.
  - Extend search to include generic name, brand name, category, and barcode.
- Frontend:
  - Extend medicine form and filters.
  - Add grouped display labels for brand/generic/unit/category.

Acceptance criteria:
- Staff can search by generic, brand, and barcode.
- Medicine records are meaningful enough for real pharmacy inventory.

### Step 6.6 - Batch Tracking and Multiple Purchase Costs

Goal: support different expiry dates, batch numbers, and purchase costs for the same medicine.

Build:
- Update Prisma schema:
  - Add `MedicineBatch` table with:
    - `id`
    - `medicineId`
    - `companyId`
    - `purchaseItemId`
    - `batchNumber`
    - `expiryDate`
    - `buyPrice`
    - `sellPrice`
    - `quantityReceived`
    - `quantityAvailable`
    - `createdAt`
    - `updatedAt`
- Backend:
  - Create batches during supplier purchase.
  - On sale, deduct stock using a clear strategy such as FEFO.
  - On return, restore stock to the correct batch when possible.
- Frontend:
  - Show batch list in medicine detail.
  - Show soon-to-expire batches separately.

Acceptance criteria:
- Same medicine can exist in multiple active batches.
- Profit and expiry reporting become more accurate.

### Step 7.6 - Billing Enhancements: Discounts, Friendly Serial Numbers, Voids, and POS Printing

Goal: add missing operational sales features used in real pharmacies.

Build:
- Update Prisma schema:
  - Add `prescriptionNumber` unique serial
  - Add `discountType`, `discountValue`, `discountAmount`
  - Add optional `voidedAt`, `voidedById`, `voidReason`
- Backend:
  - Support discount calculation on prescriptions.
  - Add `POST /api/sales/:id/void`
  - Prevent voiding when business rules would be broken unless an admin approves it.
- Frontend:
  - Show serial numbers instead of raw IDs in the UI.
  - Add discount fields to new prescription page.
  - Add void action with confirmation and reason.
  - Add thermal receipt layout and label/barcode printing support.

Acceptance criteria:
- Staff can issue cleaner receipts and serial numbers.
- Discounts and voids are fully auditable.
- Receipt printing is usable in a pharmacy counter environment.

### Step 13.6 - UX Consistency and Deployment Hardening

Goal: finish the cross-cutting real-world quality items that are still missing.

Build:
- Frontend:
  - Create one shared Afghani currency formatter and use it everywhere.
  - Add dark mode support.
  - Keep all major pages mobile-safe.
- Platform:
  - Add local-network deployment docs and environment setup.
  - Add optional PWA/offline read caching for dashboard, medicines, and reports.

Acceptance criteria:
- Currency formatting is consistent.
- The system looks correct on desktop and mobile.
- Admin has a clear path for LAN deployment.

## Final Verdict

This system already covers a strong first version of:
- auth and roles
- medicines
- supplier balances
- customer debt
- sales and prescriptions
- expenses
- salaries
- cash register basics
- multilingual UI

The biggest gaps before calling it "production-ready for a real pharmacy" are:
- structured purchase bills
- loss/shortage tracking
- exposed backups
- full audit trail
- sales return UI
- complete reporting coverage
