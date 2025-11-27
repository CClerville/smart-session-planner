// =============================================================================
// ROOT LAYOUT
// =============================================================================
// App entry point with providers and navigation setup.
// =============================================================================

import { useEffect } from "react";
import { useColorScheme } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { TamaguiProvider, Theme } from "tamagui";
import { useFonts } from "expo-font";

import config from "../tamagui.config";
import { TRPCProvider } from "../lib/trpc";
import { AuthProvider } from "../lib/auth";
import { API_URL } from "../lib/constants";

// Prevent splash screen from hiding until fonts load
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

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
      <Theme name={colorScheme === "dark" ? "dark" : "light"}>
        <TRPCProvider apiUrl={API_URL}>
          <AuthProvider>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: {
                  backgroundColor: colorScheme === "dark" ? "#0a0a0a" : "#fff",
                },
              }}
            />
            <StatusBar style="auto" />
          </AuthProvider>
        </TRPCProvider>
      </Theme>
    </TamaguiProvider>
  );
}

