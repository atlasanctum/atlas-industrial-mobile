import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useMemo, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { Icon, IconAction, PrimaryButton, SeverityPill, Surface } from "@/components/atlas-ui";
import { ScreenContainer } from "@/components/screen-container";
import { useAtlasEvidenceQueue } from "@/hooks/use-atlas-evidence";
import { useAtlasEventQueue } from "@/hooks/use-atlas-live";
import { useAtlas } from "@/lib/atlas-store";

const inspectionSteps = [
  { id: "identity", title: "Confirm identity", detail: "Machine 14 · AT-PL-014 is the object being verified." },
  { id: "control", title: "Verify controls", detail: "Isolation, PPE, and the required procedure have been reviewed." },
  { id: "measurement", title: "Record observation", detail: "Cooling return temperature and visible hose condition are within an accepted operating state." },
];

type PhotoEvidence = { uri: string; contentType: string; filename: string };

export default function InspectionScreen() {
  const [complete, setComplete] = useState<string[]>([]);
  const [evidence, setEvidence] = useState("");
  const [photo, setPhoto] = useState<PhotoEvidence | null>(null);
  const { enqueue, online, queue } = useAtlasEventQueue();
  const evidenceQueue = useAtlasEvidenceQueue();
  const { createTask, notify } = useAtlas();
  const ready = complete.length === inspectionSteps.length && evidence.trim().length >= 8;
  const missing = useMemo(() => inspectionSteps.filter((step) => !complete.includes(step.id)).length, [complete]);

  const toggle = (id: string) => setComplete((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const capturePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (permission.status !== "granted") { notify("Camera access is required to capture inspection evidence.", "warning"); return; }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ["images"], quality: 0.7 });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    setPhoto({ uri: asset.uri, contentType: asset.mimeType ?? "image/jpeg", filename: asset.fileName ?? `inspection-${Date.now()}.jpg` });
    notify("Photo evidence is attached locally and will upload after the inspection event syncs.", "success");
  };
  const recordInspection = async () => {
    if (!ready) { notify(`Complete ${missing || "the"} required verification step${missing === 1 ? "" : "s"} and add evidence before recording.`, "warning"); return; }
    const event = await enqueue({ eventType: "inspection_recorded", entityType: "inspection", entityId: "MX-14-cooling-loop", facilityId: undefined, payload: { assetCode: "AT-PL-014", checklist: complete, evidence: evidence.trim(), photoAttached: Boolean(photo), result: "recorded", source: "guided_inspection" } });
    if (photo) await evidenceQueue.queueFile({ eventClientId: event.clientEventId, localUri: photo.uri, contentType: photo.contentType, filename: photo.filename, entityType: "inspection", entityId: "MX-14-cooling-loop" });
    createTask("Review Machine 14 inspection evidence", "Verification follow-up");
    notify(online ? "Inspection recorded; attached evidence will upload securely." : "Inspection and attached evidence are safely queued until connectivity returns.", "success");
    router.back();
  };

  return <ScreenContainer className="flex-1" edges={["top", "left", "right", "bottom"]} containerClassName="bg-background"><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
    <View style={styles.header}><IconAction name="arrow-back" label="Back" onPress={() => router.back()} /><View style={styles.headCenter}><Text style={styles.eyebrow}>Quality & safety</Text><Text style={styles.title}>Guided inspection</Text></View><SeverityPill severity={online ? "good" : "attention"} label={online ? "Online" : "Offline"} /></View>
    <Surface style={styles.context}><View style={styles.contextIcon}><Icon name="precision-manufacturing" color="#21D4C2" size={22} /></View><View style={styles.contextCopy}><Text style={styles.contextLabel}>INSPECTION CONTEXT</Text><Text style={styles.contextTitle}>Machine 14 · Cooling loop</Text><Text style={styles.contextBody}>A verified inspection becomes a traceable event with actor, time, object, evidence, and authorization context.</Text></View></Surface>
    <Text style={styles.sectionEyebrow}>REQUIRED CONTROLS</Text>
    <View style={styles.steps}>{inspectionSteps.map((step, index) => { const isComplete = complete.includes(step.id); return <Pressable key={step.id} onPress={() => toggle(step.id)} style={({ pressed }) => [styles.step, isComplete && styles.stepComplete, pressed && { opacity: 0.74 }]}><View style={[styles.check, isComplete && styles.checkComplete]}><Icon name={isComplete ? "check" : "circle"} color={isComplete ? "#061719" : "#6C858C"} size={isComplete ? 16 : 13} /></View><View style={styles.stepCopy}><Text style={styles.stepIndex}>STEP {index + 1}</Text><Text style={styles.stepTitle}>{step.title}</Text><Text style={styles.stepDetail}>{step.detail}</Text></View></Pressable> })}</View>
    <Text style={styles.sectionEyebrow}>EVIDENCE NOTE</Text>
    <Surface style={styles.evidenceCard}><Text style={styles.evidenceHint}>Describe the reading, condition, or corrective action. This note is included in the operational event record.</Text><TextInput value={evidence} onChangeText={setEvidence} placeholder="Example: Return temperature stable at …" placeholderTextColor="#70858C" multiline style={styles.input} textAlignVertical="top" /><PrimaryButton label={photo ? "Replace evidence photo" : "Capture evidence photo"} icon="photo-camera" kind="secondary" onPress={() => void capturePhoto()} />{photo ? <View style={styles.photoWrap}><Image source={{ uri: photo.uri }} style={styles.photo} /><Text style={styles.photoText}>Evidence photo attached and queued for secure upload.</Text></View> : null}</Surface>
    <Surface style={styles.syncCard}><Icon name="cloud-queue" color={online ? "#21D4C2" : "#F5B84B"} size={19} /><View style={styles.syncCopy}><Text style={styles.syncTitle}>{online ? "Event synchronization ready" : "Offline-first inspection"}</Text><Text style={styles.syncText}>{queue.length || evidenceQueue.items.length ? `${queue.length} event${queue.length === 1 ? "" : "s"} and ${evidenceQueue.items.length} evidence file${evidenceQueue.items.length === 1 ? "" : "s"} awaiting sync.` : online ? "The verified inspection and any evidence will synchronize after recording." : "This inspection and its evidence remain durable on the device until connectivity returns."}</Text></View></Surface>
    <PrimaryButton label="Record verified inspection" icon="verified" onPress={() => void recordInspection()} />
  </ScrollView></ScreenContainer>;
}

