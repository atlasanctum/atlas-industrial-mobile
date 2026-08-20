import { router } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { Icon, IconAction, PrimaryButton, SectionTitle, SeverityPill, Surface } from "@/components/atlas-ui";
import { ScreenContainer } from "@/components/screen-container";
import { orders } from "@/lib/atlas-data";
import { useAtlas } from "@/lib/atlas-store";

export default function CommerceScreen() {
  const { notify } = useAtlas();
  return <ScreenContainer className="flex-1" edges={["top", "left", "right", "bottom"]} containerClassName="bg-background"><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <View style={styles.header}><IconAction name="arrow-back" label="Back to command" onPress={() => router.back()} /><View style={styles.headCenter}><Text style={styles.eyebrow}>Commercial operations</Text><Text style={styles.title}>Commerce</Text></View><IconAction name="more-horiz" label="More commerce options" onPress={() => notify("Commercial records remain connected to production and logistics.")} /></View>
    <Surface style={styles.flowCard}><Text style={styles.flowLabel}>Connected order flow</Text><View style={styles.flow}><View style={styles.flowStep}><Icon name="receipt-long" color="#9CC7E9" size={17} /><Text style={styles.flowText}>Order</Text></View><Icon name="arrow-forward" color="#52656B" size={16} /><View style={styles.flowStep}><Icon name="precision-manufacturing" color="#9CC7E9" size={17} /><Text style={styles.flowText}>Produce</Text></View><Icon name="arrow-forward" color="#52656B" size={16} /><View style={styles.flowStep}><Icon name="local-shipping" color="#9CC7E9" size={17} /><Text style={styles.flowText}>Deliver</Text></View></View></Surface>
    <View style={styles.metricRow}><Surface style={styles.metric}><Icon name="warning-amber" color="#F5B84B" size={18} /><Text style={styles.metricValue}>1</Text><Text style={styles.metricLabel}>commitment at risk</Text></Surface><Surface style={styles.metric}><Icon name="local-shipping" color="#21D4C2" size={18} /><Text style={styles.metricValue}>1</Text><Text style={styles.metricLabel}>dispatch ready</Text></Surface></View>
    <SectionTitle eyebrow="Economic events" title="Orders & commitments" />
    <View style={styles.orderList}>{orders.map((order) => { const severity = order.status === "At risk" ? "critical" : order.status === "Ready to dispatch" ? "good" : "attention" as const; return <Surface key={order.id} style={styles.orderCard}><View style={styles.orderTop}><Text style={styles.orderId}>{order.id}</Text><SeverityPill severity={severity} label={order.status} /></View><Text style={styles.customer}>{order.customer}</Text><Text style={styles.product}>{order.product}</Text><Text style={styles.note}>{order.note}</Text><View style={styles.orderFooter}><Text style={styles.value}>{order.value}</Text><PrimaryButton label="Trace" kind="secondary" icon="account-tree" onPress={() => notify(`${order.id} is linked to its related production, material, delivery, and evidence records.`)} /></View></Surface> })}</View>
    <SectionTitle eyebrow="Decision support" title="Protect the order" />
    <Surface style={styles.recovery}><View style={styles.recoveryIcon}><Icon name="auto-awesome" color="#21D4C2" size={20} /></View><View style={styles.recoveryText}><Text style={styles.recoveryTitle}>SO-812 recovery path</Text><Text style={styles.recoveryBody}>Complete Job 182’s controlled alternate route, then release the LifeHouse delivery approval.</Text></View></Surface>
  </ScrollView></ScreenContainer>;
}

const styles = StyleSheet.create({
  content: { gap: 17, paddingBottom: 30, paddingHorizontal: 18, paddingTop: 8 },
  header: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  headCenter: { alignItems: "center" },
  eyebrow: { color: "#8EA0A7", fontSize: 10, fontWeight: "800", letterSpacing: 1.05, textTransform: "uppercase" },
  title: { color: "#E8F0F1", fontSize: 25, fontWeight: "800", letterSpacing: -0.7, marginTop: 2 },
  flowCard: { gap: 12, padding: 14 },
  flowLabel: { color: "#8EA0A7", fontSize: 11, fontWeight: "800", textTransform: "uppercase" },
  flow: { alignItems: "center", flexDirection: "row", justifyContent: "space-around" },
  flowStep: { alignItems: "center", gap: 5 },
  flowText: { color: "#C6D7DA", fontSize: 11, fontWeight: "800" },
  metricRow: { flexDirection: "row", gap: 10 },
  metric: { flex: 1, gap: 7, padding: 13 },
  metricValue: { color: "#E8F0F1", fontSize: 23, fontWeight: "800", marginTop: 3 },
  metricLabel: { color: "#8EA0A7", fontSize: 11, fontWeight: "700" },
  orderList: { gap: 10 },
  orderCard: { gap: 9, padding: 14 },
  orderTop: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  orderId: { color: "#7F949B", fontSize: 10, fontWeight: "900", letterSpacing: 0.9 },
  customer: { color: "#E8F0F1", fontSize: 16, fontWeight: "800" },
  product: { color: "#B2C4C8", fontSize: 12, fontWeight: "700" },
  note: { color: "#8EA0A7", fontSize: 12, lineHeight: 18 },
  orderFooter: { alignItems: "center", flexDirection: "row", gap: 10, justifyContent: "space-between", marginTop: 2 },
  value: { color: "#9EC6EC", flex: 1, fontSize: 11, fontWeight: "700", lineHeight: 16 },
  recovery: { alignItems: "center", flexDirection: "row", gap: 11, padding: 13 },
  recoveryIcon: { alignItems: "center", backgroundColor: "#183536", borderRadius: 12, height: 42, justifyContent: "center", width: 42 },
  recoveryText: { flex: 1, gap: 3 },
  recoveryTitle: { color: "#E8F0F1", fontSize: 13, fontWeight: "800" },
  recoveryBody: { color: "#8EA0A7", fontSize: 11, lineHeight: 16 },
});
