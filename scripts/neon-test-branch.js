export class IntegrationValidationError extends Error {}

export function fail(message) {
  throw new IntegrationValidationError(message);
}

export function normalizeNeonHostname(hostname) {
  const host = String(hostname).trim().toLowerCase().replace(/\.$/, "");
  const [firstLabel, ...rest] = host.split(".");
  if (!firstLabel || rest.length === 0) return host;
  return [firstLabel.replace(/-pooler$/, ""), ...rest].join(".");
}

export function validateNeonBranch({ branch, endpoints, projectId, branchId, testHost }) {
  if (!branch || branch.id !== branchId) {
    fail("NEON_TEST_BRANCH_ID does not match the Neon branch returned by the API.");
  }
  if (branch.project_id !== projectId) {
    fail("NEON_PROJECT_ID does not match the project returned for NEON_TEST_BRANCH_ID.");
  }
  if (branch.primary !== false) {
    fail("NEON_TEST_BRANCH_ID must identify a non-primary Neon branch.");
  }
  const branchName = String(branch.name ?? "");
  if (!/(^|[-_ ])test($|[-_ ])/i.test(branchName)) {
    fail("The Neon branch identified by NEON_TEST_BRANCH_ID must have a name containing a 'test' segment.");
  }
  if (!Array.isArray(endpoints)) {
    fail("Neon did not return an endpoint list for NEON_TEST_BRANCH_ID.");
  }

  const normalizedTestHost = normalizeNeonHostname(testHost);
  const endpoint = endpoints.find((candidate) =>
    candidate.branch_id === branchId &&
    typeof candidate.host === "string" &&
    normalizeNeonHostname(candidate.host) === normalizedTestHost,
  );
  if (!endpoint) {
    fail("TEST_DATABASE_URL hostname does not match any hostname returned for NEON_TEST_BRANCH_ID.");
  }
  if (endpoint.disabled || endpoint.current_state === "disabled") {
    fail("The configured Neon test endpoint is disabled.");
  }
  return { branchName, endpointHost: endpoint.host };
}
