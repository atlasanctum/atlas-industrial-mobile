import { Tabs } from "expo-router";
import { Platform, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Icon } from "@/components/atlas-ui";

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === "web" ? 10 : Math.max(insets.bottom, 8);
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#21D4C2",
        tabBarInactiveTintColor: "#778A91",
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: styles.label,
        tabBarStyle: [styles.tabBar, { height: 59 + bottomPadding, paddingBottom: bottomPadding }],
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Command", tabBarIcon: ({ color }) => <Icon name="space-dashboard" color={color} size={22} /> }} />
      <Tabs.Screen name="work" options={{ title: "Work", tabBarIcon: ({ color }) => <Icon name="assignment" color={color} size={22} /> }} />
      <Tabs.Screen name="assets" options={{ title: "Assets", tabBarIcon: ({ color }) => <Icon name="precision-manufacturing" color={color} size={22} /> }} />
      <Tabs.Screen name="projects" options={{ title: "Projects", tabBarIcon: ({ color }) => <Icon name="account-tree" color={color} size={22} /> }} />
      <Tabs.Screen name="intelligence" options={{ title: "Intelligence", tabBarIcon: ({ color }) => <Icon name="auto-awesome" color={color} size={21} /> }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: { backgroundColor: "#0E181D", borderTopColor: "#293940", borderTopWidth: 1, paddingTop: 8 },
  label: { fontSize: 10, fontWeight: "700", marginTop: 2 },
});
