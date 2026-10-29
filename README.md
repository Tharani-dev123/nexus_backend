# Payroll & Tax Declaration API

A multi-tenant Payroll & Tax Declaration backend built with **Node.js**, **Express**, **TypeScript**, **Prisma**, and **PostgreSQL**. The platform enables organizations to manage employees, salary structures, payroll processing, payslips, and employee tax declarations with approval workflows.

---

## 🚀 Features

### Authentication & Security

* JWT Access & Refresh Token Authentication
* Refresh Token Rotation
* Multi-device Session Management
* Email Verification
* Forgot Password / Reset Password
* Role-Based Access Control (RBAC)
* Company-Level Authorization
* Audit Logging

### Company Management

* Create and Manage Companies
* Multi-Tenant Architecture
* Company Settings
* Department Management
* Company Access Controls

### Employee Management

* Employee CRUD Operations
* Employee Status Management
* Department Assignment
* Bank Information
* Statutory Information

  * PAN
  * Aadhaar
  * PF
  * ESI
  * UAN
* Employee Invitation Flow

### Payroll Management

* Payroll Component Configuration
* Salary Structure Management
* Payroll Upload via Excel
* Payroll Processing Engine
* Payroll Runs
* Payroll Entries
* Payslip Generation
* Salary Projection Engine
* Annual Pay Statements

### Tax Declaration Management

* Old Regime Support
* New Regime Support
* Employee Self-Service Portal
* Investment Declaration
* HRA Calculation
* Home Loan Declaration
* NPS Declaration
* Tax Proof Upload
* Approval Workflow
* Tax Summary Reports
* Excel Export

### AWS Integrations

* Amazon S3 File Storage
* Amazon SES Email Service
* Presigned URLs
* Payroll Document Storage
* Tax Proof Storage

### Monitoring & Logging

* Winston Logging
* Morgan Request Logging
* BetterStack Integration
* Request Tracing
* Audit Logs

---

# 🏗️ Technology Stack

| Layer                  | Technology       |
| ---------------------- | ---------------- |
| Runtime                | Node.js          |
| Framework              | Express 5        |
| Language               | TypeScript       |
| ORM                    | Prisma 7         |
| Database               | PostgreSQL       |
| Validation             | Zod              |
| Authentication         | JWT + Bcrypt     |
| Storage                | AWS S3           |
| Email                  | AWS SES          |
| Logging                | Winston + Morgan |
| Spreadsheet Processing | ExcelJS          |

---

# 📂 Project Structure

```text
src/
│
├── config/
├── constants/
├── controller/
├── database/
├── handlers/
├── middleware/
├── routes/
├── schemas/
├── services/
├── utils/
│
└── index.ts

prisma/
│
├── enums/
├── models/
├── migrations/
└── seed.ts
```

---

# 🏛 Architecture

```text
Client Request
      │
      ▼
Routes
      │
      ▼
Middleware
      │
      ▼
Controller
      │
      ▼
Service
      │
      ▼
Repository
      │
      ▼
Prisma
      │
      ▼
PostgreSQL
```

---

# 🔐 Authentication Flow

```text
User Login
     │
     ▼
Verify Credentials
     │
     ▼
Generate Refresh Token
     │
     ▼
Store Token Hash
     │
     ▼
Generate Access Token
     │
     ▼
Return Tokens
```

### Access Token

```text
Lifetime: 12 Hours
```

### Refresh Token

```text
Lifetime: 30 Days
```

---

# 👥 User Roles

```text
OWNER
ADMIN
HR
EMPLOYEE
```

---

# 🏢 Core Modules

## Authentication

```http
POST   /api/auth/signup
POST   /api/auth/login
POST   /api/auth/logout
POST   /api/auth/logout-all-devices
POST   /api/auth/send-verification-email
POST   /api/auth/verify-email
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
POST   /api/auth/refresh-access-token
```

See [Student onboarding and OTP security](docs/STUDENT_AUTH_ONBOARDING.md) for admission-code registration, forced account setup, OTP limits, and the guarded PostgreSQL integration-test command.

---

## Company

```http
POST   /api/company/create-company
GET    /api/company/get-company
PATCH  /api/company/update-company
DELETE /api/company/delete-company
```

---

## Department

```http
POST   /api/department/create-department
GET    /api/department/get-departments
GET    /api/department/get-department-by-id
PATCH  /api/department/update-department
DELETE /api/department/delete-department
```

