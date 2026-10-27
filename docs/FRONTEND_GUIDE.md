# Frontend Development Guide — Payroll & Tax Declaration Web App

This document is the contract between the backend (this repo) and the frontend.
It covers everything you need to build the UI: base URL, auth, response shapes,
the full API reference, enums, ready-to-paste TypeScript types, and a suggested
screen map with role rules.

> Verified against the codebase on 2026-06-19. Endpoint paths, mounting, the
> response envelope, port, and CORS origin were read from source, not assumed.

---

## 1. Connection & Configuration

| Setting        | Value                                  | Notes |
| -------------- | -------------------------------------- | ----- |
| API base URL   | `http://localhost:3000/api`            | Port from `PORT` env (default `3000`). Everything is mounted under `/api`. |
| Dev frontend   | `http://localhost:5173`                | Backend `CORS_ORIGIN` default (Vite). Must match where your app runs. |
| CORS           | enabled, `credentials: true`           | Allows `GET, POST, PATCH, PUT, DELETE, OPTIONS`. |
| Auth transport | `Authorization: Bearer <accessToken>`  | Header-based JWT. Not cookies. |
| Content type   | `application/json`                     | Except file uploads (`multipart/form-data`). |

Recommended frontend env:
```env
VITE_API_BASE_URL=http://localhost:3000/api
```
If you change the frontend port, update `CORS_ORIGIN` on the backend to match,
or requests will be blocked by the browser.

Health check: `GET /api/health` → 200. Use it to verify connectivity.

---

## 2. Response Envelope (read this first)

**Every** response uses one of these three shapes. Always branch on `success`.

Success with data:
```json
{ "success": true, "data": { /* payload — object or array */ } }
```

Success with only a message (deletes, actions):
```json
{ "success": true, "message": "Operation successful" }
```

Error:
```json
{ "success": false, "error": { "message": "Human readable error" } }
```

Some errors carry extra fields next to `message` (Prisma-mapped), e.g.:
```json
{ "success": false, "error": { "message": "A record with that email already exists.", "code": "P2002", "field": "email" } }
```

### HTTP status codes
| Code | Meaning | Frontend action |
| ---- | ------- | --------------- |
| 200  | OK | — |
| 201  | Created | — |
| 400  | Validation / bad input | Show field errors from `error.message` |
| 401  | Missing/expired token | Try refresh, else go to login |
| 403  | Not allowed (not owner / no company access) | Hide/disable action, show notice |
| 404  | Not found | Empty state |
| 409  | Conflict (duplicate) | Show `error.field` conflict |
| 500  | Server error | Generic retry message |

---

## 3. Authentication Flow

JWT access token + refresh token. **The access token is your primary credential**; send it on every protected request.

- **Access token** — JWT, expires in **12 hours**. Send as `Authorization: Bearer <token>`.
- **Refresh token** — JWT, expires in **30 days**. Returned **only by login** (not signup). Use it to mint new access tokens.

### Endpoints
| Action | Endpoint | Returns |
| ------ | -------- | ------- |
| Sign up | `POST /api/auth/signup` | `{ user, accessToken }` (no refresh token) |
| Log in | `POST /api/auth/login` | `{ user, accessToken, refreshToken }` |
| Refresh | `POST /api/auth/refresh-access-token` | `{ accessToken }` |
| Log out (this device) | `POST /api/auth/logout` *(auth required)* | message |
| Log out everywhere | `POST /api/auth/logout-all-devices` *(auth required)* | message |
| Send verification email | `POST /api/auth/send-verification-email` | message |
| Verify email | `POST /api/auth/verify-email` | message |
| Forgot password | `POST /api/auth/forgot-password` | message |
| Reset password | `POST /api/auth/reset-password` | message |
| Accept invite | `POST /api/auth/accept-invite` | `{ user, ...tokens }` |
| Request login OTP (passwordless) | `POST /api/auth/request-login-otp` | message |
| Verify login OTP | `POST /api/auth/verify-login-otp` | `{ user, accessToken, refreshToken }` |
| Accept staff invite | `POST /api/auth/accept-staff-invite` | `{ user, accessToken, refreshToken }` |

