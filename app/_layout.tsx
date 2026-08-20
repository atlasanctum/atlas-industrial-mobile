import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { AtlasApiProvider } from "@/components/atlas-api-provider";
import { AtlasToast } from "@/components/atlas-runtime";
import { AtlasProvider } from "@/lib/atlas-store";
import { ThemeProvider } from "@/lib/theme-provider";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <AtlasApiProvider>
          <AtlasProvider>
            <StatusBar style="light" />
            <Stack screenOptions={{ headerShown: false, animation: "fade" }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="asset/[id]" options={{ presentation: "card" }} />
              <Stack.Screen name="task/[id]" options={{ presentation: "card" }} />
              <Stack.Screen name="project/[id]" options={{ presentation: "card" }} />
              <Stack.Screen name="commerce" options={{ presentation: "card" }} />
              <Stack.Screen name="scan" options={{ presentation: "fullScreenModal", animation: "fade" }} />
            </Stack>
            <AtlasToast />
          </AtlasProvider>
        </AtlasApiProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
