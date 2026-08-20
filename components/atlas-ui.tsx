import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import type { ComponentProps, ReactNode } from "react";
import { Pressable, StyleSheet, Text, View, type ViewStyle } from "react-native";

import type { Severity } from "@/lib/atlas-data";

type IconName = ComponentProps<typeof MaterialIcons>["name"];

const severityColors: Record<Severity, { background: string; foreground: string; dot: string; label: string }> = {
  critical: { background: "#3B1E1B", foreground: "#FF9A8B", dot: "#FF6B57", label: "Critical" },
  high: { background: "#3A2C16", foreground: "#FFD37A", dot: "#F5B84B", label: "High" },
  attention: { background: "#3A2C16", foreground: "#FFD37A", dot: "#F5B84B", label: "Attention" },
  normal: { background: "#213139", foreground: "#9CC7E9", dot: "#4E9BFF", label: "Normal" },
  good: { background: "#17342F", foreground: "#7CE5D4", dot: "#21D4C2", label: "Healthy" },
};

export function AppMark({ size = 34 }: { size?: number }) {
  return (
    <View style={[styles.mark, { width: size, height: size, borderRadius: size * 0.3 }]}>
      <View style={[styles.markLine, { width: size * 0.5 }]} />
      <View style={[styles.markDot, { width: size * 0.18, height: size * 0.18, borderRadius: size }]} />
    </View>
  );
}

export function Icon({ name, color = "#E8F0F1", size = 20 }: { name: IconName; color?: string; size?: number }) {
  return <MaterialIcons name={name} color={color} size={size} />;
}

export function IconAction({ name, label, onPress, accent = false }: { name: IconName; label: string; onPress: () => void; accent?: boolean }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={({ pressed }) => [styles.iconAction, accent && styles.iconActionAccent, pressed && styles.pressed]}>
      <Icon name={name} size={20} color={accent ? "#0B1216" : "#C9D5D8"} />
    </Pressable>
  );
}

export function SeverityPill({ severity, label }: { severity: Severity; label?: string }) {
  const color = severityColors[severity];
  return (
    <View style={[styles.pill, { backgroundColor: color.background }]}>
      <View style={[styles.pillDot, { backgroundColor: color.dot }]} />
      <Text style={[styles.pillText, { color: color.foreground }]}>{label ?? color.label}</Text>
    </View>
  );
}

export function SectionTitle({ eyebrow, title, action, onAction }: { eyebrow?: string; title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.sectionTitle}>
      <View style={styles.sectionTitleText}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.sectionHeading}>{title}</Text>
      </View>
      {action ? <Pressable onPress={onAction} style={({ pressed }) => pressed && styles.textPressed}><Text style={styles.sectionAction}>{action}</Text></Pressable> : null}
    </View>
  );
}

export function Surface({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[styles.surface, style]}>{children}</View>;
}

export function MetricCard({ label, value, detail, tone = "neutral", icon }: { label: string; value: string; detail: string; tone?: "neutral" | "good" | "attention" | "critical"; icon: IconName }) {
  const accent = tone === "good" ? "#21D4C2" : tone === "attention" ? "#F5B84B" : tone === "critical" ? "#FF6B57" : "#4E9BFF";
  return (
    <Surface style={styles.metricCard}>
      <View style={[styles.metricIcon, { backgroundColor: `${accent}1C` }]}><Icon name={icon} color={accent} size={18} /></View>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricDetail}>{detail}</Text>
    </Surface>
  );
}

export function PrimaryButton({ label, onPress, icon = "arrow-forward", kind = "primary" }: { label: string; onPress: () => void; icon?: IconName; kind?: "primary" | "secondary" | "danger" }) {
  const isPrimary = kind === "primary";
  const isDanger = kind === "danger";
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.primaryButton, !isPrimary && styles.secondaryButton, isDanger && styles.dangerButton, pressed && styles.pressed]}>
      <Text style={[styles.primaryButtonText, !isPrimary && styles.secondaryButtonText]}>{label}</Text>
      <Icon name={icon} color={isPrimary ? "#071416" : "#C9D5D8"} size={18} />
    </Pressable>
  );
}

