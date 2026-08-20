import { ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

import { FloatingAct } from "@/components/atlas-runtime";
import { Icon, IconAction, LinkedRecord, PrimaryButton, SectionTitle, SeverityPill, Surface } from "@/components/atlas-ui";
import { ScreenContainer } from "@/components/screen-container";
import { inventoryItems, productionPulse, qualityControls, safetyControls } from "@/lib/atlas-data";
import { useAtlas } from "@/lib/atlas-store";

export default function OperationsScreen() {
  const { createTask, notify } = useAtlas();
  return <ScreenContainer className="flex-1" edges={["top", "left", "right", "bottom"]} containerClassName="bg-background"><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <View style={styles.header}><IconAction name="arrow-back" label="Back to command" onPress={() => router.back()} /><View style={styles.headCenter}><Text style={styles.eyebrow}>Operational fabric</Text><Text style={styles.title}>Operations</Text></View><IconAction name="more-horiz" label="More operations options" onPress={() => notify("Operational fabric events remain role- and facility-scoped.")} /></View>
    <Surface style={styles.pulseCard}><View style={styles.pulseTop}><View><Text style={styles.pulseLabel}>Production pulse</Text><Text style={styles.pulseTitle}>{productionPulse.line}</Text></View><SeverityPill severity="attention" label="Recovery active" /></View><View style={styles.pulseGrid}><View><Text style={styles.gridLabel}>PLAN</Text><Text style={styles.gridValue}>{productionPulse.plan}</Text></View><View><Text style={styles.gridLabel}>THROUGHPUT</Text><Text style={styles.gridValue}>{productionPulse.throughput}</Text></View></View><View style={styles.bottleneck}><Icon name="report-problem" color="#F5B84B" size={17} /><Text style={styles.bottleneckText}>{productionPulse.bottleneck}</Text></View><PrimaryButton label="Open recovery work" icon="assignment" onPress={() => router.push({ pathname: "/task/[id]", params: { id: "WO-182" } })} /></Surface>
    <SectionTitle eyebrow="Inventory" title="Materials & availability" />
    <View style={styles.list}>{inventoryItems.map((item) => <Surface key={item.id} style={styles.record}><View style={styles.recordTop}><View style={styles.recordIcon}><Icon name="inventory" color={item.severity === "high" ? "#FF6B57" : item.severity === "attention" ? "#F5B84B" : "#21D4C2"} size={18} /></View><View style={styles.recordCopy}><Text style={styles.recordTitle}>{item.name}</Text><Text style={styles.recordMeta}>{item.location}</Text></View><SeverityPill severity={item.severity} label={item.state} /></View><Text style={styles.recordDetail}>{item.detail}</Text><PrimaryButton label={item.state === "Stockout risk" ? "Create replenishment task" : "Open inventory record"} icon={item.state === "Stockout risk" ? "add-task" : "visibility"} kind="secondary" onPress={() => item.state === "Stockout risk" ? createTask(`Protect availability: ${item.name}`, "Inventory replenishment") : notify(`${item.id} remains connected to its material, inspection, reservation, and consumption events.`)} /></Surface>)}</View>
    <SectionTitle eyebrow="Quality" title="Controls & evidence" />
    <View style={styles.list}>{qualityControls.map((control) => <LinkedRecord key={control.id} icon="fact-check" title={control.title} detail={`${control.context} · ${control.detail}`} severity={control.severity} onPress={() => createTask(`Complete: ${control.title}`, "Quality inspection")} />)}</View>
    <SectionTitle eyebrow="Safety" title="Human safeguards" />
    <View style={styles.list}>{safetyControls.map((control) => <LinkedRecord key={control.id} icon="health-and-safety" title={control.title} detail={`${control.context} · ${control.detail}`} severity={control.severity} onPress={() => notify(`${control.id} requires explicit evidence and human verification before closure.`)} />)}</View>
    <Surface style={styles.learnCard}><Icon name="history-edu" color="#78B6FF" size={20} /><View style={styles.learnCopy}><Text style={styles.learnTitle}>Every action creates evidence</Text><Text style={styles.learnText}>Production, inventory, quality, and safety updates flow into the same auditable event fabric for operational learning.</Text></View></Surface>
    <View style={{ height: 80 }} />
  </ScrollView><FloatingAct /></ScreenContainer>;
}

const styles = StyleSheet.create({
  content: { gap: 17, paddingBottom: 20, paddingHorizontal: 18, paddingTop: 8 },
  header: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  headCenter: { alignItems: "center" },
  eyebrow: { color: "#8EA0A7", fontSize: 10, fontWeight: "800", letterSpacing: 1.05, textTransform: "uppercase" },
  title: { color: "#E8F0F1", fontSize: 25, fontWeight: "800", letterSpacing: -0.7, marginTop: 2 },
  pulseCard: { gap: 13, padding: 15 },
  pulseTop: { alignItems: "flex-start", flexDirection: "row", justifyContent: "space-between" },
  pulseLabel: { color: "#8EA0A7", fontSize: 10, fontWeight: "800", letterSpacing: 0.9, textTransform: "uppercase" },
  pulseTitle: { color: "#E8F0F1", fontSize: 18, fontWeight: "800", marginTop: 3 },
  pulseGrid: { backgroundColor: "#17242A", borderRadius: 12, flexDirection: "row", gap: 18, padding: 12 },
  gridLabel: { color: "#789099", fontSize: 9, fontWeight: "900", letterSpacing: 0.7 },
  gridValue: { color: "#D7E4E6", fontSize: 11, fontWeight: "700", lineHeight: 16, marginTop: 4, maxWidth: 142 },
  bottleneck: { alignItems: "center", flexDirection: "row", gap: 8 },
  bottleneckText: { color: "#E7D19B", flex: 1, fontSize: 12, fontWeight: "700", lineHeight: 17 },
  list: { gap: 9 },
  record: { gap: 10, padding: 14 },
  recordTop: { alignItems: "center", flexDirection: "row", gap: 9 },
  recordIcon: { alignItems: "center", backgroundColor: "#172F34", borderRadius: 11, height: 38, justifyContent: "center", width: 38 },
  recordCopy: { flex: 1 },
  recordTitle: { color: "#E8F0F1", fontSize: 14, fontWeight: "800" },
  recordMeta: { color: "#869BA1", fontSize: 11, fontWeight: "600", marginTop: 3 },
  recordDetail: { color: "#AABAC0", fontSize: 12, lineHeight: 18 },
  learnCard: { alignItems: "flex-start", flexDirection: "row", gap: 11, padding: 14 },
  learnCopy: { flex: 1, gap: 3 },
  learnTitle: { color: "#E8F0F1", fontSize: 13, fontWeight: "800" },
  learnText: { color: "#90A4AA", fontSize: 11, lineHeight: 16 },
});
