// =============================================================================
// LOGIN SCREEN
// =============================================================================
// User login form with email/password authentication.
// =============================================================================

import { Link, router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform } from "react-native";
import {
  Button,
  H1,
  Input,
  Paragraph,
  Spinner,
  Text,
  XStack,
  YStack,
} from "tamagui";
import { useAuth } from "../../lib/auth";
import { trpc } from "../../lib/trpc";

export default function LoginScreen() {
  const { setAuth } = useAuth();

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Login mutation
  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: async (data) => {
      await setAuth(data.token, {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
      });
      router.replace("/(tabs)");
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleLogin = () => {
    setError(null);

    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    if (!password) {
      setError("Password is required");
      return;
    }

    loginMutation.mutate({ email: email.trim(), password });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <YStack flex={1} padding="$6" justifyContent="center" gap="$4">
        {/* Header */}
        <YStack gap="$2" marginBottom="$4">
          <H1 textAlign="center" color="$color12">
            Welcome Back
          </H1>
          <Paragraph textAlign="center" color="$gray10">
            Sign in to continue planning your sessions
          </Paragraph>
        </YStack>

        {/* Error Message */}
        {error && (
          <XStack
            backgroundColor="$red2"
            padding="$3"
            borderRadius="$4"
            borderWidth={1}
            borderColor="$red6"
          >
            <Text color="$red10" fontSize="$3">
              {error}
            </Text>
          </XStack>
        )}

        {/* Form */}
        <YStack gap="$4">
          <YStack gap="$2">
            <Text color="$gray11" fontSize="$2" fontWeight="600">
              Email
            </Text>
            <Input
              placeholder="you@example.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              size="$5"
              borderWidth={1}
              borderColor="$gray6"
              focusStyle={{ borderColor: "$brand" }}
            />
          </YStack>

          <YStack gap="$2">
            <Text color="$gray11" fontSize="$2" fontWeight="600">
              Password
            </Text>
            <Input
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              size="$5"
              borderWidth={1}
              borderColor="$gray6"
              focusStyle={{ borderColor: "$brand" }}
            />
          </YStack>

          <Button
            size="$5"
            backgroundColor="$brand"
            color="white"
            onPress={handleLogin}
            disabled={loginMutation.isPending}
            pressStyle={{ opacity: 0.8 }}
            marginTop="$2"
          >
            {loginMutation.isPending ? <Spinner color="white" /> : "Sign In"}
          </Button>
        </YStack>

        {/* Register Link */}
        <XStack justifyContent="center" gap="$2" marginTop="$4">
          <Text color="$gray10">Don't have an account?</Text>
          <Link href="/(auth)/register" asChild>
            <Text color="$brand" fontWeight="600" pressStyle={{ opacity: 0.7 }}>
              Sign Up
            </Text>
          </Link>
        </XStack>
      </YStack>
    </KeyboardAvoidingView>
  );
}
