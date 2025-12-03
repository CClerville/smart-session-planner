// =============================================================================
// DASHBOARD SCREEN
// =============================================================================

import { trpc } from "@/lib/api";
import { formatDateTime, formatTime, getToday } from "@/utils";
import { getSessionTypeStyle as getSessionTypeStyleUtil } from "@/utils/sessionTypeColors";
import { getSessionTypeIcon } from "@/utils/sessionTypeIcons";
import { Ionicons } from "@expo/vector-icons";
import { Link, router } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, Pressable, RefreshControl, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Button,
  Card,
  Spinner,
  styled,
  Text,
  useTheme,
  XStack,
  YStack,
} from "tamagui";

enum ViewMode {
  Today = "today",
  Week = "week",
}

export function DashboardScreen() {
  const theme = useTheme();
  const utils = trpc.useUtils();
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.Today);

  // Memoize date values to prevent infinite queries
  // React Query uses query params as cache keys, so new Date() objects
  // on every render cause it to treat each render as a new query
  const queryDates = useMemo(() => {
    const startDate = new Date();
    const endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    return { startDate, endDate };
  }, []);

  // Fetch session types to determine default for suggestions
  const sessionTypesQuery = trpc.sessionTypes.list.useQuery();

  // Get highest priority session type (or first available) for suggestions
  const defaultSessionTypeId = useMemo(() => {
    const types = sessionTypesQuery.data;
    if (!types || types.length === 0) return undefined;
    // Sort by priority descending, then by name
    const sorted = [...types].sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      return a.name.localeCompare(b.name);
    });
    return sorted[0]?.id;
  }, [sessionTypesQuery.data]);

  // Fetch stats
  const statsQuery = trpc.stats.getStats.useQuery();

  // Fetch upcoming sessions
  const upcomingQuery = trpc.sessions.upcoming.useQuery();

  // Fetch suggestions with default session type
  const suggestionsQuery = trpc.suggestions.getSuggestions.useQuery(
    {
      startDate: queryDates.startDate,
      endDate: queryDates.endDate,
      sessionTypeId: defaultSessionTypeId,
      duration: 60,
    },
    {
      enabled: !!defaultSessionTypeId, // Only fetch if we have a session type
    }
  );

  // Create session mutation
  const createMutation = trpc.sessions.create.useMutation({
    onSuccess: () => {
      utils.sessions.invalidate();
      utils.stats.invalidate();
      suggestionsQuery.refetch();
      Alert.alert("Success", "Session scheduled successfully!");
    },
    onError: (err) => {
      Alert.alert("Error", err.message);
    },
  });

  const isLoading =
    statsQuery.isLoading ||
    upcomingQuery.isLoading ||
    sessionTypesQuery.isLoading;
  const isRefreshing =
    statsQuery.isFetching ||
    upcomingQuery.isFetching ||
    suggestionsQuery.isFetching;

  const handleRefresh = () => {
    statsQuery.refetch();
    upcomingQuery.refetch();
    suggestionsQuery.refetch();
    sessionTypesQuery.refetch();
  };

  // Handle accepting a suggestion
  const handleAccept = (suggestion: {
    startTime: Date;
    endTime: Date;
    sessionType: { id: string; name: string } | null;
  }) => {
    if (!suggestion.sessionType) {
      Alert.alert("Error", "Session type information is missing");
      return;
    }

    const sessionType = suggestion.sessionType;
    if (!sessionType) {
      Alert.alert("Error", "Session type information is missing");
      return;
    }

    Alert.alert(
      "Schedule Session",
      `Schedule ${sessionType.name} for ${formatDateTime(new Date(suggestion.startTime))}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Schedule",
          onPress: () => {
            const duration =
              (new Date(suggestion.endTime).getTime() -
                new Date(suggestion.startTime).getTime()) /
              (60 * 1000);
            createMutation.mutate({
              sessionTypeId: sessionType.id,
              startTime: new Date(suggestion.startTime),
              endTime: new Date(suggestion.endTime),
              duration,
            });
          },
        },
      ]
    );
  };

  // Handle adjusting a suggestion
  const handleAdjust = (suggestion: {
    startTime: Date;
    endTime: Date;
    sessionType: { id: string } | null;
  }) => {
    // Navigate to new session screen - user can adjust time there
    router.push("/session/new");
  };

  // Format relative date for suggestion card
  const formatRelativeDate = (date: Date): string => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const suggestionDate = new Date(date);
    suggestionDate.setHours(0, 0, 0, 0);

    if (suggestionDate.getTime() === today.getTime()) {
      return "Today";
    } else if (suggestionDate.getTime() === tomorrow.getTime()) {
      return "Tomorrow";
    } else {
      // Format as "Mon, Dec 25" for dates beyond tomorrow
      return suggestionDate.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
    }
  };

  // Calculate stats based on view mode
  const stats =
    viewMode === ViewMode.Today
      ? statsQuery.data?.today
      : statsQuery.data?.thisWeek;
  const totalSessions = stats?.total ?? 0;
  const completedSessions = stats?.completed ?? 0;

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.pageBg.val }}
      edges={["top"]}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header Section */}
        <YStack padding="$4" gap="$3">
          <Text
            color="$textPrimary"
            fontSize={28}
            fontWeight="700"
            fontFamily="InterBold"
          >
            Dashboard
          </Text>
          {/* Today/Week Toggle */}
          <XStack justifyContent="space-between" alignItems="center">
            <YStack>
              <Text color="$textSecondary" fontSize={15} marginTop="$1">
                {getToday()}
              </Text>
              <Text color="$textSecondary" fontSize={13}>
                Your schedule{" "}
                {viewMode === ViewMode.Today ? "today" : "this week"}
              </Text>
            </YStack>
            <XStack
              backgroundColor="$buttonSecondary"
              borderRadius={20}
              padding={4}
            >
              <Pressable onPress={() => setViewMode(ViewMode.Today)}>
                <XStack
                  paddingHorizontal={16}
                  paddingVertical={8}
                  borderRadius={16}
                  backgroundColor={
                    viewMode === ViewMode.Today
                      ? theme.cardBg.val
                      : "transparent"
                  }
                >
                  <Text
                    color="$textPrimary"
                    fontSize={14}
                    fontWeight={viewMode === ViewMode.Today ? "600" : "400"}
                  >
                    Today
                  </Text>
                </XStack>
              </Pressable>
              <Pressable onPress={() => setViewMode(ViewMode.Week)}>
                <XStack
                  paddingHorizontal={16}
                  paddingVertical={8}
                  borderRadius={16}
                  backgroundColor={
                    viewMode === ViewMode.Week
                      ? theme.cardBg.val
                      : "transparent"
                  }
                >
                  <Text
                    color="$textPrimary"
                    fontSize={14}
                    fontWeight={viewMode === ViewMode.Week ? "600" : "400"}
                  >
                    Week
                  </Text>
                </XStack>
              </Pressable>
            </XStack>
          </XStack>
        </YStack>

        {/* Stats Pill */}
        <XStack
          backgroundColor="$cardBg"
          borderRadius={24}
          borderColor="$borderLight"
          borderWidth={1}
          paddingHorizontal={20}
          paddingVertical={14}
          alignItems="center"
          gap="$4"
          shadowColor="#000"
          shadowOffset={{ width: 0, height: 2 }}
          shadowOpacity={0.05}
          shadowRadius={8}
          elevation={2}
          marginHorizontal="$4"
        >
          <XStack alignItems="center" gap="$2">
            <Ionicons name="time-outline" size={18} color="$textSecondary" />
            <Text color="$textPrimary" fontSize={15} fontWeight="500">
              {totalSessions} sessions
            </Text>
          </XStack>
          <Text color="$textSecondary">·</Text>
          <XStack alignItems="center" gap="$2">
            <Ionicons name="checkmark-circle" size={18} color="$success" />
            <Text color="$textPrimary" fontSize={15} fontWeight="500">
              {completedSessions} done
            </Text>
          </XStack>
        </XStack>

        {isLoading ? (
          <YStack
            flex={1}
            justifyContent="center"
            alignItems="center"
            padding="$8"
          >
            <Spinner size="large" color="$accent" />
          </YStack>
        ) : (
          <YStack gap="$5" marginTop="$8">
            {/* Smart Suggestions Section */}
            <YStack>
              <XStack
                paddingHorizontal="$4"
                justifyContent="space-between"
                alignItems="center"
                marginBottom="$3"
              >
                <Text color="$textPrimary" fontSize={18} fontWeight="600">
                  Smart Suggestions
                </Text>
                <Link href="/suggestions" asChild>
                  <Pressable>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color="$textSecondary"
                    />
                  </Pressable>
                </Link>
              </XStack>

              {/* Horizontal scroll of suggestion cards */}
              {sessionTypesQuery.isLoading ? (
                <XStack
                  paddingHorizontal="$4"
                  justifyContent="center"
                  paddingVertical="$4"
                >
                  <Spinner size="small" color="$accent" />
                </XStack>
              ) : !defaultSessionTypeId ? (
                <Card
                  backgroundColor="$cardBg"
                  borderRadius={16}
                  padding="$5"
                  marginHorizontal="$4"
                  shadowColor="#000"
                  shadowOffset={{ width: 0, height: 2 }}
                  shadowOpacity={0.05}
                  shadowRadius={8}
                  elevation={2}
                >
                  <YStack alignItems="center" gap="$3">
                    <Ionicons
                      name="calendar-outline"
                      size={40}
                      color="$textSecondary"
                    />
                    <Text
                      color="$textSecondary"
                      textAlign="center"
                      fontSize={14}
                    >
                      Create a session type to see smart suggestions
                    </Text>
                    <Link href="/types" asChild>
                      <Button
                        size="$4"
                        backgroundColor="$buttonPrimary"
                        color="#FFFFFF"
                        borderRadius={24}
                        paddingHorizontal={24}
                      >
                        Create Session Type
                      </Button>
                    </Link>
                  </YStack>
                </Card>
              ) : suggestionsQuery.isLoading ? (
                <XStack
                  paddingHorizontal="$4"
                  justifyContent="center"
                  paddingVertical="$4"
                >
                  <Spinner size="small" color="$accent" />
                </XStack>
              ) : !suggestionsQuery.data?.suggestions ||
                suggestionsQuery.data.suggestions.length === 0 ? (
                <Card
                  backgroundColor="$cardBg"
                  borderRadius={16}
                  padding="$5"
                  marginHorizontal="$4"
                  shadowColor="#000"
                  shadowOffset={{ width: 0, height: 2 }}
                  shadowOpacity={0.05}
                  shadowRadius={8}
                  elevation={2}
                >
                  <YStack alignItems="center" gap="$3">
                    <Ionicons
                      name="calendar-outline"
                      size={40}
                      color="$textSecondary"
                    />
                    <Text
                      color="$textSecondary"
                      textAlign="center"
                      fontSize={14}
                    >
                      {suggestionsQuery.data?.message ||
                        "No suggestions available. Set your availability to get suggestions."}
                    </Text>
                    <Link href="/availability" asChild>
                      <Button
                        size="$4"
                        backgroundColor="$buttonPrimary"
                        color="#FFFFFF"
                        borderRadius={24}
                        paddingHorizontal={24}
                      >
                        Set Availability
                      </Button>
                    </Link>
                  </YStack>
                </Card>
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
                >
                  {suggestionsQuery.data.suggestions
                    .slice(0, 5)
                    .map((suggestion, index) => (
                      <SuggestionCard
                        key={index}
                        suggestion={suggestion}
                        onAccept={handleAccept}
                        onAdjust={handleAdjust}
                        isCreating={createMutation.isPending}
                        formatRelativeDate={formatRelativeDate}
                      />
                    ))}
                </ScrollView>
              )}
            </YStack>

            {/* Today's Sessions Section */}
            <YStack paddingHorizontal="$4" gap="$3">
              <XStack justifyContent="space-between" alignItems="center">
                <Text color="$textPrimary" fontSize={18} fontWeight="600">
                  {viewMode === ViewMode.Today
                    ? "Today's Sessions"
                    : "This Week's Sessions"}
                </Text>
                <Link href="/session/new" asChild>
                  <Pressable>
                    <YStack
                      width={32}
                      height={32}
                      borderRadius={16}
                      backgroundColor="$buttonPrimary"
                      justifyContent="center"
                      alignItems="center"
                    >
                      <Ionicons name="add" size={20} color="#FFFFFF" />
                    </YStack>
                  </Pressable>
                </Link>
              </XStack>

              {(() => {
                const sessions =
                  viewMode === ViewMode.Today
                    ? (upcomingQuery.data?.today ?? [])
                    : (upcomingQuery.data?.thisWeek ?? []);

                return sessions.length === 0 ? (
                  <Card
                    backgroundColor="$cardBg"
                    borderRadius={16}
                    padding="$5"
                    shadowColor="#000"
                    shadowOffset={{ width: 0, height: 2 }}
                    shadowOpacity={0.05}
                    shadowRadius={8}
                    elevation={2}
                  >
                    <YStack alignItems="center" gap="$3">
                      <Ionicons
                        name="calendar-outline"
                        size={40}
                        color="$textSecondary"
                      />
                      <Text color="$textSecondary" textAlign="center">
                        {viewMode === ViewMode.Today
                          ? "No sessions scheduled for today"
                          : "No sessions scheduled for this week"}
                      </Text>
                      <Link href="/session/new" asChild>
                        <Button
                          size="$4"
                          backgroundColor="$buttonPrimary"
                          color="#FFFFFF"
                          borderRadius={24}
                          paddingHorizontal={24}
                        >
                          Schedule Session
                        </Button>
                      </Link>
                    </YStack>
                  </Card>
                ) : (
                  <YStack gap="$3">
                    {sessions.map((session) => {
                      const style = getSessionTypeStyleUtil(
                        session.sessionType.color,
                        session.sessionType.priority,
                        session.sessionType.name
                      );
                      const icon = getSessionTypeIcon(
                        session.sessionType.icon,
                        session.sessionType.name
                      );
                      const isCompleted = session.status === "COMPLETED";

                      return (
                        <Link
                          key={session.id}
                          href={`/session/${session.id}`}
                          asChild
                        >
                          <Card
                            backgroundColor="$cardBg"
                            borderRadius={16}
                            padding="$4"
                            pressStyle={{ scale: 0.98, opacity: 0.9 }}
                            animation="quick"
                            shadowColor="#000"
                            shadowOffset={{ width: 0, height: 2 }}
                            shadowOpacity={0.05}
                            shadowRadius={8}
                            elevation={2}
                          >
                            <XStack alignItems="center" gap="$3">
                              {/* Icon with colored background */}
                              <YStack
                                width={48}
                                height={48}
                                borderRadius={24}
                                backgroundColor={style.bg}
                                justifyContent="center"
                                alignItems="center"
                              >
                                <Ionicons
                                  name={icon}
                                  size={22}
                                  color={style.icon}
                                />
                              </YStack>

                              {/* Session info */}
                              <YStack flex={1}>
                                <Text
                                  color="$textPrimary"
                                  fontSize={16}
                                  fontWeight="600"
                                >
                                  {session.sessionType.name}
                                </Text>
                                <XStack alignItems="center" gap="$1">
                                  <Ionicons
                                    name="time-outline"
                                    size={14}
                                    color="$textSecondary"
                                  />
                                  <Text color="$textSecondary" fontSize={14}>
                                    {formatTime(new Date(session.startTime))}-
                                    {formatTime(new Date(session.endTime))}
                                  </Text>
                                </XStack>
                              </YStack>

                              {/* Completion indicator */}
                              {isCompleted && (
                                <YStack
                                  width={28}
                                  height={28}
                                  borderRadius={14}
                                  backgroundColor="$success"
                                  justifyContent="center"
                                  alignItems="center"
                                >
                                  <Ionicons
                                    name="checkmark"
                                    size={18}
                                    color="#FFFFFF"
                                  />
                                </YStack>
                              )}
                            </XStack>
                          </Card>
                        </Link>
                      );
                    })}
                  </YStack>
                );
              })()}
            </YStack>
          </YStack>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// -----------------------------------------------------------------------------
// Suggestion Card Component
// -----------------------------------------------------------------------------

interface SuggestionCardProps {
  suggestion: {
    startTime: Date;
    endTime: Date;
    reasons: string[];
    sessionType: {
      id: string;
      name: string;
      priority: number;
      color: string | null;
      icon: string | null;
    } | null;
  };
  onAccept: (suggestion: {
    startTime: Date;
    endTime: Date;
    sessionType: { id: string; name: string } | null;
  }) => void;
  onAdjust: (suggestion: {
    startTime: Date;
    endTime: Date;
    sessionType: { id: string } | null;
  }) => void;
  isCreating: boolean;
  formatRelativeDate: (date: Date) => string;
}

function SuggestionCard({
  suggestion,
  onAccept,
  onAdjust,
  isCreating,
  formatRelativeDate,
}: SuggestionCardProps) {
  const sessionTypeName = suggestion.sessionType?.name || "Session";
  const relativeDate = formatRelativeDate(new Date(suggestion.startTime));
  const timeStr = `${formatTime(new Date(suggestion.startTime))}-${formatTime(new Date(suggestion.endTime))}`;
  const description = suggestion.reasons[0] || "Available slot";

  return (
    <Card
      width={280}
      backgroundColor="#F3E8FF"
      borderRadius={16}
      padding="$4"
      shadowColor="#000"
      shadowOffset={{ width: 0, height: 2 }}
      shadowOpacity={0.05}
      shadowRadius={8}
      elevation={2}
    >
      <YStack gap="$3">
        {/* Header with session type name */}
        <XStack justifyContent="space-between" alignItems="center">
          <Text color="$textPrimary" fontSize={18} fontWeight="600">
            {sessionTypeName}
          </Text>
        </XStack>

        {/* Time */}
        <XStack alignItems="center" gap="$2">
          <Ionicons name="time-outline" size={16} color="$textSecondary" />
          <Text color="$textSecondary" fontSize={14}>
            {relativeDate} · {timeStr}
          </Text>
        </XStack>

        {/* Description */}
        <Text color="$textSecondary" fontSize={14} numberOfLines={2}>
          {description}
        </Text>

        {/* Action buttons */}
        <XStack gap="$3" marginTop="$1">
          <Button
            flex={1}
            size="$4"
            backgroundColor="$buttonPrimary"
            color="#FFFFFF"
            borderRadius={24}
            fontWeight="600"
            onPress={() => onAccept(suggestion)}
            disabled={isCreating || !suggestion.sessionType}
          >
            {isCreating ? <Spinner size="small" color="#FFFFFF" /> : "Accept"}
          </Button>
          <Button
            flex={1}
            size="$4"
            backgroundColor="$white"
            borderWidth={1}
            borderColor="$borderLight"
            color="$textPrimary"
            borderRadius={24}
            fontWeight="500"
            onPress={() => onAdjust(suggestion)}
            disabled={isCreating}
          >
            Adjust
          </Button>
        </XStack>
      </YStack>
    </Card>
  );
}
