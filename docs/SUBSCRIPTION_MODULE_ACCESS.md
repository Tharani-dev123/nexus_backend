# Subscription & Module Access Engine

The single source of truth for **what a company can see and do**. A company buys
only the modules it needs; the backend gates every feature route, and the
frontend renders a **dynamic sidebar** from the modules the company owns — no
hardcoded menus.

> Verified against source on 2026-06-23. Paths, the response envelope and the
> login payload were read from the codebase.

---

## 1. Concepts

| Entity                | Meaning                                                                 |
| --------------------- | ----------------------------------------------------------------------- |
| `ProductModule`       | A purchasable product: `TAX_DECLARATION`, `ATTENDANCE`, `LEAVE`, `PAYROLL`, `BIOMETRIC`, `EMPLOYEE_PORTAL`, `COMPLIANCE`. |
| `SubscriptionPlan`    | A sellable bundle of modules (e.g. `TAX_DECLARATION`, `FULL_SUITE`).     |
| `CompanySubscription` | The plan a company is currently on (history retained).                  |
| `CompanyModule`       | Per-company, per-module `isEnabled` flag — the row the gate reads.       |

Sub-features `SHIFT` and `HOLIDAY` are **not** separately purchasable — they ship
inside the `ATTENDANCE` module and share its gate.

### Cross-module capabilities

Buying modules together unlocks integrations. The access payload returns a
`capabilities` map derived from the enabled set:

| Capability                 | True when                          | Effect                                  |
| -------------------------- | ---------------------------------- | --------------------------------------- |
| `payrollManualMode`        | PAYROLL, no ATTENDANCE             | Pay days entered manually (Company C).  |
| `attendanceDrivesPayroll`  | ATTENDANCE + PAYROLL              | Attendance feeds the payroll run (D).   |
| `leaveDrivesAttendance`    | LEAVE + ATTENDANCE               | Approved leave writes attendance days.  |
| `lopAutoCalculated`        | LEAVE + ATTENDANCE + PAYROLL    | LOP computed end-to-end (Company E).    |
| `biometricFeedsAttendance` | BIOMETRIC + ATTENDANCE           | Biometric punches ingested.             |

---

## 2. Login response

`POST /api/auth/login` (and `POST /api/auth/verify-login-otp`) now return the
access snapshot alongside the tokens:

```json
{
  "success": true,
  "data": {
    "user": { "id": "…", "email": "…", "companyId": "…", "userRole": "ADMIN" },
    "accessToken": "…",
    "refreshToken": "…",
    "companyId": "…",
    "subscription": {
      "id": "…",
      "planCode": "ATTENDANCE_PAYROLL",
      "planName": "Attendance + Payroll",
      "startDate": "2026-06-23T00:00:00.000Z",
      "endDate": null,
      "isActive": true
    },
    "enabledModules": ["ATTENDANCE", "PAYROLL"],
    "capabilities": { "attendanceDrivesPayroll": true, "payrollManualMode": false },
    "navigation": { "base": [ … ], "sections": [ … ] }
  }
}
```

`subscription` is `null` and `enabledModules` is `[]` for a user not yet bound to
a company. The same payload is available any time via `GET /api/subscription/access`.

---

## 3. Endpoints

All under `/api/subscription`, authenticated, and `?companyId=` scoped
(`authenticateUser` + `authorizeCompanyAccess`).

| Method | Path                          | Permission            | Purpose |
| ------ | ----------------------------- | --------------------- | ------- |
| GET    | `/subscription/access`        | any member            | Full access snapshot (subscription + modules + capabilities + navigation). |
| GET    | `/subscription/navigation`    | any member            | Just the sidebar payload. |
| GET    | `/subscription/plans`         | `SUBSCRIPTION:READ`   | Plan catalogue (each annotated with its modules). |
| POST   | `/subscription/plans`         | `SUBSCRIPTION:CREATE` | Create a plan. |
| PATCH  | `/subscription/plans?planId=` | `SUBSCRIPTION:UPDATE` | Update a plan. |
| POST   | `/subscription/subscribe`     | `SUBSCRIPTION:CREATE` | Activate a plan for the company (provisions its modules). |
| GET    | `/subscription/subscriptions` | `SUBSCRIPTION:READ`   | Subscription history. |
| POST   | `/subscription/modules/enable`| `SUBSCRIPTION:UPDATE` | Enable a single module (add-on). |
| POST   | `/subscription/modules/disable`| `SUBSCRIPTION:UPDATE`| Disable a single module. |

