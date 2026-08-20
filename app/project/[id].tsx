import { router, useLocalSearchParams } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { Icon, IconAction, LinkedRecord, PrimaryButton, SectionTitle, SeverityPill, Surface } from "@/components/atlas-ui";
import { ScreenContainer } from "@/components/screen-container";
import { projects } from "@/lib/atlas-data";
import { useAtlas } from "@/lib/atlas-store";

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const project = projects.find((item) => item.id === id) ?? projects[0];
  const { createTask, notify } = useAtlas();
  const severity = project.schedule === "Delayed" ? "critical" : project.schedule === "At risk" ? "attention" : "good" as const;
  return <ScreenContainer className="flex-1" edges={["top", "left", "right", "bottom"]} containerClassName="bg-background"><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <View style={styles.header}><IconAction name="arrow-back" label="Back" onPress={() => router.back()} /><Text style={styles.headerTitle}>Project control</Text><IconAction name="more-horiz" label="More project options" onPress={() => notify("Project controls remain tied to schedule, cost, resources, quality, safety and risk.")} /></View>
    <Surface style={styles.hero}><View style={styles.heroTop}><View style={styles.projectBadge}><Icon name="account-tree" color="#21D4C2" size={24} /></View><SeverityPill severity={severity} label={project.schedule} /></View><Text style={styles.name}>{project.name}</Text><Text style={styles.stage}>{project.stage} · {project.location}</Text><View style={styles.progressBlock}><View style={styles.progressTop}><Text style={styles.progressLabel}>PROJECT COMPLETION</Text><Text style={styles.progressValue}>{project.completion}%</Text></View><View style={styles.progressRail}><View style={[styles.progressFill, { width: `${project.completion}%`, backgroundColor: project.schedule === "On track" ? "#21D4C2" : "#F5B84B" }]} /></View></View></Surface>
    <SectionTitle eyebrow="Integrated health" title="Outcome view" />
    <View style={styles.healthGrid}><Surface style={styles.healthCell}><Icon name="event" color="#9CC7E9" size={18} /><Text style={styles.healthLabel}>Schedule</Text><Text style={styles.healthValue}>{project.schedule}</Text></Surface><Surface style={styles.healthCell}><Icon name="account-balance-wallet" color="#9CC7E9" size={18} /><Text style={styles.healthLabel}>Budget</Text><Text style={styles.healthValue}>{project.budget}</Text></Surface><Surface style={styles.healthCell}><Icon name="warning-amber" color="#F5B84B" size={18} /><Text style={styles.healthLabel}>Constraint</Text><Text style={styles.healthValue}>{project.risk}</Text></Surface><Surface style={styles.healthCell}><Icon name="flag" color="#9CC7E9" size={18} /><Text style={styles.healthLabel}>Milestone</Text><Text style={styles.healthValue}>{project.nextMilestone}</Text></Surface></View>
    <SectionTitle eyebrow="Decision engine" title="Recommended action" />
    <Surface style={styles.decision}><View style={styles.decisionIcon}><Icon name="auto-awesome" color="#21D4C2" size={20} /></View><Text style={styles.decisionTitle}>Protect the delivery release</Text><Text style={styles.decisionBody}>{project.update}</Text><View style={styles.decisionMeta}><View><Text style={styles.metaLabel}>Expected outcome</Text><Text style={styles.metaValue}>Delivery readiness is protected</Text></View><View><Text style={styles.metaLabel}>Authority</Text><Text style={styles.metaValue}>Project & production lead</Text></View></View><PrimaryButton label="Create recovery action" icon="add-task" onPress={() => createTask(`Protect milestone: ${project.name}`, "Project recovery")} /></Surface>
    <SectionTitle eyebrow="Operational fabric" title="Connected work" />
    <View style={styles.records}><LinkedRecord icon="assignment" title="WO-182 recovery" detail="Alternate production routing is the current delivery constraint." onPress={() => router.push({ pathname: "/task/[id]", params: { id: "WO-182" } })} /><LinkedRecord icon="precision-manufacturing" title="Machine 14" detail="Cooling-loop alert remains an active operational risk." onPress={() => router.push({ pathname: "/asset/[id]", params: { id: "MX-14" } })} /></View>
  </ScrollView></ScreenContainer>;
}

const styles = StyleSheet.create({
  content: { gap: 17, paddingBottom: 30, paddingHorizontal: 18, paddingTop: 8 },
  header: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  headerTitle: { color: "#E8F0F1", fontSize: 15, fontWeight: "800" },
  hero: { gap: 10, padding: 16 },
  heroTop: { alignItems: "flex-start", flexDirection: "row", justifyContent: "space-between" },
  projectBadge: { alignItems: "center", backgroundColor: "#183536", borderRadius: 16, height: 55, justifyContent: "center", width: 55 },
  name: { color: "#E8F0F1", fontSize: 24, fontWeight: "800", letterSpacing: -0.55, marginTop: 2 },
  stage: { color: "#9AAEB3", fontSize: 12 },
  progressBlock: { backgroundColor: "#17242A", borderRadius: 12, gap: 8, marginTop: 3, padding: 12 },
  progressTop: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  progressLabel: { color: "#7C9198", fontSize: 10, fontWeight: "900", letterSpacing: 0.7 },
  progressValue: { color: "#D9E5E6", fontSize: 13, fontWeight: "900" },
  progressRail: { backgroundColor: "#2A3B40", borderRadius: 99, height: 7, overflow: "hidden" },
  progressFill: { borderRadius: 99, height: 7 },
  healthGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  healthCell: { gap: 6, minHeight: 115, padding: 13, width: "48.4%" },
  healthLabel: { color: "#7F949B", fontSize: 10, fontWeight: "800", marginTop: 3, textTransform: "uppercase" },
  healthValue: { color: "#C9D7D9", fontSize: 11, fontWeight: "700", lineHeight: 16 },
  decision: { gap: 10, padding: 15 },
  decisionIcon: { alignItems: "center", backgroundColor: "#183536", borderRadius: 12, height: 41, justifyContent: "center", width: 41 },
  decisionTitle: { color: "#E8F0F1", fontSize: 16, fontWeight: "800", marginTop: 2 },
  decisionBody: { color: "#AABBBF", fontSize: 13, lineHeight: 19 },
  decisionMeta: { backgroundColor: "#17242A", borderRadius: 12, flexDirection: "row", gap: 15, padding: 11 },
  metaLabel: { color: "#7C9198", fontSize: 9, fontWeight: "900", letterSpacing: 0.7, textTransform: "uppercase" },
  metaValue: { color: "#D2DFE1", fontSize: 11, fontWeight: "700", lineHeight: 16, marginTop: 4, maxWidth: 130 },
  records: { gap: 9 },
});
