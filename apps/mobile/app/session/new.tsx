// =============================================================================
// NEW SESSION SCREEN
// =============================================================================
// Create a new scheduled session.
// =============================================================================

import { useState } from "react";
import { ScrollView, Platform } from "react-native";
import { router, Stack } from "expo-router";
import {
  YStack,
  XStack,
  Text,
  Button,
  Input,
  Spinner,
  Select,
  Adapt,
  Sheet,
} from "tamagui";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import { trpc } from "../../lib/trpc";
import { formatDateTime, PRIORITY_COLORS, type Priority } from "../../lib/constants";

export default function NewSessionScreen() {
  const utils = trpc.useUtils();

  // Form state
  const [sessionTypeId, setSessionTypeId] = useState("");
  const [startTime, setStartTime] = useState(new Date());
  const [duration, setDuration] = useState(60);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Date picker visibility
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Fetch session types
  const typesQuery = trpc.sessionTypes.list.useQuery();

  // Create mutation
  const createMutation = trpc.sessions.create.useMutation({
    onSuccess: () => {
      utils.sessions.invalidate();
      utils.stats.invalidate();
      router.back();
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleCreate = () => {
    setError(null);

    if (!sessionTypeId) {
      setError("Please select a session type");
      return;
    }

    const endTime = new Date(startTime.getTime() + duration * 60 * 1000);

    createMutation.mutate({
      sessionTypeId,
      startTime,
      endTime,
      duration,
      notes: notes.trim() || undefined,
    });
  };

  const selectedType = typesQuery.data?.find((t) => t.id === sessionTypeId);

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "New Session",
          headerBackTitle: "Back",
        }}
      />
      <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16 }}
        >
          <YStack gap="$4">
            {/* Error Message */}
            {error && (
              <XStack
                backgroundColor="$red2"
                padding="$3"
                borderRadius="$4"
                borderWidth={1}
                borderColor="$red6"
              >
                <Text color="$red10" fontSize="$3">
                  {error}
                </Text>
              </XStack>
            )}

            {/* Session Type Selection */}
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
                  size="$5"
                  borderWidth={1}
                  borderColor="$gray6"
                  iconAfter={<Ionicons name="chevron-down" size={20} />}
                >
                  <Select.Value placeholder="Select a type..." />
                </Select.Trigger>

                <Adapt when="sm" platform="touch">
                  <Sheet
                    modal
                    dismissOnSnapToBottom
                    snapPoints={[50]}
                  >
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
                      {typesQuery.data?.map((type, index) => (
                        <Select.Item
                          key={type.id}
                          value={type.id}
                          index={index}
                        >
                          <XStack alignItems="center" gap="$2">
                            <YStack
                              width={12}
                              height={12}
                              borderRadius={6}
                              backgroundColor={
                                type.color ??
                                PRIORITY_COLORS[type.priority as Priority]
                              }
                            />
                            <Select.ItemText>{type.name}</Select.ItemText>
                          </XStack>
                        </Select.Item>
                      ))}
                    </Select.Group>
                  </Select.Viewport>
                </Select.Content>
              </Select>

              {selectedType && (
                <XStack
                  padding="$2"
                  backgroundColor={
                    (selectedType.color ??
                      PRIORITY_COLORS[selectedType.priority as Priority]) + "20"
                  }
                  borderRadius="$2"
                  alignItems="center"
                  gap="$2"
                >
                  <YStack
                    width={8}
                    height={8}
                    borderRadius={4}
                    backgroundColor={
                      selectedType.color ??
                      PRIORITY_COLORS[selectedType.priority as Priority]
                    }
                  />
                  <Text color="$gray11" fontSize="$2">
                    {selectedType.name} • Priority {selectedType.priority}
                  </Text>
                </XStack>
              )}
            </YStack>

            {/* Date Selection */}
            <YStack gap="$2">
              <Text color="$gray11" fontSize="$2" fontWeight="600">
                Date & Time
              </Text>
              <Button
                size="$5"
                backgroundColor="$gray3"
                justifyContent="flex-start"
                onPress={() => setShowDatePicker(true)}
              >
                <Text color="$color12">{formatDateTime(startTime)}</Text>
              </Button>

              {showDatePicker && (
                <DateTimePicker
                  value={startTime}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={(event, date) => {
                    setShowDatePicker(false);
                    if (date) {
                      const newDate = new Date(startTime);
                      newDate.setFullYear(date.getFullYear());
                      newDate.setMonth(date.getMonth());
                      newDate.setDate(date.getDate());
                      setStartTime(newDate);
                      setShowTimePicker(true);
                    }
                  }}
                />
              )}

              {showTimePicker && (
                <DateTimePicker
                  value={startTime}
                  mode="time"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={(event, date) => {
                    setShowTimePicker(false);
                    if (date) {
                      const newDate = new Date(startTime);
                      newDate.setHours(date.getHours());
                      newDate.setMinutes(date.getMinutes());
                      setStartTime(newDate);
                    }
                  }}
                />
              )}
            </YStack>

            {/* Duration Selection */}
            <YStack gap="$2">
              <Text color="$gray11" fontSize="$2" fontWeight="600">
                Duration
              </Text>
              <XStack gap="$2" flexWrap="wrap">
                {[15, 30, 45, 60, 90, 120].map((d) => (
                  <Button
                    key={d}
                    size="$4"
                    backgroundColor={duration === d ? "$brand" : "$gray4"}
                    color={duration === d ? "white" : "$gray11"}
                    onPress={() => setDuration(d)}
                  >
                    {d < 60 ? `${d}m` : `${d / 60}h`}
                  </Button>
                ))}
              </XStack>
              <Input
                placeholder="Custom duration (minutes)"
                value={duration.toString()}
                onChangeText={(text) => {
                  const num = parseInt(text, 10);
                  if (!isNaN(num) && num > 0) {
                    setDuration(num);
                  }
                }}
                keyboardType="number-pad"
                size="$4"
                borderWidth={1}
                borderColor="$gray6"
              />
            </YStack>

            {/* Notes */}
            <YStack gap="$2">
              <Text color="$gray11" fontSize="$2" fontWeight="600">
                Notes (optional)
              </Text>
              <Input
                placeholder="Add notes for this session..."
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
                size="$5"
                borderWidth={1}
                borderColor="$gray6"
              />
            </YStack>

            {/* Submit Button */}
            <Button
              size="$5"
              backgroundColor="$brand"
              color="white"
              onPress={handleCreate}
              disabled={createMutation.isPending}
              marginTop="$2"
            >
              {createMutation.isPending ? (
                <Spinner color="white" />
              ) : (
                "Schedule Session"
              )}
            </Button>
          </YStack>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