`subscribe` body: `{ "planCode": "FULL_SUITE", "startDate"?, "endDate"? }`.
`modules/enable|disable` body: `{ "moduleCode": "ATTENDANCE" }`.

A request to a feature route the company has not purchased returns:

```json
{ "success": false, "error": { "message": "Forbidden: the LEAVE module is not enabled for this company", "moduleCode": "LEAVE", "reason": "MODULE_NOT_ENABLED" } }
```
(HTTP `403`.) Feature routers gated today: `/payroll`, `/attendance`, `/shift`,
`/holiday` (all ATTENDANCE), `/leave`, `/tax`.

---

## 4. Frontend permission strategy

**Rule: never hardcode the sidebar or route table. Derive both from the access
payload.**

1. On login, persist `enabledModules`, `capabilities` and `navigation` (and
   re-hydrate via `GET /subscription/access` on refresh).
2. Render the sidebar from `navigation.base` + `navigation.sections` verbatim.
3. Guard routes with a `<ModuleGuard>` that checks `enabledModules`.
4. Branch feature UX on `capabilities` (e.g. show manual pay-days entry when
   `payrollManualMode`).

### Access store (React + Zustand sketch)

```ts
import { create } from "zustand";

type Nav = { base: NavItem[]; sections: NavSection[] };
interface AccessState {
  enabledModules: string[];
  capabilities: Record<string, boolean>;
  navigation: Nav | null;
  setAccess: (a: Partial<AccessState>) => void;
  can: (module: string) => boolean;
}

export const useAccess = create<AccessState>((set, get) => ({
  enabledModules: [],
  capabilities: {},
  navigation: null,
  setAccess: (a) => set(a),
  can: (module) => get().enabledModules.includes(module),
}));

// after login:
useAccess.getState().setAccess({
  enabledModules: data.enabledModules,
  capabilities: data.capabilities,
  navigation: data.navigation,
});
```

### Dynamic sidebar

```tsx
function Sidebar() {
  const nav = useAccess((s) => s.navigation);
  if (!nav) return null;
  return (
    <nav>
      {nav.base.map((i) => <NavLink key={i.key} to={i.path}>{i.label}</NavLink>)}
      {nav.sections.map((section) => (
        <section key={section.module}>
          <h4>{section.label}</h4>
          {section.items.map((i) => (
            <NavLink key={i.key} to={i.path}>{i.label}</NavLink>
          ))}
        </section>
      ))}
    </nav>
  );
}
```

### Route guard

```tsx
function ModuleGuard({ module, children }: { module: string; children: ReactNode }) {
  const can = useAccess((s) => s.can);
  if (!can(module)) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

// <Route path="/attendance/*" element={<ModuleGuard module="ATTENDANCE"><Attendance/></ModuleGuard>} />
```

The backend gate is authoritative — the frontend guard is purely for UX. A
forged client that renders a hidden screen still gets `403` from the API.

---

## 5. Worked examples (spec companies)

| Company | Plan / modules                     | Sidebar sections shown                          |
| ------- | ---------------------------------- | ----------------------------------------------- |
| A       | `TAX_DECLARATION`                  | Dashboard, **Tax** (Tax Dashboard, Tax Declaration, Tax Reports) |
| B       | `ATTENDANCE`                       | Dashboard, **Attendance** (Shift, Holiday, Attendance) |
| C       | `PAYROLL`                          | Dashboard, **Payroll** (Payroll, Salary Structure, Payroll Reports) — manual mode |
| D       | `ATTENDANCE_PAYROLL`               | Dashboard, Attendance, Payroll — attendance feeds payroll |
| E       | `ATTENDANCE_LEAVE_PAYROLL`         | Dashboard, Attendance, Leave, Payroll — auto LOP |
| F       | `FULL_SUITE`                       | All sections                                    |

Everything not listed for a company is simply absent from `navigation.sections`
and blocked at the API — hidden, not just disabled.
