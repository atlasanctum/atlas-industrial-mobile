import { router } from "expo-router";
import { RecordingPresets, requestRecordingPermissionsAsync, setAudioModeAsync, useAudioRecorder, useAudioRecorderState } from "expo-audio";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

import { Icon, IconAction, PrimaryButton, SeverityPill, Surface } from "@/components/atlas-ui";
import { ScreenContainer } from "@/components/screen-container";
import { useAtlasSync } from "@/components/atlas-sync-provider";
import { useAtlas } from "@/lib/atlas-store";

function clock(seconds: number) { const rounded = Math.max(0, Math.floor(seconds)); return `${String(Math.floor(rounded / 60)).padStart(2, "0")}:${String(rounded % 60).padStart(2, "0")}`; }

export default function VoiceNoteScreen() {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);
  const [uri, setUri] = useState<string | null>(null);
  const [summary, setSummary] = useState("");
  const sync = useAtlasSync();
  const { enqueue, online } = sync.events;
  const evidenceQueue = sync.evidence;
  const { createTask, notify } = useAtlas();

  const toggleRecording = async () => {
    if (recorderState.isRecording) { await recorder.stop(); setUri(recorder.uri ?? null); notify("Voice note captured locally. Confirm the operational summary before recording the event.", "success"); return; }
    const permission = await requestRecordingPermissionsAsync();
    if (!permission.granted) { notify("Microphone access is required to capture a voice field report.", "warning"); return; }
    try { await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true }); await recorder.prepareToRecordAsync(); recorder.record(); setUri(null); } catch { notify("Atlas could not start this recording. Check the microphone permission and try again.", "warning"); }
  };

  const recordEvent = async () => {
    if (!uri) { notify("Record a short voice note before saving the field report.", "warning"); return; }
    if (summary.trim().length < 8) { notify("Add a concise operational summary so the voice report can be routed safely.", "warning"); return; }
    const event = await enqueue({ eventType: "issue_reported", entityType: "issue", entityId: "voice-field-report", payload: { summary: summary.trim(), audioCaptured: true, capture: "native_microphone", storageState: "pending_secure_upload" } });
    const extension = uri.toLowerCase().endsWith(".webm") ? "webm" : "m4a";
    await evidenceQueue.queueFile({ eventClientId: event.clientEventId, localUri: uri, contentType: extension === "webm" ? "audio/webm" : "audio/m4a", filename: `voice-field-report-${Date.now()}.${extension}`, entityType: "issue", entityId: "voice-field-report" });
    createTask("Review voice field report", "Voice-reported issue");
    notify(online ? "Voice field report recorded; audio will upload securely." : "Voice report and audio are queued safely until connectivity returns.", "success");
    router.back();
  };

  return <ScreenContainer className="flex-1" edges={["top", "left", "right", "bottom"]} containerClassName="bg-background"><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
    <View style={styles.header}><IconAction name="arrow-back" label="Back" onPress={() => router.back()} /><View style={styles.headCenter}><Text style={styles.eyebrow}>Voice-first operations</Text><Text style={styles.title}>Field report</Text></View><SeverityPill severity={online ? "good" : "attention"} label={online ? "Online" : "Offline"} /></View>
    <Surface style={styles.intro}><Icon name="graphic-eq" color="#21D4C2" size={22} /><View style={styles.introCopy}><Text style={styles.introTitle}>Say what happened</Text><Text style={styles.introText}>Record an observation in the field, then confirm the short operational summary that routes the resulting event.</Text></View></Surface>
    <View style={styles.recorderWrap}><Pressable onPress={() => void toggleRecording()} style={({ pressed }) => [styles.recordButton, recorderState.isRecording && styles.recording, pressed && { transform: [{ scale: 0.97 }], opacity: 0.9 }]}><Icon name={recorderState.isRecording ? "stop" : "mic"} color={recorderState.isRecording ? "#FFF3F0" : "#071719"} size={33} /></Pressable><Text style={styles.recordState}>{recorderState.isRecording ? "Recording operational observation" : uri ? "Voice note captured" : "Tap to start recording"}</Text><Text style={styles.timer}>{clock(recorderState.durationMillis / 1000)}</Text></View>
    <Surface style={styles.noteCard}><Text style={styles.noteLabel}>OPERATIONAL SUMMARY</Text><Text style={styles.noteHint}>Describe the observable signal without guessing at the cause. The recording is retained securely on-device until the authorized evidence upload completes.</Text><TextInput value={summary} onChangeText={setSummary} placeholder="Example: Machine 14 is overheating and a coolant hose appears loose." placeholderTextColor="#70858C" multiline style={styles.input} textAlignVertical="top" /></Surface>
    <Surface style={styles.guardrail}><Icon name="shield" color="#78B6FF" size={19} /><View style={styles.guardrailCopy}><Text style={styles.guardrailTitle}>Human review stays in the loop</Text><Text style={styles.guardrailText}>{evidenceQueue.items.length ? `${evidenceQueue.items.length} evidence file${evidenceQueue.items.length === 1 ? " is" : "s are"} queued for encrypted transport.` : "Atlas records the signal and creates follow-up work. It does not diagnose equipment or initiate irreversible action from a voice note alone."}</Text></View></Surface>
    <PrimaryButton label="Record voice field event" icon="send" onPress={() => void recordEvent()} />
  </ScrollView></ScreenContainer>;
}

const styles = StyleSheet.create({
  content: { gap: 16, paddingBottom: 28, paddingHorizontal: 18, paddingTop: 8 }, header: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" }, headCenter: { alignItems: "center" }, eyebrow: { color: "#8EA0A7", fontSize: 10, fontWeight: "800", letterSpacing: 1.05, textTransform: "uppercase" }, title: { color: "#E8F0F1", fontSize: 22, fontWeight: "800", letterSpacing: -0.6, marginTop: 2 }, intro: { alignItems: "flex-start", flexDirection: "row", gap: 11, padding: 14 }, introCopy: { flex: 1, gap: 3 }, introTitle: { color: "#E8F0F1", fontSize: 15, fontWeight: "800" }, introText: { color: "#9DAFB4", fontSize: 12, lineHeight: 18 }, recorderWrap: { alignItems: "center", gap: 8, paddingVertical: 11 }, recordButton: { alignItems: "center", backgroundColor: "#21D4C2", borderColor: "#76F4E6", borderRadius: 56, borderWidth: 2, height: 104, justifyContent: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.32, shadowRadius: 8, width: 104 }, recording: { backgroundColor: "#C6473D", borderColor: "#FF978A" }, recordState: { color: "#D6E3E5", fontSize: 13, fontWeight: "800", marginTop: 3 }, timer: { color: "#789099", fontSize: 17, fontWeight: "800", letterSpacing: 1.2 }, noteCard: { gap: 8, padding: 13 }, noteLabel: { color: "#7F949B", fontSize: 10, fontWeight: "900", letterSpacing: 0.8 }, noteHint: { color: "#98AAAF", fontSize: 11, lineHeight: 16 }, input: { backgroundColor: "#17242A", borderColor: "#2A3C42", borderRadius: 11, borderWidth: 1, color: "#E8F0F1", fontSize: 13, minHeight: 105, padding: 11 }, guardrail: { alignItems: "flex-start", flexDirection: "row", gap: 10, padding: 13 }, guardrailCopy: { flex: 1, gap: 3 }, guardrailTitle: { color: "#D9E6E8", fontSize: 12, fontWeight: "800" }, guardrailText: { color: "#8FA4AA", fontSize: 11, lineHeight: 16 },
});
