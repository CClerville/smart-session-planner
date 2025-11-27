// =============================================================================
// REGISTER SCREEN
// =============================================================================
// User registration form with email/password/name.
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

export default function RegisterScreen() {
  const { setAuth } = useAuth();

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Register mutation
  const registerMutation = trpc.auth.register.useMutation({
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

  const handleRegister = () => {
    setError(null);

    // Validation
    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    if (!password) {
      setError("Password is required");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    registerMutation.mutate({
      email: email.trim(),
      password,
      name: name.trim() || undefined,
    });
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
            Create Account
          </H1>
          <Paragraph textAlign="center" color="$gray10">
            Start planning smarter sessions today
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
              Name (optional)
            </Text>
            <Input
              placeholder="Your name"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              size="$5"
              borderWidth={1}
              borderColor="$gray6"
              focusStyle={{ borderColor: "$brand" }}
            />
          </YStack>

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
              placeholder="At least 8 characters"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              size="$5"
              borderWidth={1}
              borderColor="$gray6"
              focusStyle={{ borderColor: "$brand" }}
            />
          </YStack>

          <YStack gap="$2">
            <Text color="$gray11" fontSize="$2" fontWeight="600">
              Confirm Password
            </Text>
            <Input
              placeholder="••••••••"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
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
            onPress={handleRegister}
            disabled={registerMutation.isPending}
            pressStyle={{ opacity: 0.8 }}
            marginTop="$2"
          >
            {registerMutation.isPending ? (
              <Spinner color="white" />
            ) : (
              "Create Account"
            )}
          </Button>
        </YStack>

        {/* Login Link */}
        <XStack justifyContent="center" gap="$2" marginTop="$4">
          <Text color="$gray10">Already have an account?</Text>
          <Link href="/(auth)/login" asChild>
            <Text color="$brand" fontWeight="600" pressStyle={{ opacity: 0.7 }}>
              Sign In
            </Text>
          </Link>
        </XStack>
      </YStack>
    </KeyboardAvoidingView>
  );
}
