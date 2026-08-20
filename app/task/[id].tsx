import { router, useLocalSearchParams } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { Icon, IconAction, PrimaryButton, SectionTitle, SeverityPill, Surface } from "@/components/atlas-ui";
import { ScreenContainer } from "@/components/screen-container";
import { useAtlas } from "@/lib/atlas-store";
import { useAtlasEventQueue, useAtlasWorkspace } from "@/hooks/use-atlas-live";
import { mapLiveWorkItem, type LiveAtlasRecord } from "@/lib/atlas-live-mappers";

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { tasks, updateTaskStatus, notify } = useAtlas();
  const workspace = useAtlasWorkspace();
  const queue = useAtlasEventQueue();
  const liveTask = workspace.data?.status === "ready" ? (workspace.data.workItems as LiveAtlasRecord[]).find((item) => item.id === id) : undefined;
  const task = tasks.find((item) => item.id === id) ?? (liveTask ? mapLiveWorkItem(liveTask) : undefined);
  if (!task) return <ScreenContainer className="flex-1" edges={["top", "left", "right", "bottom"]} containerClassName="bg-background"><View style={styles.missing}><IconAction name="arrow-back" label="Back" onPress={() => router.back()} /><Text style={styles.missingTitle}>Work context is not available</Text><Text style={styles.missingBody}>This work item is outside your current role scope or has not synchronized to the workspace yet.</Text></View></ScreenContainer>;
  const completed = task.status === "Completed";
  const start = async () => {
    const targetStatus = task.status === "In progress" ? "Completed" : "In progress";
    updateTaskStatus(task.id, targetStatus);
    await queue.enqueue({ eventType: targetStatus === "Completed" ? "work_completed" : "work_started", entityType: "work_item", entityId: task.id, payload: { status: targetStatus, source: "work_detail" } });
    notify(queue.online ? "Work-state event recorded and will synchronize." : "Work-state event queued safely for synchronization.", "success");
  };
  return <ScreenContainer className="flex-1" edges={["top", "left", "right", "bottom"]} containerClassName="bg-background"><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <View style={styles.header}><IconAction name="arrow-back" label="Back" onPress={() => router.back()} /><Text style={styles.headerTitle}>Work detail</Text><IconAction name="more-horiz" label="More work options" onPress={() => notify("Work transitions remain traceable within the local prototype state.")} /></View>
    <Surface style={styles.hero}><View style={styles.heroTop}><SeverityPill severity={task.severity} /><Text style={styles.taskId}>{task.id}</Text></View><Text style={styles.taskTitle}>{task.title}</Text><Text style={styles.taskMeta}>{task.type} · {task.location}</Text><View style={styles.statusRow}><View style={[styles.statusIcon, { backgroundColor: completed ? "#173B35" : task.status === "In progress" ? "#1C3245" : "#3A2C16" }]}><Icon name={completed ? "check-circle" : task.status === "In progress" ? "play-circle" : "schedule"} color={completed ? "#21D4C2" : task.status === "In progress" ? "#78B6FF" : "#F5B84B"} size={18} /></View><View><Text style={styles.statusLabel}>WORK STATUS</Text><Text style={styles.statusValue}>{task.status}</Text></View><Text style={styles.due}>{task.due}</Text></View></Surface>
    <SectionTitle eyebrow="Operational assignment" title="Who, what & where" />
    <Surface style={styles.assignment}><View style={styles.assignmentRow}><Icon name="person" color="#9CC7E9" size={19} /><View><Text style={styles.rowLabel}>Owner</Text><Text style={styles.rowValue}>{task.owner}</Text></View></View><View style={styles.assignmentRow}><Icon name="location-on" color="#9CC7E9" size={19} /><View><Text style={styles.rowLabel}>Location</Text><Text style={styles.rowValue}>{task.location}</Text></View></View><View style={styles.assignmentRow}><Icon name="handyman" color="#9CC7E9" size={19} /><View><Text style={styles.rowLabel}>Required resources</Text><Text style={styles.rowValue}>{task.resources}</Text></View></View></Surface>
    <SectionTitle eyebrow="Procedure" title="Execute with control" />
    <Surface style={styles.procedure}><View style={styles.stepNumber}><Text style={styles.stepNumberText}>1</Text></View><View style={styles.procedureBody}><Text style={styles.procedureTitle}>Controlled work procedure</Text><Text style={styles.procedureText}>{task.procedure}</Text></View></Surface>
    <SectionTitle eyebrow="Verification" title="Evidence required" />
    <Surface style={styles.evidence}><View style={styles.evidenceIcon}><Icon name="verified" color="#21D4C2" size={21} /></View><View style={styles.evidenceBody}><Text style={styles.evidenceTitle}>{task.evidence}</Text><Text style={styles.evidenceText}>A completed task records actor, time, location, resulting state, and verification evidence.</Text></View></Surface>
    <View style={styles.actions}>{!completed ? <PrimaryButton label={task.status === "In progress" ? "Verify & complete" : "Start work"} icon={task.status === "In progress" ? "check" : "play-arrow"} onPress={start} /> : <Surface style={styles.completed}><Icon name="check-circle" color="#21D4C2" size={20} /><Text style={styles.completedText}>This work is verified and recorded.</Text></Surface>}<PrimaryButton label="Add evidence note" kind="secondary" icon="note-add" onPress={() => notify("Evidence note captured in the local event record.", "success")} /></View>
  </ScrollView></ScreenContainer>;
}

