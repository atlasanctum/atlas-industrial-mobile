import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { FloatingAct } from "@/components/atlas-runtime";
import { Icon, IconAction, LinkedRecord, SectionTitle, SeverityPill, Surface } from "@/components/atlas-ui";
import { ScreenContainer } from "@/components/screen-container";
import { useAtlas } from "@/lib/atlas-store";
import { useAtlasWorkspace } from "@/hooks/use-atlas-live";
import { mapLiveWorkItem, type LiveAtlasRecord } from "@/lib/atlas-live-mappers";

const filters = ["All", "Mine", "Urgent", "In progress"] as const;
type Filter = (typeof filters)[number];

export default function WorkScreen() {
  const { tasks, notify } = useAtlas();
  const workspace = useAtlasWorkspace();
  const [filter, setFilter] = useState<Filter>("All");
  const sourceTasks = workspace.data?.status === "ready" ? (workspace.data.workItems as LiveAtlasRecord[]).map(mapLiveWorkItem) : tasks;
  const filtered = useMemo(() => sourceTasks.filter((task) => {
    if (filter === "Mine") return task.owner === "You";
    if (filter === "Urgent") return task.severity === "critical" || task.severity === "high";
    if (filter === "In progress") return task.status === "In progress";
    return task.status !== "Completed";
  }), [filter, sourceTasks]);

  return <ScreenContainer className="flex-1" containerClassName="bg-background"><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <View style={styles.header}><View><Text style={styles.eyebrow}>Execution layer</Text><Text style={styles.title}>Work</Text></View><IconAction name="tune" label="Filter work" onPress={() => notify("Work is ordered by operational consequence.")} /></View>
    <Surface style={styles.shiftCard}><View style={styles.shiftTop}><View style={styles.shiftIcon}><Icon name="schedule" size={20} color="#21D4C2" /></View><View style={styles.shiftInfo}><Text style={styles.shiftLabel}>{workspace.data?.status === "ready" ? "Live role-scoped work" : "Your current shift"}</Text><Text style={styles.shiftTitle}>North Plant · Shift A</Text></View><Text style={styles.shiftCount}>{sourceTasks.filter((task) => task.owner === "You" && task.status !== "Completed").length} assigned</Text></View><Text style={styles.shiftNote}>Work stays connected to its asset, procedure, resources, evidence, and outcome.</Text></Surface>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>{filters.map((item) => <Pressable key={item} onPress={() => setFilter(item)} style={({ pressed }) => [styles.filter, filter === item && styles.filterActive, pressed && { opacity: 0.75 }]}><Text style={[styles.filterText, filter === item && styles.filterTextActive]}>{item}</Text></Pressable>)}</ScrollView>
    <SectionTitle eyebrow="Priority queue" title={`${filtered.length} active items`} />
    <View style={styles.workList}>{filtered.map((task) => <Pressable key={task.id} onPress={() => router.push({ pathname: "/task/[id]", params: { id: task.id } })} style={({ pressed }) => [styles.taskCard, pressed && styles.pressed]}><View style={styles.taskTop}><SeverityPill severity={task.severity} /><Text style={styles.id}>{task.id}</Text></View><Text style={styles.taskTitle}>{task.title}</Text><Text style={styles.taskMeta}>{task.type} · {task.location}</Text><View style={styles.taskFooter}><View style={styles.status}><View style={[styles.statusDot, { backgroundColor: task.status === "In progress" ? "#4E9BFF" : task.status === "Blocked" ? "#FF6B57" : "#F5B84B" }]} /><Text style={styles.statusText}>{task.status}</Text></View><Text style={styles.due}>{task.due}</Text></View></Pressable>)}</View>
    <SectionTitle eyebrow="Team coordination" title="Awaiting your attention" />
    <LinkedRecord icon="group" title="Review work owners" detail="Amina owns recovery; Diego owns Machine 14 inspection; Nora owns delivery release." onPress={() => notify("Ownership and escalation paths are shown in each work detail.")} />
    <View style={{ height: 90 }} />
  </ScrollView><FloatingAct /></ScreenContainer>;
}

const styles = StyleSheet.create({
  content: { gap: 17, paddingHorizontal: 18, paddingTop: 8 },
  header: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  eyebrow: { color: "#8EA0A7", fontSize: 10, fontWeight: "800", letterSpacing: 1.2, textTransform: "uppercase" },
  title: { color: "#E8F0F1", fontSize: 34, fontWeight: "800", letterSpacing: -1.1, marginTop: 4 },
  shiftCard: { gap: 10, padding: 14 },
  shiftTop: { alignItems: "center", flexDirection: "row", gap: 10 },
  shiftIcon: { alignItems: "center", backgroundColor: "#183536", borderRadius: 12, height: 40, justifyContent: "center", width: 40 },
  shiftInfo: { flex: 1, gap: 2 },
  shiftLabel: { color: "#8EA0A7", fontSize: 11, fontWeight: "700" },
  shiftTitle: { color: "#E8F0F1", fontSize: 14, fontWeight: "800" },
  shiftCount: { color: "#78B6FF", fontSize: 11, fontWeight: "800" },
  shiftNote: { color: "#97AAB0", fontSize: 12, lineHeight: 17 },
  filterRow: { gap: 8 },
  filter: { backgroundColor: "#17242A", borderColor: "#314249", borderRadius: 99, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 9 },
  filterActive: { backgroundColor: "#1C3E3D", borderColor: "#21D4C2" },
  filterText: { color: "#9FB1B6", fontSize: 12, fontWeight: "700" },
  filterTextActive: { color: "#87F0E2" },
  workList: { gap: 10 },
  taskCard: { backgroundColor: "#121D22", borderColor: "#28383E", borderRadius: 17, borderWidth: 1, gap: 9, padding: 14 },
  taskTop: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  id: { color: "#788B91", fontSize: 10, fontWeight: "900", letterSpacing: 0.8 },
  taskTitle: { color: "#E8F0F1", fontSize: 16, fontWeight: "800", letterSpacing: -0.2 },
  taskMeta: { color: "#8EA0A7", fontSize: 12, lineHeight: 16 },
  taskFooter: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginTop: 3 },
  status: { alignItems: "center", flexDirection: "row", gap: 6 },
  statusDot: { borderRadius: 99, height: 7, width: 7 },
  statusText: { color: "#B8C9CD", fontSize: 11, fontWeight: "700" },
  due: { color: "#9FB2B8", fontSize: 11, fontWeight: "700" },
  pressed: { opacity: 0.74, transform: [{ scale: 0.99 }] },
});
