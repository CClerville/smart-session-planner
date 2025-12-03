import {
  DAYS_OF_WEEK_SHORT,
  STATUS_COLORS,
  type SessionStatus,
} from "@/constants";
import { trpc } from "@/lib/api";
import { formatDate, formatTime } from "@/utils";
import { getSessionTypeStyle as getSessionTypeStyleUtil } from "@/utils/sessionTypeColors";
import { getSessionTypeIcon } from "@/utils/sessionTypeIcons";
import { Ionicons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, RefreshControl, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Card, Spinner, Text, useTheme, XStack, YStack } from "tamagui";

export function ScheduleScreen() {
  const theme = useTheme();
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
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.pageBg.val }}
      edges={["top"]}
    >
      <YStack flex={1}>
        {/* Header */}
        <YStack padding="$4" gap="$4">
          <XStack justifyContent="space-between" alignItems="center">
            <Text
              color={"$textPrimary"}
              fontSize={28}
              fontWeight="700"
              fontFamily="InterBold"
            >
              Calendar
            </Text>
            <Link href="/session/new" asChild>
              <Pressable>
                <YStack
                  width={36}
                  height={36}
                  borderRadius={18}
                  backgroundColor={"$buttonPrimary"}
                  justifyContent="center"
                  alignItems="center"
                >
                  <Ionicons name="add" size={22} color="#FFFFFF" />
                </YStack>
              </Pressable>
            </Link>
          </XStack>

          {/* Week Navigation */}
          <XStack justifyContent="space-between" alignItems="center">
            <Pressable onPress={() => setWeekOffset((w) => w - 1)}>
              <YStack padding="$2">
                <Ionicons
                  name="chevron-back"
                  size={22}
                  color={"$textSecondary"}
                />
              </YStack>
            </Pressable>
            <Text color={"$textPrimary"} fontSize={16} fontWeight="600">
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
            <Pressable onPress={() => setWeekOffset((w) => w + 1)}>
              <YStack padding="$2">
                <Ionicons
                  name="chevron-forward"
                  size={22}
                  color={"$textSecondary"}
                />
              </YStack>
            </Pressable>
          </XStack>

          {/* Week Days Header */}
          <XStack gap={6}>
            {weekDates.map((date, index) => {
              const today = isToday(date);
              return (
                <YStack
                  key={index}
                  flex={1}
                  alignItems="center"
                  paddingVertical="$2"
                  paddingHorizontal="$1"
                  backgroundColor={today ? theme.todayBg.val : theme.dayBg.val}
                  borderRadius={12}
                >
                  <Text
                    color={today ? "#FFFFFF" : "$textSecondary"}
                    fontSize={11}
                    fontWeight="500"
                  >
                    {DAYS_OF_WEEK_SHORT[date.getDay()]}
                  </Text>
                  <Text
                    color={today ? "#FFFFFF" : "$textPrimary"}
                    fontSize={16}
                    fontWeight="700"
                  >
                    {date.getDate()}
                  </Text>
                </YStack>
              );
            })}
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
              <Spinner size="large" color={theme.accent.val} />
            </YStack>
          ) : sessionsQuery.data?.length === 0 ? (
            <Card
              backgroundColor={"$cardBg"}
              borderRadius={16}
              padding="$6"
              shadowColor="#000"
              shadowOffset={{ width: 0, height: 2 }}
              shadowOpacity={0.05}
              shadowRadius={8}
              elevation={2}
            >
              <YStack alignItems="center" gap="$3">
                <Ionicons
                  name="calendar-outline"
                  size={48}
                  color={"$textSecondary"}
                />
                <Text color={"$textSecondary"} textAlign="center">
                  No sessions scheduled this week
                </Text>
                <Link href="/session/new" asChild>
                  <Button
                    size="$4"
                    backgroundColor={"$buttonPrimary"}
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
            <YStack gap="$4">
              {weekDates.map((date) => {
                const dateKey = date.toDateString();
                const daySessions = sessionsByDate.get(dateKey) ?? [];

                if (daySessions.length === 0) return null;

                return (
                  <YStack key={dateKey} gap="$3">
                    <Text
                      color={"$textSecondary"}
                      fontSize={13}
                      fontWeight="600"
                      textTransform="uppercase"
                    >
                      {formatDate(date)}
                    </Text>
                    {daySessions.map((session) => {
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
                            backgroundColor={"$cardBg"}
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
                                  color={"$textPrimary"}
                                  fontSize={16}
                                  fontWeight="600"
                                >
                                  {session.sessionType.name}
                                </Text>
                                <XStack alignItems="center" gap="$1">
                                  <Ionicons
                                    name="time-outline"
                                    size={14}
                                    color={"$textSecondary"}
                                  />
                                  <Text color={"$textSecondary"} fontSize={14}>
                                    {formatTime(new Date(session.startTime))} -{" "}
                                    {formatTime(new Date(session.endTime))}
                                  </Text>
                                </XStack>
                              </YStack>

                              {/* Status indicator */}
                              {isCompleted ? (
                                <YStack
                                  width={28}
                                  height={28}
                                  borderRadius={14}
                                  backgroundColor="#22C55E"
                                  justifyContent="center"
                                  alignItems="center"
                                >
                                  <Ionicons
                                    name="checkmark"
                                    size={18}
                                    color="#FFFFFF"
                                  />
                                </YStack>
                              ) : (
                                <XStack
                                  paddingHorizontal={10}
                                  paddingVertical={4}
                                  backgroundColor={
                                    STATUS_COLORS[
                                      session.status as SessionStatus
                                    ] + "15"
                                  }
                                  borderRadius={12}
                                >
                                  <Text
                                    fontSize={12}
                                    color={
                                      STATUS_COLORS[
                                        session.status as SessionStatus
                                      ]
                                    }
                                    fontWeight="600"
                                  >
                                    {session.status}
                                  </Text>
                                </XStack>
                              )}
                            </XStack>
                          </Card>
                        </Link>
                      );
                    })}
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
