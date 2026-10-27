# Configuration-Driven Payroll ERP — Enterprise Architecture

> **Goal**: 95% of all legal / taxation / payroll / attendance / leave / labor-law changes
> are implemented by editing **masters, rules, formulas, configurations** — never source
> code, never redeployment, never DB redesign. Designed for a 10-year maintenance horizon
> with minimal AMC effort, on par with SAP SuccessFactors, Workday, Darwinbox, Oracle HCM,
> Zoho Payroll and Keka.

## 0. The core insight (and why this is mostly additive)

This codebase **already** has the hard part right: every calculation lives in a **pure,
deterministic engine** that takes its rules *as input* — it does not own them:

| Engine | File | Already takes config as input |
|---|---|---|
| Attendance | [attendanceEngine.ts](../../src/services/attendance/engine/attendanceEngine.ts) | `ShiftWindow` (grace, half/full-day minutes) |
| Leave | [leavePolicyEngine.ts](../../src/services/leave/engine/leavePolicyEngine.ts) | `AccrualPolicy`, `EligibilityPolicy`, … |
| LOP | [lopEngine.ts](../../src/services/payroll/lop/lopEngine.ts) | `LopPayBasis` |
| Salary | [calculateSalaryStructure.service.ts](../../src/services/payroll/salaryStructure/calculateSalaryStructure.service.ts) | component defs + `FORMULA` via [expressionEvaluator.ts](../../src/services/payroll/salaryStructure/expressionEvaluator.ts) |

What is **not** yet config-driven is the **source** of that config:

- ❌ `pfEmployeePercent`, `esiEmployeePercent`, `pfSalaryCeiling` are **fixed columns** on
  [payrollSetting.prisma](../../prisma/models/payroll/payrollSetting.prisma) → a new statutory field = a migration.
- ❌ Professional Tax is a single `professionalTaxAmount` (not slab-based, not state-versioned).
- ❌ [taxRegimeConfig.prisma](../../prisma/models/tax/taxRegimeConfig.prisma) is versioned by FY+regime but **not multi-tenant** and **not generic** (one shape per concept).
- ❌ Default calc rules live in a **TS constant** ([payrollComponents.constant.ts](../../src/constants/payroll/payrollComponents.constant.ts)).
- ❌ Leave approval routing is two booleans (`requiresManagerApproval` / `requiresHrApproval`) — not a configurable chain.

**The architecture below introduces one missing layer — a Policy Resolution Layer — that
turns "scattered, partly-hardcoded config" into "one versioned, effective-dated,
multi-tenant, audited config substrate," and feeds the existing pure engines unchanged.**

```
                         ┌────────────────────────────────────────────┐
                         │     POLICY RESOLUTION LAYER (the new core)   │
   Admin Config Portal → │  PolicyDefinition · PolicyVersion · Formula  │
   (no developer)        │  resolve(scopeChain, ruleType, asOfDate)     │
                         └───────────────┬──────────────────────────────┘
                                         │ returns a typed, immutable
                                         │ ResolvedPolicy snapshot
                                         ▼
   ┌─────────┬──────────┬─────────┬───────────┬──────────┬──────────┐
   │ Tax     │ PF/ESI   │ LOP     │ Leave     │Attendance│ Salary   │   ← existing PURE engines,
   │ engine  │ /PT/TDS  │ engine  │ engine    │ engine   │ engine   │     unchanged in spirit
   └─────────┴──────────┴─────────┴───────────┴──────────┴──────────┘
```

---

## 1. Complete database design

Three concerns, three groups of tables. Everything new is **additive** and carries
`companyId` (nullable where a row is a global default), keeping the existing multi-tenant
+ multi-file Prisma convention.

### 1.1 Configuration substrate (the new core)

| Table | Purpose |
|---|---|
| `PolicyDefinition` | Catalog of *what kinds* of rules exist (`ruleCode`, `ruleType`, `scopeLevel`, JSON-schema for validation). Seeded once; rarely changes. |
| `PolicyVersion` | The actual, **immutable-once-published**, effective-dated config instance. Holds `jsonConfiguration`. This is "Rule Master + Rule Configuration" merged with versioning. |
| `FormulaDefinition` | Named, reusable formula (`code`, `returnType`, declared inputs). |
| `FormulaVersion` | Effective-dated formula `expression` text (e.g. `MIN(BASIC * 0.12, 1800)`). |
| `PolicyChangeLog` | Append-only audit of every publish/edit: old JSON, new JSON, user, date, version. |
| `NumberSequence` | Document-number engine (format template + counter + reset cadence). |
| `WorkflowDefinition` / `WorkflowStage` | Configurable approval chains. |
| `WorkflowInstance` / `WorkflowTask` | Runtime state of an in-flight approval. |

### 1.2 Domain masters (already exist — keep, then point at the substrate)

