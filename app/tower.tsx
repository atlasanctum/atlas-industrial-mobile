import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Icon, LinkedRecord, MetricCard, SectionTitle, SeverityPill, Surface } from "@/components/atlas-ui";
import { ScreenContainer } from "@/components/screen-container";
import { digitalTwins, enterpriseHealth, healthDimensions } from "@/lib/atlas-advanced";
import type { AtlasOperatingState } from "@/shared/atlas-domain";

const views = ["Enterprise", "Facility", "Line", "Asset"] as const;
const severityFor = (state: AtlasOperatingState) => state === "critical" ? "critical" : state === "at_risk" ? "high" : state === "watch" ? "attention" : "good" as const;

export default function TowerScreen() {
  const [scope, setScope] = useState<(typeof views)[number]>("Enterprise");
  const visibleDimensions = useMemo(() => scope === "Enterprise" ? healthDimensions : healthDimensions.filter((dimension) => scope === "Facility" ? dimension.id !== "finance" : scope === "Line" ? ["production", "capacity", "quality", "safety"].includes(dimension.id) : ["production", "capacity", "quality"].includes(dimension.id)), [scope]);

  return <ScreenContainer className="flex-1" containerClassName="bg-background"><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <View style={styles.header}><View style={styles.icon}><Icon name="radar" color="#21D4C2" size={21} /></View><View><Text style={styles.eyebrow}>Industrial control tower</Text><Text style={styles.title}>Current reality</Text></View></View>
    <Surface style={styles.hero}><View style={styles.heroTop}><View><Text style={styles.heroLabel}>Enterprise health</Text><Text style={styles.heroValue}>{enterpriseHealth.value}<Text style={styles.heroUnit}> / 100</Text></Text></View><SeverityPill severity={severityFor(enterpriseHealth.state)} label={enterpriseHealth.state.replace("_", " ")} /></View><Text style={styles.heroBody}>Interpretation is based on the visible operational dimensions below. Each value retains an evidence state rather than presenting an opaque score.</Text></Surface>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scopeRow}>{views.map((view) => <Pressable key={view} onPress={() => setScope(view)} style={[styles.scope, scope === view && styles.scopeActive]}><Text style={[styles.scopeText, scope === view && styles.scopeTextActive]}>{view}</Text></Pressable>)}</ScrollView>
    <SectionTitle eyebrow={`${scope} view`} title="Operating state" />
    <View style={styles.metrics}>{visibleDimensions.map((dimension) => <MetricCard key={dimension.id} label={dimension.label} value={`${dimension.value}%`} detail={`${dimension.state.replace("_", " ")} · ${dimension.evidenceState}`} tone={dimension.state === "normal" ? "good" : dimension.state === "watch" ? "attention" : dimension.state === "at_risk" ? "attention" : "critical"} icon={dimension.id === "production" ? "precision-manufacturing" : dimension.id === "safety" ? "health-and-safety" : dimension.id === "quality" ? "verified" : "monitor-heart"} />)}</View>
    <SectionTitle eyebrow="Progressive drill-down" title="Connected twins" />
    <View style={styles.records}>{digitalTwins.map((twin) => <LinkedRecord key={twin.assetId} icon="hub" title={twin.title} detail={`${twin.line} · ${twin.predictedState}`} severity={severityFor(twin.evidenceState === "verified" ? "normal" : twin.evidenceState === "likely" ? "watch" : "at_risk")} onPress={() => router.push({ pathname: "/twin/[id]", params: { id: twin.assetId } })} />)}</View>
    <SectionTitle eyebrow="Decision fabric" title="Explore next" />
    <View style={styles.records}><LinkedRecord icon="timeline" title="Industrial memory" detail="Trace event → decision → outcome → lesson." onPress={() => router.push("/memory")} /><LinkedRecord icon="account-tree" title="Scenario engine" detail="Compare constrained-production recovery paths." onPress={() => router.push("/scenario")} /><LinkedRecord icon="smart-toy" title="Agent coordination" detail="See one evidence-aware recommendation across operating domains." onPress={() => router.push("/agents")} /></View><View style={{ height: 36 }} />
  </ScrollView></ScreenContainer>;
}

const styles = StyleSheet.create({ content: { gap: 16, paddingHorizontal: 18, paddingTop: 10 }, header: { alignItems: "center", flexDirection: "row", gap: 10 }, icon: { alignItems: "center", backgroundColor: "#183536", borderRadius: 14, height: 44, justifyContent: "center", width: 44 }, eyebrow: { color: "#8EA0A7", fontSize: 10, fontWeight: "900", letterSpacing: 1.1, textTransform: "uppercase" }, title: { color: "#E8F0F1", fontSize: 30, fontWeight: "800", letterSpacing: -1 }, hero: { gap: 10, padding: 16 }, heroTop: { alignItems: "flex-start", flexDirection: "row", justifyContent: "space-between" }, heroLabel: { color: "#8EA0A7", fontSize: 11, fontWeight: "800", textTransform: "uppercase" }, heroValue: { color: "#E8F0F1", fontSize: 35, fontWeight: "900", letterSpacing: -1.2, marginTop: 4 }, heroUnit: { color: "#8EA0A7", fontSize: 14 }, heroBody: { color: "#A9BBBF", fontSize: 12, lineHeight: 18 }, scopeRow: { gap: 8 }, scope: { borderColor: "#33474E", borderRadius: 99, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 9 }, scopeActive: { backgroundColor: "#1B4543", borderColor: "#21D4C2" }, scopeText: { color: "#9CB0B5", fontSize: 12, fontWeight: "800" }, scopeTextActive: { color: "#7CE5D4" }, metrics: { flexDirection: "row", flexWrap: "wrap", gap: 10 }, records: { gap: 9 } });
