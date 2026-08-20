import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { Icon, PrimaryButton, SeverityPill, Surface } from "@/components/atlas-ui";
import { useAtlas } from "@/lib/atlas-store";
import { haptic } from "@/lib/haptics";

type ActionKey = "scan" | "task" | "issue" | "inspection" | "receive" | "transfer" | "evidence" | "ask";

const actionItems: { key: ActionKey; label: string; icon: keyof typeof MaterialIcons.glyphMap; note: string }[] = [
  { key: "scan", label: "Scan an asset", icon: "qr-code-scanner", note: "Identify an asset, material, shipment or work order." },
  { key: "task", label: "Create task", icon: "add-task", note: "Create a traceable item in the current operational context." },
  { key: "issue", label: "Report issue", icon: "report-problem", note: "Capture a field signal and route it to the right owner." },
  { key: "inspection", label: "Record inspection", icon: "fact-check", note: "Run a guided quality or safety verification." },
  { key: "receive", label: "Receive material", icon: "inventory", note: "Confirm a material arrival and start quality checks." },
  { key: "transfer", label: "Transfer inventory", icon: "swap-horiz", note: "Move a traceable item between controlled locations." },
  { key: "evidence", label: "Capture evidence", icon: "photo-camera", note: "Attach a photo, note, or measurement to an event." },
  { key: "ask", label: "Ask Atlas", icon: "auto-awesome", note: "Use the operational copilot to decide what should happen next." },
];

export function FloatingAct() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<ActionKey | null>(null);
  const { createTask, notify } = useAtlas();
  const active = actionItems.find((item) => item.key === selected);

  const openAction = (key: ActionKey) => {
    haptic.medium();
    setSelected(key);
  };

  const close = () => {
    setSelected(null);
    setOpen(false);
  };

  const confirm = () => {
    if (!selected) return;
    if (selected === "scan") {
      close();
      router.push("/asset/MX-14");
      notify("Machine 14 identified from your scan.", "success");
      return;
    }
    if (selected === "ask") {
      close();
      router.navigate("/(tabs)/intelligence");
      notify("Atlas is ready with your current operational context.");
      return;
    }
    const label = active?.label ?? "Field action";
    createTask(`${label} — current context`, selected === "issue" ? "Issue event" : "Field action");
    close();
  };

  const confirmationCopy: Record<ActionKey, { title: string; body: string; cta: string }> = {
    scan: { title: "Machine 14 found", body: "Industrial identity AT-PL-014 matches your current North Plant context. The cooling-loop alert requires attention.", cta: "Open asset passport" },
    task: { title: "Create contextual work", body: "A new task will be assigned to you at North Plant and added to this shift’s queue.", cta: "Create task" },
    issue: { title: "Record an operational signal", body: "A structured issue event will be created with your current facility, time, and reporter context.", cta: "Record issue" },
    inspection: { title: "Start verification", body: "A guided inspection will be created for the current operational context. Evidence is required to complete it.", cta: "Create inspection" },
    receive: { title: "Receive with traceability", body: "Start a material receiving event, then complete the required incoming verification before release.", cta: "Start receiving" },
    transfer: { title: "Create controlled transfer", body: "The transfer will stay pending until location and custodian are verified.", cta: "Create transfer" },
    evidence: { title: "Capture verification", body: "A traceable evidence task will be created for the current object and location.", cta: "Add evidence task" },
    ask: { title: "Ask Atlas", body: "Open the industrial copilot with the current facility, alerts, and active work already in context.", cta: "Open intelligence" },
  };

  return (
    <>
      <Pressable accessibilityRole="button" accessibilityLabel="Open universal action menu" onPress={() => { haptic.medium(); setOpen(true); }} style={({ pressed }) => [styles.fab, pressed && styles.pressed]}>
        <Icon name="add" color="#061719" size={23} />
        <Text style={styles.fabText}>ACT</Text>
      </Pressable>
      <Modal visible={open} transparent animationType="slide" onRequestClose={close}>
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={close} />
          <View style={styles.sheet}>
            <View style={styles.grabber} />
            {selected && active ? (
              <View style={styles.confirmation}>
                <View style={styles.actionLead}><View style={styles.actionIconLarge}><Icon name={active.icon} color="#21D4C2" size={25} /></View><SeverityPill severity={selected === "issue" ? "high" : "normal"} label="Current context" /></View>
                <Text style={styles.confirmationTitle}>{confirmationCopy[selected].title}</Text>
                <Text style={styles.confirmationBody}>{confirmationCopy[selected].body}</Text>
                <View style={styles.confirmationActions}>
                  <PrimaryButton label={confirmationCopy[selected].cta} onPress={confirm} />
                  <PrimaryButton label="Back" icon="arrow-back" kind="secondary" onPress={() => setSelected(null)} />
                </View>
              </View>
            ) : (
              <>
                <View style={styles.sheetHeader}><View><Text style={styles.sheetEyebrow}>Universal action</Text><Text style={styles.sheetTitle}>What needs to happen?</Text></View><Pressable onPress={close} style={styles.closeButton}><Icon name="close" size={20} color="#C9D5D8" /></Pressable></View>
                <Text style={styles.sheetIntro}>Atlas carries your location, shift, and active operation into the next action.</Text>
                <View style={styles.actionGrid}>{actionItems.map((item) => <Pressable key={item.key} onPress={() => openAction(item.key)} style={({ pressed }) => [styles.actionItem, pressed && styles.pressed]}><View style={styles.actionIcon}><Icon name={item.icon} size={19} color="#9CC7E9" /></View><Text style={styles.actionLabel}>{item.label}</Text></Pressable>)}</View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

export function AtlasToast() {
  const { toast, setToast } = useAtlas();
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3400);
    return () => clearTimeout(timer);
  }, [toast, setToast]);
  if (!toast) return null;
  return <View pointerEvents="none" style={styles.toast}><Icon name="check-circle" size={17} color="#21D4C2" /><Text style={styles.toastText}>{toast}</Text></View>;
}

