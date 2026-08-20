import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { FloatingAct } from "@/components/atlas-runtime";
import { Icon, LinkedRecord, PrimaryButton, SectionTitle, SeverityPill, Surface } from "@/components/atlas-ui";
import { ScreenContainer } from "@/components/screen-container";
import { useAtlasWorkspace } from "@/hooks/use-atlas-live";
import { useAtlas } from "@/lib/atlas-store";
import { trpc } from "@/lib/trpc";
import type { GroundedRecommendation } from "@/shared/atlas-domain";

const prompts = ["What should I focus on today?", "Why is Job 182 delayed?", "Show assets needing inspection"];

export default function IntelligenceScreen() {
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState<GroundedRecommendation | null>(null);
  const { createTask, notify } = useAtlas();
  const workspace = useAtlasWorkspace();
  const ask = trpc.atlas.askIntelligence.useMutation();
  const decide = trpc.atlas.decideRecommendation.useMutation();
  const liveReady = workspace.data?.status === "ready";
  const workspacePermissions = workspace.data?.permissions as string[] | undefined;
  const mayApprove = workspacePermissions?.includes("recommendation:approve") ?? false;
  const member = workspace.data?.member;

  const runQuery = async (message?: string) => {
    const input = (message ?? prompt).trim();
    if (!input) { notify("Ask a specific question about the current operation.", "warning"); return; }
    setPrompt(input);
    if (!workspace.auth.isAuthenticated) { notify("Sign in to run a grounded Atlas analysis against the live workspace.", "warning"); return; }
    if (!liveReady) { notify(workspace.data?.status === "awaiting_role" ? "Your Atlas role assignment is pending." : "Apply the Atlas schema and deployment configuration to activate live intelligence.", "warning"); return; }
    try {
      const recommendation = await ask.mutateAsync({ question: input });
      setResult(recommendation);
      notify("Atlas analyzed only the records your role can access.", "success");
      await workspace.refetch();
    } catch {
      notify("Atlas could not complete the grounded analysis. Check live workspace readiness and try again.", "warning");
    }
  };

  const decideResult = async (decision: "approved" | "rejected") => {
    if (!result) return;
    try {
      await decide.mutateAsync({ recommendationId: result.id, decision });
      notify(decision === "approved" ? "Recommendation approved and an authorization record was created." : "Recommendation rejected and the decision was recorded.", decision === "approved" ? "success" : "warning");
      await workspace.refetch();
    } catch {
      notify("This role cannot authorize the recommendation, or the record is not live yet.", "warning");
    }
  };

  const display = result ?? {
    situation: "Protect the LifeHouse delivery path",
    evidence: ["Machine 14 cooling alert", "Work order WO-182", "Customer order SO-812"],
    options: ["Route Job 182 to Machine 8", "Hold the delivery release", "Wait for Machine 14 assessment"],
    tradeoffs: ["Alternate routing requires a controlled setup check before release."],
    recommendation: "Order SO-812 is at risk because Machine 14 has delayed Job 182. The fastest controlled recovery is to route Job 182 to Machine 8 while a technician inspects the cooling loop.",
    confidence: "medium" as const,
    authorizationRole: "manager" as const,
    expectedOutcome: "Delivery readiness remains protected after authorized work and verification.",
    citations: [],
  };

  return <ScreenContainer className="flex-1" containerClassName="bg-background"><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <View style={styles.header}><View style={styles.headerMark}><Icon name="auto-awesome" size={18} color="#21D4C2" /></View><View><Text style={styles.eyebrow}>Industrial copilot</Text><Text style={styles.title}>Intelligence</Text></View></View>
    <Surface style={styles.contextCard}><View style={styles.contextHeader}><View><Text style={styles.contextLabel}>Grounding context</Text><Text style={styles.contextTitle}>{liveReady ? `${member?.displayName ?? "Atlas member"} · ${member?.role ?? "role"}` : "Live role context pending"}</Text></View><SeverityPill severity={liveReady ? "good" : "attention"} label={liveReady ? "Role scoped" : "Setup needed"} /></View><Text style={styles.contextBody}>{liveReady ? `Atlas will cite only records within ${member?.facilityIds.length ? "your assigned facilities" : "your approved workspace scope"}. Recommendations remain pending until ${display.authorizationRole} authorization.` : "Apply the deployment schema, configure Supabase variables, then assign each user an Atlas role before live operational data can be analyzed."}</Text></Surface>
    <View style={styles.askBox}><Icon name="auto-awesome" color="#21D4C2" size={21} /><TextInput value={prompt} onChangeText={setPrompt} onSubmitEditing={() => void runQuery()} placeholder="Ask about your operation" placeholderTextColor="#73868D" style={styles.askInput} returnKeyType="send" /><Pressable onPress={() => void runQuery()} style={({ pressed }) => [styles.send, pressed && { opacity: 0.7 }]}><Icon name={ask.isPending ? "hourglass-top" : "arrow-upward"} color="#081518" size={18} /></Pressable></View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.promptRow}>{prompts.map((item) => <Pressable key={item} onPress={() => void runQuery(item)} style={({ pressed }) => [styles.prompt, pressed && { opacity: 0.7 }]}><Text style={styles.promptText}>{item}</Text></Pressable>)}</ScrollView>
    <SectionTitle eyebrow={result ? "Grounded result" : "Decision protocol"} title={result ? "Recommendation" : "What Atlas will return"} />
    <Surface style={styles.answerCard}><View style={styles.answerTop}><View style={styles.answerIcon}><Icon name="insights" color="#21D4C2" size={21} /></View><View style={styles.answerHeadCopy}><Text style={styles.answerLabel}>SITUATION</Text><Text style={styles.answerTitle}>{display.situation}</Text></View><SeverityPill severity={display.confidence === "high" ? "good" : "attention"} label={`${display.confidence} confidence`} /></View><Text style={styles.answerBody}>{display.recommendation}</Text><View style={styles.answerGrid}><View><Text style={styles.answerFactLabel}>Authorization</Text><Text style={styles.answerFactValue}>{display.authorizationRole} approval required</Text></View><View><Text style={styles.answerFactLabel}>Expected outcome</Text><Text style={styles.answerFactValue}>{display.expectedOutcome}</Text></View></View>{result ? <><Text style={styles.listLabel}>TRADE-OFFS</Text>{display.tradeoffs.map((tradeoff) => <View key={tradeoff} style={styles.tradeoff}><Icon name="compare-arrows" color="#F5B84B" size={15} /><Text style={styles.tradeoffText}>{tradeoff}</Text></View>)}<View style={styles.decisionActions}>{mayApprove ? <><PrimaryButton label="Approve" icon="verified" onPress={() => void decideResult("approved")} /><PrimaryButton label="Reject" icon="close" kind="secondary" onPress={() => void decideResult("rejected")} /></> : <PrimaryButton label={`Await ${display.authorizationRole} approval`} kind="secondary" icon="lock" onPress={() => notify("This recommendation is recorded as pending authorization. Only a role with approval permission can decide it.")} />}</View></> : <PrimaryButton label="Create recovery task" icon="add-task" onPress={() => createTask("Review Atlas recovery recommendation", "Decision action")} />}</Surface>
    <SectionTitle eyebrow="Evidence" title="Record citations" />
    <View style={styles.evidence}>{display.citations.length ? display.citations.map((citation) => <LinkedRecord key={`${citation.recordType}-${citation.recordId}`} icon="link" title={citation.label} detail={`${citation.recordType} · ${citation.recordId}`} onPress={() => notify(`Citation selected: ${citation.recordId}`)} />) : display.evidence.map((evidence, index) => <LinkedRecord key={evidence} icon={index === 0 ? "precision-manufacturing" : index === 1 ? "assignment" : "local-shipping"} title={evidence} detail="Shown as a demonstration until Atlas receives live records and a role-scoped analysis." />)}</View>
    <View style={{ height: 90 }} />
  </ScrollView><FloatingAct /></ScreenContainer>;
}