`PayrollComponent`, `Shift`, `LeaveType`, `Holiday`, `Employee`, `Branch`, `Company`,
`PayRollRun`, `PayRollEntry`, `Payslip`, `TaxDeclaration` … all stay. The migration
(§13) re-sources their *rule values* from `PolicyVersion` instead of fixed columns.

### 1.3 Reproducibility table (new, critical)

| Table | Purpose |
|---|---|
| `PolicyVersion.jsonConfiguration` is immutable once `PUBLISHED` | **Historical payroll never changes** because the version it used is frozen. |
| `PayRollRun.resolvedPolicySnapshot Json` (new column) | Belt-and-suspenders: the exact resolved policy set + version ids used by that run are stamped on the run, so a payslip from 2025-03 reproduces byte-for-byte even after 2027 rule changes. |

### 1.4 ER overview

```
PolicyDefinition 1───* PolicyVersion ──┐ (scope keys: companyId?, branchId?, country?, state?)
        │                              ├─* PolicyChangeLog
        └ ruleType (PF|ESI|PT|TDS|GRATUITY|BONUS|LOP|LEAVE_ACCRUAL|ATTENDANCE|TAX_SLAB|…)
FormulaDefinition 1───* FormulaVersion
WorkflowDefinition 1──* WorkflowStage
        │
        └─* WorkflowInstance 1──* WorkflowTask   (referenced by LeaveRequest, Regularization, PayRollRun…)
NumberSequence (companyId, docType, format, nextValue)
PayRollRun.resolvedPolicySnapshot ─ frozen copy of every PolicyVersion the run consumed
```

---

## 2. Prisma schema (new models, existing conventions)

Files live under `prisma/models/policy/**` and `prisma/enums/policy.prisma`, registered the
same way the existing multi-file schema is.

`prisma/enums/policy.prisma`
```prisma
enum PolicyScopeLevel { GLOBAL  COUNTRY  STATE  COMPANY  BRANCH  EMPLOYEE_GROUP }

enum PolicyStatus     { DRAFT  PUBLISHED  ARCHIVED }

// Open-ended on purpose. Adding a NEW statutory concept is the ONLY change that ever
// touches code, and it is a one-line additive enum value — never a table redesign.
enum PolicyRuleType {
  PF  ESI  PT  TDS  GRATUITY  BONUS  LWF
  TAX_SLAB  TAX_REGIME  TAX_REBATE  SURCHARGE  CESS  STANDARD_DEDUCTION
  LOP  WORKING_DAYS  ARREAR  REIMBURSEMENT  PAYROLL_FREQUENCY
  LEAVE_ACCRUAL  LEAVE_CARRYFORWARD  LEAVE_ENCASHMENT  LEAVE_ELIGIBILITY  SANDWICH
  ATTENDANCE_GRACE  OVERTIME  HALF_DAY  WEEKLY_OFF  SHIFT
  SALARY_STRUCTURE  COMPONENT_CALC
}

enum WorkflowStatus  { PENDING  APPROVED  REJECTED  CANCELLED  WITHDRAWN }
enum WorkflowTaskStatus { PENDING  APPROVED  REJECTED  SKIPPED }
```

`prisma/models/policy/policyDefinition.prisma`
```prisma
/// Catalog of rule TYPES. Seeded; defines the JSON contract each version must satisfy.
model PolicyDefinition {
  id        String          @id @default(cuid())
  ruleCode  String          @unique          // "IN_PF", "IN_ESI", "KA_PT", "IN_TAX_SLAB_NEW"
  ruleName  String
  ruleType  PolicyRuleType
  category  String                            // "STATUTORY" | "PAYROLL" | "LEAVE" | "ATTENDANCE"
  scopeLevel PolicyScopeLevel @default(COMPANY)
  /// JSON Schema (draft-07) the version payload is validated against before publish.
  jsonSchema Json
  isActive  Boolean         @default(true)
  versions  PolicyVersion[]
  createdAt DateTime        @default(now())
  updatedAt DateTime        @updatedAt
  @@index([ruleType])
  @@index([category])
}
```

