import { router } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { FloatingAct } from "@/components/atlas-runtime";
import { Icon, IconAction, PrimaryButton, SectionTitle, SeverityPill, Surface } from "@/components/atlas-ui";
import { ScreenContainer } from "@/components/screen-container";
import { projects } from "@/lib/atlas-data";
import { useAtlas } from "@/lib/atlas-store";

export default function ProjectsScreen() {
  const { notify } = useAtlas();
  const atRisk = projects.filter((project) => project.schedule !== "On track").length;
  return <ScreenContainer className="flex-1" containerClassName="bg-background"><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <View style={styles.header}><View><Text style={styles.eyebrow}>Portfolio → Program → Project</Text><Text style={styles.title}>Projects</Text></View><IconAction name="map" label="Open operational map" onPress={() => notify("The operational map will relate sites, assets, work, and events when location services are connected.")} /></View>
    <Surface style={styles.portfolio}><View style={styles.portfolioIcon}><Icon name="account-tree" color="#21D4C2" size={21} /></View><View style={styles.portfolioCopy}><Text style={styles.portfolioLabel}>Portfolio status</Text><Text style={styles.portfolioTitle}>{projects.length} active industrial programs</Text><Text style={styles.portfolioBody}>{atRisk} delivery path needs a coordinated recovery decision.</Text></View></Surface>
    <SectionTitle eyebrow="Delivery, cost & risk" title="Active projects" />
    <View style={styles.projectList}>{projects.map((project) => { const severity = project.schedule === "Delayed" ? "critical" : project.schedule === "At risk" ? "attention" : "good" as const; return <Surface key={project.id} style={styles.projectCard}><View style={styles.projectTop}><View><Text style={styles.projectName}>{project.name}</Text><Text style={styles.projectStage}>{project.stage} · {project.location}</Text></View><SeverityPill severity={severity} label={project.schedule} /></View><View style={styles.progressRow}><View style={styles.progressRail}><View style={[styles.progressFill, { width: `${project.completion}%`, backgroundColor: project.schedule === "On track" ? "#21D4C2" : "#F5B84B" }]} /></View><Text style={styles.progressText}>{project.completion}%</Text></View><View style={styles.projectFacts}><View><Text style={styles.factLabel}>Budget</Text><Text style={styles.factValue}>{project.budget}</Text></View><View><Text style={styles.factLabel}>Next milestone</Text><Text style={styles.factValue}>{project.nextMilestone}</Text></View></View><PrimaryButton label="Open project" kind="secondary" onPress={() => router.push({ pathname: "/project/[id]", params: { id: project.id } })} /></Surface> })}</View>
    <SectionTitle eyebrow="Connected path" title="How work becomes value" />
    <Surface style={styles.flowCard}><View style={styles.flowStep}><Icon name="inventory" color="#9CC7E9" size={18} /><Text style={styles.flowText}>Materials</Text></View><Icon name="arrow-forward" color="#52656B" size={17} /><View style={styles.flowStep}><Icon name="precision-manufacturing" color="#9CC7E9" size={18} /><Text style={styles.flowText}>Production</Text></View><Icon name="arrow-forward" color="#52656B" size={17} /><View style={styles.flowStep}><Icon name="home-work" color="#9CC7E9" size={18} /><Text style={styles.flowText}>Site</Text></View></Surface>
    <View style={{ height: 90 }} />
  </ScrollView><FloatingAct /></ScreenContainer>;
}

const styles = StyleSheet.create({
  content: { gap: 17, paddingHorizontal: 18, paddingTop: 8 },
  header: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  eyebrow: { color: "#8EA0A7", fontSize: 10, fontWeight: "800", letterSpacing: 1.15, textTransform: "uppercase" },
  title: { color: "#E8F0F1", fontSize: 34, fontWeight: "800", letterSpacing: -1.1, marginTop: 4 },
  portfolio: { alignItems: "center", flexDirection: "row", gap: 11, padding: 14 },
  portfolioIcon: { alignItems: "center", backgroundColor: "#183536", borderRadius: 12, height: 45, justifyContent: "center", width: 45 },
  portfolioCopy: { flex: 1, gap: 3 },
  portfolioLabel: { color: "#8EA0A7", fontSize: 11, fontWeight: "700" },
  portfolioTitle: { color: "#E8F0F1", fontSize: 14, fontWeight: "800" },
  portfolioBody: { color: "#9DAFB4", fontSize: 11, lineHeight: 16 },
  projectList: { gap: 11 },
  projectCard: { gap: 13, padding: 15 },
  projectTop: { alignItems: "flex-start", flexDirection: "row", justifyContent: "space-between" },
  projectName: { color: "#E8F0F1", fontSize: 16, fontWeight: "800" },
  projectStage: { color: "#8EA0A7", fontSize: 11, lineHeight: 16, marginTop: 3 },
  progressRow: { alignItems: "center", flexDirection: "row", gap: 10 },
  progressRail: { backgroundColor: "#27363B", borderRadius: 99, flex: 1, height: 7, overflow: "hidden" },
  progressFill: { borderRadius: 99, height: 7 },
  progressText: { color: "#BBCDD1", fontSize: 11, fontWeight: "800" },
  projectFacts: { flexDirection: "row", gap: 20 },
  factLabel: { color: "#71878F", fontSize: 10, fontWeight: "800", textTransform: "uppercase" },
  factValue: { color: "#C6D5D8", fontSize: 11, fontWeight: "700", lineHeight: 16, marginTop: 3, maxWidth: 150 },
  flowCard: { alignItems: "center", flexDirection: "row", justifyContent: "space-around", padding: 14 },
  flowStep: { alignItems: "center", gap: 5 },
  flowText: { color: "#BDD0D4", fontSize: 10, fontWeight: "800" },
});
