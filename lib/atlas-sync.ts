export type AtlasEventSyncResult = { synced: number; remaining: number };
export type AtlasEvidenceSyncResult = { uploaded: number; pending: number };
export type AtlasSyncResult = { events: AtlasEventSyncResult; evidence: AtlasEvidenceSyncResult; deferredEvidence: boolean };

export async function coordinateAtlasSync(eventFlush: () => Promise<AtlasEventSyncResult>, evidenceFlush: () => Promise<AtlasEvidenceSyncResult>): Promise<AtlasSyncResult> {
  const events = await eventFlush();
  if (events.remaining > 0) return { events, evidence: { uploaded: 0, pending: 0 }, deferredEvidence: true };
  const evidence = await evidenceFlush();
  return { events, evidence, deferredEvidence: false };
}
