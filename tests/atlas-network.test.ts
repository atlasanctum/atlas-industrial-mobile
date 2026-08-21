import { describe, expect, it } from "vitest";

import { canShareNetworkRecord, rankNetworkMatches, type AtlasCapacityOffer, type AtlasNetworkDemand } from "../shared/atlas-domain";

const demand: AtlasNetworkDemand = { id: "demand-1", title: "CNC order", requiredCapability: "CNC Machining", requiredHours: 24, dueInDays: 8, minimumQuality: 90, requiredCertification: "ISO 9001", region: "Nairobi" };
const offers: AtlasCapacityOffer[] = [
  { id: "fast", participantId: "one", capability: "CNC Machining", availableHours: 40, earliestStart: "today", leadTimeDays: 2, costIndex: 75, qualityScore: 94, reliabilityScore: 95, resilienceScore: 82, impactScore: 80, certifications: ["ISO 9001"], visibility: "partner" },
  { id: "cost", participantId: "two", capability: "CNC Machining", availableHours: 40, earliestStart: "today", leadTimeDays: 6, costIndex: 30, qualityScore: 91, reliabilityScore: 91, resilienceScore: 94, impactScore: 88, certifications: ["ISO 9001"], visibility: "consortium" },
  { id: "private", participantId: "three", capability: "CNC Machining", availableHours: 80, earliestStart: "today", leadTimeDays: 1, costIndex: 10, qualityScore: 99, reliabilityScore: 99, resilienceScore: 99, impactScore: 99, certifications: ["ISO 9001"], visibility: "private" },
];

describe("Atlas industrial network", () => {
  it("preserves privacy visibility boundaries", () => {
    expect(canShareNetworkRecord("private", "partner")).toBe(false);
    expect(canShareNetworkRecord("partner", "partner")).toBe(true);
    expect(canShareNetworkRecord("consortium", "partner")).toBe(false);
    expect(canShareNetworkRecord("public", "public")).toBe(true);
  });

  it("ranks only eligible non-private capacity against the selected objective", () => {
    expect(rankNetworkMatches(demand, offers, "fastest").map((match) => match.offerId)).toEqual(["fast", "cost"]);
    expect(rankNetworkMatches(demand, offers, "lowest_cost")[0]?.offerId).toBe("cost");
  });
});