`prisma/models/policy/policyVersion.prisma`
```prisma
/// One effective-dated, versioned configuration instance. PUBLISHED rows are immutable;
/// an "edit" creates a new version that supersedes the old one. This is what makes
/// historical payroll reproducible and what removes every percentage from source code.
model PolicyVersion {
  id           String           @id @default(cuid())
  definitionId String
  definition   PolicyDefinition @relation(fields: [definitionId], references: [id])

  // ── Scope keys (most-specific wins). All nullable = a GLOBAL default. ──
  companyId String?
  company   Company? @relation(fields: [companyId], references: [id])
  branchId  String?
  branch    Branch?  @relation(fields: [branchId], references: [id])
  country   String?                            // "IN", "AE", "SG"
  state     String?                            // "KA", "MH" (PT is state-wise)
  employeeGroup String?                         // optional cohort key

  version       Int
  status        PolicyStatus @default(DRAFT)
  effectiveFrom DateTime
  effectiveTo   DateTime?                       // null = open-ended (current)

  /// The actual values. NO percentage, slab or limit lives in code — only here.
  /// e.g. {"employeeContribution":12,"employerContribution":12,"wageCeiling":15000}
  jsonConfiguration Json

  supersedesId String?
  supersedes   PolicyVersion?  @relation("VersionChain", fields: [supersedesId], references: [id])
  supersededBy PolicyVersion[] @relation("VersionChain")

  changeLogs PolicyChangeLog[]
  createdBy  String?
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  // Hot resolution path: "give me PF for company X, state KA, effective 2025-03-01".
  @@index([definitionId, companyId, effectiveFrom])
  @@index([definitionId, country, state, effectiveFrom])
  @@index([status, effectiveFrom])
  @@unique([definitionId, companyId, branchId, country, state, employeeGroup, version])
}
```

`prisma/models/policy/formula.prisma`
```prisma
model FormulaDefinition {
  id         String           @id @default(cuid())
  companyId  String?                            // null = global library formula
  code       String                             // "PF_EMPLOYEE", "HRA", "BASIC"
  name       String
  returnType String           @default("NUMBER")
  /// Declared identifiers a version may reference: ["CTC","BASIC","GROSS","DAYS"]
  inputs     Json
  versions   FormulaVersion[]
  createdAt  DateTime         @default(now())
  @@unique([companyId, code])
}

model FormulaVersion {
  id            String            @id @default(cuid())
  formulaId     String
  formula       FormulaDefinition @relation(fields: [formulaId], references: [id])
  /// e.g. "MIN(BASIC * 0.12, 1800)"  — interpreted by the extended safe evaluator.
  expression    String
  version       Int
  effectiveFrom DateTime
  effectiveTo   DateTime?
  createdBy     String?
  createdAt     DateTime          @default(now())
  @@index([formulaId, effectiveFrom])
}
```

`prisma/models/policy/policyChangeLog.prisma`
```prisma
/// Compliance audit of every config mutation. Append-only.
model PolicyChangeLog {
  id        String        @id @default(cuid())
  versionId String
  version   PolicyVersion @relation(fields: [versionId], references: [id])
  action    String                              // "DRAFTED" | "PUBLISHED" | "ARCHIVED"
  oldValue  Json?
  newValue  Json?
  changedBy String
  reason    String?
  createdAt DateTime      @default(now())
  @@index([versionId])
  @@index([createdAt])
}
```

`prisma/models/policy/numberSequence.prisma`
```prisma
model NumberSequence {
  id        String  @id @default(cuid())
  companyId String
  docType   String                              // "ATTENDANCE" | "LEAVE" | "PAYROLL"
  /// Template tokens: {PREFIX}-{YYYY}-{SEQ:5}. Configurable, no code change.
  format    String  @default("{PREFIX}-{YYYY}-{SEQ:5}")
  prefix    String
  nextValue Int     @default(1)
  resetCadence String @default("YEARLY")        // NEVER | YEARLY | MONTHLY | FINANCIAL_YEAR
  lastResetKey String?                          // "2026" / "2026-06" — detects rollover
  @@unique([companyId, docType])
}
```

`prisma/models/policy/workflow.prisma`
```prisma
model WorkflowDefinition {
  id        String          @id @default(cuid())
  companyId String
  docType   String                              // "LEAVE" | "REGULARIZATION" | "PAYROLL_RUN"
  name      String
  isActive  Boolean         @default(true)
  stages    WorkflowStage[]
  instances WorkflowInstance[]
  @@index([companyId, docType, isActive])
}

model WorkflowStage {
  id           String             @id @default(cuid())
  workflowId   String
  workflow     WorkflowDefinition @relation(fields: [workflowId], references: [id], onDelete: Cascade)
  sequence     Int                                  // 1,2,3 …
  /// WHO approves: by role, by named relation, or a specific user.
  approverType String                               // "ROLE" | "REPORTING_MANAGER" | "USER"
  approverRef  String                               // "HR" | "MANAGER" | userId
  /// Optional JSON-logic gate: stage only applies when condition is true,
  /// e.g. {">":[{"var":"days"},3]} → director step only for >3-day leaves.
  condition    Json?
  isMandatory  Boolean            @default(true)
  @@unique([workflowId, sequence])
}

model WorkflowInstance {
  id           String             @id @default(cuid())
  workflowId   String
  workflow     WorkflowDefinition @relation(fields: [workflowId], references: [id])
  docType      String
  docId        String                               // e.g. LeaveRequest.id
  status       WorkflowStatus     @default(PENDING)
  currentStage Int                @default(1)
  tasks        WorkflowTask[]
  createdAt    DateTime           @default(now())
  @@index([docType, docId])
  @@index([status])
}

model WorkflowTask {
  id          String             @id @default(cuid())
  instanceId  String
  instance    WorkflowInstance   @relation(fields: [instanceId], references: [id], onDelete: Cascade)
  sequence    Int
  approverType String
  approverRef  String
  status      WorkflowTaskStatus @default(PENDING)
  actedBy     String?
  comment     String?
  actedAt     DateTime?
  @@index([instanceId])
  @@index([approverRef, status])
}
```

