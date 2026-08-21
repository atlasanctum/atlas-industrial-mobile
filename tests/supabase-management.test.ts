import { describe, expect, it } from "vitest";

const managementToken = process.env.SUPABASE_ACCESS_TOKEN;
const projectRef = process.env.SUPABASE_PROJECT_REF;
const describeWithManagementAccess = managementToken && projectRef ? describe : describe.skip;

describeWithManagementAccess("Supabase Management API configuration", () => {
  it("accepts the configured token for the target project", async () => {
    const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}`, {
      headers: { Authorization: `Bearer ${managementToken}` },
    });
    expect(response.ok).toBe(true);
  });
});
