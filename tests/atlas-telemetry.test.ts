import { describe, expect, it } from "vitest";

import { deriveMaintenanceSignal, hasAtlasPermission, isValidTelemetryReading, type AtlasTelemetryReading } from "../shared/atlas-domain";

const reading = (value: number, observedAt = "2026-08-20T08:42:00.000Z"): AtlasTelemetryReading => ({ id: `telemetry-${value}`, assetId: "MX-14", metric: "temperature_c", value, observedAt });

describe("Atlas predictive maintenance signals", () => {
  it("derives a transparent high-risk action from a threshold-exceeding live reading", () => {
    const signal = deriveMaintenanceSignal([reading(84), reading(83, "2026-08-20T08:41:00.000Z"), reading(82.5, "2026-08-20T08:40:00.000Z")]);
    expect(signal?.risk).toBe("high");
    expect(signal?.confidence).toBe("high");
    expect(signal?.recommendedAction).toContain("Inspect the cooling path");
  });

  it("retains low-risk readings as observations without creating a maintenance demand", () => {
    const signal = deriveMaintenanceSignal([reading(61)]);
    expect(signal?.risk).toBe("low");
    expect(signal?.recommendedAction).toContain("Continue observation");
  });

  it("keeps evidence uploads and control verification inside Atlas role authority", () => {
    expect(hasAtlasPermission("inspector", "evidence:upload")).toBe(true);
    expect(hasAtlasPermission("inspector", "control:complete")).toBe(true);
    expect(hasAtlasPermission("auditor", "evidence:upload")).toBe(false);
  });

  it("rejects malformed gateway readings before they can affect maintenance signals", () => {
    expect(isValidTelemetryReading({ assetId: "MX-14", metric: "temperature_c", value: 74, observedAt: "2026-08-20T08:42:00.000Z" })).toBe(true);
    expect(isValidTelemetryReading({ assetId: "MX-14", metric: "temperature_c", value: -1, observedAt: "2026-08-20T08:42:00.000Z" })).toBe(false);
    expect(isValidTelemetryReading({ assetId: "MX-14", metric: "temperature_c", value: 74, observedAt: "not-a-date" })).toBe(false);
  });
});
