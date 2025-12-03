import { PRIORITY_COLORS, type Priority } from "@/constants";
import { trpc } from "@/lib/api";
import { formatDateTime, formatDuration, formatTime } from "@/utils";
import { Ionicons } from "@expo/vector-icons";
import type { AppRouter } from "@repo/api";
import type { inferRouterOutputs } from "@trpc/server";
import { router, Stack } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Alert, Pressable, RefreshControl, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Adapt,
  Button,
  Card,
  Select,
  Sheet,
  Spinner,
  Text,
  useTheme,
  XStack,
  YStack,
} from "tamagui";

// Module-level date range - computed once when file loads
// This ensures query key stability even if component remounts rapidly
const getStableDateRange = () => {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfRange = new Date(startOfDay);
  endOfRange.setDate(endOfRange.getDate() + 7);
  return { startDate: startOfDay, endDate: endOfRange };
};
const STABLE_DATE_RANGE = getStableDateRange();

// Get device timezone for accurate slot generation
const getDeviceTimezone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "UTC";
  }
};
const DEVICE_TIMEZONE = getDeviceTimezone();

type SessionType =
  inferRouterOutputs<AppRouter>["sessionTypes"]["list"][number];

export function SuggestionsScreen() {
  const theme = useTheme();
  const utils = trpc.useUtils();

  const [sessionTypeId, setSessionTypeId] = useState<string>("");
  const [duration, setDuration] = useState(60);

  // Prevent query from firing during rapid remounts in development
  const [isStable, setIsStable] = useState(false);
  const mountedRef = useRef(false);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      // Small delay to let the component stabilize
      const timer = setTimeout(() => setIsStable(true), 100);
      return () => clearTimeout(timer);
    }
  }, []);

  const typesQuery = trpc.sessionTypes.list.useQuery();

  const suggestionsQuery = trpc.suggestions.getSuggestions.useQuery(
    {
      ...STABLE_DATE_RANGE,
      sessionTypeId: sessionTypeId || undefined,
      duration,
      config: {
        timezone: DEVICE_TIMEZONE,
      },
    },
    {
      // Only run query after component has stabilized
      enabled: isStable,
      // Prevent refetch loops
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity, // Never consider stale - manual refresh only
    }
  );

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

  const handleAccept = (suggestion: { startTime: Date; endTime: Date }) => {
    if (!sessionTypeId) {
      Alert.alert("Error", "Please select a session type first");
      return;
    }

    Alert.alert(
      "Schedule Session",
      `Schedule this session for ${formatDateTime(new Date(suggestion.startTime))}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Schedule",
          onPress: () => {
            createMutation.mutate({
              sessionTypeId,
              startTime: new Date(suggestion.startTime),
              endTime: new Date(suggestion.endTime),
              duration,
            });
          },
        },
      ]
    );
  };

  const handleAdjust = (suggestion: { startTime: Date; endTime: Date }) => {
    Alert.alert(
      "Adjust Time",
      "This will open the session editor to customize the time.",
      [{ text: "OK" }]
    );
  };

  const selectedType = typesQuery.data?.find(
    (t: SessionType) => t.id === sessionTypeId
  );

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Smart Suggestions",
          headerBackTitle: "Back",
          headerStyle: {
            backgroundColor: theme.pageBg.val,
          },
          headerTintColor: theme.textPrimary.val,
          headerTitleStyle: {
            fontWeight: "600",
            color: theme.textPrimary.val,
          },
        }}
      />
      <SafeAreaView
        style={{ flex: 1, backgroundColor: theme.pageBg.val }}
        edges={["bottom"]}
      >
        <YStack flex={1}>
          {/* Filters Section */}
          <YStack
            padding="$4"
            gap="$4"
            backgroundColor="$cardBg"
            borderBottomWidth={1}
            borderColor="$borderLight"
          >
            {/* Session Type Filter */}
            <YStack gap="$2">
              <Text color="$textSecondary" fontSize={13} fontWeight="600">
                Session Type
              </Text>
              <Select
                value={sessionTypeId}
                onValueChange={setSessionTypeId}
                disablePreventBodyScroll
              >
                <Select.Trigger
                  size="$4"
                  borderWidth={1}
                  borderColor="$borderLight"
                  backgroundColor="$cardBg"
                  borderRadius={12}
                  iconAfter={
                    <Ionicons
                      name="chevron-down"
                      size={18}
                      color="$textSecondary"
                    />
                  }
                >
                  <Select.Value placeholder="Select a type..." />
                </Select.Trigger>

                <Adapt when="sm" platform="touch">
                  <Sheet modal dismissOnSnapToBottom snapPoints={[50]}>
                    <Sheet.Frame>
                      <Sheet.ScrollView>
                        <Adapt.Contents />
                      </Sheet.ScrollView>
                    </Sheet.Frame>
                    <Sheet.Overlay />
                  </Sheet>
                </Adapt>

                <Select.Content>
                  <Select.Viewport>
                    <Select.Group>
                      {typesQuery.data?.map(
                        (type: SessionType, index: number) => (
                          <Select.Item
                            key={type.id}
                            value={type.id}
                            index={index}
                          >
                            <XStack alignItems="center" gap="$2">
                              <YStack
                                width={10}
                                height={10}
                                borderRadius={5}
                                backgroundColor={
                                  type.color ??
                                  PRIORITY_COLORS[type.priority as Priority]
                                }
                              />
                              <Select.ItemText>{type.name}</Select.ItemText>
                            </XStack>
                          </Select.Item>
                        )
                      )}
                    </Select.Group>
                  </Select.Viewport>
                </Select.Content>
              </Select>
            </YStack>

            {/* Duration Filter */}
            <YStack gap="$2">
              <Text color="$textSecondary" fontSize={13} fontWeight="600">
                Duration
              </Text>
              <XStack gap={8} flexWrap="wrap">
                {[30, 45, 60, 90, 120].map((d) => (
                  <Pressable key={d} onPress={() => setDuration(d)}>
                    <XStack
                      paddingHorizontal={16}
                      paddingVertical={10}
                      backgroundColor={
                        duration === d ? "$buttonPrimary" : "$buttonSecondary"
                      }
                      borderRadius={20}
                    >
                      <Text
                        color={duration === d ? "white" : "$textPrimary"}
                        fontSize={14}
                        fontWeight="500"
                      >
                        {formatDuration(d)}
                      </Text>
                    </XStack>
                  </Pressable>
                ))}
              </XStack>
            </YStack>
          </YStack>

          {/* Suggestions List */}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 16, gap: 12 }}
            refreshControl={
              <RefreshControl
                refreshing={suggestionsQuery.isFetching}
                onRefresh={() => suggestionsQuery.refetch()}
              />
            }
          >
            {!sessionTypeId ? (
              <Card
                backgroundColor="$cardBg"
                borderRadius={16}
                padding="$6"
                shadowColor="#000"
                shadowOffset={{ width: 0, height: 2 }}
                shadowOpacity={0.05}
                shadowRadius={8}
                elevation={2}
              >
                <YStack alignItems="center" gap="$3">
                  <YStack
                    width={64}
                    height={64}
                    borderRadius={32}
                    backgroundColor="#FEF3C7"
                    justifyContent="center"
                    alignItems="center"
                  >
                    <Ionicons name="bulb-outline" size={32} color="#F59E0B" />
                  </YStack>
                  <Text color="$textPrimary" fontSize={16} fontWeight="600">
                    Select a Session Type
                  </Text>
                  <Text color="$textSecondary" textAlign="center" fontSize={14}>
                    Choose a session type above to see smart suggestions
                  </Text>
                </YStack>
              </Card>
            ) : suggestionsQuery.isLoading ? (
              <YStack padding="$8" alignItems="center" gap="$3">
                <Spinner size="large" color="$accent" />
                <Text color="$textSecondary" fontSize={14}>
                  Finding optimal times...
                </Text>
              </YStack>
            ) : suggestionsQuery.data?.suggestions.length === 0 ? (
              <Card
                backgroundColor="$cardBg"
                borderRadius={16}
                padding="$6"
                shadowColor="#000"
                shadowOffset={{ width: 0, height: 2 }}
                shadowOpacity={0.05}
                shadowRadius={8}
                elevation={2}
              >
                <YStack alignItems="center" gap="$3">
                  <YStack
                    width={64}
                    height={64}
                    borderRadius={32}
                    backgroundColor="#F3F4F6"
                    justifyContent="center"
                    alignItems="center"
                  >
                    <Ionicons
                      name="calendar-outline"
                      size={32}
                      color="$textSecondary"
                    />
                  </YStack>
                  <Text color="$textPrimary" fontSize={16} fontWeight="600">
                    No Suggestions Available
                  </Text>
                  <Text color="$textSecondary" textAlign="center" fontSize={14}>
                    {suggestionsQuery.data?.message ||
                      "Set your availability to get suggestions"}
                  </Text>
                  <Button
                    size="$4"
                    backgroundColor="$buttonPrimary"
                    color="#FFFFFF"
                    borderRadius={24}
                    paddingHorizontal={24}
                    onPress={() => router.push("/availability")}
                  >
                    Set Availability
                  </Button>
                </YStack>
              </Card>
            ) : (
              <YStack gap="$3">
                <XStack alignItems="center" gap="$2" marginBottom="$1">
                  <Ionicons
                    name="sparkles"
                    size={20}
                    color={theme.accent.val}
                  />
                  <Text color="$textPrimary" fontSize={18} fontWeight="600">
                    Recommended Times
                  </Text>
                </XStack>

                <Text color="$textSecondary" fontSize={14} marginBottom="$2">
                  Based on your availability for {selectedType?.name}
                </Text>

                {suggestionsQuery.data?.suggestions.map((suggestion, index) => (
                  <Card
                    key={index}
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
                      {/* Header with dots */}
                      <XStack
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        <Text
                          color="$textPrimary"
                          fontSize={18}
                          fontWeight="600"
                        >
                          {selectedType?.name || "Session"}
                        </Text>
                      </XStack>

                      {/* Time */}
                      <XStack alignItems="center" gap="$2">
                        <Ionicons
                          name="time-outline"
                          size={16}
                          color="$textSecondary"
                        />
                        <Text color="$textSecondary" fontSize={14}>
                          {new Date(suggestion.startTime).toLocaleDateString(
                            "en-US",
                            {
                              weekday: "short",
                            }
                          )}{" "}
                          · {formatTime(new Date(suggestion.startTime))}-
                          {formatTime(new Date(suggestion.endTime))}
                        </Text>
                      </XStack>

                      {/* Reason */}
                      {suggestion.reasons.length > 0 && (
                        <Text
                          color="$textSecondary"
                          fontSize={14}
                          numberOfLines={2}
                        >
                          {suggestion.reasons[0]}
                        </Text>
                      )}

                      {/* Action buttons - Figma style */}
                      <XStack gap="$3" marginTop="$1">
                        <Button
                          flex={1}
                          size="$4"
                          backgroundColor="$buttonPrimary"
                          color="#FFFFFF"
                          borderRadius={24}
                          fontWeight="600"
                          onPress={() => handleAccept(suggestion)}
                          disabled={createMutation.isPending}
                        >
                          {createMutation.isPending ? (
                            <Spinner size="small" color="#FFFFFF" />
                          ) : (
                            "Accept"
                          )}
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
                          onPress={() => handleAdjust(suggestion)}
                        >
                          Adjust
                        </Button>
                      </XStack>
                    </YStack>
                  </Card>
                ))}
              </YStack>
            )}
          </ScrollView>
        </YStack>
      </SafeAreaView>
    </>
  );
}
