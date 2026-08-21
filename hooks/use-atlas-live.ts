import * as Network from "expo-network";
import { useCallback, useEffect, useRef, useState } from "react";

import { acknowledgeAtlasEvents, enqueueAtlasEvent, readQueuedAtlasEvents, recordSyncAttempt, type QueuedAtlasEvent } from "@/lib/atlas-queue";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/hooks/use-auth";

export function useAtlasWorkspace() {
  const auth = useAuth();
  const workspace = trpc.atlas.workspace.useQuery(undefined, { enabled: auth.isAuthenticated, retry: false });
  return { ...workspace, auth };
}

export function useAtlasEventQueue({ autoFlush = true }: { autoFlush?: boolean } = {}) {
  const network = Network.useNetworkState();
  const sync = trpc.atlas.syncEvents.useMutation();
  const [queue, setQueue] = useState<QueuedAtlasEvent[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const autoSyncAttempted = useRef(false);

  const refresh = useCallback(async () => {
    const events = await readQueuedAtlasEvents();
    setQueue(events);
    setIsLoaded(true);
    return events;
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const online = network.isInternetReachable === true;
  const flush = useCallback(async () => {
    const events = await readQueuedAtlasEvents();
    if (!online || events.length === 0 || sync.isPending) return { synced: 0, remaining: events.length };
    try {
      const response = await sync.mutateAsync({ events });
      const remaining = await acknowledgeAtlasEvents(response.accepted);
      setQueue(remaining);
      return { synced: response.accepted.length, remaining: remaining.length };
    } catch {
      const retried = await recordSyncAttempt();
      setQueue(retried);
      return { synced: 0, remaining: retried.length };
    }
  }, [online, sync]);

  useEffect(() => {
    if (!online) {
      autoSyncAttempted.current = false;
      return;
    }
    if (autoFlush && isLoaded && queue.length > 0 && !autoSyncAttempted.current) {
      autoSyncAttempted.current = true;
      void flush();
    }
  }, [autoFlush, flush, isLoaded, online, queue.length]);

  const enqueue = useCallback(async (...args: Parameters<typeof enqueueAtlasEvent>) => {
    const event = await enqueueAtlasEvent(...args);
    setQueue((current) => [...current, event]);
    return event;
  }, []);

  return { queue, isLoaded, online, isSyncing: sync.isPending, enqueue, flush, refresh };
}
