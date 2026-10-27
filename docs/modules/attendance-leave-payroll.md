# Attendance · Shift · Holiday · Leave · LOP · Salary · Payroll Module

> Phase 1 deliverable — business analysis, data model, payroll dependencies,
> scalability notes and the migration plan. Implementation follows the existing
> project conventions exactly (multi-file Prisma schema, one-function-per-file
> repo/service layers, Zod schemas in `src/schemas`, `AppError` + `serverResponse`
> handlers, `authenticateUser` + `authorizeCompanyAccess` middleware chain).

## 1. Business requirement analysis

| Module | Core responsibility | Feeds into |
|---|---|---|
| Shift | Define working windows, grace, weekly-off pattern; assign to employees over time | Attendance classification |
| Holiday | Company/branch/optional/national holiday calendar | Attendance + leave day-count |
| Attendance | Per-day status per employee; bulk upload; regularization; monthly lock | LOP engine, Payroll |
| Leave | Leave types, balances (ledgered), requests + approval workflow | Attendance (paid/unpaid days), LOP |
| Leave Policy | Per-company/type config: accrual, carry-forward, expiry, sandwich, eligibility | Leave engine |
| LOP | Pure function: absent + unpaid leave + half-days → lopDays / payableDays / lopAmount | Payroll |
| Salary Component | Earnings / deductions / employer contributions master (existing `PayrollComponent`) | Salary structure |
| Salary Structure | Reusable templates (Phase 9) + per-employee revisionable assignment (Phase 10) | Payroll |
| Payroll | Attendance → LOP → structure → gross/deductions/net → payslip | Payslip |

## 2. Entities & relationships

```
Company 1─┬─* Branch ─────* Employee ─┬─* Attendance *─1 Shift
          ├─* Shift  ─────* EmployeeShiftAssignment
          ├─* Holiday (branchId nullable = company-wide)
          ├─* LeaveType 1─1 LeavePolicy
          │            └─* LeaveBalance 1─* LeaveTransaction (signed ledger)
          ├─* LeaveRequest 1─* LeaveApproval
          ├─* AttendanceLock (companyId, branchId, month, year)
          └─* SalaryStructureTemplate 1─* SalaryStructureTemplateComponent *─1 PayrollComponent

Employee 1─* SalaryStructure (revisionable; effectiveFrom/To, isActive, revisionNumber)
LeaveRequest 1─* Attendance (an approved leave stamps the affected days)
```

Key design choices:
- **Multi-tenancy**: every table carries `companyId` and is indexed on it. Branch is an
  optional second axis (`branchId` nullable) so single-branch companies are unaffected.
- **Leave balance integrity**: `LeaveBalance` is a fast snapshot; `LeaveTransaction` is the
  append-only signed ledger (accrual +, consumption −, …). Snapshot and ledger are written
  in the same Prisma transaction, so the balance is always reconstructible/auditable.
- **Attendance ↔ payroll contract**: `Attendance.dayValue` (1 / 0.5 / 0) and `isPaid` roll up
  to exactly the fields `PayrollEntry` already consumes — `presentDays`, `lopDays`, `paidDays`,
  `effectiveWorkdays`. No payroll rewrite required.
- **Locking**: `Attendance.isLocked` is the enforced per-row gate; `AttendanceLock` is the
  control/audit record for the month-lock action.

## 3. Payroll dependency flow

```
Shift + Holiday + WeeklyOff  ┐
Approved Leave (paid/unpaid) ├─► Attendance (per day: status, dayValue, isPaid)
Punches / bulk upload        ┘
                                   │  monthly aggregate
                                   ▼
        AttendanceSummary { workingDays, presentDays, halfDays, absentDays,
                            unpaidLeaveDays, paidLeaveDays, holidays, weeklyOffs }
                                   │
                                   ▼
        LOP engine  calculateLOP(summary, monthlyGross, payableBasis)
                    → { lopDays, payableDays, lopAmount }
                                   │
                                   ▼
        Salary structure (active revision, annualCTC) ─► monthly component amounts
                                   │  pro-rate earnings by payableDays/effectiveWorkdays
                                   ▼
        PayrollEntry { grossSalary, deductions (PF/ESI/PT/TDS/LOP), netPay }
                                   ▼
                                Payslip
```

## 4. Scalability (100k+ employees / multi-company)

- **Indexing**: composite indexes on `(companyId, date)`, `(employeeId, date)`,
  `(companyId, status)` for the hot attendance/leave query paths; `@@unique([employeeId, date])`
  guarantees one attendance row per employee-day and powers idempotent bulk upserts.
- **Bulk paths** use `createMany` / chunked `$transaction`; Excel parsing streams via `exceljs`.
- **Ledger over recompute**: balances never require a full-history scan thanks to the snapshot.
- **Stateless services + cursor/skip pagination** on every list endpoint (`buildPagination`).
- **Read/write isolation friendly**: all reads go through repos accepting a `TransactionClient`,
  so a future read-replica router is a one-line change.

## 5. Migration plan

The schema is split across `prisma/models/**` and `prisma/enums/**` (existing convention).
All changes are **additive and backward-compatible**:

1. **New enums**: `AttendanceStatus`, `AttendanceSource`, `RegularizationStatus`,
   `AttendanceLockStatus`, `ShiftType`, `HolidayType`, `HolidayScope`, `LeaveCategory`,
   `LeaveStatus`, `LeaveAccrualFrequency`, `LeaveDuration`, `LeaveApprovalStage`,
   `ApprovalAction`, `LeaveTxnType`.
2. **Extended enums** (additive — no value removed): `UserRole` += `SUPER_ADMIN`,
   `PAYROLL_MANAGER`, `MANAGER`; `PayrollComponentType` += `EMPLOYER_CONTRIBUTION`.
3. **New models**: `Branch`, `Shift`, `EmployeeShiftAssignment`, `Holiday`, `Attendance`,
   `AttendanceRegularization`, `AttendanceLock`, `LeaveType`, `LeavePolicy`, `LeaveBalance`,
   `LeaveTransaction`, `LeaveRequest`, `LeaveApproval`, `SalaryStructureTemplate`,
   `SalaryStructureTemplateComponent`.
4. **Additive columns on existing models** (all nullable / defaulted → safe on populated tables):
   - `Employee`: `branchId`, `probationEndDate`, `noticePeriodEndDate` (+ back-relations).
   - `SalaryStructure`: `templateId`, `revisionNumber` (default 1), `revisionNote`.
   - `AuditLog`: three new indexes only.

### Apply

```bash
# 1. validate (no DB needed)
npx prisma validate

# 2. create + apply the migration against the dev DB
npx prisma migrate dev --name attendance_leave_payroll_module

# 3. regenerate client
npx prisma generate

# 4. (optional) seed default leave types + a GENERAL shift per company
npx tsx prisma/seed.ts
```

`migrate dev` generates one SQL migration adding the new enums/tables and the nullable
columns. Because no column is dropped or made non-nullable, it applies online with no backfill.
For zero-downtime production rollout use `prisma migrate deploy` after review of the generated SQL.
