# API Documentation — Payroll & Tax Declaration Web App

Backend reference for the Payroll & Tax Declaration platform (Node.js · Express 5 ·
TypeScript · Prisma · PostgreSQL).

> Verified against source on 2026-06-21 from `src/routes`, `src/controller`,
> `src/services`, and `src/database`. Where this drifts from code, the source wins.
> Every endpoint below lists its **query params**, **request body**, and **response
> body** (the shape inside the `data` envelope). Reusable object shapes live in
> [§5 Response Objects](#5-response-objects) and are referenced by name (e.g. `→ Employee`).

---

## 1. Base URL & Conventions

| Setting          | Value                                  | Notes |
| ---------------- | -------------------------------------- | ----- |
| Base URL         | `http://localhost:3000/api`            | Port from `PORT` env (default `3000`). Everything mounts under `/api`. |
| Dev frontend     | `http://localhost:5173`                | Backend `CORS_ORIGIN` default (Vite). |
| CORS             | enabled, `credentials: true`           | Allows `GET, POST, PATCH, PUT, DELETE, OPTIONS`. |
| Auth transport   | `Authorization: Bearer <accessToken>`  | Header-based JWT (not cookies). |
| Content type     | `application/json`                     | Except file uploads (`multipart/form-data`). |
| Health check     | `GET /api/health` → `{ "success": true }` | Use to verify connectivity. |

---

## 2. Response Envelope

Every response is one of three shapes. **Always branch on `success`.**

```jsonc
// Success with data
{ "success": true, "data": { /* object or array */ } }

// Success with only a message (deletes, actions)
{ "success": true, "message": "Operation successful" }

// Error
{ "success": false, "error": { "message": "Human readable error" } }
```

Some errors carry extra Prisma-mapped fields next to `message`:

```json
{ "success": false, "error": { "message": "A record with that email already exists.", "code": "P2002", "field": "email" } }
```

Throughout §6, **"Response `data`"** means the object placed inside that `data` key,
and **"Response: message"** means the message-only shape above. `Decimal` money
fields serialize as JSON numbers; dates are ISO-8601 strings.

### HTTP status codes

| Code | Meaning                | Frontend action |
| ---- | ---------------------- | --------------- |
| 200  | OK                     | — |
| 201  | Created                | — |
| 400  | Validation / bad input | Show field errors from `error.message` |
| 401  | Missing/expired token  | Try refresh, else go to login |
| 403  | Not allowed            | Hide/disable action, show notice |
| 404  | Not found              | Empty state |
| 409  | Conflict (duplicate / wrong state) | Show `error.field` conflict |
| 422  | Unprocessable (bad file content)   | Show parse reason |
| 500  | Server error           | Generic retry message |

---

## 3. Authentication

JWT access token + refresh token. The **access token is the primary credential** —
send it on every protected request.

- **Access token** — JWT, expires in **12 hours**. Header: `Authorization: Bearer <token>`.
- **Refresh token** — JWT, expires in **30 days**. Returned **only by login flows**
  (`/login`, `/verify-login-otp`, `/accept-invite`, `/accept-staff-invite`) — **not** by signup.

### Client logic (recommended)

```text
1. Login → store accessToken (memory/localStorage) + refreshToken (localStorage).
2. Attach `Authorization: Bearer <accessToken>` to every protected call.
3. On 401 → POST /auth/refresh-access-token with { refreshToken }.
     success → save new accessToken, retry original request once.
     failure → clear tokens, redirect to /login.
4. Logout → call /auth/logout, then clear local tokens.
```

If login fails with **"Email not verified"** (400), route the user into the verify-email flow.

> **Login `user` is a subset.** `/login`, `/verify-login-otp`, `/accept-invite`, and
> `/accept-staff-invite` return a trimmed `AuthUser` (no `name`/`updatedAt`/`deletedAt`).
> Use `GET /api/user/me` to fetch the full `User`. See `→ AuthUser` / `→ User` in §5.

### Passwordless employee login

Employees get **no account** when created/uploaded. An owner enables login —
either **one at a time** (`POST /api/employee/enable-login`) or for the **whole
company at once** (`POST /api/employee/enable-login-all`). Enabling creates the
account and emails the employee. After that they sign in with **email + a
one-time code**:

```text
POST /auth/request-login-otp  { email }          → 6-digit code emailed
POST /auth/verify-login-otp   { email, otp }      → { user, accessToken, refreshToken }
```

The code is **single-use** and expires in **10 minutes**. These accounts have no
password, so `POST /auth/login` does not work for them (and `request-login-otp`
rejects password accounts with 400). The `user` in the login response includes
`companyId` and `userRole` (`EMPLOYEE`), so the client can route straight to the
self-service screens.

An owner can revoke access the same way — one employee
(`POST /api/employee/disable-login`) or all at once
(`POST /api/employee/disable-login-all`). Disabling revokes the employee's active
sessions and removes their login; the employee record itself is untouched and
login can be re-enabled later.

---

## 4. Roles & Access Control

User roles: `OWNER`, `ADMIN`, `HR`, `EMPLOYEE`.

The backend enforces two middleware layers (mirror them in the UI):

| Middleware                | Rule | Applies to |
| ------------------------- | ---- | ---------- |
| `authenticateUser`        | Valid bearer token required | All `/user`, `/company`, `/department`, `/employee`, `/payroll`, `/tax`, `/me/tax` |
| `authorizeCompanyAccess`  | User must own or belong to `companyId` | `/department`, `/employee`, `/payroll`, `/tax` (router-level) and `/company` (per-route) |
| `verifyCompanyRootAccess` | **Company owner only** (root user) | All create/update/delete of company, department, employee, payroll, and tax approve/reject/proof |

> Endpoints marked **✅ owner-only** below require `verifyCompanyRootAccess`.

**Practical rule for the UI:**
- **Owner** → full admin: manage company, employees, payroll, approve/reject tax declarations.
- **Employee / others** → self-service only: view own profile, fill & submit own tax declaration (`/api/me/tax/*`), view own pay statement.

Most company-scoped endpoints require a **`companyId` query parameter**. Keep the
active company id in app state. The current user's company comes from `GET /api/user/me`.

---

## 5. Response Objects

Shared shapes referenced by `→ Name` in the endpoint reference. Nullable fields are
marked `| null`.

```jsonc
// → User  (full profile: GET /user/me, /user/update-me, and nested in company/employee)
{
  "id": "uuid", "name": "string", "email": "string",
  "isEmailVerified": true, "companyId": "uuid | null",
  "userRole": "OWNER | ADMIN | HR | EMPLOYEE",
  "createdAt": "ISO-8601", "updatedAt": "ISO-8601", "deletedAt": "ISO-8601 | null"
}

// → AuthUser  (trimmed user returned by login flows — note: no name)
{
  "id": "uuid", "email": "string", "isEmailVerified": true,
  "companyId": "uuid | null", "userRole": "OWNER | ADMIN | HR | EMPLOYEE",
  "createdAt": "ISO-8601"
}

// → Session  (GET /user/get-active-sessions returns an array of these)
{ "id": "uuid", "expiresAt": "ISO-8601", "createdAt": "ISO-8601", "updatedAt": "ISO-8601" }

// → Company
{
  "id": "uuid", "name": "string", "email": "string | null", "phone": "string | null",
  "address": "string | null", "website": "string | null",
  "financialYearStartMonth": 4, "primaryCountryCode": "string | null",
  "rootUserId": "uuid", "createdAt": "ISO-8601", "updatedAt": "ISO-8601",
  "deletedAt": "ISO-8601 | null",
  "users": ["→ User"],        // included by create/get
  "rootUser": "→ User"        // included by create/get
}

// → Department
{ "id": "cuid", "companyId": "uuid", "name": "string",
  "createdAt": "ISO-8601", "deletedAt": "ISO-8601 | null" }
// list rows also carry: "_count": { "employees": 0 }

// → Employee
{
  "id": "cuid", "companyId": "uuid", "userId": "uuid | null",
  "employeeCode": "string", "name": "string", "email": "string | null",
  "phoneNumber": "string | null", "designation": "string | null",
  "departmentId": "cuid | null", "joinDate": "ISO-8601 | null",
  "dateOfBirth": "ISO-8601 | null", "gender": "string | null", "address": "string | null",
  "panNumber": "string | null", "panDocKey": "string | null", "aadhaarNo": "string | null",
  "uanNumber": "string | null", "pfNumber": "string | null", "esiNumber": "string | null",
  "bankAccountNumber": "string | null", "bankName": "string | null", "ifscCode": "string | null",
  "status": "ACTIVE | INACTIVE | RESIGNED | TERMINATED",
  "createdAt": "ISO-8601", "updatedAt": "ISO-8601",
  "department": "→ Department | null",   // included by get-employees / get-employee
  "user": "→ User | null"                // included by get-employee
}

// → PayrollRun  (list rows include "_count": { "entries": 0 } instead of "entries")
{
  "id": "cuid", "companyId": "uuid", "year": 2025, "month": 4,
  "uploadType": "SALARY | INCENTIVE | OTHER",
  "status": "DRAFT | PROCESSING | PROCESSED | FINALISED | FAILED",
  "uploadedById": "uuid", "sourceFileKey": "string | null",
  "processedAt": "ISO-8601 | null", "remarks": "string | null", "createdAt": "ISO-8601",
  "entries": ["→ PayrollEntry"]   // only on GET /payroll/run (single)
}

// → PayrollEntry
{
  "id": "cuid", "payrollRunId": "cuid", "employeeId": "cuid",
  "daysInMonth": 30, "effectiveWorkdays": 30,
  "presentDays": 30, "lopDays": 0, "paidDays": 30,
  "annualCTC": 0, "grossSalary": 0, "pf": 0, "esi": 0,
  "employerPf": 0, "employerEsi": 0, "incomeTax": 0, "professionalTax": 0,
  "otherDeduction": 0, "totalDeductions": 0, "netPay": 0,
  "sourceRow": 0, "remarks": "string | null", "isLocked": false, "createdAt": "ISO-8601",
  "employee": { "id": "cuid", "employeeCode": "string", "name": "string" },
  "components": ["→ PayrollComponent"]
}

// → PayrollComponent
{
  "id": "cuid", "payrollEntryId": "cuid", "componentId": "cuid | null",
  "code": "BASIC", "name": "Basic", "type": "EARNING | DEDUCTION",
  "amount": 0, "createdAt": "ISO-8601"
}

// → TaxWorkingSheet  (the full computed declaration; returned by most tax reads + me/tax writes)
{
  "declarationId": "cuid", "status": "DRAFT | SUBMITTED | APPROVED | REJECTED",
  "regime": "OLD | NEW",
  "financialYear": { "start": 2025, "end": 2026, "label": "FY 2025-26" },
  "employee": { "id": "cuid", "employeeCode": "string", "name": "string",
                "email": "string | null", "pan": "string | null" },
  "salary": { "basicAnnual": 0, "hraAnnual": 0, "conveyanceAnnual": 0, "medicalAnnual": 0,
              "specialAllowanceAnnual": 0, "communicationAnnual": 0, "otherAllowanceAnnual": 0,
              "bonusAnnual": 0, "grandTotalSalary": 0 },
  "hra": { "residenceLocation": "string | null", "monthlyRent": "number | null",
           "landlordName": "string | null", "landlordPan": "string | null", "exemption": 0 },
  "deductions": { "standardDeduction": 0, "professionalTaxAnnual": 0, "housingLoanInterest": 0,
                  "otherIncome": 0, "chapterVIA": { "SECTION_80C": 0 }, "chapterVIATotal": 0 },
  "computation": { "grandTotalSalary": 0, "grossTotalIncome": 0, "taxableIncome": 0,
                   "taxBeforeRebate": 0, "rebate87A": 0, "surcharge": 0, "cess": 0,
                   "totalTaxPayable": 0, "tdsDeducted": 0, "balanceTaxPayable": 0 },
  "items": ["→ DeclarationItem"],
  "review": { "submittedAt": "ISO-8601 | null", "approvedAt": "ISO-8601 | null",
              "approvedBy": { "id": "uuid", "name": "string", "email": "string" } | null,
              "rejectionReason": "string | null" }
}

// → DeclarationItem
{
  "id": "cuid", "section": "TaxSection", "sectionLabel": "string",
  "description": "string | null", "referenceNo": "string | null",
  "amount": 0, "proofDocKey": "string | null", "hasProof": false, "metadata": "any | null"
}
```

---

## 6. Endpoint Reference

All paths are prefixed with `/api`. ✅ = owner-only (`verifyCompanyRootAccess`).
Company-scoped endpoints need `?companyId=<id>`.

### 6.1 Auth — `/api/auth` (public unless noted)

**`POST /signup`**
- Body: `{ name: string, email: string, password: string }` (password 8–72 chars)
- Response `data`: `{ user: → User, accessToken: string }` — **no refresh token**; `201`.
- `409` email already in use · `400` validation.

**`POST /login`**
- Body: `{ email: string, password: string }`
- Response `data`: `{ user: → AuthUser, accessToken: string, refreshToken: string }`
- `400` "Email not verified" · `401` invalid credentials.

**`POST /logout`** *(auth)* · Body: none · Response: message `"Logged out successfully"`.

**`POST /logout-all-devices`** *(auth)* · Body: none · Response: message (revokes all sessions).

**`POST /send-verification-email`** · Body: `{ email: string }` · Response: message.

**`POST /verify-email`** · Body: `{ email: string, otp: string }` (otp 6 digits) · Response: message · `400` invalid/expired OTP.

**`POST /forgot-password`** · Body: `{ email: string }` · Response: message.

**`POST /reset-password`** · Body: `{ email: string, otp: string, newPassword: string }` · Response: message · `400` invalid/expired OTP.
> Note: reset uses `{ email, otp, newPassword }` (an emailed OTP), not a separate reset token.

**`POST /accept-invite`** *(employee invite)* · Body: `{ token: string, password: string }`
- Response `data`: `{ user: → AuthUser, accessToken, refreshToken }`
- `400` invalid/expired/used token or employee has no email · `409` email already has an account.

**`POST /request-login-otp`** · Body: `{ email: string }` · Response: message `"Login code sent"`
- `404` no login enabled for email · `400` account uses a password.

**`POST /verify-login-otp`** · Body: `{ email: string, otp: string }`
- Response `data`: `{ user: → AuthUser, accessToken, refreshToken }` · `401` invalid/expired code.

**`POST /accept-staff-invite`** · Body: `{ token: string, password: string }`
- Response `data`: `{ user: → AuthUser, accessToken, refreshToken }` (role from invite: ADMIN/HR)
- `400` invalid/expired/used token · `409` email already has an account.

**`POST /refresh-access-token`** · Body: `{ refreshToken: string }`
- Response `data`: `{ accessToken: string }` · `401` invalid/expired refresh token.

### 6.2 User — `/api/user` (auth required)

**`GET /me`** · Query/Body: none · Response `data`: `→ User`.

**`PUT /update-me`** · Body: `{ name?: string }` (1–255 chars) · Response `data`: `→ User`.

**`POST /change-password`** · Body: `{ currentPassword: string, newPassword: string }` (8–72 chars)
- Response `data`: `{ message: "Password updated" }` · `401` incorrect current password.

**`DELETE /delete-me`** · Body: `{ password: string }`
- Response `data`: `{ message: "User deleted" }` · `401` incorrect password.

**`GET /get-active-sessions`** · Query/Body: none · Response `data`: `[ → Session ]` (token hashes never returned).

**`POST /revoke-session`** · Body: `{ sessionId: string }` · Response: message `"Session Revoked Successfully"`.

### 6.3 Company — `/api/company` (auth required)

**`POST /create-company`** · Body: `{ name: string, email?: string, phone?: string, address?: string }`
- Response `data`: `→ Company` (with `users[]` + `rootUser`; caller becomes owner); `201`.

**`GET /get-company`** · Query: `companyId` · Response `data`: `→ Company` (with `users[]` + `rootUser`).

**`PATCH /update-company`** ✅ · Query: `companyId` · Body: `{ name?, email?, phone?, address? }`
- Response `data`: `→ Company`.

**`DELETE /delete-company`** ✅ · Query: `companyId` · Response: message (soft delete).

**`POST /invite-staff`** ✅ · Query: `companyId` · Body: `{ email: string, name: string, role: "ADMIN" | "HR" }`
- Response `data`: `{ id: string, email: string, name: string, role: "ADMIN" | "HR", expiresAt: "ISO-8601" }` (token emailed, expires in 72h); `201`.
- `400` bad role/fields · `409` email already registered.

> **Staff invites.** Only the owner can invite, and only as `ADMIN` or `HR`. The invitee
> gets a link to `/accept-staff-invite?token=…`; the frontend collects a password and calls
> `POST /auth/accept-staff-invite`, returning tokens (logged in immediately). These accounts
> log in with **email + password** (not OTP).

### 6.4 Department — `/api/department` (auth + company access)

**`POST /create-department`** ✅ · Query: `companyId` · Body: `{ name: string }` (1–100 chars)
- Response `data`: `→ Department`; `201` · `409` duplicate name.

**`GET /get-departments`** · Query: `companyId` · Response `data`: `[ → Department + _count.employees ]` (sorted by name).

**`GET /get-department-by-id`** · Query: `id`, `companyId` · Response `data`: `→ Department` · `404` not found.

**`PATCH /update-department`** ✅ · Query: `id`, `companyId` · Body: `{ name?: string }`
- Response `data`: `→ Department` · `409` duplicate name.

**`DELETE /delete-department`** ✅ · Query: `id`, `companyId` · Response: message (soft delete).

### 6.5 Employee — `/api/employee` (auth + company access)

**`POST /create-employee`** ✅ · Query: `companyId`
- Body (employeeCode + name required, rest optional):
  ```jsonc
  {
    "employeeCode": "string", "name": "string",
    "email": "string?", "phoneNumber": "string?", "designation": "string?",
    "departmentId": "cuid?", "joinDate": "ISO-8601?", "dateOfBirth": "ISO-8601?",
    "gender": "string?", "address": "string?", "panNumber": "string?", "aadhaarNo": "string?"
  }
  ```
- Response `data`: `→ Employee` (status defaults `ACTIVE`, `userId: null`, no login created); `201`.
- `409` `employeeCode` already exists (globally unique).

**`GET /get-employees`** · Query: `companyId`, `page?` (default 1), `limit?` (default 10), `search?` (name/code/email), `departmentId?`, `status?`
- Response `data`: `[ → Employee (with department) ]` — raw array, `createdAt DESC`. See [§7 Pagination](#7-pagination).

**`GET /get-employee`** · Query: `id`, `companyId` · Response `data`: `→ Employee` (with `department` + `user`) · `404` not found.

**`PATCH /update-employee`** ✅ · Query: `id`, `companyId` · Body: any subset of the create body
- Response `data`: `→ Employee`.

**`DELETE /Status-update-employee`** ✅ · Query: `id`, `companyId` · Body: `{ status: "ACTIVE" | "INACTIVE" | "RESIGNED" | "TERMINATED" }`
- Response: message `"Employee Status successfully"`. *(DELETE verb, but updates status — not a delete.)*

**`POST /bulk-upload`** ✅ · Query: `companyId` · `multipart/form-data`, field **`file`** (`.xlsx`/`.csv`, ≤5MB)
- Response `data`: `{ created: number, skipped: number, duplicateCodes: string[], warnings: string[] }`; `201`.
- `400` no file · `422` empty file / legacy `.xls` / no header row / no employee rows.
- Header row auto-detected in first 25 rows; columns matched case-insensitively (`EMPLOYEECODE`/`EMPNO`/…, `NAME`, `PAN`, `EMAIL`). No emails sent, no logins created.

**`POST /enable-login`** ✅ · Query: `id`, `companyId` · Body: none
- Response: message (creates passwordless account + emails employee).
- `400` employee has no email · `404` not found · `409` already has a login / email already taken.

**`POST /enable-login-all`** ✅ · Query: `companyId` · Body: none
- Response `data`:
  ```jsonc
  {
    "totalEmployees": 0, "enabledCount": 0, "skippedCount": 0,
    "enabled": [ { "employeeId": "cuid", "name": "string", "email": "string" } ],
    "skipped": [ { "employeeId": "cuid", "name": "string", "email": "string | null",
      "reason": "Already has a login account | No email on file | An account with this email already exists | Could not enable login" } ]
  }
  ```
  Never fails on a bad row — ineligible employees are skipped and reported.

**`POST /disable-login`** ✅ · Query: `id`, `companyId` · Body: none
- Response: message (revokes sessions, removes login; employee record untouched).
- `400` employee has no login · `404` not found.

**`POST /disable-login-all`** ✅ · Query: `companyId` · Body: none
- Response `data`:
  ```jsonc
  {
    "totalEmployees": 0, "disabledCount": 0, "skippedCount": 0,
    "disabled": [ { "employeeId": "cuid", "name": "string", "email": "string | null" } ],
    "skipped":  [ { "employeeId": "cuid", "name": "string", "email": "string | null",
      "reason": "No login to disable | Could not disable login" } ]
  }
  ```

> Creating or bulk-uploading employees sends **no email** and grants **no login**.
> Use the enable/disable endpoints to grant or revoke access.

### 6.6 Payroll — `/api/payroll` (auth + company access)

**`GET /upload-url`** ✅ · Query: `companyId`, `fileName` (also accepted in body for API clients)
- Response `data`: `{ uploadUrl: string, key: string }` — pre-signed S3 PUT URL (expires ~300s) + object key.
- `400` `fileName` missing. **Send `key` back as `sourceFileKey`** to `/upload`.

**`POST /upload`** ✅ · Query: `companyId`
- Body: `{ year: number (2000–2100), month: number (1–12), uploadType: "SALARY" | "INCENTIVE" | "OTHER", sourceFileKey: string, replace?: boolean }`
- Response `data`: `{ runId: string, created: number, skipped: number, unmatchedEmployeeCodes: string[], warnings: string[] }`; `201`.
- `409` run already exists for the period and `replace` is false · `422` no rows matched any employee.

**`GET /runs`** · Query: `companyId`, `year?`, `month?`, `uploadType?`
- Response `data`: `[ → PayrollRun + _count.entries ]` (sorted year DESC, month DESC; no full entries).

**`GET /run`** · Query: `companyId`, `runId`
- Response `data`: `→ PayrollRun` **with** `entries[]` (each with `employee` + `components[]`). · `404` not found.

**`DELETE /run`** ✅ · Query: `companyId`, `runId` · Response: message (cascade-deletes entries) · `404` not found.

**`PATCH /entry`** ✅ · Query: `companyId`, `entryId`
- Body:
  ```jsonc
  {
    "components": [ { "code": "BASIC", "amount": 0, "type": "EARNING | DEDUCTION (optional if in master)" } ],
    "daysInMonth": 30,          // optional, 1–31
    "effectiveWorkdays": 30,    // optional, 0–31
    "remarks": "string?"        // optional
  }
  ```
  `components` needs ≥1 item; `type` required only when the code isn't in the company master.
- Response `data`: `→ PayrollEntry` (gross/deductions/netPay recomputed from components).
- `400` unknown component without `type` · `404` entry not found · `409` entry is locked.

**`DELETE /entry`** ✅ · Query: `companyId`, `entryId` · Response: message · `404` not found · `409` locked.

**`GET /pay-statement`** · Query: `companyId`, `employeeId`, `year` (FY start year), `uploadType?` (default `SALARY`)
- Response `data`:
  ```jsonc
  {
    "employee": { "id": "cuid", "employeeCode": "string", "name": "string" },
    "financialYear": { "start": 2025, "end": 2026, "startMonth": 4 },
    "uploadType": "SALARY",
    "paidMonths": 0,
    "projectionBasis": "STRUCTURE | LAST_REGULAR_PAYROLL | NONE",
    "months": [ { "year": 2025, "month": 4, "label": "APR-2025",
                  "source": "ACTUAL | PROJECTED", "components": { "BASIC": 0 },
                  "gross": 0, "totalDeductions": 0, "netPay": 0 } ],
    "componentTotals": [ { "code": "BASIC", "name": "Basic", "type": "EARNING | DEDUCTION",
                           "actual": 0, "projected": 0, "total": 0 } ],
    "totals": {
      "actual":     { "gross": 0, "totalDeductions": 0, "netPay": 0 },
      "projected":  { "gross": 0, "totalDeductions": 0, "netPay": 0 },
      "grandTotal": { "gross": 0, "totalDeductions": 0, "netPay": 0 }
    }
  }
  ```
  Returns all 12 FY months; unpaid months are `PROJECTED` (from the latest regular payroll, else salary structure, else zero). · `404` employee not found.

### 6.7 Tax — Admin `/api/tax` (auth + company access)

**`GET /declarations`** · Query: `companyId`, `year?`, `status?`, `employeeId?`
- Response `data`: array of tracking rows:
  ```jsonc
  {
    "declarationId": "cuid", "employeeId": "cuid", "employeeCode": "string",
    "employeeName": "string", "email": "string | null", "regime": "OLD | NEW",
    "financialYearStart": 2025, "financialYearEnd": 2026,
    "status": "DRAFT | SUBMITTED | APPROVED | REJECTED",
    "grandTotalSalary": 0, "taxableIncome": 0, "totalTaxPayable": 0,
    "tdsDeducted": 0, "balanceTaxPayable": 0, "itemCount": 0, "proofCount": 0,
    "submittedAt": "ISO-8601 | null", "approvedAt": "ISO-8601 | null", "rejectionReason": "string | null"
  }
  ```

**`GET /summary`** · Query: `companyId`, `year`
- Response `data`:
  ```jsonc
  {
    "financialYear": { "start": 2025, "end": 2026, "label": "FY 2025-26" },
    "totalEmployees": 0, "draftCount": 0, "submittedCount": 0,
    "approvedCount": 0, "rejectedCount": 0, "notStartedCount": 0,
    "grid": [ { "employeeId": "cuid", "employeeCode": "string", "employeeName": "string",
                "email": "string | null",
                "status": "DRAFT | SUBMITTED | APPROVED | REJECTED | NOT_STARTED",
                "declarationId": "cuid | null", "grandTotalSalary": "number | null",
                "totalTaxPayable": "number | null", "balanceTaxPayable": "number | null",
                "proofCount": 0, "submittedAt": "ISO-8601 | null", "approvedAt": "ISO-8601 | null" } ]
  }
  ```

**`GET /declaration`** · Query: `companyId`, `declarationId` · Response `data`: `→ TaxWorkingSheet` · `404` not found.

**`GET /export/tracking`** · Query: `companyId`, `year` · Response: **binary `.xlsx`** (`Content-Disposition: attachment`).

**`GET /export/declaration`** · Query: `companyId`, `declarationId` · Response: **binary `.xlsx`**.

**`PATCH /approve`** ✅ · Query: `companyId`, `declarationId` · Body: none
- Response `data`: `→ TaxWorkingSheet` (status `APPROVED`) · `409` not in `SUBMITTED` state.

**`PATCH /reject`** ✅ · Query: `companyId`, `declarationId` · Body: `{ reason: string }` (1–1000 chars)
- Response `data`: `→ TaxWorkingSheet` (status `REJECTED`, `rejectionReason` set) · `409` not in `SUBMITTED` state.

**`POST /proof`** ✅ · Query: `companyId`, `declarationId`
- Body: `{ itemId?, section?, amount?, description?, referenceNo?, proofDocKey? }` — omit `itemId` to create a new line (then `section` is required); include it to patch one.
- Response `data`: `→ TaxWorkingSheet` (recomputed) · `409` declaration already `APPROVED`.

**`DELETE /proof`** ✅ · Query: `companyId`, `declarationId`, `itemId`, `removeItem?` (default false)
- Response: message. `removeItem=false` clears just the proof file (keeps the line); `true` deletes the whole line. · `409` `APPROVED`.

> The two `/export/*` endpoints stream a binary `.xlsx` — request as a **blob**, not JSON, and trigger a download.

### 6.8 Tax — Employee self-service `/api/me/tax` (auth only, no companyId)

Operates on the **logged-in user's own** declaration; the employee is resolved from the token.

**`GET /declaration`** · Query: `year`, `regime?` (`OLD`/`NEW`, seeds a new draft)
- Response `data`: `→ TaxWorkingSheet`. Creates a `DRAFT` shell on first access and refreshes salary while still `DRAFT`.

**`PATCH /declaration`** · Query: `year`
- Body:
  ```jsonc
  {
    "regime": "OLD | NEW?",
    "residenceLocation": "string | null?", "monthlyRent": "number | null?",
    "landlordName": "string | null?", "landlordPan": "string | null?",
    "housingLoanInterest": 0, "otherIncome": 0,
    "items": [ { "section": "TaxSection", "amount": 0, "description": "string | null?",
                 "referenceNo": "string | null?", "proofDocKey": "string | null?" } ]
  }
  ```
  When `items` is present it **replaces** the whole grid (existing proof keys per section are carried forward FIFO).
- Response `data`: `→ TaxWorkingSheet` (recomputed). Editable only while `DRAFT`/`REJECTED` (a `REJECTED` edit reverts to `DRAFT`). · `409` otherwise.

**`POST /submit`** · Query: `year` · Body: none
- Response `data`: `→ TaxWorkingSheet` (status `SUBMITTED`, salary snapshot locked) · `409` not `DRAFT`/`REJECTED`.

**`POST /proof`** · Query: `declarationId`
- Body: `{ itemId?, section?, amount?, description?, referenceNo?, proofDocKey? }` (omit `itemId` to create; `section` then required).
- Response `data`: `→ TaxWorkingSheet` · `404` not found · `409` not `DRAFT`/`REJECTED`.

**`DELETE /proof`** · Query: `declarationId`, `itemId`, `removeItem?` (default false)
- Response: message (`removeItem=false` clears the proof file; `true` deletes the line) · `409` not `DRAFT`/`REJECTED`.

Proof body fields (admin & me): `{ itemId?, section, amount, description?, referenceNo?, proofDocKey? }`.

---

## 7. Pagination

List endpoints (notably `/employee/get-employees`) take `page` (default 1) and
`limit` (default 10). **The response is a raw array — no total-count wrapper.**
If the returned array length `< limit`, you're on the last page. Sorted `createdAt DESC`.

---

## 8. File Uploads (S3 flow)

For payroll files and proof/PAN docs:

```text
1. GET /api/payroll/upload-url?companyId=…&fileName=…  →  { uploadUrl, key }
2. PUT the file bytes directly to uploadUrl (S3 pre-signed — no auth header).
3. Send `key` back as sourceFileKey (payroll) / proofDocKey (tax) to the API.
```

Employee bulk upload is the exception — it posts `multipart/form-data` (field `file`)
directly to `/api/employee/bulk-upload`.

---

## 9. Enums

```ts
type UserRole        = "OWNER" | "ADMIN" | "HR" | "EMPLOYEE";
type EmployeeStatus  = "ACTIVE" | "INACTIVE" | "RESIGNED" | "TERMINATED";

type PayrollUploadType    = "SALARY" | "INCENTIVE" | "OTHER";
type PayrollRunStatus     = "DRAFT" | "PROCESSING" | "PROCESSED" | "FINALISED" | "FAILED";
type PayrollComponentType = "EARNING" | "DEDUCTION";

type TaxRegime         = "OLD" | "NEW";
type DeclarationStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED";

type TaxSection =
  | "SECTION_80C" | "SECTION_80CCD" | "SECTION_80CCD_1B"
  | "SECTION_80D" | "SECTION_80DD" | "SECTION_80DDB"
  | "SECTION_80E" | "SECTION_80G"
  | "HRA" | "HOME_LOAN" | "NPS" | "OTHER";
```

> `Decimal` fields are serialized as JSON — treat as `string | number` and parse
> with care for money math. Dates are ISO-8601 strings.

---

## 10. Salary Structure Engine

Component calculation strategies and their evaluation order:

```text
FIXED  →  PERCENTAGE_OF_CTC  →  PERCENTAGE_OF_BASIC  →  FORMULA  →  BALANCING
```

Strategies: `FIXED`, `PERCENTAGE_OF_CTC`, `PERCENTAGE_OF_BASIC`, `PERCENTAGE_OF_GROSS`,
`FORMULA`, `BALANCING`.

---

*See [FLOW_DOCUMENTATION.html](FLOW_DOCUMENTATION.html) for visual flowcharts of the
request lifecycle, auth, payroll, and tax flows. For frontend integration details
(TypeScript types, screen map), see [FRONTEND_GUIDE.md](FRONTEND_GUIDE.md).*
