// =============================================================================
// PROFILE SCREEN
// =============================================================================
// User settings, availability, and account management.
// =============================================================================

import { ScrollView, Alert } from "react-native";
import { Link, router } from "expo-router";
import {
  YStack,
  XStack,
  Text,
  H2,
  Card,
  Button,
  Separator,
} from "tamagui";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../lib/auth";
import { trpc } from "../../lib/trpc";

export default function ProfileScreen() {
  const { user, clearAuth } = useAuth();

  // Fetch user stats for profile summary
  const statsQuery = trpc.stats.getStats.useQuery();

  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          await clearAuth();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16 }}
      >
        {/* Header */}
        <YStack marginBottom="$4">
          <H2 color="$color12">Profile</H2>
        </YStack>

        {/* User Info Card */}
        <Card padding="$4" backgroundColor="$gray2" marginBottom="$4">
          <XStack alignItems="center" gap="$3">
            <YStack
              width={60}
              height={60}
              borderRadius={30}
              backgroundColor="$brand"
              justifyContent="center"
              alignItems="center"
            >
              <Text color="white" fontSize="$7" fontWeight="700">
                {(user?.name?.[0] ?? user?.email?.[0] ?? "U").toUpperCase()}
              </Text>
            </YStack>
            <YStack flex={1}>
              <Text color="$color12" fontSize="$5" fontWeight="600">
                {user?.name ?? "User"}
              </Text>
              <Text color="$gray10" fontSize="$3">
                {user?.email}
              </Text>
            </YStack>
          </XStack>

          {/* Quick Stats */}
          <XStack marginTop="$4" gap="$4">
            <YStack flex={1} alignItems="center">
              <Text color="$color12" fontSize="$6" fontWeight="700">
                {statsQuery.data?.totalCompleted ?? 0}
              </Text>
              <Text color="$gray10" fontSize="$2">
                Completed
              </Text>
            </YStack>
            <YStack flex={1} alignItems="center">
              <Text color="$color12" fontSize="$6" fontWeight="700">
                {statsQuery.data?.currentStreak ?? 0}
              </Text>
              <Text color="$gray10" fontSize="$2">
                Day Streak
              </Text>
            </YStack>
            <YStack flex={1} alignItems="center">
              <Text color="$color12" fontSize="$6" fontWeight="700">
                {statsQuery.data?.totalHoursCompleted ?? 0}h
              </Text>
              <Text color="$gray10" fontSize="$2">
                Total Time
              </Text>
            </YStack>
          </XStack>
        </Card>

        {/* Menu Items */}
        <YStack gap="$2">
          <Text color="$gray10" fontSize="$2" fontWeight="600" marginBottom="$1">
            SETTINGS
          </Text>

          <Link href="/availability" asChild>
            <Card
              padding="$4"
              backgroundColor="$gray2"
              pressStyle={{ opacity: 0.8 }}
            >
              <XStack alignItems="center" gap="$3">
                <YStack
                  width={40}
                  height={40}
                  borderRadius="$3"
                  backgroundColor="$blue5"
                  justifyContent="center"
                  alignItems="center"
                >
                  <Ionicons name="time-outline" size={20} color="#3B82F6" />
                </YStack>
                <YStack flex={1}>
                  <Text color="$color12" fontWeight="600">
                    Availability
                  </Text>
                  <Text color="$gray10" fontSize="$2">
                    Set your weekly availability
                  </Text>
                </YStack>
                <Ionicons name="chevron-forward" size={20} color="#6B7280" />
              </XStack>
            </Card>
          </Link>

          <Link href="/stats" asChild>
            <Card
              padding="$4"
              backgroundColor="$gray2"
              pressStyle={{ opacity: 0.8 }}
            >
              <XStack alignItems="center" gap="$3">
                <YStack
                  width={40}
                  height={40}
                  borderRadius="$3"
                  backgroundColor="$green5"
                  justifyContent="center"
                  alignItems="center"
                >
                  <Ionicons name="stats-chart" size={20} color="#22C55E" />
                </YStack>
                <YStack flex={1}>
                  <Text color="$color12" fontWeight="600">
                    Statistics
                  </Text>
                  <Text color="$gray10" fontSize="$2">
                    View detailed analytics
                  </Text>
                </YStack>
                <Ionicons name="chevron-forward" size={20} color="#6B7280" />
              </XStack>
            </Card>
          </Link>

          <Link href="/suggestions" asChild>
            <Card
              padding="$4"
              backgroundColor="$gray2"
              pressStyle={{ opacity: 0.8 }}
            >
              <XStack alignItems="center" gap="$3">
                <YStack
                  width={40}
                  height={40}
                  borderRadius="$3"
                  backgroundColor="$yellow5"
                  justifyContent="center"
                  alignItems="center"
                >
                  <Ionicons name="bulb-outline" size={20} color="#F59E0B" />
                </YStack>
                <YStack flex={1}>
                  <Text color="$color12" fontWeight="600">
                    Smart Suggestions
                  </Text>
                  <Text color="$gray10" fontSize="$2">
                    Get AI-powered scheduling tips
                  </Text>
                </YStack>
                <Ionicons name="chevron-forward" size={20} color="#6B7280" />
              </XStack>
            </Card>
          </Link>
        </YStack>

        <Separator marginVertical="$4" />

        {/* Logout */}
        <Button
          size="$5"
          backgroundColor="$red4"
          color="$red10"
          onPress={handleLogout}
          icon={<Ionicons name="log-out-outline" size={20} color="#EF4444" />}
        >
          Log Out
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

