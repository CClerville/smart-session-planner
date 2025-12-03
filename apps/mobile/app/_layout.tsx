import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { TamaguiProvider, Theme } from "tamagui";

import { API_URL } from "@/constants";
import { AuthProvider, TRPCProvider } from "@/lib/providers";
import config from "../tamagui.config";

// Light lavender background from Figma design
const BACKGROUND_COLOR = "#F8F0F8";

// Prevent splash screen from hiding until fonts load
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // Load fonts required by Tamagui
  const [fontsLoaded] = useFonts({
    Inter: require("@tamagui/font-inter/otf/Inter-Medium.otf"),
    InterBold: require("@tamagui/font-inter/otf/Inter-Bold.otf"),
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <TamaguiProvider config={config}>
      {/* Force light theme to match Figma design */}
      <Theme name="light">
        <TRPCProvider apiUrl={API_URL}>
          <AuthProvider>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: {
                  backgroundColor: BACKGROUND_COLOR,
                },
                headerStyle: {
                  backgroundColor: BACKGROUND_COLOR,
                },
                headerTintColor: "#1A1A1A",
                headerTitleStyle: {
                  fontWeight: "600",
                  color: "#1A1A1A",
                },
              }}
            />
            <StatusBar style="dark" />
          </AuthProvider>
        </TRPCProvider>
      </Theme>
    </TamaguiProvider>
  );
}
