import { trpc } from "@/lib/api";
import { Link, router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Button,
  Input,
  Spinner,
  Text,
  XStack,
  YStack,
  useTheme,
} from "tamagui";
import { useAuth } from "../hooks";

export function RegisterScreen() {
  const theme = useTheme();
  const { setAuth } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

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
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.pageBg.val }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
          keyboardShouldPersistTaps="handled"
        >
          <YStack flex={1} padding="$6" justifyContent="center" gap="$5">
            {/* Header */}
            <YStack gap="$2" marginBottom="$4">
              <Text
                textAlign="center"
                color={"$textPrimary"}
                fontSize={32}
                fontWeight="700"
                fontFamily="InterBold"
              >
                Create Account
              </Text>
              <Text textAlign="center" color={"$textSecondary"} fontSize={16}>
                Start planning smarter sessions today
              </Text>
            </YStack>

            {/* Error Message */}
            {error && (
              <XStack
                backgroundColor={theme.danger.val}
                padding="$4"
                borderRadius={12}
              >
                <Text color={"#FFFFFF"} fontSize={14}>
                  {error}
                </Text>
              </XStack>
            )}

            {/* Form */}
            <YStack gap="$4">
              <YStack gap="$2">
                <Text color={"$textSecondary"} fontSize={13} fontWeight="600">
                  Name (optional)
                </Text>
                <Input
                  placeholder="Your name"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  size="$5"
                  borderWidth={1}
                  borderColor={"$borderLight"}
                  borderRadius={12}
                  backgroundColor={"$cardBg"}
                  focusStyle={{ borderColor: theme.accent.val }}
                />
              </YStack>

              <YStack gap="$2">
                <Text color={"$textSecondary"} fontSize={13} fontWeight="600">
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
                  borderColor={"$borderLight"}
                  borderRadius={12}
                  backgroundColor={"$cardBg"}
                  focusStyle={{ borderColor: theme.accent.val }}
                />
              </YStack>

              <YStack gap="$2">
                <Text color={"$textSecondary"} fontSize={13} fontWeight="600">
                  Password
                </Text>
                <Input
                  placeholder="At least 8 characters"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  size="$5"
                  borderWidth={1}
                  borderColor={"$borderLight"}
                  borderRadius={12}
                  backgroundColor={"$cardBg"}
                  focusStyle={{ borderColor: theme.accent.val }}
                />
              </YStack>

              <YStack gap="$2">
                <Text color={"$textSecondary"} fontSize={13} fontWeight="600">
                  Confirm Password
                </Text>
                <Input
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  size="$5"
                  borderWidth={1}
                  borderColor={"$borderLight"}
                  borderRadius={12}
                  backgroundColor={"$cardBg"}
                  focusStyle={{ borderColor: theme.accent.val }}
                />
              </YStack>

              <Button
                size="$5"
                backgroundColor={"$buttonPrimary"}
                color="#FFFFFF"
                borderRadius={24}
                onPress={handleRegister}
                disabled={registerMutation.isPending}
                pressStyle={{ opacity: 0.9, scale: 0.99 }}
                marginTop="$2"
              >
                {registerMutation.isPending ? (
                  <Spinner color="#FFFFFF" />
                ) : (
                  "Create Account"
                )}
              </Button>
            </YStack>

            {/* Login Link */}
            <XStack justifyContent="center" gap="$2" marginTop="$4">
              <Text color={"$textSecondary"} fontSize={15}>
                Already have an account?
              </Text>
              <Link href="/(auth)/login" asChild>
                <Text
                  color={theme.accent.val}
                  fontSize={15}
                  fontWeight="600"
                  pressStyle={{ opacity: 0.7 }}
                >
                  Sign In
                </Text>
              </Link>
            </XStack>
          </YStack>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
