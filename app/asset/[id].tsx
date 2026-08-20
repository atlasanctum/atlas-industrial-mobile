import { router, useLocalSearchParams } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { Icon, IconAction, LinkedRecord, PrimaryButton, SectionTitle, SeverityPill, Surface } from "@/components/atlas-ui";
import { ScreenContainer } from "@/components/screen-container";
import { assets } from "@/lib/atlas-data";
import { useAtlasWorkspace } from "@/hooks/use-atlas-live";
import { mapLiveAsset, type LiveAtlasRecord } from "@/lib/atlas-live-mappers";
import { useAtlas } from "@/lib/atlas-store";

export default function AssetDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const workspace = useAtlasWorkspace();
  const liveAsset = workspace.data?.status === "ready" ? (workspace.data.assets as LiveAtlasRecord[]).find((item) => item.id === id) : undefined;
  const asset = assets.find((item) => item.id === id) ?? (liveAsset ? mapLiveAsset(liveAsset) : undefined);
  const { createTask, notify } = useAtlas();
  if (!asset) return <ScreenContainer className="flex-1" edges={["top", "left", "right", "bottom"]} containerClassName="bg-background"><View style={styles.missing}><IconAction name="arrow-back" label="Back" onPress={() => router.back()} /><View style={styles.missingIcon}><Icon name="inventory" color="#F5B84B" size={26} /></View><Text style={styles.missingTitle}>Asset context is not available</Text><Text style={styles.missingBody}>The scan was recorded locally, but this identity is not in your role-scoped workspace yet. Synchronize when online or verify the asset ID with your supervisor.</Text></View></ScreenContainer>;
  const severity = asset.status === "Attention" ? "attention" : asset.status === "Stopped" ? "critical" : "good" as const;
  const assetIcon = asset.type.includes("Vehicle") ? "local-shipping" : asset.type.includes("housing") ? "home-work" : "precision-manufacturing";
  return <ScreenContainer className="flex-1" edges={["top", "left", "right", "bottom"]} containerClassName="bg-background"><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <View style={styles.header}><IconAction name="arrow-back" label="Back" onPress={() => router.back()} /><Text style={styles.headerTitle}>Asset passport</Text><IconAction name="more-horiz" label="More asset options" onPress={() => notify("Asset controls are governed by your facility and role permissions.")} /></View>
    <Surface style={styles.hero}><View style={styles.heroTop}><View style={styles.assetIcon}><Icon name={assetIcon} color="#21D4C2" size={30} /></View><SeverityPill severity={severity} label={asset.status} /></View><Text style={styles.assetName}>{asset.name}</Text><Text style={styles.assetType}>{asset.type} · {asset.code}</Text><View style={styles.assetStats}><View><Text style={styles.statLabel}>Health</Text><Text style={styles.statValue}>{asset.health}%</Text></View><View><Text style={styles.statLabel}>Location</Text><Text style={styles.statValueSmall}>{asset.location}</Text></View></View></Surface>
    <SectionTitle eyebrow="Current state" title="What needs to happen" />
    <Surface style={styles.alertCard}><View style={styles.alertTitleRow}><Icon name="warning-amber" color="#F5B84B" size={20} /><Text style={styles.alertTitle}>Operational attention</Text></View><Text style={styles.alertText}>{asset.alert}</Text><View style={styles.nextAction}><Text style={styles.nextLabel}>RECOMMENDED NEXT ACTION</Text><Text style={styles.nextText}>{asset.nextAction}</Text></View><PrimaryButton label="Create inspection work" icon="fact-check" onPress={() => createTask(`Inspect ${asset.name}`, "Asset inspection")} /></Surface>
    <SectionTitle eyebrow="Digital identity" title="Traceability" />
    <Surface style={styles.identityCard}><View style={styles.identityRow}><Text style={styles.identityLabel}>Serial number</Text><Text style={styles.identityValue}>{asset.serial}</Text></View><View style={styles.identityRow}><Text style={styles.identityLabel}>Custodian</Text><Text style={styles.identityValue}>{asset.custodian}</Text></View><View style={styles.identityRow}><Text style={styles.identityLabel}>Lifecycle</Text><Text style={styles.identityValue}>{asset.manufactured}</Text></View><View style={styles.identityRow}><Text style={styles.identityLabel}>Utilization</Text><Text style={styles.identityValue}>{asset.utilization}</Text></View></Surface>
    <SectionTitle eyebrow="Event fabric" title="Recent history" />
    <View style={styles.history}>{asset.history.map((entry, index) => <View key={entry} style={styles.event}><View style={styles.eventRail}><View style={[styles.eventDot, { backgroundColor: index === 0 ? "#21D4C2" : "#4E9BFF" }]} />{index < asset.history.length - 1 ? <View style={styles.eventLine} /> : null}</View><View style={styles.eventBody}><Text style={styles.eventText}>{entry}</Text><Text style={styles.eventMeta}>{index === 0 ? "Current operational event" : "Verified record"}</Text></View></View>)}</View>
    <SectionTitle eyebrow="Connected graph" title="Related records" />
    <View style={styles.related}><LinkedRecord icon="assignment" title="Work order WO-182" detail="Production recovery is using Machine 8 as the controlled alternate route." onPress={() => router.push({ pathname: "/task/[id]", params: { id: "WO-182" } })} /><LinkedRecord icon="account-tree" title="LifeHouse Site West" detail="Delivery commitment depends on completed production recovery." onPress={() => router.push({ pathname: "/project/[id]", params: { id: "LH-01" } })} /></View>
  </ScrollView></ScreenContainer>;
}