---

## Employee

```http
POST   /api/employee/create-employee
GET    /api/employee/get-employees
GET    /api/employee/get-employee
PATCH  /api/employee/update-employee
DELETE /api/employee/status-update-employee
```

---

## Payroll

```http
POST   /api/payroll/upload
GET    /api/payroll/runs
GET    /api/payroll/run
PATCH  /api/payroll/entry
DELETE /api/payroll/entry
DELETE /api/payroll/run
GET    /api/payroll/pay-statement
```

---

## Tax (Admin)

```http
GET    /api/tax/declarations
GET    /api/tax/summary
GET    /api/tax/declaration
GET    /api/tax/export/tracking
GET    /api/tax/export/declaration

PATCH  /api/tax/approve
PATCH  /api/tax/reject

POST   /api/tax/proof
DELETE /api/tax/proof
```

---

## Tax (Employee Self-Service)

```http
GET    /api/me/tax/declaration
PATCH  /api/me/tax/declaration
POST   /api/me/tax/submit

POST   /api/me/tax/proof
DELETE /api/me/tax/proof
```

---

# 💰 Salary Structure Engine

The salary engine supports multiple component calculation strategies.

```text
FIXED
PERCENTAGE_OF_CTC
PERCENTAGE_OF_BASIC
PERCENTAGE_OF_GROSS
FORMULA
BALANCING
```

### Calculation Order

```text
FIXED
    ↓
PERCENTAGE_OF_CTC
    ↓
PERCENTAGE_OF_BASIC
    ↓
FORMULA
    ↓
BALANCING
```

---

# 📊 Payroll Processing Flow

```text
Excel Upload
      │
      ▼
S3 Storage
      │
      ▼
Payroll Parser
      │
      ▼
Validation
      │
      ▼
Payroll Run
      │
      ▼
Payroll Entries
      │
      ▼
Payslips
```

---

# 🧾 Tax Declaration Lifecycle

```text
DRAFT
   │
   ▼
SUBMITTED
   │
 ┌─┴─────────┐
 ▼           ▼
APPROVED   REJECTED
               │
               ▼
             DRAFT
```

---

# 🗄️ Database Models

### Identity

```text
User
Credential
RefreshToken
```

### Organization

```text
Company
Department
PayrollSetting
```

### Employee

```text
Employee
InviteToken
SalaryStructure
SalaryStructureComponent
```

### Payroll

```text
PayrollComponent
PayrollRun
PayrollEntry
PayrollEntryComponent
Payslip
GeneratedDocument
```

### Tax

```text
TaxDeclaration
TaxDeclarationItem
TaxRegimeConfig
```

### Audit

```text
AuditLog
```

---

# ⚙️ Environment Variables

Create a `.env` file:

```env
DATABASE_URL=

PORT=3000

NODE_ENV=development

AUTH_ACCESS_TOKEN_SECRET=
AUTH_REFRESH_TOKEN_SECRET=

AWS_REGION=
FCX_AWS_ACCESS_KEY=
FCX_AWS_ACCESS_KEY_SECRET=
FCX_S3_BUCKET=

TRANSACTIONAL_DOMAIN_EMAIL=

BETTERSTACK_TOKEN=
BETTERSTACK_URL=
```

---

# 🛠 Installation

## Clone Repository

```bash
git clone <repository-url>

cd payroll-tax-declaration-api
```

## Install Dependencies

```bash
npm install
```

## Run Migrations

```bash
npx prisma migrate deploy
```

## Seed Initial Data

```bash
npx tsx prisma/seed.ts
```

## Start Development Server

```bash
npm run dev
```

---

# 📦 Build

```bash
npm run build
```

---

# 🚀 Production

```bash
npm run start
```

---

# 🧪 Health Check

```http
GET /api/health
```

Response:

```json
{
  "success": true
}
```

---

# 🔒 Security

* Password Hashing using Bcrypt
* JWT Authentication
* Refresh Token Rotation
* Company-Level Data Isolation
* Request Validation using Zod
* Audit Logging
* Soft Delete Strategy
* Secure AWS S3 Storage
* Role-Based Access Control

---

# 📄 License

Private Proprietary Software.

All rights reserved.

---

## Maintainers

**Payroll & Tax Declaration Team**

Built using:

* Node.js
* TypeScript
* Prisma
* PostgreSQL
* AWS S3
* AWS SES

Documentation source: uploaded repository documentation. 