Add to `PayRollRun`:
```prisma
// Frozen copy of every PolicyVersion id + payload this run consumed → byte-for-byte
// reproducibility regardless of later rule changes.
resolvedPolicySnapshot Json?
```

---

## 3. Rule engine design

A **rule** = a `PolicyDefinition` (the contract) + the currently-effective `PolicyVersion`
(the values). The engine is generic; statutory specifics live only in JSON.

**Lifecycle**: `DRAFT` → (validate against `jsonSchema`) → `PUBLISHED` (immutable, closes the
previous version's `effectiveTo`) → `ARCHIVED`.

**Resolution contract** (`src/services/policy/engine/resolvePolicy.ts`):
```
resolvePolicy({ ruleType, scope, asOfDate }) : ResolvedPolicy
  1. Candidate versions = PUBLISHED, definition.ruleType = ruleType,
     effectiveFrom <= asOfDate AND (effectiveTo IS NULL OR asOfDate < effectiveTo)
  2. Filter to scope chain matches (see §14 precedence).
  3. Order by scope specificity DESC, then version DESC → take first.
  4. Return { versionId, json, effectiveFrom } (cache by key, see §20).
```
A PF change in 2027 is: Admin drafts version 3 with `effectiveFrom 2027-04-01`, publishes.
Payroll for March 2027 still resolves version 2; April resolves version 3. **Zero code, zero deploy.**

Example payloads (these are *data*, never constants):
```jsonc
// ruleType PF      {"employeeRate":12,"employerRate":12,"wageCeiling":15000,"epsRate":8.33,"capContribution":1800}
// ruleType ESI     {"employeeRate":0.75,"employerRate":3.25,"grossCeiling":21000}
// ruleType PT      {"state":"KA","slabs":[{"upTo":15000,"amount":0},{"upTo":25000,"amount":200},{"upTo":null,"amount":300}]}
// ruleType GRATUITY{"formula":"(BASIC_DA * 15 / 26) * YEARS_OF_SERVICE","eligibleAfterYears":5,"taxExemptCap":2000000}
// ruleType BONUS   {"minWage":7000,"percent":8.33,"maxPercent":20,"eligibilityWageCeiling":21000}
```

---

## 4. Formula engine design

Your [expressionEvaluator.ts](../../src/services/payroll/salaryStructure/expressionEvaluator.ts) is already a **safe hand-written recursive-descent parser** (no `eval`/`Function`).
That security property is precious — keep it. The design **extends** it (additive) to cover
the statutory examples in the brief:

- **Functions**: `MIN`, `MAX`, `ROUND`, `FLOOR`, `CEIL`, `CLAMP`, `IF(cond, a, b)`.
- **Comparisons** (for `IF`): `>` `>=` `<` `<=` `==` `!=`.
- **Variables**: still resolved from a supplied map — `CTC`, `BASIC`, `GROSS`, `DAYS`,
  `PAYABLE_DAYS`, plus any resolved component code.

```
PF        = MIN(BASIC * 0.12, 1800)
HRA       = BASIC * 0.50
LOP       = GROSS / PAYABLE_DAYS * LOP_DAYS
GRATUITY  = BASIC_DA * 15 / 26 * YEARS_OF_SERVICE
PT        = IF(GROSS > 25000, 300, IF(GROSS > 15000, 200, 0))
```

Formulas are stored in `FormulaVersion.expression` (effective-dated) **or** inline on a
`PolicyVersion`/`SalaryStructureComponent`. The evaluator is the single interpreter both paths
call. Editable from the Admin portal; validated on save by (a) parse success and (b)
identifier ∈ declared `inputs`. **No formula in source.**

> Implementation note: extend `tokenize()` with a comma token + identifier-followed-by-`(`
> → function call, and add a `parseComparison` precedence level under `parseExpr`. ~80 LOC,
> fully backward-compatible with existing `+ - * /` formulas.

---

## 5. Policy engine design (orchestration)

The Policy Engine is the thin orchestrator each domain calls. It never computes — it
**resolves config and hands it to a pure engine**:

```
buildPayrollPolicies(companyId, branchId, period) : PayrollPolicySet
  asOf = period.lastDay
  return {
    pf:        resolvePolicy({ruleType:"PF",        scope, asOf}),
    esi:       resolvePolicy({ruleType:"ESI",       scope, asOf}),
    pt:        resolvePolicy({ruleType:"PT",        scope:{...scope,state}, asOf}),
    tds:       resolvePolicy({ruleType:"TDS",       scope, asOf}),
    lop:       resolvePolicy({ruleType:"LOP",       scope, asOf}),
    workingDays:resolvePolicy({ruleType:"WORKING_DAYS", scope, asOf}),
  }
```
The result feeds `calculateLOP`, `calculateSalaryStructure`, the statutory calculators, etc.
A new **Payroll Policy Master** (companies create many, pick one as active) is just a
`PolicyVersion` of `ruleType PAYROLL_FREQUENCY` whose JSON references the component set, LOP
basis, arrear/reimbursement handling — all data.

---

## 6. Tax engine design (multi-country, isolated)

Country rules are **isolated by the `country` scope key + a per-country strategy**, so adding
a country is data + (at most) one strategy file, never edits to existing countries.

```
src/services/tax/engine/
  resolveTaxContext.ts        # resolves regime, slabs, rebate, surcharge, cess by (country, FY, regime)
  countries/
    in.strategy.ts            # India: slab + 87A rebate + surcharge + cess + std deduction
    ae.strategy.ts            # UAE: returns zero-tax (still data-driven via PolicyVersion)
    sg.strategy.ts            # Singapore: resident progressive slabs
  taxEngine.ts                # picks strategy by country, runs pure slab math over JSON
```
- `ruleType TAX_SLAB` JSON = `{"slabs":[{"from":0,"to":300000,"rate":0}, …]}` (mirrors today's
  `TaxRegimeConfig.slabs Json` — see migration §13).
- Per-country **and** per-company override via the scope chain: a company can override a
  rebate limit without touching the national default.
- Government changes a slab → Admin edits the slab JSON, sets `effectiveFrom` = next FY. Done.

The existing [calculateTaxDeclaration.service.ts](../../src/services/tax/engine/calculateTaxDeclaration.service.ts) becomes a thin caller of `taxEngine.ts`.

---

## 7. Payroll engine design

The run orchestrator ([runPayrollFromAttendance.service.ts](../../src/services/payroll/run/runPayrollFromAttendance.service.ts)) gains **one new first step** and **one new last step**:

```
runPayroll(companyId, period):
  0. policies = buildPayrollPolicies(companyId, branchId, period)        # NEW — resolve as-of period
  for each employee:
    1. summary  = summarizeMonth(attendance)            # existing pure engine
    2. lop      = calculateLOP(summary, policies.lop)   # existing, now policy-fed
    3. struct   = calculateSalaryStructure(ctc, components)  # existing
    4. statutory= { pf: pfCalc(struct, policies.pf), esi: esiCalc(...), pt: ptCalc(...), tds: tdsCalc(...) }
    5. entry    = buildPayrollEntry(struct, lop, statutory)
  6. run.resolvedPolicySnapshot = freeze(policies)      # NEW — reproducibility (§1.3)
```
`pfCalc/esiCalc/ptCalc/tdsCalc` are **new pure functions** alongside the existing engines:
each takes a `ResolvedPolicy.json` + the salary numbers and returns an amount. No statutory
constant anywhere. Re-running a locked historical month reads `resolvedPolicySnapshot` and
reproduces the original figures exactly.

---

## 8. Leave engine design

The engine ([leavePolicyEngine.ts](../../src/services/leave/engine/leavePolicyEngine.ts)) already takes `AccrualPolicy`/`EligibilityPolicy`/etc. as
inputs — **no change**. Migration: the per-type [leavePolicy.prisma](../../prisma/models/leave/leavePolicy.prisma) row becomes the
*current* `PolicyVersion` (`ruleType LEAVE_ACCRUAL/…`), giving it versioning + effective dates
+ company/branch override it lacks today. A thin adapter maps the resolved JSON onto the
engine's existing input interfaces, so accrual/carry-forward/encashment/eligibility/sandwich
all stay configurable with **zero engine edits**. Approval routing moves to the Workflow
engine (§10), replacing the two `requires*Approval` booleans.

---

## 9. Attendance engine design

[attendanceEngine.ts](../../src/services/attendance/engine/attendanceEngine.ts) already consumes a `ShiftWindow` (grace, half/full-day minutes, breaks).
Migration: shift timings + grace/late/early/half-day/overtime/weekly-off rules become
`PolicyVersion`s (`ruleType ATTENDANCE_GRACE / OVERTIME / HALF_DAY / WEEKLY_OFF / SHIFT`):
```jsonc
{"lateAfterMinutes":15,"halfDayAfterMinutes":240,"overtimeEligibleAfterHours":9,"weeklyOffPattern":"1000001"}
```
Resolved per (company, branch, shift, date) and passed into `classifyPunch` exactly as the
`Shift` row is today. Grace/OT/half-day thresholds become editable without redeploy.

---

## 10. Workflow engine design

Replaces every hardcoded approval chain (the leave booleans, regularization review) with a
configurable graph.

```
configure:  WorkflowDefinition(docType="LEAVE") → stages [
              {seq:1, ROLE, "MANAGER"},
              {seq:2, ROLE, "HR", condition:{"<=":[{"var":"days"},5]}},
              {seq:3, ROLE, "DIRECTOR", condition:{">":[{"var":"days"},5]}}]
runtime:    on submit → create WorkflowInstance + first WorkflowTask
            on approve → mark task APPROVED; evaluate next stage's condition (JSON-logic);
                         create next task or finalize APPROVED/REJECTED
```
Admin reconfigures `Employee → Manager → HR` ⇄ `Employee → HR` ⇄ `Employee → Manager →
Director → HR` from the portal. The condition gate is the same safe-evaluator family used by
formulas. The existing [approveLeave.service.ts](../../src/services/leave/request/approveLeave.service.ts) becomes a caller of `advanceWorkflow(instanceId, action)`.

---

## 11. Versioning strategy

- **One concept, many versions.** `(definition, scope) → [v1, v2, v3]`, ordered by `version`.
- **Immutability.** Publishing a version **never mutates** an existing one — it inserts a new
  row and closes the prior `effectiveTo`. So historical reads are stable by construction.
- **Supersession chain** (`supersedesId`) gives a full lineage for audit and diff.
- **Draft → Publish → Archive** with JSON-schema validation gating publish.
- Formulas version identically (`FormulaVersion`).

## 12. Effective-date strategy

- Every version carries `[effectiveFrom, effectiveTo)` (half-open interval).
- Resolution always uses an **as-of date = the business date of the calculation** (payroll
  period last day, leave start date, attendance day) — *not* `now()`. This is what makes a
  back-dated payroll re-run correct.
- Publishing version N+1 sets version N's `effectiveTo = N+1.effectiveFrom` in the same
  transaction (no gaps, no overlaps; enforced by a check in the publish service).
- Future-dated versions are first-class: a 2027 PF change is entered today and silently
  activates on its date.

## 13. Migration strategy (strangler — additive, backward-compatible)

Following the project's stated rule (*all changes additive, nullable/defaulted, online*):

**Step 1 — add the substrate (no behavior change).**
`prisma migrate dev --name policy_engine` creates the new tables + the `PayRollRun.resolvedPolicySnapshot` nullable column. Nothing reads them yet.

**Step 2 — backfill from existing config (data, not schema).** A seed/backfill script
(`prisma/seed/backfillPolicies.ts`) reads each `PayrollSetting` row and writes equivalent
`PolicyVersion`s:
```
PayrollSetting.pfEmployeePercent  → PolicyVersion(PF){employeeRate, employerRate, wageCeiling}
PayrollSetting.esi*               → PolicyVersion(ESI){...}
PayrollSetting.professionalTax*   → PolicyVersion(PT){state, slabs:[{upTo:null, amount}]}
TaxRegimeConfig (per FY+regime)   → PolicyVersion(TAX_SLAB / TAX_REGIME){slabs, rebate, ...} (1:1, JSON already matches)
payrollComponents.constant.ts     → already seeded into PayrollComponent rows; keep constant as the seed source only
LeavePolicy rows                  → PolicyVersion(LEAVE_*) v1, effectiveFrom = company start
Shift rule fields                 → PolicyVersion(ATTENDANCE_*) v1
```
`effectiveFrom` for v1 = company's earliest payroll/incorporation date, so historical runs
keep resolving the same numbers.

**Step 3 — flip the read path behind a feature flag.** Engines start calling
`resolvePolicy(...)` instead of reading `PayrollSetting`/`TaxRegimeConfig` columns. Run both
in parallel for one cycle and diff outputs (shadow mode) before cutover.

**Step 4 — deprecate (do not drop).** Mark the old columns `@deprecated` in comments; leave
them for one or two release cycles, then drop in a later additive migration once the snapshot
history fully covers reproducibility. No data is ever lost.

This means **the only future schema change for a rule change is adding a new `PolicyRuleType`
enum value** — and even that is rare; most changes are pure data.

## 14. Multi-tenant strategy

- Every `PolicyVersion` carries optional `companyId` / `branchId` / `country` / `state` /
  `employeeGroup`. `null` at a level = "applies to all below."
- **Scope precedence (most specific wins)** during resolution:
  ```
  EMPLOYEE_GROUP  >  BRANCH  >  COMPANY  >  STATE  >  COUNTRY  >  GLOBAL
  ```
  → Platform ships a **GLOBAL/COUNTRY default** (e.g. India PF 12%); a company overrides only
  what it must; a branch in another state overrides PT only. Tenants are fully isolated yet
  inherit sane defaults, so onboarding a company needs near-zero config.
- All hot queries are indexed on `(definitionId, companyId, effectiveFrom)` and
  `(definitionId, country, state, effectiveFrom)` (see model `@@index`).
- Row-level company scoping is already enforced by `authorizeCompanyAccess` /
  `requirePermission` middleware — the config APIs reuse them unchanged.

## 15. API design (Admin Configuration Portal)

New router `src/routes/policy.routes.ts`, mounted in [index.routes.ts](../../src/routes/index.routes.ts), following the exact
middleware chain convention (`requirePermission` + `validateInput`). A new RBAC resource
`POLICY` (added to [permissions.constant.ts](../../src/constants/rbac/permissions.constant.ts)) gates it; only `OWNER`/`SUPER_ADMIN`/`ADMIN`.

```
# Rule catalog
GET    /policy/definitions                       list rule types (+ json schema)
# Versions (the everyday admin surface)
GET    /policy/:ruleType/versions?scope=...       list versions for a rule+scope
GET    /policy/:ruleType/resolve?asOf=YYYY-MM-DD   preview what WILL apply (dry-run)
POST   /policy/:ruleType/versions                 create DRAFT
PATCH  /policy/versions/:id                        edit DRAFT (PUBLISHED is immutable → 409)
POST   /policy/versions/:id/publish                validate→publish→close prior version
POST   /policy/versions/:id/archive
GET    /policy/versions/:id/changelog              compliance audit trail
# Formulas
GET/POST/PATCH  /policy/formulas[...]              + POST /policy/formulas/validate (parse+identifier check)
# Workflows
GET/POST/PATCH  /policy/workflows[...]
# Number sequences
GET/PATCH       /policy/sequences/:docType
# Simulation (de-risks every change)
POST   /policy/simulate/payroll                    run a draft policy set over a sample employee, show diff
```
Every mutating endpoint validates the JSON payload against `PolicyDefinition.jsonSchema`
(using `zod` + a JSON-schema bridge) and writes a `PolicyChangeLog` row in the same
transaction. `/simulate` lets an admin see the rupee impact **before** publishing.

## 16. Folder structure (mirrors existing conventions exactly)

```
prisma/
  enums/policy.prisma
  models/policy/{policyDefinition,policyVersion,formula,policyChangeLog,numberSequence,workflow}.prisma
  seed/backfillPolicies.ts

src/
  constants/policy/{ruleTypes,policyCategories}.constant.ts      # codes only, no values
  schemas/policy/{createVersion,publishVersion,formula,workflow,...}.schema.ts  + index.schema.ts
  database/policy/                                               # one-function-per-file repos
    definition/{getDefinition,listDefinitions}.repo.ts
    version/{createVersion,getEffectiveVersion,listVersions,publishVersion,closePriorVersion}.repo.ts
    formula/{getEffectiveFormula,...}.repo.ts
    changelog/createChangeLog.repo.ts
    sequence/{getSequence,incrementSequence}.repo.ts
    workflow/{...}.repo.ts
    index.repo.ts
  services/policy/
    engine/{resolvePolicy,resolveFormula,scopePrecedence}.ts     # pure-ish resolution
    version/{createVersion,publishVersion,archiveVersion}.service.ts
    formula/{evaluate (extended),validateFormula}.ts
    workflow/{startWorkflow,advanceWorkflow,evaluateCondition}.ts
    number/{nextDocumentNumber}.service.ts
    simulate/simulatePayroll.service.ts
    index.service.ts
  controller/policy.controller.ts
  routes/policy.routes.ts
  middleware/rbac/  (reuse requirePermission; add POLICY resource)
```

## 17. Repository layer

Same shape as [createBranch.repo.ts](../../src/database/branch/create/createBranch.repo.ts): one default-exported async function per file, accepting an
optional `tx: Prisma.TransactionClient = prisma`, aggregated by an `index.repo.ts`. Key repos:

```ts
// src/database/policy/version/getEffectiveVersion.repo.ts
export default async function getEffectiveVersion(
  q: { ruleType: PolicyRuleType; companyId?: string; branchId?: string;
       country?: string; state?: string; asOf: Date },
  tx: Prisma.TransactionClient = prisma,
) {
  // PUBLISHED + effective window + scope-match, ordered by specificity then version.
  // Returns the single winning PolicyVersion (or null → caller falls back to GLOBAL).
}
```
`publishVersion.repo.ts` + `closePriorVersion.repo.ts` run inside one `$transaction` so the
window invariant (no gaps/overlaps) holds atomically — matching the existing
ledger-and-snapshot-in-one-transaction discipline noted in the module doc.

## 18. Service layer

Same shape as [createBranch.service.ts](../../src/services/branch/create/createBranch.service.ts): thin, default-exported, calls repos via the `index`,
records audit. The split is deliberate:
- **Resolution services** (`resolvePolicy`) — read-only, cacheable, pure given DB input.
- **Mutation services** (`publishVersion`) — validate JSON-schema → write version → close
  prior → `PolicyChangeLog` + `AUDIT_SERVICE.recordAudit` (reuse the existing audit, see
  [recordAudit.service.ts](../../src/services/audit/record/recordAudit.service.ts)) — all in one transaction.
- **Pure calculators** (`pfCalc`, `esiCalc`, `ptCalc`, `tdsCalc`) — no I/O, unit-tested in
  isolation (vitest is already configured), exactly like the existing engines.

## 19. Event-driven architecture recommendations

Keep it pragmatic on the current single-service Express stack; design for later split.

- **Transactional outbox**: a `DomainEvent` table written *in the same transaction* as the
  state change (e.g. `PolicyPublished`, `PayrollRunFinalized`, `LeaveApproved`,
  `AttendanceLocked`). A worker relays to consumers. Guarantees no lost events without a
  distributed transaction.
- **Domain events to emit**: `PolicyVersionPublished` → bust the resolution cache for that
  key; `SalaryStructureRevised` → flag affected future runs; `WorkflowTaskCreated` → notify
  approver; `PayrollRunFinalized` → trigger payslip generation + GL export.
- **Idempotent consumers** keyed by event id (handlers may retry).
- **Cache invalidation via events**, not TTL guesswork: publishing a version emits an event
  that evicts exactly `resolve(ruleType, scope)` keys.
- **Migration path**: events first as in-process handlers behind an `EventBus` interface;
  swap the transport to SQS/SNS/Kafka later with no domain-code change. The repo already has
  AWS SDK (`@aws-sdk/*`) wired, so SQS/SNS is a small step when scale demands it.

## 20. Enterprise-grade, scalable design (SAP SF / Workday / Darwinbox / Oracle HCM / Zoho / Keka parity)

| Capability | How this design delivers it |
|---|---|
| **Effective-dated everything** (Workday's core model) | `[effectiveFrom, effectiveTo)` on every `PolicyVersion`/`FormulaVersion`; as-of resolution. |
| **Config over code** (SuccessFactors MDF, Darwinbox policy builder) | `PolicyDefinition` + JSON payloads; admins edit values, never code. |
| **Formula/rule builder** (Keka, Zoho) | Safe formula engine + JSON-logic conditions, editable from portal. |
| **Multi-country statutory** (Oracle HCM localizations) | `country` scope key + per-country strategy; UAE/SG/India isolated. |
| **Multi-tenant with inheritance** | GLOBAL→COUNTRY→…→EMPLOYEE_GROUP precedence; defaults + overrides. |
| **Reproducible historical runs** | Immutable published versions + `resolvedPolicySnapshot` on the run. |
| **Auditability/compliance** | `PolicyChangeLog` (old/new/who/when/version) + existing `AuditLog`. |
| **Configurable workflows** | `WorkflowDefinition`/`Stage`/`Instance`/`Task` with conditions. |

**Performance & scale (100k+ employees, multi-company):**
- **Resolution cache**: a per-process LRU keyed by `(ruleType, scopeHash, asOfMonth)` —
  policies change rarely, reads are hot; invalidated by `PolicyVersionPublished` events. The
  repo already has a `src/cache/` directory to host this.
- **Batch resolve once per run**: `buildPayrollPolicies` resolves the full set **once per
  (company, branch, period)**, not per employee — turning N×rules lookups into O(rules).
- **Snapshot read for reruns**: locked-month reruns read `resolvedPolicySnapshot` (zero DB
  resolution).
- **Indexes**: composite indexes on the two hot resolution shapes (defined on the model).
- **Stateless services + read-replica friendliness**: resolution is pure read; repos already
  accept a `TransactionClient`, so a replica router is a one-line change (as the existing
  module doc already notes for attendance).
- **Bulk paths** reuse the existing `createMany` / chunked `$transaction` / `exceljs` patterns.

---

## Bottom line

You do **not** rewrite the engines — they are already pure and config-shaped. You add **one
layer**: a versioned, effective-dated, multi-tenant **Policy Resolution Layer** plus a
**Workflow** and **Number-sequence** engine, then **strangle** the three hardcoded sources
(`PayrollSetting` columns, `TaxRegimeConfig`, the components constant) into it with additive,
online, backward-compatible migrations. After cutover, a government rule change is an admin
editing JSON with a future `effectiveFrom` — **no source change, no redeploy, no DB redesign,
and history stays frozen.**
