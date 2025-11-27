// =============================================================================
// APP ENTRY - AUTH REDIRECT
// =============================================================================
// Redirects to appropriate screen based on auth state.
// =============================================================================

import { useEffect } from "react";
import { Redirect } from "expo-router";
import { YStack, Spinner, Text } from "tamagui";
import { useAuth } from "../lib/auth";

export default function Index() {
  const { isLoading, isAuthenticated } = useAuth();

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center" gap="$4">
        <Spinner size="large" color="$brand" />
        <Text color="$gray10">Loading...</Text>
      </YStack>
    );
  }

  // Redirect based on auth state
  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)/login" />;
}