const styles = StyleSheet.create({
  content: { gap: 16, paddingBottom: 28, paddingHorizontal: 18, paddingTop: 8 },
  header: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" }, headCenter: { alignItems: "center" }, eyebrow: { color: "#8EA0A7", fontSize: 10, fontWeight: "800", letterSpacing: 1.05, textTransform: "uppercase" }, title: { color: "#E8F0F1", fontSize: 22, fontWeight: "800", letterSpacing: -0.6, marginTop: 2 },
  context: { alignItems: "flex-start", flexDirection: "row", gap: 11, padding: 14 }, contextIcon: { alignItems: "center", backgroundColor: "#183536", borderRadius: 12, height: 43, justifyContent: "center", width: 43 }, contextCopy: { flex: 1, gap: 3 }, contextLabel: { color: "#789099", fontSize: 9, fontWeight: "900", letterSpacing: 0.7 }, contextTitle: { color: "#E8F0F1", fontSize: 15, fontWeight: "800" }, contextBody: { color: "#9EB1B6", fontSize: 11, lineHeight: 16, marginTop: 2 },
  sectionEyebrow: { color: "#7F949B", fontSize: 10, fontWeight: "900", letterSpacing: 0.9, marginTop: 2 }, steps: { gap: 9 }, step: { alignItems: "flex-start", backgroundColor: "#142126", borderColor: "#2A3A40", borderRadius: 14, borderWidth: 1, flexDirection: "row", gap: 11, padding: 13 }, stepComplete: { backgroundColor: "#173334", borderColor: "#3D7773" }, check: { alignItems: "center", backgroundColor: "#1D3036", borderRadius: 14, height: 28, justifyContent: "center", width: 28 }, checkComplete: { backgroundColor: "#21D4C2" }, stepCopy: { flex: 1, gap: 3 }, stepIndex: { color: "#789099", fontSize: 9, fontWeight: "900", letterSpacing: 0.6 }, stepTitle: { color: "#DCE7E9", fontSize: 13, fontWeight: "800" }, stepDetail: { color: "#98AAAE", fontSize: 11, lineHeight: 16 },
  evidenceCard: { gap: 8, padding: 13 }, evidenceHint: { color: "#95A8AD", fontSize: 11, lineHeight: 16 }, input: { backgroundColor: "#17242A", borderColor: "#2A3C42", borderRadius: 11, borderWidth: 1, color: "#E8F0F1", fontSize: 13, minHeight: 98, padding: 11 }, photoWrap: { alignItems: "center", flexDirection: "row", gap: 10 }, photo: { borderRadius: 9, height: 48, width: 48 }, photoText: { color: "#9EC7C1", flex: 1, fontSize: 11, fontWeight: "700", lineHeight: 15 },
  syncCard: { alignItems: "flex-start", flexDirection: "row", gap: 10, padding: 13 }, syncCopy: { flex: 1, gap: 2 }, syncTitle: { color: "#DCE8E9", fontSize: 12, fontWeight: "800" }, syncText: { color: "#8FA4AA", fontSize: 11, lineHeight: 16 },
});
