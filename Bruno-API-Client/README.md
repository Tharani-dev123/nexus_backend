# Nexus API Client

Open this folder as a Bruno collection and select the **Local** environment. The default API URL is `http://localhost:3000/api`, matching the service's default port. Update `baseUrl` if your local server uses another port.

Set the environment values (`email`, `password`, `companyId`, and the relevant resource IDs) for your local data. Run **Login** first; its response stores the access and refresh tokens for subsequent requests. OTP and invitation requests use the `otp` and `inviteToken` values.

Requests are grouped by API area and follow the routes mounted by the server under `/api`.
