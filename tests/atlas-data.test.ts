import { describe, expect, it } from "vitest";

import { assets, commandBrief, initialTasks, orders, projects } from "../lib/atlas-data";

describe("Atlas operational workspace", () => {
  it("keeps active work linked to valid assets and projects", () => {
    const assetIds = new Set(assets.map((asset) => asset.id));
    const projectIds = new Set(projects.map((project) => project.id));

    initialTasks.forEach((task) => {
      if (task.relatedAssetId) expect(assetIds.has(task.relatedAssetId)).toBe(true);
      if (task.relatedProjectId) expect(projectIds.has(task.relatedProjectId)).toBe(true);
    });
  });

  it("has a consequence-bearing exception and associated commercial commitment", () => {
    expect(initialTasks.some((task) => task.severity === "critical")).toBe(true);
    expect(orders.some((order) => order.status === "At risk")).toBe(true);
    expect(commandBrief.recommendation).toContain("Job 182");
  });

  it("provides a digital identity and next action for every registered asset", () => {
    assets.forEach((asset) => {
      expect(asset.code).not.toHaveLength(0);
      expect(asset.serial).not.toHaveLength(0);
      expect(asset.nextAction).not.toHaveLength(0);
      expect(asset.health).toBeGreaterThanOrEqual(0);
      expect(asset.health).toBeLessThanOrEqual(100);
    });
  });
});