export function LinkedRecord({ icon, title, detail, onPress, severity }: { icon: IconName; title: string; detail: string; onPress?: () => void; severity?: Severity }) {
  const content = (
    <>
      <View style={styles.recordIcon}><Icon name={icon} size={20} color="#9CC7E9" /></View>
      <View style={styles.recordBody}>
        <Text style={styles.recordTitle}>{title}</Text>
        <Text style={styles.recordDetail} numberOfLines={2}>{detail}</Text>
      </View>
      {severity ? <SeverityPill severity={severity} /> : <Icon name="chevron-right" color="#6D8188" size={20} />}
    </>
  );
  if (!onPress) return <View style={styles.record}>{content}</View>;
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.record, pressed && styles.pressed]}>{content}</Pressable>;
}

export const palette = {
  background: "#0B1216",
  surface: "#121D22",
  surfaceRaised: "#17242A",
  border: "#28383E",
  text: "#E8F0F1",
  muted: "#8EA0A7",
  cyan: "#21D4C2",
  blue: "#4E9BFF",
  amber: "#F5B84B",
  vermilion: "#FF6B57",
};

const styles = StyleSheet.create({
  mark: { alignItems: "center", backgroundColor: "#21D4C2", justifyContent: "center", overflow: "hidden" },
  markLine: { backgroundColor: "#0B1216", height: 3, borderRadius: 4, transform: [{ rotate: "-35deg" }] },
  markDot: { position: "absolute", backgroundColor: "#0B1216", right: "20%", bottom: "25%" },
  iconAction: { alignItems: "center", backgroundColor: "#17242A", borderColor: "#2B3B41", borderWidth: 1, height: 40, justifyContent: "center", width: 40, borderRadius: 20 },
  iconActionAccent: { backgroundColor: "#21D4C2", borderColor: "#21D4C2" },
  pill: { alignItems: "center", alignSelf: "flex-start", borderRadius: 100, flexDirection: "row", gap: 6, paddingHorizontal: 9, paddingVertical: 5 },
  pillDot: { height: 6, width: 6, borderRadius: 99 },
  pillText: { fontSize: 11, fontWeight: "700", letterSpacing: 0.15 },
  sectionTitle: { alignItems: "flex-end", flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  sectionTitleText: { gap: 2 },
  eyebrow: { color: "#8EA0A7", fontSize: 10, fontWeight: "800", letterSpacing: 1.2, textTransform: "uppercase" },
  sectionHeading: { color: "#E8F0F1", fontSize: 20, fontWeight: "700", letterSpacing: -0.35 },
  sectionAction: { color: "#78B6FF", fontSize: 13, fontWeight: "700" },
  surface: { backgroundColor: "#121D22", borderColor: "#28383E", borderRadius: 18, borderWidth: 1 },
  metricCard: { flex: 1, minHeight: 142, padding: 14 },
  metricIcon: { alignItems: "center", borderRadius: 10, height: 32, justifyContent: "center", width: 32 },
  metricLabel: { color: "#8EA0A7", fontSize: 11, fontWeight: "700", marginTop: 13 },
  metricValue: { color: "#E8F0F1", fontSize: 23, fontWeight: "800", letterSpacing: -0.65, marginTop: 3 },
  metricDetail: { color: "#8EA0A7", fontSize: 11, lineHeight: 15, marginTop: 4 },
  primaryButton: { alignItems: "center", backgroundColor: "#21D4C2", borderRadius: 13, flexDirection: "row", gap: 10, justifyContent: "center", minHeight: 48, paddingHorizontal: 16 },
  secondaryButton: { backgroundColor: "#17242A", borderColor: "#31434A", borderWidth: 1 },
  dangerButton: { backgroundColor: "#FF6B57", borderColor: "#FF6B57" },
  primaryButtonText: { color: "#071416", fontSize: 14, fontWeight: "800" },
  secondaryButtonText: { color: "#D7E2E4" },
  record: { alignItems: "center", backgroundColor: "#121D22", borderColor: "#28383E", borderRadius: 16, borderWidth: 1, flexDirection: "row", gap: 12, minHeight: 76, padding: 12 },
  recordIcon: { alignItems: "center", backgroundColor: "#1C2D34", borderRadius: 12, height: 42, justifyContent: "center", width: 42 },
  recordBody: { flex: 1, gap: 4 },
  recordTitle: { color: "#E8F0F1", fontSize: 14, fontWeight: "700" },
  recordDetail: { color: "#8EA0A7", fontSize: 12, lineHeight: 16 },
  pressed: { opacity: 0.72, transform: [{ scale: 0.985 }] },
  textPressed: { opacity: 0.65 },
});

