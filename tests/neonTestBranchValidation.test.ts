import { describe, expect, it } from "vitest";
import { normalizeNeonHostname, validateNeonBranch } from "../scripts/neon-test-branch.js";

const branch = {
  id: "br_student_test",
  project_id: "project_student_app",
  name: "student-test",
  primary: false,
};
const testEndpoint = {
  branch_id: branch.id,
  host: "ep-student-test.c-6.us-east-2.aws.neon.tech",
  current_state: "active",
};

describe("Neon test branch endpoint validation", () => {
  it("matches a direct endpoint hostname returned by Neon", () => {
    expect(validateNeonBranch({
      branch,
      endpoints: [testEndpoint],
      projectId: branch.project_id,
      branchId: branch.id,
      testHost: testEndpoint.host,
    }).endpointHost).toBe(testEndpoint.host);
    expect(normalizeNeonHostname(testEndpoint.host)).toBe(testEndpoint.host);
  });

  it("matches a pooled hostname to the direct hostname returned by Neon", () => {
    expect(normalizeNeonHostname("EP-STUDENT-TEST-POOLER.c-6.us-east-2.aws.neon.tech")).toBe(testEndpoint.host);
    expect(validateNeonBranch({
      branch,
      endpoints: [testEndpoint],
      projectId: branch.project_id,
      branchId: branch.id,
      testHost: "ep-student-test-pooler.c-6.us-east-2.aws.neon.tech",
    }).endpointHost).toBe(testEndpoint.host);
  });

  it("rejects an API branch ID that differs from the configured test branch ID", () => {
    expect(() => validateNeonBranch({
      branch,
      endpoints: [testEndpoint],
      projectId: branch.project_id,
      branchId: "br_unrelated_test",
      testHost: testEndpoint.host,
    })).toThrow("NEON_TEST_BRANCH_ID does not match");
  });

  it("validates project identity and requires a non-primary test-named branch", () => {
    expect(() => validateNeonBranch({
      branch,
      endpoints: [testEndpoint],
      projectId: "project_other",
      branchId: branch.id,
      testHost: testEndpoint.host,
    })).toThrow("NEON_PROJECT_ID does not match");
    expect(() => validateNeonBranch({
      branch: { ...branch, primary: true },
      endpoints: [testEndpoint],
      projectId: branch.project_id,
      branchId: branch.id,
      testHost: testEndpoint.host,
    })).toThrow("non-primary");
    expect(() => validateNeonBranch({
      branch: { ...branch, name: "production" },
      endpoints: [testEndpoint],
      projectId: branch.project_id,
      branchId: branch.id,
      testHost: testEndpoint.host,
    })).toThrow("name containing a 'test' segment");
  });

  it("rejects a production endpoint hostname even when it is a Neon endpoint", () => {
    const productionEndpoint = {
      branch_id: "br_production",
      host: "ep-production.c-6.us-east-2.aws.neon.tech",
      current_state: "active",
    };
    expect(() => validateNeonBranch({
      branch,
      endpoints: [productionEndpoint],
      projectId: branch.project_id,
      branchId: branch.id,
      testHost: productionEndpoint.host,
    })).toThrow("does not match any hostname returned");
  });
});