const styles = StyleSheet.create({
  content: { gap: 17, paddingHorizontal: 18, paddingTop: 8 },
  header: { alignItems: "center", flexDirection: "row", gap: 9 },
  headerMark: { alignItems: "center", backgroundColor: "#183536", borderRadius: 13, height: 42, justifyContent: "center", width: 42 },
  eyebrow: { color: "#8EA0A7", fontSize: 10, fontWeight: "800", letterSpacing: 1.15, textTransform: "uppercase" },
  title: { color: "#E8F0F1", fontSize: 31, fontWeight: "800", letterSpacing: -1, marginTop: 2 },
  contextCard: { gap: 10, padding: 15 },
  contextHeader: { alignItems: "flex-start", flexDirection: "row", justifyContent: "space-between" },
  contextLabel: { color: "#8EA0A7", fontSize: 10, fontWeight: "800", letterSpacing: 0.8, textTransform: "uppercase" },
  contextTitle: { color: "#E8F0F1", fontSize: 15, fontWeight: "800", marginTop: 4 },
  contextBody: { color: "#9DAFB4", fontSize: 12, lineHeight: 18 },
  askBox: { alignItems: "center", backgroundColor: "#17242A", borderColor: "#3C5D61", borderRadius: 15, borderWidth: 1, flexDirection: "row", gap: 9, minHeight: 54, paddingHorizontal: 13 },
  askInput: { color: "#E8F0F1", flex: 1, fontSize: 14, fontWeight: "600", paddingVertical: 0 },
  send: { alignItems: "center", backgroundColor: "#21D4C2", borderRadius: 15, height: 30, justifyContent: "center", width: 30 },
  promptRow: { gap: 8 },
  prompt: { backgroundColor: "#17242A", borderColor: "#2B3B41", borderRadius: 99, borderWidth: 1, paddingHorizontal: 13, paddingVertical: 9 },
  promptText: { color: "#B7C9CD", fontSize: 12, fontWeight: "700" },
  answerCard: { gap: 13, padding: 15 },
  answerTop: { alignItems: "center", flexDirection: "row", gap: 10 },
  answerIcon: { alignItems: "center", backgroundColor: "#183536", borderRadius: 12, height: 42, justifyContent: "center", width: 42 },
  answerHeadCopy: { flex: 1 },
  answerLabel: { color: "#78B6FF", fontSize: 10, fontWeight: "900", letterSpacing: 1, textTransform: "uppercase" },
  answerTitle: { color: "#E8F0F1", fontSize: 15, fontWeight: "800", marginTop: 3 },
  answerBody: { color: "#B0C0C4", fontSize: 13, lineHeight: 20 },
  answerGrid: { backgroundColor: "#17242A", borderRadius: 12, flexDirection: "row", gap: 20, padding: 12 },
  answerFactLabel: { color: "#758990", fontSize: 10, fontWeight: "800", textTransform: "uppercase" },
  answerFactValue: { color: "#C9D7D9", fontSize: 11, fontWeight: "700", lineHeight: 16, marginTop: 4, maxWidth: 140 },
  listLabel: { color: "#7C9299", fontSize: 10, fontWeight: "900", letterSpacing: 0.8, marginTop: 2 },
  tradeoff: { alignItems: "flex-start", flexDirection: "row", gap: 8 },
  tradeoffText: { color: "#AABCC0", flex: 1, fontSize: 12, lineHeight: 17 },
  decisionActions: { gap: 8 },
  evidence: { gap: 9 },
});