const styles = StyleSheet.create({
  content: { gap: 17, paddingBottom: 30, paddingHorizontal: 18, paddingTop: 8 },
  header: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  headerTitle: { color: "#E8F0F1", fontSize: 15, fontWeight: "800" },
  hero: { gap: 10, padding: 16 },
  heroTop: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  taskId: { color: "#7E9399", fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  taskTitle: { color: "#E8F0F1", fontSize: 23, fontWeight: "800", letterSpacing: -0.6, lineHeight: 30 },
  taskMeta: { color: "#9AAEB3", fontSize: 12, lineHeight: 17 },
  statusRow: { alignItems: "center", backgroundColor: "#17242A", borderRadius: 13, flexDirection: "row", gap: 9, marginTop: 5, padding: 11 },
  statusIcon: { alignItems: "center", borderRadius: 11, height: 34, justifyContent: "center", width: 34 },
  statusLabel: { color: "#778D94", fontSize: 9, fontWeight: "900", letterSpacing: 0.8 },
  statusValue: { color: "#D7E4E6", fontSize: 12, fontWeight: "800", marginTop: 2 },
  due: { color: "#B9CBCF", fontSize: 11, fontWeight: "700", marginLeft: "auto", textAlign: "right" },
  assignment: { gap: 14, padding: 15 },
  assignmentRow: { alignItems: "flex-start", flexDirection: "row", gap: 11 },
  rowLabel: { color: "#7C9198", fontSize: 10, fontWeight: "800", textTransform: "uppercase" },
  rowValue: { color: "#D2E0E2", fontSize: 13, fontWeight: "700", lineHeight: 19, marginTop: 3, maxWidth: 290 },
  procedure: { alignItems: "flex-start", flexDirection: "row", gap: 11, padding: 14 },
  stepNumber: { alignItems: "center", backgroundColor: "#1E3B3C", borderRadius: 15, height: 30, justifyContent: "center", width: 30 },
  stepNumberText: { color: "#85EDE0", fontSize: 12, fontWeight: "900" },
  procedureBody: { flex: 1, gap: 5 },
  procedureTitle: { color: "#E1EBEC", fontSize: 13, fontWeight: "800" },
  procedureText: { color: "#A7B9BD", fontSize: 12, lineHeight: 19 },
  evidence: { alignItems: "flex-start", flexDirection: "row", gap: 11, padding: 14 },
  evidenceIcon: { alignItems: "center", backgroundColor: "#183536", borderRadius: 12, height: 41, justifyContent: "center", width: 41 },
  evidenceBody: { flex: 1, gap: 4 },
  evidenceTitle: { color: "#D7E4E6", fontSize: 12, fontWeight: "800", lineHeight: 18 },
  evidenceText: { color: "#859AA1", fontSize: 11, lineHeight: 16 },
  actions: { gap: 9 },
  completed: { alignItems: "center", flexDirection: "row", gap: 9, justifyContent: "center", minHeight: 48, paddingHorizontal: 16 },
  completedText: { color: "#91E7DC", fontSize: 13, fontWeight: "800" },
  missing: { alignItems: "center", flex: 1, gap: 14, justifyContent: "center", paddingHorizontal: 30 },
  missingTitle: { color: "#E8F0F1", fontSize: 20, fontWeight: "800", textAlign: "center" },
  missingBody: { color: "#A4B6BA", fontSize: 13, lineHeight: 20, textAlign: "center" },
});
