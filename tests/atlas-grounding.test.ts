import { describe, expect, it } from "vitest";

import { normalizeGroundedRecommendation } from "../shared/atlas-domain";

describe("Atlas grounded recommendation guard", () => {
  it("keeps only complete record citations and applies a valid approving role", () => {
    const recommendation = normalizeGroundedRecommendation({
      situation: "Line constraint",
      confidence: "high",
      authorizationRole: "manager",
      citations: [
        { recordType: "asset", recordId: "asset-1", label: "Machine 14" },
        { recordType: "asset", recordId: 4, label: "Invalid citation" },
      ] as never,
    }, "recommendation-1");

    expect(recommendation.citations).toEqual([{ recordType: "asset", recordId: "asset-1", label: "Machine 14" }]);
    expect(recommendation.authorizationRole).toBe("manager");
    expect(recommendation.confidence).toBe("high");
  });

  it("falls back to a controlled approval role for invalid model output", () => {
    const recommendation = normalizeGroundedRecommendation({ authorizationRole: "untrusted" as never, confidence: "certain" as never }, "recommendation-2");
    expect(recommendation.authorizationRole).toBe("manager");
    expect(recommendation.confidence).toBe("low");
  });
});
