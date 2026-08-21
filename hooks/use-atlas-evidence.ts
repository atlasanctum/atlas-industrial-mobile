import * as Network from "expo-network";
import { useCallback, useEffect, useRef, useState } from "react";

import { markEvidenceUploaded, readEvidenceQueue, recordEvidenceAttempt, removeUploadedEvidence, type EvidenceInput, queueEvidenceFile } from "@/lib/atlas-evidence-queue";
import { trpc } from "@/lib/trpc";
import type { AtlasEvidenceDraft } from "@/shared/atlas-domain";

export function useAtlasEvidenceQueue({ autoFlush = true }: { autoFlush?: boolean } = {}) {
  const network = Network.useNetworkState();
  const upload = trpc.atlas.uploadEvidence.useMutation();
  const [items, setItems] = useState<AtlasEvidenceDraft[]>([]);
  const [loaded, setLoaded] = useState(false);
  const autoFlushAttempted = useRef(false);

  const refresh = useCallback(async () => {
    const queue = await readEvidenceQueue();
    setItems(queue);
    setLoaded(true);
    return queue;
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);
  const online = network.isInternetReachable === true;

  const flush = useCallback(async () => {
    const queue = await readEvidenceQueue();
    if (!online || upload.isPending) return { uploaded: 0, pending: queue.length };
    let uploaded = 0;
    for (const item of queue.filter((candidate) => candidate.status !== "uploaded")) {
      try {
        const base64 = await (await import("expo-file-system/legacy")).readAsStringAsync(item.localUri, { encoding: "base64" as never });
        const response = await upload.mutateAsync({ id: item.id, eventClientId: item.eventClientId, entityType: item.entityType, entityId: item.entityId, contentType: item.contentType, filename: item.filename, sizeBytes: item.sizeBytes, base64 });
        await markEvidenceUploaded(item.id, response.url);
        await removeUploadedEvidence(item.id);
        uploaded += 1;
      } catch {
        await recordEvidenceAttempt(item.id);
      }
    }
    const remaining = await readEvidenceQueue();
    setItems(remaining);
    return { uploaded, pending: remaining.length };
  }, [online, upload]);

  useEffect(() => {
    if (!online) { autoFlushAttempted.current = false; return; }
    if (autoFlush && loaded && items.length > 0 && !autoFlushAttempted.current) { autoFlushAttempted.current = true; void flush(); }
  }, [autoFlush, flush, items.length, loaded, online]);

  const queueFile = useCallback(async (input: EvidenceInput) => {
    const draft = await queueEvidenceFile(input);
    setItems((current) => [...current, draft]);
    return draft;
  }, []);

  return { items, loaded, online, isUploading: upload.isPending, queueFile, flush, refresh };
}
