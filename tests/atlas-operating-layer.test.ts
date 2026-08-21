import { describe, expect, it } from "vitest";

import { explainableRiskScore, operatingStateFor, weightedIndustrialHealth, type AtlasHealthDimension } from "../shared/atlas-domain";

const dimensions: AtlasHealthDimension[] = [
  { id: "production", label: "Production", value: 90, state: "normal", evidenceState: "verified", explanation: "Within band" },
  { id: "safety", label: "Safety", value: 80, state: "watch", evidenceState: "verified", explanation: "Watch state" },
];

describe("Atlas advanced operating layer", () => {
  it("keeps health dimensions visible while deriving a composite state", () => {
    expect(weightedIndustrialHealth(dimensions)).toEqual({ value: 85, state: "watch" });
    expect(operatingStateFor(54)).toBe("critical");
    expect(operatingStateFor(75)).toBe("watch");
  });

  it("returns an explainable risk state from bounded industrial inputs", () => {
    expect(explainableRiskScore({ probability: 90, impact: 90, exposure: 80, detectability: 70 })).toEqual({ score: 85, state: "critical" });
    expect(explainableRiskScore({ probability: -5, impact: 20, exposure: 20, detectability: 20 }).state).toBe("normal");
  });
});