> **Passwordless employee login.** Employees do **not** get an account when
> they're created/uploaded. An owner enables login per-employee
> (`POST /api/employee/enable-login`, §5) or for the whole company at once
> (`POST /api/employee/enable-login-all`), which creates the account(s) and emails
> them. From then on the employee signs in with **email + a one-time code**:
> `POST /auth/request-login-otp` with `{ email }` → they receive a 6-digit code
> → `POST /auth/verify-login-otp` with `{ email, otp }` returns tokens. The
> returned `user` includes `companyId` and `userRole` (`EMPLOYEE`) so you can
> route them straight to the self-service screens. The code is single-use and
> expires in 10 minutes. These accounts have no password, so `POST /auth/login`
> will not work for them (and `request-login-otp` rejects password accounts with
> 400). An owner can revoke access with `/employee/disable-login` (one) or
> `/employee/disable-login-all` (all).

### Recommended client logic
```ts
// 1. Login → store accessToken (memory or localStorage) + refreshToken (localStorage).
// 2. Attach `Authorization: Bearer <accessToken>` to every protected call.
// 3. On 401 → POST /auth/refresh-access-token with { refreshToken }.
//      success → save new accessToken, retry original request once.
//      failure → clear tokens, redirect to /login.
// 4. Logout → call /auth/logout, then clear local tokens.
```
A note on email verification: login may fail with "Email not verified". Route the
user into the verify-email flow when you see that.

---

## 4. Roles & Access Control

User roles: `OWNER`, `ADMIN`, `HR`, `EMPLOYEE`.

The backend enforces two layers; mirror them in the UI to avoid dead clicks:

1. **`authorizeCompanyAccess`** — user must own or belong to the `companyId`.
   Applies to all `/company` (per-route), `/department`, `/employee`, `/payroll`, `/tax` routes.
2. **`verifyCompanyRootAccess`** — only the **company owner** (root user). Required
   for all create/update/delete of company, department, employee, payroll, and
   tax approve/reject/proof actions.

**Practical rule for the UI:**
- **Owner** → full admin: manage company, employees, payroll, approve/reject tax declarations.
- **Employee / others** → self-service only: view own profile, fill & submit *own* tax declaration (`/api/me/tax/*`), view own pay statement.

Most company-scoped endpoints require a **`companyId` query parameter**. Keep the
active company id in app state and append it to those requests. The current user's
company comes from `GET /api/user/me`.

---

## 5. Full API Reference

All paths are prefixed with `/api`. ✅ = owner-only (`verifyCompanyRootAccess`).
Company-scoped endpoints need `?companyId=<id>`.

### Auth — `/api/auth` (public unless noted)
See §3.

### User — `/api/user` (auth required)
| Method | Path | Body / Query | Purpose |
| ------ | ---- | ------------ | ------- |
| GET | `/me` | — | Current user profile |
| PUT | `/update-me` | `{ name? }` | Update profile |
| POST | `/change-password` | `{ currentPassword, newPassword }` | Change password |
| DELETE | `/delete-me` | `{ password }` | Delete own account |
| GET | `/get-active-sessions` | — | List active sessions |
| POST | `/revoke-session` | `{ sessionId }` | Revoke a session |

### Company — `/api/company` (auth required)
| Method | Path | Query | Purpose |
| ------ | ---- | ----- | ------- |
| POST | `/create-company` | — | Create company (caller becomes owner) |
| GET | `/get-company` | `companyId` | Company details |
| PATCH ✅ | `/update-company` | `companyId` | Update company |
| DELETE ✅ | `/delete-company` | `companyId` | Delete company |
| POST ✅ | `/invite-staff` | `companyId` + `{ email, name, role }` | Invite a staff user (ADMIN/HR) — emails them a set-password link |

Create/Update body: `{ name, email?, phone?, address? }`.

