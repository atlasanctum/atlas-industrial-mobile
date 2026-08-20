import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { FloatingAct } from "@/components/atlas-runtime";
import { Icon, IconAction, SectionTitle, SeverityPill, Surface } from "@/components/atlas-ui";
import { ScreenContainer } from "@/components/screen-container";
import { assets } from "@/lib/atlas-data";
import { useAtlasWorkspace } from "@/hooks/use-atlas-live";
import { mapLiveAsset, type LiveAtlasRecord } from "@/lib/atlas-live-mappers";
import { useAtlas } from "@/lib/atlas-store";

export default function AssetsScreen() {
  const [query, setQuery] = useState("");
  const { notify } = useAtlas();
  const workspace = useAtlasWorkspace();
  const sourceAssets = workspace.data?.status === "ready" ? (workspace.data.assets as LiveAtlasRecord[]).map(mapLiveAsset) : assets;
  const visibleAssets = useMemo(() => sourceAssets.filter((asset) => `${asset.name} ${asset.code} ${asset.location}`.toLowerCase().includes(query.toLowerCase())), [query, sourceAssets]);
  return <ScreenContainer className="flex-1" containerClassName="bg-background"><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <View style={styles.header}><View><Text style={styles.eyebrow}>Physical world registry</Text><Text style={styles.title}>Assets</Text></View><IconAction name="qr-code-scanner" label="Scan a code" accent onPress={() => router.push("/scan")} /></View>
    <Pressable onPress={() => notify("Search is ready for an asset name, tag, serial, or location.")} style={styles.search}><Icon name="search" color="#8EA0A7" size={19} /><TextInput value={query} onChangeText={setQuery} placeholder="Search assets, tags, locations" placeholderTextColor="#73868D" style={styles.searchInput} returnKeyType="search" /></Pressable>
    <Surface style={styles.scanCard}><View style={styles.scanIcon}><Icon name="qr-code-scanner" color="#21D4C2" size={24} /></View><View style={styles.scanText}><Text style={styles.scanTitle}>Scan → Understand → Act</Text><Text style={styles.scanBody}>Identify an object, retrieve its history, then take the next best action.</Text></View><Icon name="arrow-forward" color="#78B6FF" size={20} /></Surface>
    <SectionTitle eyebrow={workspace.data?.status === "ready" ? "Live operational identity" : "Operational identity"} title={`${visibleAssets.length} assets in context`} />
    <View style={styles.assetList}>{visibleAssets.map((asset) => { const severity = asset.status === "Attention" ? "attention" : asset.status === "Stopped" ? "critical" : "good" as const; return <Pressable key={asset.id} onPress={() => router.push({ pathname: "/asset/[id]", params: { id: asset.id } })} style={({ pressed }) => [styles.assetCard, pressed && styles.pressed]}><View style={styles.assetTop}><View style={styles.assetIcon}><Icon name={asset.type.includes("Vehicle") ? "local-shipping" : asset.type.includes("housing") ? "home-work" : "precision-manufacturing"} color="#9CC7E9" size={22} /></View><View style={styles.assetMain}><Text style={styles.assetName}>{asset.name}</Text><Text style={styles.assetType}>{asset.type} · {asset.code}</Text></View><SeverityPill severity={severity} label={asset.status} /></View><View style={styles.assetHealth}><View style={styles.healthRail}><View style={[styles.healthFill, { width: `${asset.health}%`, backgroundColor: asset.health > 85 ? "#21D4C2" : "#F5B84B" }]} /></View><Text style={styles.healthText}>{asset.health}% health</Text></View><Text style={styles.assetLocation}>{asset.location} · {asset.utilization}</Text></Pressable> })}</View>
    <View style={{ height: 90 }} />
  </ScrollView><FloatingAct /></ScreenContainer>;
}

const styles = StyleSheet.create({
  content: { gap: 17, paddingHorizontal: 18, paddingTop: 8 },
  header: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  eyebrow: { color: "#8EA0A7", fontSize: 10, fontWeight: "800", letterSpacing: 1.15, textTransform: "uppercase" },
  title: { color: "#E8F0F1", fontSize: 34, fontWeight: "800", letterSpacing: -1.1, marginTop: 4 },
  search: { alignItems: "center", backgroundColor: "#17242A", borderColor: "#2E4148", borderRadius: 14, borderWidth: 1, flexDirection: "row", gap: 9, paddingHorizontal: 13, minHeight: 50 },
  searchInput: { color: "#E8F0F1", flex: 1, fontSize: 14, fontWeight: "600", paddingVertical: 0 },
  scanCard: { alignItems: "center", flexDirection: "row", gap: 11, padding: 13 },
  scanIcon: { alignItems: "center", backgroundColor: "#173536", borderRadius: 12, height: 42, justifyContent: "center", width: 42 },
  scanText: { flex: 1, gap: 3 },
  scanTitle: { color: "#E8F0F1", fontSize: 13, fontWeight: "800" },
  scanBody: { color: "#8EA0A7", fontSize: 11, lineHeight: 16 },
  assetList: { gap: 10 },
  assetCard: { backgroundColor: "#121D22", borderColor: "#28383E", borderRadius: 17, borderWidth: 1, gap: 12, padding: 14 },
  assetTop: { alignItems: "center", flexDirection: "row", gap: 10 },
  assetIcon: { alignItems: "center", backgroundColor: "#1E3037", borderRadius: 13, height: 46, justifyContent: "center", width: 46 },
  assetMain: { flex: 1, gap: 3 },
  assetName: { color: "#E8F0F1", fontSize: 15, fontWeight: "800" },
  assetType: { color: "#8EA0A7", fontSize: 11, lineHeight: 15 },
  assetHealth: { alignItems: "center", flexDirection: "row", gap: 9 },
  healthRail: { backgroundColor: "#27363B", borderRadius: 9, flex: 1, height: 6, overflow: "hidden" },
  healthFill: { borderRadius: 9, height: 6 },
  healthText: { color: "#B5C7CB", fontSize: 11, fontWeight: "700" },
  assetLocation: { color: "#7F949B", fontSize: 11, fontWeight: "600" },
  pressed: { opacity: 0.74, transform: [{ scale: 0.99 }] },
});
