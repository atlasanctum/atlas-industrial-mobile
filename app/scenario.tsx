import { useState } from "react";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Icon, PrimaryButton, SectionTitle, SeverityPill, Surface } from "@/components/atlas-ui";
import { ScreenContainer } from "@/components/screen-container";
import { scenarioLibrary } from "@/lib/atlas-advanced";
import { useAtlas } from "@/lib/atlas-store";
import { trpc } from "@/lib/trpc";
import { useAtlasWorkspace } from "@/hooks/use-atlas-live";

const severityFor = (state: string) => state === "critical" ? "critical" : state === "at_risk" ? "high" : state === "watch" ? "attention" : "good" as const;

export default function ScenarioScreen() {
  const [activeId, setActiveId] = useState(scenarioLibrary[0].id);
  const [liveScenarioId, setLiveScenarioId] = useState<string | null>(null);
  const active = scenarioLibrary.find((scenario) => scenario.id === activeId) ?? scenarioLibrary[0];
  const { notify } = useAtlas();
  const workspace = useAtlasWorkspace();
  const createScenario = trpc.atlas.createScenario.useMutation();
  const decideScenario = trpc.atlas.decideScenario.useMutation();
  const workspacePermissions = workspace.data?.permissions as string[] | undefined;
  const mayApprove = workspacePermissions?.includes("recommendation:approve") ?? false;
  const requestApproval = async () => {
    if (workspace.auth.isAuthenticated && workspace.data?.status === "ready") {
      try { const response = await createScenario.mutateAsync({ scopeType: active.scope, scopeId: active.scope === "asset" ? "MX-14" : undefined, premise: active.premise, assumptions: { evidenceState: active.evidenceState, source: "mobile_scenario_library" } }); setLiveScenarioId(response.scenarioId); notify("Scenario request is live and awaiting manager authorization.", "success"); return; } catch { notify("Atlas could not record the live scenario request. Check deployment readiness.", "warning"); return; }
    }
    notify("This scenario is a locally visible estimate. Sign in to record it in the governed live workspace.", "warning");
  };
  return <ScreenContainer className="flex-1" containerClassName="bg-background"><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <View style={styles.header}><View style={styles.icon}><Icon name="account-tree" color="#21D4C2" size={21} /></View><View><Text style={styles.eyebrow}>Industrial scenario engine</Text><Text style={styles.title}>Compare futures</Text></View></View>
    <Text style={styles.intro}>Scenarios make assumptions visible. Atlas treats outputs as estimates until live records, authorization, execution, and verification close the learning loop.</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.choices}>{scenarioLibrary.map((scenario) => <Pressable key={scenario.id} onPress={() => setActiveId(scenario.id)} style={[styles.choice, activeId === scenario.id && styles.choiceActive]}><Text style={[styles.choiceText, activeId === scenario.id && styles.choiceTextActive]}>{scenario.title}</Text></Pressable>)}</ScrollView>
    <Surface style={styles.main}><View style={styles.mainTop}><View style={{ flex: 1 }}><Text style={styles.label}>SCENARIO</Text><Text style={styles.mainTitle}>{active.title}</Text></View><SeverityPill severity={severityFor(active.riskState)} label={active.riskState.replace("_", " ")} /></View><Text style={styles.premise}>{active.premise}</Text><View style={styles.impacts}><Impact label="Production" value={active.expectedProduction} /><Impact label="Delivery" value={active.deliveryImpact} /><Impact label="Margin" value={active.marginImpact} /></View><View style={styles.recommend}><Icon name="tips-and-updates" color="#21D4C2" size={18} /><Text style={styles.recommendText}>{active.recommendation}</Text></View><Text style={styles.estimate}>Evidence state: {active.evidenceState} · {active.requiredRole} authorization required before any execution.</Text>{liveScenarioId && mayApprove ? <PrimaryButton label={decideScenario.isPending ? "Authorizing scenario" : "Approve recorded scenario"} icon="verified-user" onPress={() => void decideScenario.mutateAsync({ scenarioId: liveScenarioId, decision: "approved" }).then(() => notify("Scenario approval was recorded in the live audit trail.", "success")).catch(() => notify("Atlas could not authorize this scenario for your current role or scope.", "warning"))} /> : <PrimaryButton label={createScenario.isPending ? "Recording scenario" : liveScenarioId ? "Awaiting manager approval" : "Send for approval"} icon={liveScenarioId ? "hourglass-top" : "verified"} onPress={() => void requestApproval()} />}</Surface>
    <PrimaryButton label="Open controlled pilot runbook" icon="rocket-launch" kind="secondary" onPress={() => router.push("/pilot")} />
    <SectionTitle eyebrow="Model discipline" title="What Atlas will not assume" /><Surface style={styles.guardrail}><Text style={styles.guardrailTitle}>No automatic execution</Text><Text style={styles.guardrailBody}>A scenario can inform a recovery plan, but operational changes require the configured authority path and later verification against actual outcomes.</Text></Surface><View style={{ height: 28 }} />
  </ScrollView></ScreenContainer>;
}
function Impact({ label, value }: { label: string; value: string }) { return <View style={styles.impact}><Text style={styles.impactLabel}>{label}</Text><Text style={styles.impactValue}>{value}</Text></View>; }
const styles = StyleSheet.create({ content: { gap: 15, paddingHorizontal: 18, paddingTop: 10 }, header: { alignItems: "center", flexDirection: "row", gap: 10 }, icon: { alignItems: "center", backgroundColor: "#183536", borderRadius: 14, height: 44, justifyContent: "center", width: 44 }, eyebrow: { color: "#8EA0A7", fontSize: 10, fontWeight: "900", letterSpacing: 1, textTransform: "uppercase" }, title: { color: "#E8F0F1", fontSize: 29, fontWeight: "900", letterSpacing: -0.9 }, intro: { color: "#A9BBBF", fontSize: 13, lineHeight: 19 }, choices: { gap: 8 }, choice: { borderColor: "#34474D", borderRadius: 99, borderWidth: 1, maxWidth: 210, paddingHorizontal: 13, paddingVertical: 9 }, choiceActive: { backgroundColor: "#1B4543", borderColor: "#21D4C2" }, choiceText: { color: "#A4B7BB", fontSize: 12, fontWeight: "800" }, choiceTextActive: { color: "#75E8DA" }, main: { gap: 13, padding: 15 }, mainTop: { alignItems: "flex-start", flexDirection: "row", gap: 8 }, label: { color: "#79B7FF", fontSize: 10, fontWeight: "900", letterSpacing: 0.9 }, mainTitle: { color: "#E8F0F1", fontSize: 18, fontWeight: "900", marginTop: 4 }, premise: { color: "#B4C5C9", fontSize: 13, lineHeight: 19 }, impacts: { flexDirection: "row", gap: 8 }, impact: { backgroundColor: "#17242A", borderRadius: 11, flex: 1, padding: 10 }, impactLabel: { color: "#81969D", fontSize: 9, fontWeight: "900", textTransform: "uppercase" }, impactValue: { color: "#E0EAEC", fontSize: 13, fontWeight: "800", marginTop: 5 }, recommend: { alignItems: "flex-start", backgroundColor: "#163132", borderRadius: 12, flexDirection: "row", gap: 8, padding: 11 }, recommendText: { color: "#CDE2E1", flex: 1, fontSize: 12, fontWeight: "700", lineHeight: 17 }, estimate: { color: "#8FA5AA", fontSize: 11, lineHeight: 16 }, guardrail: { gap: 6, padding: 14 }, guardrailTitle: { color: "#DCE8EA", fontSize: 14, fontWeight: "800" }, guardrailBody: { color: "#9CADB2", fontSize: 12, lineHeight: 18 } });
