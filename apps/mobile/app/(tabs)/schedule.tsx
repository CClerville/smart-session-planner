// =============================================================================
// SCHEDULE SCREEN
// =============================================================================
// Calendar view of scheduled sessions with filtering.
// =============================================================================

import { useState, useMemo } from "react";
import { ScrollView, RefreshControl } from "react-native";
import { Link } from "expo-router";
import {
  YStack,
  XStack,
  Text,
  H2,
  Card,
  Button,
  Spinner,
} from "tamagui";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { trpc } from "../../lib/trpc";
import {
  formatTime,
  formatDate,
  DAYS_OF_WEEK_SHORT,
  PRIORITY_COLORS,
  STATUS_COLORS,
  type Priority,
  type SessionStatus,
} from "../../lib/constants";

export default function ScheduleScreen() {
  // Date range state (current week by default)
  const [weekOffset, setWeekOffset] = useState(0);

  // Calculate date range for the week
  const { startOfWeek, endOfWeek, weekDates } = useMemo(() => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay() + weekOffset * 7);
    start.setHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    // Generate array of dates for the week
    const dates: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      dates.push(date);
    }

    return { startOfWeek: start, endOfWeek: end, weekDates: dates };
  }, [weekOffset]);

  // Fetch sessions for the week
  const sessionsQuery = trpc.sessions.list.useQuery({
    from: startOfWeek,
    to: endOfWeek,
  });

  // Group sessions by date
  const sessionsByDate = useMemo(() => {
    const grouped = new Map<string, typeof sessionsQuery.data>();

    sessionsQuery.data?.forEach((session) => {
      const dateKey = new Date(session.startTime).toDateString();
      const existing = grouped.get(dateKey) ?? [];
      grouped.set(dateKey, [...existing, session]);
    });

    return grouped;
  }, [sessionsQuery.data]);

  const handleRefresh = () => {
    sessionsQuery.refetch();
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
      <YStack flex={1}>
        {/* Header */}
        <YStack padding="$4" gap="$3">
          <XStack justifyContent="space-between" alignItems="center">
            <H2 color="$color12">Schedule</H2>
            <Link href="/session/new" asChild>
              <Button
                size="$3"
                circular
                backgroundColor="$brand"
                icon={<Ionicons name="add" size={20} color="white" />}
              />
            </Link>
          </XStack>

          {/* Week Navigation */}
          <XStack justifyContent="space-between" alignItems="center">
            <Button
              size="$3"
              chromeless
              onPress={() => setWeekOffset((w) => w - 1)}
              icon={<Ionicons name="chevron-back" size={20} />}
            />
            <Text color="$color12" fontWeight="600">
              {startOfWeek.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}{" "}
              -{" "}
              {endOfWeek.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </Text>
            <Button
              size="$3"
              chromeless
              onPress={() => setWeekOffset((w) => w + 1)}
              icon={<Ionicons name="chevron-forward" size={20} />}
            />
          </XStack>

          {/* Week Days Header */}
          <XStack gap="$1">
            {weekDates.map((date, index) => (
              <YStack
                key={index}
                flex={1}
                alignItems="center"
                padding="$2"
                backgroundColor={isToday(date) ? "$brand" : "$gray3"}
                borderRadius="$3"
              >
                <Text
                  color={isToday(date) ? "white" : "$gray10"}
                  fontSize="$1"
                  fontWeight="600"
                >
                  {DAYS_OF_WEEK_SHORT[date.getDay()]}
                </Text>
                <Text
                  color={isToday(date) ? "white" : "$color12"}
                  fontSize="$3"
                  fontWeight="700"
                >
                  {date.getDate()}
                </Text>
              </YStack>
            ))}
          </XStack>
        </YStack>

        {/* Sessions List */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingTop: 0 }}
          refreshControl={
            <RefreshControl
              refreshing={sessionsQuery.isFetching}
              onRefresh={handleRefresh}
            />
          }
        >
          {sessionsQuery.isLoading ? (
            <YStack padding="$8" alignItems="center">
              <Spinner size="large" color="$brand" />
            </YStack>
          ) : sessionsQuery.data?.length === 0 ? (
            <Card padding="$6" backgroundColor="$gray2">
              <YStack alignItems="center" gap="$3">
                <Ionicons name="calendar-outline" size={48} color="#6B7280" />
                <Text color="$gray10" textAlign="center">
                  No sessions scheduled this week
                </Text>
                <Link href="/session/new" asChild>
                  <Button size="$3" backgroundColor="$brand" color="white">
                    Schedule Session
                  </Button>
                </Link>
              </YStack>
            </Card>
          ) : (
            <YStack gap="$4">
              {weekDates.map((date) => {
                const dateKey = date.toDateString();
                const daySessions = sessionsByDate.get(dateKey) ?? [];

                if (daySessions.length === 0) return null;

                return (
                  <YStack key={dateKey} gap="$2">
                    <Text color="$gray10" fontSize="$2" fontWeight="600">
                      {formatDate(date)}
                    </Text>
                    {daySessions.map((session) => (
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
                          borderLeftWidth={4}
                          borderLeftColor={
                            session.sessionType.color ??
                            PRIORITY_COLORS[session.sessionType.priority as Priority]
                          }
                        >
                          <XStack justifyContent="space-between" alignItems="center">
                            <YStack flex={1}>
                              <Text color="$color12" fontWeight="600">
                                {session.sessionType.name}
                              </Text>
                              <Text color="$gray10" fontSize="$2">
                                {formatTime(new Date(session.startTime))} -{" "}
                                {formatTime(new Date(session.endTime))}
                              </Text>
                            </YStack>
                            <XStack
                              paddingHorizontal="$2"
                              paddingVertical="$1"
                              backgroundColor={
                                STATUS_COLORS[session.status as SessionStatus] + "20"
                              }
                              borderRadius="$2"
                            >
                              <Text
                                fontSize="$1"
                                color={STATUS_COLORS[session.status as SessionStatus]}
                                fontWeight="600"
                              >
                                {session.status}
                              </Text>
                            </XStack>
                          </XStack>
                        </Card>
                      </Link>
                    ))}
                  </YStack>
                );
              })}
            </YStack>
          )}
        </ScrollView>
      </YStack>
    </SafeAreaView>
  );
}

