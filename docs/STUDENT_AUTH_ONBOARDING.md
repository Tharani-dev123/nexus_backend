# Student onboarding and OTP security

## Organization-controlled registration

Self-registration is off by default (`Company.studentSelfRegistrationEnabled`). An organization administrator enables or disables it with `PATCH /api/students/self-registration?companyId=...` and `{ "enabled": true }`.

The organization creates an admission code scoped to one active branch with `POST /api/students/admission-codes?companyId=...`. The raw code is returned once; the database stores only its hash. Revoke it with `DELETE /api/students/admission-codes/:codeId?companyId=...`.

`POST /api/students/signup` accepts an admission code, identity/profile fields, department IDs, and a password. It does not accept company, branch, or role fields. The code selects the company and branch. Departments are checked against that same scope. Self-registration codes require the organization setting to be enabled; invitation/admission codes can be redeemed while self-registration is disabled. Codes can require administrator approval.

Staff-created student accounts start with `mustChangePassword=true` and no password credential. A one-time setup code is emailed; the student requests another with `POST /api/auth/request-student-setup` and completes setup with `POST /api/auth/complete-student-setup`. Normal login and authenticated access remain unavailable until setup finishes. For any account with a temporary password credential and the flag set, authentication middleware permits only the existing password-change route until the flag is cleared.

## OTP storage and limits

OTP challenges and per-email/per-IP counters live in PostgreSQL, so application instances share state. Only HMAC digests are stored. Codes expire after 10 minutes, are single-use, allow five verification attempts, have a 60-second resend cooldown, and are limited to three sends per email and 20 sends per IP per purpose/hour. Verification attempts are also limited by IP. Requests return generic success messages for ineligible or unknown accounts.

Set `AUTH_OTP_PEPPER` to the same secret on every application instance. If unset, OTP HMACs use the existing `AUTH_ACCESS_TOKEN_SECRET`. Changing the selected HMAC secret invalidates outstanding challenges.

Active students can sign in with password or OTP. Student status is checked during password login, OTP login, password reset, and authenticated requests. OTP access remains disabled for staff accounts that already have a password credential; passwordless staff login continues to use the existing OTP endpoints.

## PostgreSQL integration tests

Set `TEST_DATABASE_URL` to the endpoint URL for a dedicated Neon test branch and configure `AUTH_OTP_PEPPER` or `AUTH_ACCESS_TOKEN_SECRET`. Also set `ALLOW_NEON_TEST_BRANCH=true`, `NEON_API_KEY`, `NEON_PROJECT_ID`, and `NEON_TEST_BRANCH_ID`. Before running migrations, the runner uses the Neon API to verify that this exact branch exists, is non-primary, has a test-segment name, and owns the endpoint in `TEST_DATABASE_URL`. It also rejects a test target equal to `DATABASE_URL`. The runner passes both `DATABASE_URL` and `TEST_DATABASE_URL` to Vitest, sets `STUDENT_INTEGRATION_SAFE=1` only after branch verification, and fails if zero tests execute or all tests are skipped. Fixtures clean up only their own rows; the runner never drops, resets, or truncates the database. Run with `npm run test:integration`.
