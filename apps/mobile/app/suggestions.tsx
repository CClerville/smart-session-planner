// =============================================================================
// SUGGESTIONS SCREEN
// =============================================================================
// Smart scheduling suggestions based on user availability and preferences.
// =============================================================================

import { Ionicons } from "@expo/vector-icons";
import type { AppRouter } from "@repo/api";
import type { inferRouterOutputs } from "@trpc/server";
import { router, Stack } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, RefreshControl, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Adapt,
  Button,
  Card,
  H3,
  Select,
  Sheet,
  Spinner,
  Text,
  XStack,
  YStack,
} from "tamagui";
import {
  formatDateTime,
  formatDuration,
  PRIORITY_COLORS,
  type Priority,
} from "../lib/constants";
import { trpc } from "../lib/trpc";

type SessionType =
  inferRouterOutputs<AppRouter>["sessionTypes"]["list"][number];

export default function SuggestionsScreen() {
  const utils = trpc.useUtils();

  // Filter state
  const [sessionTypeId, setSessionTypeId] = useState<string>("");
  const [duration, setDuration] = useState(60);

  // Calculate date range (next 7 days)
  const dateRange = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    return { startDate: start, endDate: end };
  }, []);

  // Fetch session types for filter
  const typesQuery = trpc.sessionTypes.list.useQuery();

  // Fetch suggestions
  const suggestionsQuery = trpc.suggestions.getSuggestions.useQuery({
    ...dateRange,
    sessionTypeId: sessionTypeId || undefined,
    duration,
  });

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
        }}
      />
      <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
        <YStack flex={1}>
          {/* Filters */}
          <YStack
            padding="$4"
            gap="$3"
            borderBottomWidth={1}
            borderColor="$gray4"
          >
            {/* Session Type Filter */}
            <YStack gap="$2">
              <Text color="$gray11" fontSize="$2" fontWeight="600">
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
                  borderColor="$gray6"
                  iconAfter={<Ionicons name="chevron-down" size={18} />}
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
              <Text color="$gray11" fontSize="$2" fontWeight="600">
                Duration
              </Text>
              <XStack gap="$2" flexWrap="wrap">
                {[30, 45, 60, 90, 120].map((d) => (
                  <Button
                    key={d}
                    size="$3"
                    backgroundColor={duration === d ? "$brand" : "$gray4"}
                    color={duration === d ? "white" : "$gray11"}
                    onPress={() => setDuration(d)}
                  >
                    {formatDuration(d)}
                  </Button>
                ))}
              </XStack>
            </YStack>
          </YStack>

          {/* Suggestions List */}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 16 }}
            refreshControl={
              <RefreshControl
                refreshing={suggestionsQuery.isFetching}
                onRefresh={() => suggestionsQuery.refetch()}
              />
            }
          >
            {!sessionTypeId ? (
              <Card padding="$6" backgroundColor="$gray2">
                <YStack alignItems="center" gap="$3">
                  <Ionicons name="bulb-outline" size={48} color="#F59E0B" />
                  <Text color="$gray10" textAlign="center">
                    Select a session type to see suggestions
                  </Text>
                </YStack>
              </Card>
            ) : suggestionsQuery.isLoading ? (
              <YStack padding="$8" alignItems="center">
                <Spinner size="large" color="$brand" />
                <Text color="$gray10" marginTop="$3">
                  Finding optimal times...
                </Text>
              </YStack>
            ) : suggestionsQuery.data?.suggestions.length === 0 ? (
              <Card padding="$6" backgroundColor="$gray2">
                <YStack alignItems="center" gap="$3">
                  <Ionicons name="calendar-outline" size={48} color="#6B7280" />
                  <Text color="$gray10" textAlign="center">
                    {suggestionsQuery.data?.message ||
                      "No suggestions available"}
                  </Text>
                  <Button
                    size="$3"
                    backgroundColor="$brand"
                    color="white"
                    onPress={() => router.push("/availability")}
                  >
                    Set Availability
                  </Button>
                </YStack>
              </Card>
            ) : (
              <YStack gap="$3">
                <XStack alignItems="center" gap="$2">
                  <Ionicons name="sparkles" size={20} color="#8B5CF6" />
                  <H3 color="$color12">Recommended Times</H3>
                </XStack>

                <Text color="$gray10" fontSize="$2">
                  Based on your availability and schedule for{" "}
                  {selectedType?.name}
                </Text>

                {suggestionsQuery.data?.suggestions.map((suggestion, index) => (
                  <Card
                    key={index}
                    padding="$4"
                    backgroundColor="$gray2"
                    borderLeftWidth={4}
                    borderLeftColor={
                      selectedType?.color ??
                      PRIORITY_COLORS[(selectedType?.priority ?? 3) as Priority]
                    }
                  >
                    <XStack justifyContent="space-between" alignItems="center">
                      <YStack flex={1} gap="$1">
                        <Text color="$color12" fontWeight="600">
                          {formatDateTime(new Date(suggestion.startTime))}
                        </Text>
                        <Text color="$gray10" fontSize="$2">
                          {formatDuration(duration)}
                        </Text>
                        {suggestion.reasons.length > 0 && (
                          <XStack flexWrap="wrap" gap="$1" marginTop="$1">
                            {suggestion.reasons.slice(0, 2).map((reason, i) => (
                              <XStack
                                key={i}
                                paddingHorizontal="$2"
                                paddingVertical="$1"
                                backgroundColor="$brand"
                                opacity={0.2}
                                borderRadius="$2"
                              >
                                <Text color="$brand" fontSize="$1">
                                  {reason}
                                </Text>
                              </XStack>
                            ))}
                          </XStack>
                        )}
                      </YStack>

                      <YStack alignItems="flex-end" gap="$2">
                        <XStack
                          paddingHorizontal="$2"
                          paddingVertical="$1"
                          backgroundColor="$green5"
                          borderRadius="$2"
                        >
                          <Text color="$green10" fontSize="$1" fontWeight="600">
                            Score: {suggestion.score}
                          </Text>
                        </XStack>
                        <Button
                          size="$3"
                          backgroundColor="$brand"
                          color="white"
                          onPress={() => handleAccept(suggestion)}
                          disabled={createMutation.isPending}
                        >
                          {createMutation.isPending ? (
                            <Spinner size="small" color="white" />
                          ) : (
                            "Accept"
                          )}
                        </Button>
                      </YStack>
                    </XStack>
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
