import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { Icon, PrimaryButton, SectionTitle, SeverityPill, Surface } from "@/components/atlas-ui";
import { ScreenContainer } from "@/components/screen-container";
import { useAtlas } from "@/lib/atlas-store";

const steps = [
  { id: "scope", title: "Pilot scope confirmed", detail: "One facility, Line 2, Machine 14, one manager, and recovery work WO-182." },
  { id: "telemetry", title: "Controlled telemetry received", detail: "A source-identified vibration reading exists for the selected facility and asset." },
  { id: "scenario", title: "Recovery scenario authorized", detail: "The manager has reviewed the assumptions, impacts, and evidence state." },
  { id: "execute", title: "Recovery executed under SOP", detail: "The authorized team performs work through established facility procedures." },
  { id: "verify", title: "Outcome verified and learned", detail: "The event, evidence, outcome, and lesson are recorded in industrial memory." },
] as const;

export default function PilotScreen() {
  const [completed, setCompleted] = useState<string[]>([]);
  const { notify } = useAtlas();
  const next = steps.find((step) => !completed.includes(step.id));
  const markNext = () => {
    if (!next) { notify("Pilot checklist is complete locally. Record each completed state against the deployed workspace before closing the pilot.", "success"); return; }
    setCompleted((current) => [...current, next.id]);
    notify(`${next.title} recorded in the local pilot checklist.`, "success");
  };
  return <ScreenContainer className="flex-1" containerClassName="bg-background"><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <View style={styles.header}><View style={styles.icon}><Icon name="rocket-launch" color="#21D4C2" size={21} /></View><View style={{ flex: 1 }}><Text style={styles.eyebrow}>Controlled rollout</Text><Text style={styles.title}>Recovery pilot</Text></View><SeverityPill severity={completed.length === steps.length ? "good" : "attention"} label={`${completed.length}/${steps.length} ready`} /></View>
    <Surface style={styles.context}><Text style={styles.contextTitle}>Line 2 · Machine 14 recovery</Text><Text style={styles.contextBody}>This guided runbook mirrors the required production sequence. Its local checklist never substitutes for the live Supabase audit trail, manager authorization, field evidence, or standard operating procedures.</Text></Surface>
    <SectionTitle eyebrow="Sequential gate" title="Pilot execution" />
    <View style={styles.steps}>{steps.map((step, index) => { const done = completed.includes(step.id); const available = done || (next?.id === step.id); const surfaceStyle = done ? { ...styles.step, ...styles.stepDone } : !available ? { ...styles.step, ...styles.stepLocked } : styles.step; return <Surface key={step.id} style={surfaceStyle}><View style={[styles.stepIcon, done && styles.stepIconDone]}><Icon name={done ? "check" : available ? "radio-button-unchecked" : "lock"} color={done ? "#071416" : available ? "#F5B84B" : "#6D8188"} size={17} /></View><View style={{ flex: 1 }}><Text style={styles.stepNumber}>GATE {index + 1}</Text><Text style={styles.stepTitle}>{step.title}</Text><Text style={styles.stepDetail}>{step.detail}</Text></View></Surface>; })}</View>
    <PrimaryButton label={next ? `Mark gate ${steps.findIndex((step) => step.id === next.id) + 1} ready` : "Review production evidence"} icon={next ? "arrow-forward" : "fact-check"} onPress={markNext} />
    <SectionTitle eyebrow="Non-negotiable controls" title="Do not bypass" /><Surface style={styles.controls}><Control icon="gpp-good" text="No production change occurs before the manager’s live approval record exists." /><Control icon="source" text="Telemetry must retain source, unit, asset, facility, and observed timestamp." /><Control icon="photo-camera" text="Offline photo and audio evidence must synchronize after the triggering event and before verification." /></Surface><View style={{ height: 30 }} />
  </ScrollView></ScreenContainer>;
}
function Control({ icon, text }: { icon: "gpp-good" | "source" | "photo-camera"; text: string }) { return <View style={styles.control}><Icon name={icon} color="#4E9BFF" size={18} /><Text style={styles.controlText}>{text}</Text></View>; }
const styles = StyleSheet.create({ content: { gap: 15, paddingHorizontal: 18, paddingTop: 10 }, header: { alignItems: "center", flexDirection: "row", gap: 10 }, icon: { alignItems: "center", backgroundColor: "#183536", borderRadius: 14, height: 44, justifyContent: "center", width: 44 }, eyebrow: { color: "#8EA0A7", fontSize: 10, fontWeight: "900", letterSpacing: 1, textTransform: "uppercase" }, title: { color: "#E8F0F1", fontSize: 29, fontWeight: "900", letterSpacing: -0.9 }, context: { gap: 7, padding: 15 }, contextTitle: { color: "#DCE8EA", fontSize: 15, fontWeight: "800" }, contextBody: { color: "#9FB2B7", fontSize: 12, lineHeight: 18 }, steps: { gap: 9 }, step: { alignItems: "flex-start", flexDirection: "row", gap: 10, padding: 14 }, stepDone: { backgroundColor: "#12312E", borderColor: "#28776D" }, stepLocked: { opacity: 0.57 }, stepIcon: { alignItems: "center", backgroundColor: "#283138", borderRadius: 14, height: 28, justifyContent: "center", width: 28 }, stepIconDone: { backgroundColor: "#21D4C2" }, stepNumber: { color: "#81969D", fontSize: 9, fontWeight: "900", letterSpacing: 0.9 }, stepTitle: { color: "#E0EAEC", fontSize: 13, fontWeight: "800", marginTop: 3 }, stepDetail: { color: "#9FB2B7", fontSize: 11, lineHeight: 16, marginTop: 4 }, controls: { gap: 12, padding: 15 }, control: { alignItems: "flex-start", flexDirection: "row", gap: 10 }, controlText: { color: "#B4C6C9", flex: 1, fontSize: 12, lineHeight: 17 } });
