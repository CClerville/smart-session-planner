// =============================================================================
// DASHBOARD SCREEN
// =============================================================================
// Home screen showing quick stats and upcoming sessions.
// =============================================================================

import { ScrollView, RefreshControl } from "react-native";
import { Link } from "expo-router";
import {
  YStack,
  XStack,
  Text,
  H2,
  H3,
  Card,
  Spinner,
  Button,
} from "tamagui";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { trpc } from "../../lib/trpc";
import { useAuth } from "../../lib/auth";
import {
  formatTime,
  formatDate,
  PRIORITY_COLORS,
  type Priority,
} from "../../lib/constants";

export default function DashboardScreen() {
  const { user } = useAuth();

  // Fetch stats
  const statsQuery = trpc.stats.getStats.useQuery();

  // Fetch upcoming sessions
  const upcomingQuery = trpc.sessions.upcoming.useQuery({ limit: 5 });

  const isLoading = statsQuery.isLoading || upcomingQuery.isLoading;
  const isRefreshing = statsQuery.isFetching || upcomingQuery.isFetching;

  const handleRefresh = () => {
    statsQuery.refetch();
    upcomingQuery.refetch();
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header */}
        <YStack marginBottom="$4">
          <Text color="$gray10" fontSize="$3">
            Welcome back,
          </Text>
          <H2 color="$color12">{user?.name || "Planner"}</H2>
        </YStack>

        {isLoading ? (
          <YStack flex={1} justifyContent="center" alignItems="center" padding="$8">
            <Spinner size="large" color="$brand" />
          </YStack>
        ) : (
          <YStack gap="$4">
            {/* Stats Cards */}
            <XStack gap="$3" flexWrap="wrap">
              <StatCard
                label="This Week"
                value={statsQuery.data?.thisWeek.completed ?? 0}
                icon="checkmark-circle"
                color="#22C55E"
              />
              <StatCard
                label="Scheduled"
                value={statsQuery.data?.totalScheduled ?? 0}
                icon="calendar"
                color="#3B82F6"
              />
              <StatCard
                label="Streak"
                value={`${statsQuery.data?.currentStreak ?? 0}d`}
                icon="flame"
                color="#F59E0B"
              />
              <StatCard
                label="Rate"
                value={`${statsQuery.data?.completionRate ?? 0}%`}
                icon="trending-up"
                color="#8B5CF6"
              />
            </XStack>

            {/* Quick Actions */}
            <YStack gap="$2">
              <H3 color="$color12">Quick Actions</H3>
              <XStack gap="$3">
                <Link href="/session/new" asChild>
                  <Button
                    flex={1}
                    size="$4"
                    backgroundColor="$brand"
                    color="white"
                    icon={<Ionicons name="add" size={20} color="white" />}
                  >
                    New Session
                  </Button>
                </Link>
                <Link href="/suggestions" asChild>
                  <Button
                    flex={1}
                    size="$4"
                    backgroundColor="$gray4"
                    color="$color12"
                    icon={<Ionicons name="bulb-outline" size={20} />}
                  >
                    Suggestions
                  </Button>
                </Link>
              </XStack>
            </YStack>

            {/* Upcoming Sessions */}
            <YStack gap="$2">
              <XStack justifyContent="space-between" alignItems="center">
                <H3 color="$color12">Upcoming Sessions</H3>
                <Link href="/(tabs)/schedule" asChild>
                  <Text color="$brand" fontSize="$3" pressStyle={{ opacity: 0.7 }}>
                    See All
                  </Text>
                </Link>
              </XStack>

              {upcomingQuery.data?.length === 0 ? (
                <Card padding="$4" backgroundColor="$gray2">
                  <Text color="$gray10" textAlign="center">
                    No upcoming sessions scheduled
                  </Text>
                </Card>
              ) : (
                <YStack gap="$2">
                  {upcomingQuery.data?.map((session) => (
                    <Link
                      key={session.id}
                      href={`/session/${session.id}`}
                      asChild
                    >
                      <Card
                        padding="$3"
                        backgroundColor="$gray2"
                        pressStyle={{ scale: 0.98, opacity: 0.9 }}
                        animation="quick"
                      >
                        <XStack alignItems="center" gap="$3">
                          {/* Color indicator */}
                          <YStack
                            width={4}
                            height={40}
                            borderRadius="$2"
                            backgroundColor={
                              session.sessionType.color ??
                              PRIORITY_COLORS[session.sessionType.priority as Priority]
                            }
                          />

                          {/* Session info */}
                          <YStack flex={1}>
                            <Text color="$color12" fontWeight="600">
                              {session.sessionType.name}
                            </Text>
                            <Text color="$gray10" fontSize="$2">
                              {formatDate(new Date(session.startTime))} at{" "}
                              {formatTime(new Date(session.startTime))}
                            </Text>
                          </YStack>

                          {/* Duration */}
                          <Text color="$gray10" fontSize="$2">
                            {session.duration}m
                          </Text>
                        </XStack>
                      </Card>
                    </Link>
                  ))}
                </YStack>
              )}
            </YStack>
          </YStack>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// -----------------------------------------------------------------------------
// Stat Card Component
// -----------------------------------------------------------------------------

interface StatCardProps {
  label: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

function StatCard({ label, value, icon, color }: StatCardProps) {
  return (
    <Card
      flex={1}
      minWidth={140}
      padding="$3"
      backgroundColor="$gray2"
    >
      <XStack alignItems="center" gap="$2" marginBottom="$1">
        <Ionicons name={icon} size={16} color={color} />
        <Text color="$gray10" fontSize="$2">
          {label}
        </Text>
      </XStack>
      <Text color="$color12" fontSize="$7" fontWeight="700">
        {value}
      </Text>
    </Card>
  );
}

