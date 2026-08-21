import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { AtlasApiProvider } from "@/components/atlas-api-provider";
import { AtlasToast } from "@/components/atlas-runtime";
import { AtlasSyncProvider } from "@/components/atlas-sync-provider";
import { AtlasProvider } from "@/lib/atlas-store";
import { ThemeProvider } from "@/lib/theme-provider";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <AtlasApiProvider>
          <AtlasSyncProvider>
          <AtlasProvider>
            <StatusBar style="light" />
            <Stack screenOptions={{ headerShown: false, animation: "fade" }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="asset/[id]" options={{ presentation: "card" }} />
              <Stack.Screen name="task/[id]" options={{ presentation: "card" }} />
              <Stack.Screen name="project/[id]" options={{ presentation: "card" }} />
              <Stack.Screen name="operations" options={{ presentation: "card" }} />
              <Stack.Screen name="tower" options={{ presentation: "card" }} />
              <Stack.Screen name="twin/[id]" options={{ presentation: "card" }} />
              <Stack.Screen name="memory" options={{ presentation: "card" }} />
              <Stack.Screen name="scenario" options={{ presentation: "card" }} />
              <Stack.Screen name="agents" options={{ presentation: "card" }} />
              <Stack.Screen name="governance" options={{ presentation: "card" }} />
              <Stack.Screen name="pilot" options={{ presentation: "card" }} />
              <Stack.Screen name="network" options={{ presentation: "card" }} />
              <Stack.Screen name="partner/[id]" options={{ presentation: "card" }} />
              <Stack.Screen name="network-transaction" options={{ presentation: "card" }} />
              <Stack.Screen name="inspection" options={{ presentation: "card" }} />
              <Stack.Screen name="voice-note" options={{ presentation: "card" }} />
              <Stack.Screen name="commerce" options={{ presentation: "card" }} />
              <Stack.Screen name="scan" options={{ presentation: "fullScreenModal", animation: "fade" }} />
            </Stack>
            <AtlasToast />
          </AtlasProvider>
          </AtlasSyncProvider>
        </AtlasApiProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
