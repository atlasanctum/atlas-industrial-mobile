import { router } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { FloatingAct, OperationalCue } from "@/components/atlas-runtime";
import { AppMark, Icon, IconAction, LinkedRecord, MetricCard, PrimaryButton, SectionTitle, SeverityPill, Surface } from "@/components/atlas-ui";
import { LiveWorkspaceStatus } from "@/components/live-workspace-status";
import { commandBrief } from "@/lib/atlas-data";
import { useAtlas } from "@/lib/atlas-store";
import { ScreenContainer } from "@/components/screen-container";

export default function CommandScreen() {
  const { tasks, notify } = useAtlas();
  const activeTasks = tasks.filter((task) => task.status !== "Completed");
  const critical = activeTasks.find((task) => task.severity === "critical") ?? activeTasks[0];

  return (
    <ScreenContainer className="flex-1" containerClassName="bg-background">
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.identity}><AppMark /><View><Text style={styles.brand}>ATLAS</Text><Text style={styles.brandSub}>Industrial Systems</Text></View></View>
          <View style={styles.headerActions}><IconAction name="search" label="Search Atlas" onPress={() => router.navigate("/(tabs)/assets")} /><IconAction name="notifications-none" label="Review notifications" onPress={() => notify("Notifications are prioritized into the command view.")} /></View>
        </View>

        <View style={styles.titleBlock}>
          <Text style={styles.date}>{commandBrief.greeting}</Text>
          <Text style={styles.title}>Command</Text>
          <View style={styles.contextRow}><View style={styles.locationDot} /><Text style={styles.context}>{commandBrief.facility}</Text><Text style={styles.contextDivider}>·</Text><Text style={styles.context}>Shift A</Text></View>
        </View>

        <Surface style={styles.healthCard}>
          <View style={styles.healthTop}><View><Text style={styles.healthLabel}>Operational health</Text><Text style={styles.healthValue}>{commandBrief.health}</Text></View><SeverityPill severity="attention" label="2 decisions due" /></View>
          <View style={styles.healthLine}><View style={[styles.healthSegment, { flex: 7, backgroundColor: "#21D4C2" }]} /><View style={[styles.healthSegment, { flex: 2, backgroundColor: "#F5B84B" }]} /><View style={[styles.healthSegment, { flex: 1, backgroundColor: "#FF6B57" }]} /></View>
          <View style={styles.healthLegend}><Text style={styles.healthSmall}>14 healthy signals</Text><Text style={styles.healthSmall}>1 critical constraint</Text></View>
        </Surface>

        <LiveWorkspaceStatus />

        <View style={styles.metricRow}><MetricCard label="Decision velocity" value={commandBrief.velocity} detail={commandBrief.velocityDetail} icon="bolt" tone="good" /><MetricCard label="Active work" value={String(activeTasks.length)} detail="Tasks requiring coordination" icon="assignment" tone="attention" /></View>

        <SectionTitle eyebrow="Priority now" title="Exceptions" action="View work" onAction={() => router.navigate("/(tabs)/work")} />
        {critical ? <Surface style={styles.exceptionCard}><View style={styles.exceptionHeader}><SeverityPill severity={critical.severity} /><Text style={styles.recordId}>{critical.id}</Text></View><Text style={styles.exceptionTitle}>{critical.title}</Text><Text style={styles.exceptionBody}>Machine 14 cooling alarm is putting Order SO-812 and the LifeHouse delivery release at risk.</Text><View style={styles.exceptionFooter}><View style={styles.owner}><View style={styles.avatar}><Text style={styles.avatarText}>AY</Text></View><Text style={styles.ownerText}>{critical.owner}</Text></View><PrimaryButton label="Coordinate recovery" icon="arrow-forward" onPress={() => router.push({ pathname: "/task/[id]", params: { id: critical.id } })} /></View></Surface> : null}

        <OperationalCue label="Field-ready context" detail="Your current facility, shift, and active work are carried into every ACT workflow." />

        <SectionTitle eyebrow="AI operating brief" title="What matters" action="Open intelligence" onAction={() => router.navigate("/(tabs)/intelligence")} />
        <Surface style={styles.briefCard}><View style={styles.briefIcon}><Icon name="auto-awesome" color="#21D4C2" size={20} /></View><Text style={styles.briefTitle}>Recommended recovery</Text><Text style={styles.briefText}>{commandBrief.recommendation}</Text><View style={styles.sourceRow}><Icon name="link" color="#78B6FF" size={15} /><Text style={styles.sourceText}>Based on Machine 14, Job 182, Order SO-812</Text></View></Surface>

        <SectionTitle eyebrow="Connected operations" title="In motion" />
        <View style={styles.records}><LinkedRecord icon="precision-manufacturing" title="Machine 14 requires inspection" detail="North Plant · Cooling return is outside normal band" severity="high" onPress={() => router.push({ pathname: "/asset/[id]", params: { id: "MX-14" } })} /><LinkedRecord icon="account-tree" title="LifeHouse Site West" detail="68% complete · Delivery release needs protection" severity="attention" onPress={() => router.push({ pathname: "/project/[id]", params: { id: "LH-01" } })} /><LinkedRecord icon="local-shipping" title="Commerce & dispatch" detail="Order SO-812, inbound batch and delivery readiness" onPress={() => router.push("/commerce")} /></View>
        <View style={{ height: 90 }} />
      </ScrollView>
      <FloatingAct />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { gap: 18, paddingHorizontal: 18, paddingTop: 8 },
  header: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  identity: { alignItems: "center", flexDirection: "row", gap: 9 },
  brand: { color: "#E8F0F1", fontSize: 13, fontWeight: "900", letterSpacing: 1.5 },
  brandSub: { color: "#8EA0A7", fontSize: 10, fontWeight: "600", letterSpacing: 0.4, marginTop: 1 },
  headerActions: { flexDirection: "row", gap: 8 },
  titleBlock: { gap: 4, marginTop: 6 },
  date: { color: "#8EA0A7", fontSize: 12, fontWeight: "600" },
  title: { color: "#E8F0F1", fontSize: 34, fontWeight: "800", letterSpacing: -1.1 },
  contextRow: { alignItems: "center", flexDirection: "row", gap: 7 },
  locationDot: { backgroundColor: "#21D4C2", borderRadius: 10, height: 7, width: 7 },
  context: { color: "#AAC0C5", fontSize: 12, fontWeight: "600" },
  contextDivider: { color: "#52656B" },
  healthCard: { gap: 14, padding: 16 },
  healthTop: { alignItems: "flex-start", flexDirection: "row", justifyContent: "space-between" },
  healthLabel: { color: "#8EA0A7", fontSize: 12, fontWeight: "700" },
  healthValue: { color: "#E8F0F1", fontSize: 20, fontWeight: "800", letterSpacing: -0.4, marginTop: 4 },
  healthLine: { flexDirection: "row", gap: 3, height: 7, overflow: "hidden" },
  healthSegment: { borderRadius: 99 },
  healthLegend: { flexDirection: "row", justifyContent: "space-between" },
  healthSmall: { color: "#8EA0A7", fontSize: 11, fontWeight: "600" },
  metricRow: { flexDirection: "row", gap: 10 },
  exceptionCard: { gap: 10, padding: 16 },
  exceptionHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  recordId: { color: "#8EA0A7", fontSize: 11, fontWeight: "800", letterSpacing: 0.8 },
  exceptionTitle: { color: "#F1F6F6", fontSize: 18, fontWeight: "800", letterSpacing: -0.35, marginTop: 2 },
  exceptionBody: { color: "#9EAFB4", fontSize: 13, lineHeight: 19 },
  exceptionFooter: { alignItems: "center", flexDirection: "row", gap: 10, justifyContent: "space-between", marginTop: 4 },
  owner: { alignItems: "center", flex: 1, flexDirection: "row", gap: 8 },
  avatar: { alignItems: "center", backgroundColor: "#2A4650", borderRadius: 14, height: 28, justifyContent: "center", width: 28 },
  avatarText: { color: "#BCE7EF", fontSize: 9, fontWeight: "900" },
  ownerText: { color: "#C7D5D7", fontSize: 12, fontWeight: "600" },
  briefCard: { gap: 9, padding: 16 },
  briefIcon: { alignItems: "center", backgroundColor: "#183536", borderRadius: 12, height: 38, justifyContent: "center", width: 38 },
  briefTitle: { color: "#E8F0F1", fontSize: 16, fontWeight: "800", marginTop: 2 },
  briefText: { color: "#ABBCC0", fontSize: 13, lineHeight: 20 },
  sourceRow: { alignItems: "center", flexDirection: "row", gap: 6, marginTop: 2 },
  sourceText: { color: "#78B6FF", fontSize: 11, fontWeight: "700" },
  records: { gap: 9 },
});
