import { describe, expect, it, vi } from "vitest";

import { coordinateAtlasSync } from "../lib/atlas-sync";

describe("Atlas ordered synchronization", () => {
  it("flushes field events before uploading dependent evidence", async () => {
    const eventFlush = vi.fn(async () => ({ synced: 2, remaining: 0 }));
    const evidenceFlush = vi.fn(async () => ({ uploaded: 1, pending: 0 }));
    const result = await coordinateAtlasSync(eventFlush, evidenceFlush);
    expect(eventFlush).toHaveBeenCalledOnce();
    expect(evidenceFlush).toHaveBeenCalledOnce();
    expect(result.deferredEvidence).toBe(false);
    expect(result.evidence.uploaded).toBe(1);
  });

  it("defers evidence when a field event has not reached the live workspace", async () => {
    const eventFlush = vi.fn(async () => ({ synced: 0, remaining: 1 }));
    const evidenceFlush = vi.fn(async () => ({ uploaded: 1, pending: 0 }));
    const result = await coordinateAtlasSync(eventFlush, evidenceFlush);
    expect(evidenceFlush).not.toHaveBeenCalled();
    expect(result.deferredEvidence).toBe(true);
    expect(result.events.remaining).toBe(1);
  });
});
