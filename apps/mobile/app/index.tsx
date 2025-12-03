// =============================================================================
// APP ENTRY - AUTH REDIRECT
// =============================================================================
// Redirects to appropriate screen based on auth state.
// AuthProvider handles React Query state management and session validation,
// so we can safely use isLoading and isAuthenticated from context.
// =============================================================================

import { Redirect } from "expo-router";
import { YStack, Spinner, Text } from "tamagui";
import { useAuth } from "@/features/auth";

export default function Index() {
  const { isLoading, isAuthenticated } = useAuth();

  // Show loading state while checking auth (storage + server validation)
  // AuthProvider ensures we don't redirect prematurely during hot reloads
  if (isLoading) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center" gap="$4">
        <Spinner size="large" color="$brand" />
        <Text color="$gray10">Loading...</Text>
      </YStack>
    );
  }

  // Redirect based on auth state
  // Only redirects after AuthProvider has completed loading and validation
  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)/login" />;
}

