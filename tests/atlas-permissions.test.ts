import { describe, expect, it } from "vitest";

import { hasAtlasPermission, permissionsForRole } from "../shared/atlas-domain";

describe("Atlas role authorization", () => {
  it("allows field operators to record scans but not approve recommendations", () => {
    expect(hasAtlasPermission("operator", "scan:record")).toBe(true);
    expect(hasAtlasPermission("operator", "event:record")).toBe(true);
    expect(hasAtlasPermission("operator", "recommendation:approve")).toBe(false);
  });

  it("requires a managerial authority for recommendation approval", () => {
    expect(hasAtlasPermission("manager", "recommendation:approve")).toBe(true);
    expect(hasAtlasPermission("executive", "recommendation:approve")).toBe(true);
    expect(hasAtlasPermission("inspector", "recommendation:approve")).toBe(false);
  });

  it("keeps the auditor role read-only", () => {
    const permissions = permissionsForRole("auditor");
    expect(permissions).toContain("workspace:view");
    expect(permissions).not.toContain("event:record");
    expect(permissions).not.toContain("intelligence:ask");
  });
});
