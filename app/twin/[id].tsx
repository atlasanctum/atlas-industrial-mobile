import { router, useLocalSearchParams } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { Icon, LinkedRecord, PrimaryButton, SectionTitle, SeverityPill, Surface } from "@/components/atlas-ui";
import { ScreenContainer } from "@/components/screen-container";
import { causalLinks, digitalTwins } from "@/lib/atlas-advanced";

export default function TwinScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const twin = digitalTwins.find((record) => record.assetId === id) ?? digitalTwins[0];
  const relatedCausal = causalLinks.filter((entry) => entry.citations.some((citation) => citation.recordId.includes(twin.assetId) || twin.assetId === "LINE-2"));
  return <ScreenContainer className="flex-1" containerClassName="bg-background"><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <View style={styles.header}><View style={styles.icon}><Icon name="hub" color="#21D4C2" size={22} /></View><View style={styles.headerCopy}><Text style={styles.eyebrow}>Digital twin</Text><Text style={styles.title}>{twin.title}</Text><Text style={styles.sub}>{twin.facility} · {twin.line}</Text></View><SeverityPill severity={twin.evidenceState === "likely" ? "attention" : "normal"} label={twin.evidenceState} /></View>
    <SectionTitle eyebrow="Four-state model" title="Asset reality" />
    <View style={styles.states}><StateCard title="Current" body={twin.currentState} tone="#21D4C2" /><StateCard title="Historical" body={twin.historicalState} tone="#4E9BFF" /><StateCard title="Expected" body={twin.expectedState} tone="#F5B84B" /><StateCard title="Predicted" body={twin.predictedState} tone="#FF6B57" /></View>
    <Surface style={styles.recommendation}><Text style={styles.label}>RECOMMENDED NEXT ACTION</Text><Text style={styles.recommendationText}>{twin.recommendation}</Text><PrimaryButton label="Compare recovery scenarios" icon="account-tree" onPress={() => router.push("/scenario")} /></Surface>
    <SectionTitle eyebrow="Causal intelligence" title="Evidence path" />
    <View style={styles.records}>{relatedCausal.map((item) => <LinkedRecord key={item.id} icon="timeline" title={item.observation} detail={`${item.contributor} ${item.evidenceState === "verified" ? "· verified cause" : "· cause awaiting verification"}`} onPress={() => router.push("/memory")} />)}</View>
    <PrimaryButton label="Open asset passport" kind="secondary" icon="precision-manufacturing" onPress={() => router.push({ pathname: "/asset/[id]", params: { id: twin.assetId } })} /><View style={{ height: 32 }} />
  </ScrollView></ScreenContainer>;
}

function StateCard({ title, body, tone }: { title: string; body: string; tone: string }) { return <Surface style={styles.stateCard}><View style={[styles.stateDot, { backgroundColor: tone }]} /><Text style={styles.stateTitle}>{title}</Text><Text style={styles.stateBody}>{body}</Text></Surface>; }
const styles = StyleSheet.create({ content: { gap: 15, paddingHorizontal: 18, paddingTop: 10 }, header: { alignItems: "center", flexDirection: "row", gap: 10 }, icon: { alignItems: "center", backgroundColor: "#183536", borderRadius: 14, height: 44, justifyContent: "center", width: 44 }, headerCopy: { flex: 1 }, eyebrow: { color: "#8EA0A7", fontSize: 10, fontWeight: "900", letterSpacing: 1, textTransform: "uppercase" }, title: { color: "#E8F0F1", fontSize: 27, fontWeight: "900", letterSpacing: -0.8 }, sub: { color: "#8EA0A7", fontSize: 11, fontWeight: "700", marginTop: 2 }, states: { gap: 9 }, stateCard: { gap: 7, padding: 14 }, stateDot: { borderRadius: 4, height: 4, width: 42 }, stateTitle: { color: "#DCE8EA", fontSize: 12, fontWeight: "900", textTransform: "uppercase" }, stateBody: { color: "#9FB2B7", fontSize: 12, lineHeight: 18 }, recommendation: { gap: 10, padding: 15 }, label: { color: "#21D4C2", fontSize: 10, fontWeight: "900", letterSpacing: 1 }, recommendationText: { color: "#D8E5E7", fontSize: 14, fontWeight: "700", lineHeight: 20 }, records: { gap: 9 } });