> **Staff invites.** Only the company owner can invite staff, and only as
> `ADMIN` or `HR` (the API rejects other roles with 400). The invitee gets an
> email link to `/accept-staff-invite?token=…`; the frontend collects a password
> and calls `POST /auth/accept-staff-invite` with `{ token, password }`, which
> returns tokens (they're logged in immediately). These accounts log in with
> **email + password** (not OTP). 409 if the email already has an account.

### Department — `/api/department` (auth + company access)
| Method | Path | Query | Purpose |
| ------ | ---- | ----- | ------- |
| POST ✅ | `/create-department` | `companyId` | Create (`{ name }`) |
| GET | `/get-departments` | `companyId` | List all |
| GET | `/get-department-by-id` | `id`, `companyId` | One department |
| PATCH ✅ | `/update-department` | `id`, `companyId` | Update (`{ name }`) |
| DELETE ✅ | `/delete-department` | `id`, `companyId` | Delete |

### Employee — `/api/employee` (auth + company access)
| Method | Path | Query / Body | Purpose |
| ------ | ---- | ------------ | ------- |
| POST ✅ | `/create-employee` | `companyId` + Employee body | Create employee |
| POST ✅ | `/bulk-upload` | `companyId` + `multipart` file | Bulk upload (.xlsx/.xls/.csv, ≤5MB, field `file`) |
| GET | `/get-employees` | `companyId`, `page?`, `limit?`, `search?`, `departmentId?`, `status?` | List (paginated) |
| GET | `/get-employee` | `id`, `companyId` | One employee |
| PATCH ✅ | `/update-employee` | `id`, `companyId` + partial body | Update |
| DELETE ✅ | `/Status-update-employee` | `id`, `companyId` | Change status (note: DELETE verb, updates status) |
| POST ✅ | `/enable-login` | `id`, `companyId` | Enable passwordless login for one employee — creates their account and emails them. After this they sign in via `/auth/request-login-otp` + `/auth/verify-login-otp` (§3). |
| POST ✅ | `/enable-login-all` | `companyId` | Enable login for **all eligible** employees in the company. Returns `{ totalEmployees, enabledCount, skippedCount, enabled[], skipped[] }`. |
| POST ✅ | `/disable-login` | `id`, `companyId` | Disable one employee's login — revokes their sessions and removes the account (re-enable later with `/enable-login`). |
| POST ✅ | `/disable-login-all` | `companyId` | Disable login for **all** employees that currently have one. Returns a summary like the bulk enable. |

> Creating or bulk-uploading employees sends **no email** and gives them **no
> login**. Use `/enable-login` (one employee) or `/enable-login-all` (whole
> company) to grant access, and `/disable-login` / `/disable-login-all` to revoke
> it. `/enable-login` returns 409 if that employee already has a login; the bulk
> endpoints never fail on a bad row — they skip ineligible employees and list
> them under `skipped`.

### Payroll — `/api/payroll` (auth + company access)
| Method | Path | Query / Body | Purpose |
| ------ | ---- | ------------ | ------- |
| GET ✅ | `/upload-url` | `companyId` + `{ fileName }` | Get pre-signed S3 upload URL |
| POST ✅ | `/upload` | `companyId` + `{ year, month, uploadType, sourceFileKey, replace? }` | Register a payroll run |
| GET | `/runs` | `companyId`, `year?`, `month?`, `uploadType?` | List runs (with entries) |
| GET | `/run` | `companyId`, `runId` | One run + full entries + components |
| DELETE ✅ | `/run` | `companyId`, `runId` | Delete run |
| PATCH ✅ | `/entry` | `companyId`, `entryId` + `{ components[], daysInMonth?, effectiveWorkdays?, remarks? }` | Edit one entry |
| DELETE ✅ | `/entry` | `companyId`, `entryId` | Delete entry |
| GET | `/pay-statement` | `companyId`, `employeeId`, `year`, `uploadType?` | FY pay statement (with projection) |

### Tax — Admin `/api/tax` (auth + company access)
| Method | Path | Query / Body | Purpose |
| ------ | ---- | ------------ | ------- |
| GET | `/declarations` | `companyId`, `year`, `status?`, `employeeId?` | List declarations (tracking) |
| GET | `/summary` | `companyId`, `year` | Status counts + averages |
| GET | `/declaration` | `companyId`, `declarationId` | One declaration + items |
| GET | `/export/tracking` | `companyId`, `year` | Download tracking `.xlsx` |
| GET | `/export/declaration` | `companyId`, `declarationId` | Download declaration `.xlsx` |
| PATCH ✅ | `/approve` | `companyId`, `declarationId` | Approve |
| PATCH ✅ | `/reject` | `companyId`, `declarationId` + `{ reason }` | Reject |
| POST ✅ | `/proof` | `companyId`, `declarationId` + Proof body | Add/update proof item |
| DELETE ✅ | `/proof` | `companyId`, `declarationId`, `itemId`, `removeItem?` | Remove proof/item |

> The two `/export/*` endpoints stream a binary `.xlsx` with `Content-Disposition:
> attachment` — request them as a blob, not JSON, and trigger a browser download.

### Tax — Employee self-service `/api/me/tax` (auth only, no companyId)
Operates on the **logged-in user's own** declaration.
| Method | Path | Query / Body | Purpose |
| ------ | ---- | ------------ | ------- |
| GET | `/declaration` | `year`, `regime?` | Get my declaration |
| PATCH | `/declaration` | `year` + update body | Update my declaration |
| POST | `/submit` | `year` | Submit for approval |
| POST | `/proof/upload-file` | `multipart/form-data` field `file` | Upload proof image/PDF → `{ key }` |
| POST | `/proof` | `declarationId` + Proof body | Add proof |
| DELETE | `/proof` | `declarationId`, `itemId`, `removeItem?` | Remove proof |

Proof body (admin & me): `{ itemId?, section, amount, description?, referenceNo?, proofDocKey? }`.

**Proof file flow (the "Add proof" dialog):** the employee does **not** type an S3
key. The dialog has a file picker; on submit:
1. `POST /api/me/tax/proof/upload-file` with the chosen image/PDF as
   `multipart/form-data` (field `file`) → `{ key }`. Accepts JPG/PNG/WEBP/GIF/HEIC
   or PDF, max 10 MB. Backend PUTs to S3 (no S3 CORS needed).
2. `POST /api/me/tax/proof` with the returned `key` as `proofDocKey` (plus
   `section`, `amount`, etc.).

### Pagination
List endpoints (notably `/employee/get-employees`) take `page` (default 1) and
`limit` (default 10). **The response is a raw array — there is no total-count
wrapper.** To paginate: if the returned array length `< limit`, you're on the last
page. Results are sorted `createdAt DESC`.

### File uploads (S3 flow)
**Recommended for browsers — server-side upload proxy (no S3 CORS):** POST the
file as `multipart/form-data` (field `file`); the backend PUTs it to S3 and
returns `{ key }`. Then send that key back to the relevant API.
- Payroll: `POST /api/payroll/upload-file` → `{ key }`, then use as `sourceFileKey`.
- Tax proof: `POST /api/me/tax/proof/upload-file` → `{ key }`, then use as `proofDocKey`.

**Pre-signed URL flow (API clients / non-browser callers):**
1. `GET /api/payroll/upload-url` (or equivalent) → `{ uploadUrl, fileKey }`.
2. `PUT` the file bytes directly to `uploadUrl` (S3 pre-signed — no auth header).
3. Send the returned `fileKey` back as `sourceFileKey` / `proofDocKey` to the API.
   Note: a browser PUT here requires S3 CORS to be configured; prefer the proxy.

---

## 6. Enums (single source of truth for dropdowns)

```ts
type UserRole       = "OWNER" | "ADMIN" | "HR" | "EMPLOYEE";
type EmployeeStatus = "ACTIVE" | "INACTIVE" | "RESIGNED" | "TERMINATED";

type PayrollUploadType   = "SALARY" | "INCENTIVE" | "OTHER";
type PayrollRunStatus    = "DRAFT" | "PROCESSING" | "PROCESSED" | "FINALISED" | "FAILED";
type PayrollComponentType = "EARNING" | "DEDUCTION";

type TaxRegime         = "OLD" | "NEW";
type DeclarationStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED";

type TaxSection =
  | "SECTION_80C" | "SECTION_80CCD" | "SECTION_80CCD_1B"
  | "SECTION_80D" | "SECTION_80DD" | "SECTION_80DDB"
  | "SECTION_80E" | "SECTION_80G"
  | "HRA" | "HOME_LOAN" | "NPS" | "OTHER";
```

> `Decimal` fields are serialized as JSON — treat them as `string | number` and
> parse with care for money math. Dates are ISO-8601 strings.

---

## 7. TypeScript Types (paste into the frontend)

```ts
// ---- envelope ----
export type ApiOk<T>  = { success: true; data: T };
export type ApiMsg    = { success: true; message: string };
export type ApiErr    = { success: false; error: { message: string; code?: string; field?: string } };
export type ApiResponse<T> = ApiOk<T> | ApiMsg | ApiErr;

// ---- auth ----
export interface User {
  id: string;
  name: string;
  email: string;
  isEmailVerified: boolean;
  companyId: string | null;
  userRole: UserRole;
  createdAt: string;
  updatedAt: string;
}
export interface LoginResult  { user: User; accessToken: string; refreshToken: string }
export interface SignupResult { user: User; accessToken: string }

// ---- company / department ----
export interface Company {
  id: string; name: string;
  email: string | null; phone: string | null; address: string | null; website: string | null;
  financialYearStartMonth: number;   // default 4 (April)
  primaryCountryCode: string | null;
  rootUserId: string | null;
  createdAt: string; updatedAt: string;
}
export interface Department { id: string; companyId: string; name: string; createdAt: string }

// ---- employee ----
export interface Employee {
  id: string; employeeCode: string; name: string;
  email: string | null; phoneNumber: string | null; designation: string | null;
  departmentId: string | null;
  joinDate: string | null; dateOfBirth: string | null;
  gender: string | null; address: string | null;
  panNumber: string | null; panDocKey: string | null; aadhaarNo: string | null;
  userId: string | null; status: EmployeeStatus;
  companyId: string; createdAt: string; updatedAt: string;
}

// ---- payroll ----
export interface PayrollComponent {
  id: string; code: string; name: string; type: PayrollComponentType; amount: string;
}
export interface PayrollEntry {
  id: string; payrollRunId: string; employeeId: string;
  daysInMonth: number; effectiveWorkdays: number;
  presentDays: string; lopDays: string; paidDays: string;
  annualCTC: string | null; grossSalary: string;
  pf: string; esi: string; employerPf: string; employerEsi: string;
  incomeTax: string; professionalTax: string; otherDeduction: string;
  totalDeductions: string; netPay: string;
  sourceRow: number | null; remarks: string | null; isLocked: boolean;
  createdAt: string; components: PayrollComponent[];
}
export interface PayrollRun {
  id: string; companyId: string; year: number; month: number;
  uploadType: PayrollUploadType; status: PayrollRunStatus;
  sourceFileKey: string | null; uploadedById: string;
  uploadedAt: string; processedAt: string | null; remarks: string | null;
  createdAt: string; entries: PayrollEntry[];
}

// ---- tax ----
export interface TaxDeclarationItem {
  id: string; section: TaxSection;
  description: string | null; referenceNo: string | null;
  amount: string; proofDocKey: string | null; createdAt: string;
}
export interface TaxDeclaration {
  id: string; employeeId: string; employeeName?: string;
  financialYearStart: number; financialYearEnd: number;
  regime: TaxRegime; status: DeclarationStatus;
  residenceLocation: string | null;
  // annual salary components
  basicAnnual: string; hraAnnual: string; conveyanceAnnual: string; medicalAnnual: string;
  specialAllowanceAnnual: string; communicationAnnual: string; otherAllowanceAnnual: string; bonusAnnual: string;
  grandTotalSalary: string;
  // computed tax fields
  hraExemption: string; standardDeduction: string; professionalTaxAnnual: string;
  housingLoanInterest: string; otherIncome: string;
  taxableIncome: string; taxBeforeRebate: string; rebate87A: string;
  surcharge: string; cess: string; totalTaxPayable: string; tdsDeducted: string; balanceTaxPayable: string;
  // HRA proof
  monthlyRent: string | null; landlordName: string | null; landlordPan: string | null;
  // workflow
  approvedById: string | null; approvedAt: string | null;
  rejectionReason: string | null; submittedAt: string | null;
  createdAt: string; updatedAt: string;
  items?: TaxDeclarationItem[];
}
```

---

## 8. Suggested Screen Map

### Public / unauthenticated
- **Login** → `POST /auth/login`
- **Sign up** → `POST /auth/signup` → then verify-email flow
- **Verify email** (OTP) → `send-verification-email` / `verify-email`
- **Forgot / reset password** → `forgot-password` / `reset-password`
- **Accept invite** (from email link with token) → `accept-invite`
- **Accept staff invite** (ADMIN/HR, from email link with token) →
  `accept-staff-invite` (collect password) → store tokens like a normal login
- **Employee OTP login** (passwordless) → `request-login-otp` (enter email) →
  `verify-login-otp` (enter the 6-digit code) → store tokens like a normal login

### Owner / Admin app
- **Dashboard** — tax summary (`/tax/summary`) + recent payroll runs (`/payroll/runs`)
- **Company settings** — `get-company` / `update-company` (owner edits)
- **Team / staff** — owner invites ADMIN/HR users via `/company/invite-staff`
- **Departments** — CRUD on `/department/*`
- **Employees** — list (`get-employees`, search + filter by status/department),
  detail, create, edit, bulk upload, status change, and **Enable / Disable
  login** controls — per employee (`/employee/enable-login`,
  `/employee/disable-login`) or for the whole company at once
  (`/employee/enable-login-all`, `/employee/disable-login-all`); enabling grants
  passwordless access, disabling revokes it
- **Payroll**
  - Upload run: get upload URL → PUT to S3 → `POST /payroll/upload`
  - Run list & detail with per-entry edit (`PATCH /payroll/entry`)
  - Employee pay statement (`/payroll/pay-statement`)
- **Tax declarations (admin)** — tracking table (`/tax/declarations` filtered by
  `year`/`status`), declaration detail, approve / reject (with reason), manage
  proofs, export tracking & declaration `.xlsx`

### Employee self-service
- **My profile** — `GET /user/me`, `PUT /user/update-me`, change password, sessions
- **My tax declaration** — view (`/me/tax/declaration?year=`), edit, add/remove
  proofs, submit; show status (Draft/Submitted/Approved/Rejected) and any
  `rejectionReason`
- **My pay statement** — `/payroll/pay-statement` for own `employeeId`

### Cross-cutting UI
- Company selector if a user can access multiple companies (keep `companyId` in state).
- Global 401 interceptor → refresh-then-retry → login.
- Disable owner-only actions (✅ above) for non-owners.
- Toast errors from `error.message`; map `error.field` to form fields on 400/409.

---

## 9. Recommended Stack (not prescriptive)

The backend is framework-agnostic. A pragmatic match:
- **React + Vite + TypeScript** (CORS default already targets `:5173`).
- **TanStack Query** for server state (pairs well with the envelope + pagination model).
- **Axios** instance with a base URL and a response interceptor that unwraps
  `data`, throws on `success: false`, and handles 401 refresh.
- **React Hook Form + Zod** for forms (mirror the backend validation rules).
- **React Router** with route guards keyed on `userRole` / owner status.

```ts
// minimal axios setup
import axios from "axios";
export const api = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL });
api.interceptors.request.use((c) => {
  const t = localStorage.getItem("accessToken");
  if (t) c.headers.Authorization = `Bearer ${t}`;
  return c;
});
// add a response interceptor for { success:false } and 401-refresh-retry.
```

---

*Generated from backend source. If an endpoint behaves differently than documented
here, the source in `src/routes`, `src/controller`, and `src/schemas` wins — update
this file when it drifts.*
