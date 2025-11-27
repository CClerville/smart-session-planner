// =============================================================================
// STATS SCREEN
// =============================================================================
// Detailed statistics and analytics for session progress.
// =============================================================================

import { ScrollView, RefreshControl } from "react-native";
import { Stack } from "expo-router";
import {
  YStack,
  XStack,
  Text,
  H2,
  H3,
  Card,
  Spinner,
  Progress,
} from "tamagui";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { trpc } from "../lib/trpc";
import { PRIORITY_COLORS, type Priority } from "../lib/constants";

export default function StatsScreen() {
  const statsQuery = trpc.stats.getStats.useQuery();

  const handleRefresh = () => {
    statsQuery.refetch();
  };

  if (statsQuery.isLoading) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center">
        <Spinner size="large" color="$brand" />
      </YStack>
    );
  }

  const stats = statsQuery.data;

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Statistics",
          headerBackTitle: "Back",
        }}
      />
      <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={
            <RefreshControl
              refreshing={statsQuery.isFetching}
              onRefresh={handleRefresh}
            />
          }
        >
          <YStack gap="$4">
            {/* Overview Stats */}
            <Card padding="$4" backgroundColor="$gray2">
              <H3 color="$color12" marginBottom="$3">
                Overview
              </H3>
              <XStack flexWrap="wrap" gap="$3">
                <StatBox
                  icon="checkmark-circle"
                  iconColor="#22C55E"
                  label="Completed"
                  value={stats?.totalCompleted ?? 0}
                />
                <StatBox
                  icon="calendar"
                  iconColor="#3B82F6"
                  label="Scheduled"
                  value={stats?.totalScheduled ?? 0}
                />
                <StatBox
                  icon="close-circle"
                  iconColor="#6B7280"
                  label="Cancelled"
                  value={stats?.totalCancelled ?? 0}
                />
                <StatBox
                  icon="time"
                  iconColor="#8B5CF6"
                  label="Hours Tracked"
                  value={`${stats?.totalHoursCompleted ?? 0}h`}
                />
              </XStack>
            </Card>

            {/* Completion Rate */}
            <Card padding="$4" backgroundColor="$gray2">
              <XStack justifyContent="space-between" alignItems="center" marginBottom="$3">
                <H3 color="$color12">Completion Rate</H3>
                <Text color="$brand" fontSize="$7" fontWeight="700">
                  {stats?.completionRate ?? 0}%
                </Text>
              </XStack>
              <Progress value={stats?.completionRate ?? 0} backgroundColor="$gray5">
                <Progress.Indicator animation="bouncy" backgroundColor="$brand" />
              </Progress>
            </Card>

            {/* Streaks and Averages */}
            <Card padding="$4" backgroundColor="$gray2">
              <H3 color="$color12" marginBottom="$3">
                Streaks & Averages
              </H3>
              <YStack gap="$3">
                <XStack justifyContent="space-between" alignItems="center">
                  <XStack alignItems="center" gap="$2">
                    <Ionicons name="flame" size={20} color="#F59E0B" />
                    <Text color="$color12">Current Streak</Text>
                  </XStack>
                  <Text color="$color12" fontWeight="700" fontSize="$5">
                    {stats?.currentStreak ?? 0} days
                  </Text>
                </XStack>

                <XStack justifyContent="space-between" alignItems="center">
                  <XStack alignItems="center" gap="$2">
                    <Ionicons name="analytics" size={20} color="#3B82F6" />
                    <Text color="$color12">Avg Sessions/Week</Text>
                  </XStack>
                  <Text color="$color12" fontWeight="700" fontSize="$5">
                    {stats?.avgSessionsPerWeek ?? 0}
                  </Text>
                </XStack>

                <XStack justifyContent="space-between" alignItems="center">
                  <XStack alignItems="center" gap="$2">
                    <Ionicons name="swap-horizontal" size={20} color="#22C55E" />
                    <Text color="$color12">Avg Gap Between Sessions</Text>
                  </XStack>
                  <Text color="$color12" fontWeight="700" fontSize="$5">
                    {stats?.avgGapDays ?? 0} days
                  </Text>
                </XStack>
              </YStack>
            </Card>

            {/* This Week */}
            <Card padding="$4" backgroundColor="$gray2">
              <H3 color="$color12" marginBottom="$3">
                This Week
              </H3>
              <XStack gap="$3">
                <YStack flex={1} alignItems="center" padding="$3" backgroundColor="$gray4" borderRadius="$3">
                  <Text color="$green10" fontSize="$7" fontWeight="700">
                    {stats?.thisWeek.completed ?? 0}
                  </Text>
                  <Text color="$gray10" fontSize="$2">
                    Completed
                  </Text>
                </YStack>
                <YStack flex={1} alignItems="center" padding="$3" backgroundColor="$gray4" borderRadius="$3">
                  <Text color="$blue10" fontSize="$7" fontWeight="700">
                    {stats?.thisWeek.scheduled ?? 0}
                  </Text>
                  <Text color="$gray10" fontSize="$2">
                    Remaining
                  </Text>
                </YStack>
                <YStack flex={1} alignItems="center" padding="$3" backgroundColor="$gray4" borderRadius="$3">
                  <Text color="$color12" fontSize="$7" fontWeight="700">
                    {stats?.thisWeek.total ?? 0}
                  </Text>
                  <Text color="$gray10" fontSize="$2">
                    Total
                  </Text>
                </YStack>
              </XStack>
            </Card>

            {/* By Type Breakdown */}
            {stats?.byType && stats.byType.length > 0 && (
              <Card padding="$4" backgroundColor="$gray2">
                <H3 color="$color12" marginBottom="$3">
                  By Session Type
                </H3>
                <YStack gap="$3">
                  {stats.byType.map((type) => (
                    <YStack key={type.typeId} gap="$2">
                      <XStack justifyContent="space-between" alignItems="center">
                        <XStack alignItems="center" gap="$2">
                          <YStack
                            width={12}
                            height={12}
                            borderRadius={6}
                            backgroundColor={type.color ?? "#8B5CF6"}
                          />
                          <Text color="$color12" fontWeight="600">
                            {type.name}
                          </Text>
                        </XStack>
                        <Text color="$gray10" fontSize="$2">
                          {type.completed}/{type.count} completed
                        </Text>
                      </XStack>
                      <Progress
                        value={type.count > 0 ? (type.completed / type.count) * 100 : 0}
                        backgroundColor="$gray5"
                      >
                        <Progress.Indicator
                          animation="bouncy"
                          backgroundColor={type.color ?? "$brand"}
                        />
                      </Progress>
                      {type.totalMinutes > 0 && (
                        <Text color="$gray10" fontSize="$1">
                          {Math.round(type.totalMinutes / 60)} hours tracked
                        </Text>
                      )}
                    </YStack>
                  ))}
                </YStack>
              </Card>
            )}
          </YStack>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

// -----------------------------------------------------------------------------
// Stat Box Component
// -----------------------------------------------------------------------------

interface StatBoxProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  label: string;
  value: string | number;
}

function StatBox({ icon, iconColor, label, value }: StatBoxProps) {
  return (
    <YStack flex={1} minWidth={140} padding="$3" backgroundColor="$gray4" borderRadius="$3">
      <XStack alignItems="center" gap="$2" marginBottom="$1">
        <Ionicons name={icon} size={16} color={iconColor} />
        <Text color="$gray10" fontSize="$2">
          {label}
        </Text>
      </XStack>
      <Text color="$color12" fontSize="$6" fontWeight="700">
        {value}
      </Text>
    </YStack>
  );
}

