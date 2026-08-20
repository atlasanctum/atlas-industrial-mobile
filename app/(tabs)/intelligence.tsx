import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { FloatingAct } from "@/components/atlas-runtime";
import { Icon, LinkedRecord, PrimaryButton, SectionTitle, SeverityPill, Surface } from "@/components/atlas-ui";
import { ScreenContainer } from "@/components/screen-container";
import { useAtlas } from "@/lib/atlas-store";

const prompts = ["What should I focus on today?", "Why is Job 182 delayed?", "Show assets needing inspection"];

export default function IntelligenceScreen() {
  const [prompt, setPrompt] = useState("");
  const [asked, setAsked] = useState(false);
  const { createTask, notify } = useAtlas();
  const runQuery = (message?: string) => {
    const input = message ?? prompt;
    if (!input.trim()) { notify("Ask a specific question about the current operation.", "warning"); return; }
    setPrompt(input);
    setAsked(true);
    notify("Atlas has analyzed the connected operational context.", "success");
  };
  return <ScreenContainer className="flex-1" containerClassName="bg-background"><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <View style={styles.header}><View style={styles.headerMark}><Icon name="auto-awesome" size={18} color="#21D4C2" /></View><View><Text style={styles.eyebrow}>Industrial copilot</Text><Text style={styles.title}>Intelligence</Text></View></View>
    <Surface style={styles.contextCard}><View style={styles.contextHeader}><View><Text style={styles.contextLabel}>Live operational context</Text><Text style={styles.contextTitle}>North Plant · Shift A</Text></View><SeverityPill severity="attention" label="1 critical constraint" /></View><Text style={styles.contextBody}>Atlas has active work, asset health, project dependency, and commercial commitment context available for this prototype session.</Text></Surface>
    <View style={styles.askBox}><Icon name="auto-awesome" color="#21D4C2" size={21} /><TextInput value={prompt} onChangeText={setPrompt} onSubmitEditing={() => runQuery()} placeholder="Ask about your operation" placeholderTextColor="#73868D" style={styles.askInput} returnKeyType="send" /><Pressable onPress={() => runQuery()} style={({ pressed }) => [styles.send, pressed && { opacity: 0.7 }]}><Icon name="arrow-upward" color="#081518" size={18} /></Pressable></View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.promptRow}>{prompts.map((item) => <Pressable key={item} onPress={() => runQuery(item)} style={({ pressed }) => [styles.prompt, pressed && { opacity: 0.7 }]}><Text style={styles.promptText}>{item}</Text></Pressable>)}</ScrollView>
    <SectionTitle eyebrow={asked ? "Analysis result" : "Proactive recommendation"} title={asked ? "Decision view" : "What matters now"} />
    <Surface style={styles.answerCard}><View style={styles.answerTop}><View style={styles.answerIcon}><Icon name="insights" color="#21D4C2" size={21} /></View><View><Text style={styles.answerLabel}>SITUATION</Text><Text style={styles.answerTitle}>{asked ? "The recovery path is clear" : "Protect the LifeHouse delivery path"}</Text></View></View><Text style={styles.answerBody}>{asked ? "Machine 14’s thermal alert is the constraint. Route Job 182 to Machine 8 after a controlled setup check, and keep the cooling-loop inspection active. This protects delivery while maintaining authorization and evidence requirements." : "Order SO-812 is at risk because Machine 14 has delayed Job 182. The fastest controlled recovery is to route Job 182 to Machine 8 while a technician inspects the cooling loop."}</Text><View style={styles.answerGrid}><View><Text style={styles.answerFactLabel}>Confidence</Text><Text style={styles.answerFactValue}>High · linked records agree</Text></View><View><Text style={styles.answerFactLabel}>Authorization</Text><Text style={styles.answerFactValue}>Production manager approval</Text></View></View><PrimaryButton label="Create recovery task" icon="add-task" onPress={() => createTask("Review Atlas recovery recommendation", "Decision action")} /></Surface>
    <SectionTitle eyebrow="Evidence" title="Linked operational records" />
    <View style={styles.evidence}><LinkedRecord icon="precision-manufacturing" title="Machine 14 alarm trace" detail="Cooling return temperature outside normal band at 08:42" onPress={() => notify("Evidence source selected: Machine 14 alarm trace.")} /><LinkedRecord icon="assignment" title="Work order WO-182" detail="Recovery work is in progress at North Plant · Line 2" onPress={() => notify("Evidence source selected: Work order WO-182.")} /><LinkedRecord icon="local-shipping" title="Customer order SO-812" detail="Delivery commitment is exposed if recovery does not complete" onPress={() => notify("Evidence source selected: Customer order SO-812.")} /></View>
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
  answerLabel: { color: "#78B6FF", fontSize: 10, fontWeight: "900", letterSpacing: 1, textTransform: "uppercase" },
  answerTitle: { color: "#E8F0F1", fontSize: 16, fontWeight: "800", marginTop: 3 },
  answerBody: { color: "#B0C0C4", fontSize: 13, lineHeight: 20 },
  answerGrid: { backgroundColor: "#17242A", borderRadius: 12, flexDirection: "row", gap: 20, padding: 12 },
  answerFactLabel: { color: "#758990", fontSize: 10, fontWeight: "800", textTransform: "uppercase" },
  answerFactValue: { color: "#C9D7D9", fontSize: 11, fontWeight: "700", lineHeight: 16, marginTop: 4, maxWidth: 140 },
  evidence: { gap: 9 },
});