export function OperationalCue({ label, detail }: { label: string; detail: string }) {
  return <Surface style={styles.operationalCue}><View style={styles.cueIcon}><Icon name="offline-bolt" size={18} color="#21D4C2" /></View><View style={styles.cueText}><Text style={styles.cueLabel}>{label}</Text><Text style={styles.cueDetail}>{detail}</Text></View></Surface>;
}

const styles = StyleSheet.create({
  fab: { alignItems: "center", backgroundColor: "#21D4C2", borderColor: "#64F5E4", borderRadius: 28, borderWidth: 1, bottom: 17, elevation: 8, flexDirection: "row", gap: 7, paddingHorizontal: 17, paddingVertical: 13, position: "absolute", right: 20, shadowColor: "#000", shadowOpacity: 0.35, shadowRadius: 8, shadowOffset: { width: 0, height: 5 }, zIndex: 12 },
  fabText: { color: "#061719", fontSize: 13, fontWeight: "900", letterSpacing: 0.8 },
  modalBackdrop: { backgroundColor: "rgba(4, 10, 13, 0.74)", flex: 1, justifyContent: "flex-end" },
  sheet: { backgroundColor: "#121D22", borderColor: "#2B3B41", borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, maxHeight: "84%", paddingBottom: 34, paddingHorizontal: 20, paddingTop: 10 },
  grabber: { alignSelf: "center", backgroundColor: "#52656B", borderRadius: 99, height: 4, marginBottom: 16, width: 42 },
  sheetHeader: { alignItems: "flex-start", flexDirection: "row", justifyContent: "space-between" },
  sheetEyebrow: { color: "#8EA0A7", fontSize: 10, fontWeight: "800", letterSpacing: 1.2, textTransform: "uppercase" },
  sheetTitle: { color: "#E8F0F1", fontSize: 23, fontWeight: "800", letterSpacing: -0.6, marginTop: 3 },
  closeButton: { alignItems: "center", backgroundColor: "#1D2D33", borderRadius: 18, height: 36, justifyContent: "center", width: 36 },
  sheetIntro: { color: "#8EA0A7", fontSize: 13, lineHeight: 19, marginTop: 10, maxWidth: 315 },
  actionGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 20 },
  actionItem: { backgroundColor: "#17242A", borderColor: "#2B3B41", borderRadius: 15, borderWidth: 1, minHeight: 93, padding: 12, width: "48.4%" },
  actionIcon: { alignItems: "center", backgroundColor: "#20343C", borderRadius: 10, height: 31, justifyContent: "center", width: 31 },
  actionLabel: { color: "#DDE8EA", fontSize: 13, fontWeight: "700", lineHeight: 17, marginTop: 9 },
  confirmation: { gap: 14, paddingTop: 5 },
  actionLead: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  actionIconLarge: { alignItems: "center", backgroundColor: "#1F393A", borderRadius: 15, height: 52, justifyContent: "center", width: 52 },
  confirmationTitle: { color: "#E8F0F1", fontSize: 24, fontWeight: "800", letterSpacing: -0.6, marginTop: 3 },
  confirmationBody: { color: "#9AABB0", fontSize: 14, lineHeight: 21 },
  confirmationActions: { gap: 9, marginTop: 7 },
  toast: { alignItems: "center", backgroundColor: "#1A2B2D", borderColor: "#3B7F79", borderRadius: 14, borderWidth: 1, bottom: 104, flexDirection: "row", gap: 9, left: 18, paddingHorizontal: 14, paddingVertical: 12, position: "absolute", right: 18, shadowColor: "#000", shadowOpacity: 0.28, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, zIndex: 50 },
  toastText: { color: "#E2ECEC", flex: 1, fontSize: 13, fontWeight: "600", lineHeight: 18 },
  operationalCue: { alignItems: "center", flexDirection: "row", gap: 11, padding: 12 },
  cueIcon: { alignItems: "center", backgroundColor: "#183536", borderRadius: 10, height: 35, justifyContent: "center", width: 35 },
  cueText: { flex: 1, gap: 2 },
  cueLabel: { color: "#D8E4E6", fontSize: 12, fontWeight: "700" },
  cueDetail: { color: "#8EA0A7", fontSize: 11, lineHeight: 15 },
  pressed: { opacity: 0.74, transform: [{ scale: 0.985 }] },
});
