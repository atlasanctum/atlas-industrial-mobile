import { AppState } from "react-native";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, type PropsWithChildren } from "react";

import { useAtlasEvidenceQueue } from "@/hooks/use-atlas-evidence";
import { useAtlasEventQueue } from "@/hooks/use-atlas-live";
import { coordinateAtlasSync, type AtlasSyncResult } from "@/lib/atlas-sync";

type AtlasSyncContextValue = {
  events: ReturnType<typeof useAtlasEventQueue>;
  evidence: ReturnType<typeof useAtlasEvidenceQueue>;
  online: boolean;
  pendingCount: number;
  isSyncing: boolean;
  syncAll: () => Promise<AtlasSyncResult>;
};

const AtlasSyncContext = createContext<AtlasSyncContextValue | null>(null);

export function AtlasSyncProvider({ children }: PropsWithChildren) {
  const events = useAtlasEventQueue({ autoFlush: false });
  const evidence = useAtlasEvidenceQueue({ autoFlush: false });
  const autoSyncAttempted = useRef(false);
  const online = events.online && evidence.online;
  const pendingCount = events.queue.length + evidence.items.length;
  const isSyncing = events.isSyncing || evidence.isUploading;
  const syncAll = useCallback(() => coordinateAtlasSync(events.flush, evidence.flush), [events.flush, evidence.flush]);

  useEffect(() => {
    if (!online) { autoSyncAttempted.current = false; return; }
    if (events.isLoaded && evidence.loaded && pendingCount > 0 && !autoSyncAttempted.current && !isSyncing) {
      autoSyncAttempted.current = true;
      void syncAll();
    }
  }, [evidence.loaded, events.isLoaded, isSyncing, online, pendingCount, syncAll]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active" && online && pendingCount > 0 && !isSyncing) void syncAll();
    });
    return () => subscription.remove();
  }, [isSyncing, online, pendingCount, syncAll]);

  const value = useMemo(() => ({ events, evidence, online, pendingCount, isSyncing, syncAll }), [events, evidence, online, pendingCount, isSyncing, syncAll]);
  return <AtlasSyncContext.Provider value={value}>{children}</AtlasSyncContext.Provider>;
}

export function useAtlasSync() {
  const context = useContext(AtlasSyncContext);
  if (!context) throw new Error("useAtlasSync must be used within AtlasSyncProvider.");
  return context;
}
