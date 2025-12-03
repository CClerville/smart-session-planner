// =============================================================================
// STATS/PROGRESS SCREEN
// =============================================================================
// Detailed statistics matching Figma "Your Progress" design.
// =============================================================================

import { trpc } from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import { RefreshControl, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Spinner, Text, XStack, YStack, useTheme } from "tamagui";
import {
  BigStat,
  CardHeader,
  MetricRow,
  ProgressBar,
  StatCard,
  StatsCard,
  TypeLegend,
} from "../components";
import { getTypeColor } from "../utils";

export function StatsScreen() {
  const theme = useTheme();
  const statsQuery = trpc.stats.getStats.useQuery();

  const handleRefresh = () => {
    statsQuery.refetch();
  };

  if (statsQuery.isLoading) {
    return (
      <YStack
        flex={1}
        justifyContent="center"
        alignItems="center"
        backgroundColor={theme.pageBg.val}
      >
        <Spinner size="large" color={theme.accent.val} />
      </YStack>
    );
  }

  const stats = statsQuery.data;

  // Calculate total for progress bar
  const totalByType = stats?.byType?.reduce((sum, t) => sum + t.count, 0) || 1;

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Statistics",
          headerBackTitle: "Back",
          headerStyle: {
            backgroundColor: theme.pageBg.val,
          },
          headerTintColor: "$textPrimary",
          headerTitleStyle: {
            fontWeight: "600",
            color: "$textPrimary",
          },
        }}
      />
      <SafeAreaView
        style={{ flex: 1, backgroundColor: theme.pageBg.val }}
        edges={["bottom"]}
      >
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
            {/* Your Progress Card - Main Stats */}
            <StatsCard>
              <CardHeader icon="pie-chart" title="Your Progress" />

              {/* Big Stats Row */}
              <XStack justifyContent="space-between" marginBottom="$5">
                <BigStat value={stats?.totalScheduled ?? 0} label="Scheduled" />
                <BigStat value={stats?.totalCompleted ?? 0} label="Completed" />
                <BigStat
                  value={`${stats?.completionRate ?? 0}%`}
                  label="Rate"
                />
              </XStack>

              {/* Sessions by Type Section */}
              <YStack gap="$3">
                <Text color="$textSecondary" fontSize={13} fontWeight="500">
                  Sessions by type
                </Text>

                {stats?.byType && stats.byType.length > 0 && (
                  <>
                    <ProgressBar
                      items={stats.byType}
                      total={totalByType}
                      getColor={getTypeColor}
                    />
                    <TypeLegend types={stats.byType} getColor={getTypeColor} />
                  </>
                )}
              </YStack>

              {/* Average Spacing */}
              <XStack
                marginTop="$4"
                paddingTop="$4"
                borderTopWidth={1}
                borderTopColor="#F3F4F6"
                alignItems="center"
                gap="$2"
              >
                <Ionicons name="trending-up" size={18} color="$textSecondary" />
                <Text color="$textPrimary" fontSize={15} fontWeight="600">
                  {stats?.avgGapDays ?? 0} days
                </Text>
                <Text color="$textSecondary" fontSize={14}>
                  Average spacing between sessions
                </Text>
              </XStack>
            </StatsCard>

            {/* Streaks Card */}
            <StatsCard>
              <Text
                color="$textPrimary"
                fontSize={18}
                fontWeight="600"
                marginBottom="$4"
              >
                Streaks & Activity
              </Text>

              <YStack gap="$4">
                <MetricRow
                  icon="flame"
                  iconBgColor="#FEF3C7"
                  iconColor="#F59E0B"
                  title="Current Streak"
                  description="Keep it going!"
                  value={`${stats?.currentStreak ?? 0}d`}
                />
                <MetricRow
                  icon="calendar"
                  iconBgColor="#DBEAFE"
                  iconColor="#3B82F6"
                  title="Avg Sessions/Week"
                  description="Weekly average"
                  value={stats?.avgSessionsPerWeek ?? 0}
                />
                <MetricRow
                  icon="time"
                  iconBgColor="#DCFCE7"
                  iconColor="#22C55E"
                  title="Hours Tracked"
                  description="Total time invested"
                  value={`${stats?.totalHoursCompleted ?? 0}h`}
                />
              </YStack>
            </StatsCard>

            {/* This Week Card */}
            <StatsCard>
              <Text
                color="$textPrimary"
                fontSize={18}
                fontWeight="600"
                marginBottom="$4"
              >
                This Week
              </Text>

              <XStack gap="$3">
                <StatCard
                  value={stats?.thisWeek.completed ?? 0}
                  label="Completed"
                  backgroundColor="#DCFCE7"
                  valueColor="#16A34A"
                />
                <StatCard
                  value={stats?.thisWeek.scheduled ?? 0}
                  label="Remaining"
                  backgroundColor="#DBEAFE"
                  valueColor="#2563EB"
                />
                <StatCard
                  value={stats?.thisWeek.total ?? 0}
                  label="Total"
                  backgroundColor="#F3F4F6"
                  valueColor="$textPrimary"
                  labelColor="$textSecondary"
                />
              </XStack>
            </StatsCard>
          </YStack>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
