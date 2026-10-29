# Nexus API Client

Open this folder as a Bruno collection and select the **Local** environment. The default API URL is `http://localhost:3000/api`, matching the service's default port. Update `baseUrl` if your local server uses another port.

Set the environment values (`email`, `password`, `companyId`, and the relevant resource IDs) for your local data. Run **Login** first; its response stores the access and refresh tokens for subsequent requests. OTP and invitation requests use the `otp` and `inviteToken` values.

Requests are grouped by API area and follow the routes mounted by the server under `/api`.

The **Student** folder covers organization-scoped student administration, same-branch department memberships, admission-code registration, and a student's own profile and activity history. Set `companyId`, `branchId`, `departmentId`, and `staffUserId` for your local tenant. **Create Admission Code** saves its one-time raw code to `studentCode`; **Student Signup** uses that value and stores the created profile ID as `studentId`. Set `studentEmail`, `studentPassword`, and `admissionNumber` before signup. Student self-service requests use `/student/me` and need a student access token. **Request Student Setup** and **Complete Student Setup** support staff-created accounts; the emailed setup OTP is entered in `otp`.
