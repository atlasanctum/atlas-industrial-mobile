import { CameraView, useCameraPermissions, type BarcodeScanningResult } from "expo-camera";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Icon, IconAction, PrimaryButton, SeverityPill, Surface } from "@/components/atlas-ui";
import { ScreenContainer } from "@/components/screen-container";
import { useAtlasEventQueue } from "@/hooks/use-atlas-live";
import { haptic } from "@/lib/haptics";

function parseAtlasIdentity(value: string) {
  const match = value.match(/(?:atlas:\/\/asset\/|asset:)([A-Za-z0-9_-]+)/i);
  return match?.[1] ?? value.trim();
}

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scannedValue, setScannedValue] = useState<string | null>(null);
  const { enqueue, queue, online } = useAtlasEventQueue();

  const recordScan = async ({ data, type }: BarcodeScanningResult) => {
    if (scannedValue) return;
    const identity = parseAtlasIdentity(data);
    setScannedValue(identity);
    await enqueue({ eventType: "asset_scanned", entityType: "asset", entityId: identity, payload: { barcodeType: type, rawValue: data, capture: "native_camera" } });
    haptic.success();
  };

  if (!permission) return <ScreenContainer edges={["top", "bottom", "left", "right"]} />;
  if (!permission.granted) return <ScreenContainer edges={["top", "bottom", "left", "right"]} className="p-6" containerClassName="bg-background"><View style={styles.permission}><View style={styles.permissionIcon}><Icon name="photo-camera" color="#21D4C2" size={28} /></View><Text style={styles.permissionTitle}>Camera access is required</Text><Text style={styles.permissionBody}>Atlas uses the camera to identify QR-coded assets and record a traceable field event. The camera is never opened until you choose Scan.</Text><PrimaryButton label="Allow camera access" icon="photo-camera" onPress={() => void requestPermission()} /><PrimaryButton label="Cancel" kind="secondary" icon="arrow-back" onPress={() => router.back()} /></View></ScreenContainer>;

  return <View style={styles.page}><CameraView style={StyleSheet.absoluteFill} facing="back" barcodeScannerSettings={{ barcodeTypes: ["qr", "code128", "ean13", "ean8"] }} onBarcodeScanned={scannedValue ? undefined : recordScan} /><View style={styles.scrimTop} /><View style={styles.topbar}><IconAction name="arrow-back" label="Close scanner" onPress={() => router.back()} /><View style={styles.livePill}><View style={styles.liveDot} /><Text style={styles.liveText}>{online ? "READY TO RECORD" : "OFFLINE QUEUE ACTIVE"}</Text></View><View style={styles.queueBadge}><Icon name="cloud-queue" size={16} color="#CBE0E2" /><Text style={styles.queueText}>{queue.length}</Text></View></View><View style={styles.scannerGuide}><View style={[styles.corner, styles.topLeft]} /><View style={[styles.corner, styles.topRight]} /><View style={[styles.corner, styles.bottomLeft]} /><View style={[styles.corner, styles.bottomRight]} /></View><View style={styles.bottomPanel}>{scannedValue ? <Surface style={styles.resultCard}><View style={styles.resultTop}><View style={styles.resultIcon}><Icon name="qr-code-scanner" color="#21D4C2" size={22} /></View><SeverityPill severity="good" label={online ? "Recorded" : "Queued offline"} /></View><Text style={styles.resultTitle}>Identity captured</Text><Text style={styles.resultBody}>{scannedValue} is now linked to a traceable scan event. Confirm the object before acting on it.</Text><PrimaryButton label="Open asset context" icon="arrow-forward" onPress={() => router.replace({ pathname: "/asset/[id]", params: { id: scannedValue } })} /><Pressable onPress={() => setScannedValue(null)} style={styles.scanAgain}><Text style={styles.scanAgainText}>Scan another object</Text></Pressable></Surface> : <><Text style={styles.scanLabel}>SCAN INDUSTRIAL IDENTITY</Text><Text style={styles.scanInstruction}>Align a QR code, barcode, or Atlas asset identity inside the frame.</Text></>}</View></View>;
}

const styles = StyleSheet.create({
  page: { backgroundColor: "#071013", flex: 1 },
  scrimTop: { backgroundColor: "rgba(4, 10, 13, 0.58)", height: "33%", left: 0, position: "absolute", right: 0, top: 0 },
  topbar: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", left: 18, position: "absolute", right: 18, top: 60 },
  livePill: { alignItems: "center", backgroundColor: "rgba(10, 23, 26, 0.84)", borderColor: "#466166", borderRadius: 99, borderWidth: 1, flexDirection: "row", gap: 6, paddingHorizontal: 10, paddingVertical: 7 },
  liveDot: { backgroundColor: "#21D4C2", borderRadius: 9, height: 6, width: 6 },
  liveText: { color: "#D5E5E7", fontSize: 9, fontWeight: "900", letterSpacing: 0.7 },
  queueBadge: { alignItems: "center", backgroundColor: "rgba(10, 23, 26, 0.84)", borderColor: "#466166", borderRadius: 18, borderWidth: 1, flexDirection: "row", gap: 4, height: 36, justifyContent: "center", minWidth: 36, paddingHorizontal: 8 },
  queueText: { color: "#D5E5E7", fontSize: 11, fontWeight: "900" },
  scannerGuide: { borderColor: "rgba(177, 238, 231, 0.42)", borderRadius: 20, borderWidth: 1, height: 244, left: "12%", overflow: "hidden", position: "absolute", right: "12%", top: "29%" },
  corner: { borderColor: "#21D4C2", height: 42, position: "absolute", width: 42 },
  topLeft: { borderLeftWidth: 3, borderTopWidth: 3, left: -1, top: -1 },
  topRight: { borderRightWidth: 3, borderTopWidth: 3, right: -1, top: -1 },
  bottomLeft: { borderBottomWidth: 3, borderLeftWidth: 3, bottom: -1, left: -1 },
  bottomRight: { borderBottomWidth: 3, borderRightWidth: 3, bottom: -1, right: -1 },
  bottomPanel: { bottom: 0, left: 0, position: "absolute", right: 0 },
  scanLabel: { color: "#A7C2C5", fontSize: 10, fontWeight: "900", letterSpacing: 1.1, marginBottom: 7, textAlign: "center" },
  scanInstruction: { color: "#E6F0F1", fontSize: 15, fontWeight: "700", lineHeight: 22, paddingBottom: 47, paddingHorizontal: 45, textAlign: "center" },
  resultCard: { borderBottomLeftRadius: 0, borderBottomRightRadius: 0, gap: 10, padding: 18 },
  resultTop: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  resultIcon: { alignItems: "center", backgroundColor: "#183536", borderRadius: 12, height: 42, justifyContent: "center", width: 42 },
  resultTitle: { color: "#E8F0F1", fontSize: 19, fontWeight: "800" },
  resultBody: { color: "#A7B9BD", fontSize: 12, lineHeight: 18 },
  scanAgain: { alignItems: "center", padding: 6 },
  scanAgainText: { color: "#83C4FF", fontSize: 12, fontWeight: "800" },
  permission: { flex: 1, gap: 15, justifyContent: "center" },
  permissionIcon: { alignItems: "center", backgroundColor: "#183536", borderRadius: 18, height: 64, justifyContent: "center", width: 64 },
  permissionTitle: { color: "#E8F0F1", fontSize: 24, fontWeight: "800" },
  permissionBody: { color: "#A4B6BA", fontSize: 14, lineHeight: 21, marginBottom: 5 },
});