const styles = StyleSheet.create({
  content: { gap: 17, paddingBottom: 30, paddingHorizontal: 18, paddingTop: 8 },
  header: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  headerTitle: { color: "#E8F0F1", fontSize: 15, fontWeight: "800" },
  hero: { gap: 10, padding: 16 },
  heroTop: { alignItems: "flex-start", flexDirection: "row", justifyContent: "space-between" },
  assetIcon: { alignItems: "center", backgroundColor: "#183536", borderRadius: 16, height: 59, justifyContent: "center", width: 59 },
  assetName: { color: "#E8F0F1", fontSize: 25, fontWeight: "800", letterSpacing: -0.6, marginTop: 2 },
  assetType: { color: "#9AAEB3", fontSize: 12, fontWeight: "600" },
  assetStats: { backgroundColor: "#17242A", borderRadius: 13, flexDirection: "row", gap: 35, marginTop: 5, padding: 12 },
  statLabel: { color: "#778D94", fontSize: 10, fontWeight: "800", textTransform: "uppercase" },
  statValue: { color: "#21D4C2", fontSize: 20, fontWeight: "800", marginTop: 3 },
  statValueSmall: { color: "#C6D7DA", fontSize: 12, fontWeight: "700", lineHeight: 17, marginTop: 4, maxWidth: 185 },
  alertCard: { gap: 11, padding: 15 },
  alertTitleRow: { alignItems: "center", flexDirection: "row", gap: 8 },
  alertTitle: { color: "#F5D391", fontSize: 13, fontWeight: "800" },
  alertText: { color: "#B0C1C5", fontSize: 13, lineHeight: 19 },
  nextAction: { backgroundColor: "#17242A", borderRadius: 12, gap: 4, padding: 12 },
  nextLabel: { color: "#7C9299", fontSize: 10, fontWeight: "900", letterSpacing: 0.8 },
  nextText: { color: "#D5E2E4", fontSize: 12, fontWeight: "700", lineHeight: 18 },
  identityCard: { paddingHorizontal: 14 },
  identityRow: { borderBottomColor: "#28383E", borderBottomWidth: 1, gap: 6, paddingVertical: 12 },
  identityLabel: { color: "#7E9399", fontSize: 10, fontWeight: "800", textTransform: "uppercase" },
  identityValue: { color: "#D0DEE0", fontSize: 13, fontWeight: "700" },
  history: { gap: 0 },
  event: { flexDirection: "row", minHeight: 60 },
  eventRail: { alignItems: "center", width: 25 },
  eventDot: { borderRadius: 99, height: 10, width: 10 },
  eventLine: { backgroundColor: "#2A3A40", flex: 1, marginVertical: 2, width: 2 },
  eventBody: { flex: 1, gap: 3, paddingBottom: 14, paddingLeft: 3 },
  eventText: { color: "#D4E0E2", fontSize: 13, fontWeight: "700", lineHeight: 18 },
  eventMeta: { color: "#80949B", fontSize: 11 },
  related: { gap: 9 },
  missing: { alignItems: "center", flex: 1, gap: 16, justifyContent: "center", paddingHorizontal: 28 },
  missingIcon: { alignItems: "center", backgroundColor: "#3A2C16", borderRadius: 18, height: 62, justifyContent: "center", width: 62 },
  missingTitle: { color: "#E8F0F1", fontSize: 21, fontWeight: "800", textAlign: "center" },
  missingBody: { color: "#A4B6BA", fontSize: 13, lineHeight: 20, textAlign: "center" },
});
