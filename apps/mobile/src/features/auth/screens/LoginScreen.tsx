import { trpc } from "@/lib/api";
import { Link, router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform } from "react-native";
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

export function LoginScreen() {
  const theme = useTheme();
  const { setAuth } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

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
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.pageBg.val }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
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
              Welcome Back
            </Text>
            <Text textAlign="center" color={"$textSecondary"} fontSize={16}>
              Sign in to continue planning your sessions
            </Text>
          </YStack>

          {/* Error Message */}
          {error && (
            <XStack
              backgroundColor={theme.danger.val}
              padding="$4"
              borderRadius={12}
            >
              <Text color={theme.danger.val} fontSize={14}>
                {error}
              </Text>
            </XStack>
          )}

          {/* Form */}
          <YStack gap="$4">
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
                placeholder="••••••••"
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

            <Button
              size="$5"
              backgroundColor={"$buttonPrimary"}
              color="#FFFFFF"
              borderRadius={24}
              onPress={handleLogin}
              disabled={loginMutation.isPending}
              pressStyle={{ opacity: 0.9, scale: 0.99 }}
              marginTop="$2"
            >
              {loginMutation.isPending ? (
                <Spinner color="#FFFFFF" />
              ) : (
                "Sign In"
              )}
            </Button>
          </YStack>

          {/* Register Link */}
          <XStack justifyContent="center" gap="$2" marginTop="$4">
            <Text color={"$textSecondary"} fontSize={15}>
              Don't have an account?
            </Text>
            <Link href="/(auth)/register" asChild>
              <Text
                color={theme.accent.val}
                fontSize={15}
                fontWeight="600"
                pressStyle={{ opacity: 0.7 }}
              >
                Sign Up
              </Text>
            </Link>
          </XStack>
        </YStack>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
