import { Pressable, StyleSheet, Text, View } from "react-native";

import { Icon, Surface } from "@/components/atlas-ui";
import { useAtlasEventQueue, useAtlasWorkspace } from "@/hooks/use-atlas-live";
import { startOAuthLogin } from "@/constants/oauth";

export function LiveWorkspaceStatus() {
  const workspace = useAtlasWorkspace();
  const queue = useAtlasEventQueue();
  const state = !workspace.auth.isAuthenticated ? "Sign in to activate live workspace" : workspace.isLoading ? "Connecting to live workspace" : workspace.data?.status === "ready" ? `${workspace.data.member?.role ?? "member"} access · live data` : workspace.data?.status === "awaiting_role" ? "Awaiting role assignment" : workspace.error ? "Live workspace requires deployment schema" : "Deployment configuration required";
  const tone = workspace.data?.status === "ready" ? "#21D4C2" : "#F5B84B";
  return <Surface style={styles.card}><View style={[styles.icon, { backgroundColor: `${tone}20` }]}><Icon name={workspace.data?.status === "ready" ? "cloud-done" : "cloud-queue"} color={tone} size={18} /></View><View style={styles.copy}><Text style={styles.label}>LIVE WORKSPACE</Text><Text style={styles.state}>{state}</Text>{queue.queue.length > 0 ? <Text style={styles.queue}>{queue.queue.length} field event{queue.queue.length === 1 ? "" : "s"} queued for sync</Text> : null}</View>{!workspace.auth.isAuthenticated ? <Pressable onPress={() => void startOAuthLogin()} style={styles.sync}><Text style={styles.syncText}>Sign in</Text></Pressable> : queue.queue.length > 0 && queue.online ? <Pressable onPress={() => void queue.flush()} style={styles.sync}><Text style={styles.syncText}>{queue.isSyncing ? "Syncing" : "Sync"}</Text></Pressable> : null}</Surface>;
}

const styles = StyleSheet.create({
  card: { alignItems: "center", flexDirection: "row", gap: 10, padding: 12 },
  icon: { alignItems: "center", borderRadius: 11, height: 36, justifyContent: "center", width: 36 },
  copy: { flex: 1, gap: 2 },
  label: { color: "#7F949B", fontSize: 9, fontWeight: "900", letterSpacing: 0.8 },
  state: { color: "#D7E4E6", fontSize: 12, fontWeight: "800" },
  queue: { color: "#F5D391", fontSize: 10, fontWeight: "700", marginTop: 2 },
  sync: { backgroundColor: "#1B3434", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 },
  syncText: { color: "#75E8DA", fontSize: 11, fontWeight: "800" },
});
