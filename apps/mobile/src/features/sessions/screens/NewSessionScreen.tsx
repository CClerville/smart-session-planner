// =============================================================================
// NEW SESSION SCREEN
// =============================================================================
// Create a new scheduled session.
// =============================================================================

import { PRIORITY_COLORS, type Priority } from "@/constants";
import { trpc } from "@/lib/api";
import { formatDateTime } from "@/utils";
import { getSessionTypeStyle } from "@/utils/sessionTypeColors";
import { getSessionTypeIcon } from "@/utils/sessionTypeIcons";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { router, Stack } from "expo-router";
import { useState } from "react";
import { Platform, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Adapt,
  Button,
  Input,
  Select,
  Sheet,
  Spinner,
  Text,
  useTheme,
  XStack,
  YStack,
} from "tamagui";

export function NewSessionScreen() {
  const theme = useTheme();
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
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
          <YStack gap="$4">
            {/* Error Message */}
            {error && (
              <XStack
                backgroundColor="$dangerBg"
                padding="$3"
                borderRadius={12}
                borderWidth={1}
                borderColor="$danger"
              >
                <Text color="$danger" fontSize={14}>
                  {error}
                </Text>
              </XStack>
            )}

            {/* Session Type Selection */}
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
                  size="$5"
                  borderWidth={1}
                  borderColor="$borderLight"
                  iconAfter={
                    <Ionicons
                      name="chevron-down"
                      size={20}
                      color={theme.textSecondary.val}
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
                      {typesQuery.data?.map((type, index) => {
                        const itemStyle = getSessionTypeStyle(
                          type.color,
                          type.priority,
                          type.name
                        );
                        const itemIcon = getSessionTypeIcon(
                          type.icon,
                          type.name
                        );
                        return (
                          <Select.Item
                            key={type.id}
                            value={type.id}
                            index={index}
                          >
                            <XStack alignItems="center" gap="$2">
                              <YStack
                                width={24}
                                height={24}
                                borderRadius={12}
                                backgroundColor={itemStyle.bg}
                                justifyContent="center"
                                alignItems="center"
                              >
                                <Ionicons
                                  name={itemIcon}
                                  size={14}
                                  color={itemStyle.icon}
                                />
                              </YStack>
                              <Select.ItemText>{type.name}</Select.ItemText>
                            </XStack>
                          </Select.Item>
                        );
                      })}
                    </Select.Group>
                  </Select.Viewport>
                </Select.Content>
              </Select>

              {selectedType &&
                (() => {
                  const style = getSessionTypeStyle(
                    selectedType.color,
                    selectedType.priority,
                    selectedType.name
                  );
                  const icon = getSessionTypeIcon(
                    selectedType.icon,
                    selectedType.name
                  );
                  return (
                    <XStack
                      padding="$2"
                      backgroundColor={style.bg}
                      borderRadius="$2"
                      alignItems="center"
                      gap="$2"
                    >
                      <YStack
                        width={32}
                        height={32}
                        borderRadius={16}
                        backgroundColor={style.icon}
                        justifyContent="center"
                        alignItems="center"
                      >
                        <Ionicons name={icon} size={18} color="#FFFFFF" />
                      </YStack>
                      <Text color="$textSecondary" fontSize={13}>
                        {selectedType.name} • Priority {selectedType.priority}
                      </Text>
                    </XStack>
                  );
                })()}
            </YStack>

            {/* Date Selection */}
            <YStack gap="$2">
              <Text color="$textSecondary" fontSize={13} fontWeight="600">
                Date & Time
              </Text>
              <Button
                size="$5"
                backgroundColor="$buttonSecondary"
                color="$textPrimary"
                justifyContent="flex-start"
                borderRadius={12}
                onPress={() => setShowDatePicker(true)}
              >
                <Text color="$textPrimary" fontSize={15}>
                  {formatDateTime(startTime)}
                </Text>
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
              <Text color="$textSecondary" fontSize={13} fontWeight="600">
                Duration
              </Text>
              <XStack gap="$2" flexWrap="wrap">
                {[15, 30, 45, 60, 90, 120].map((d) => (
                  <Button
                    key={d}
                    size="$4"
                    backgroundColor={
                      duration === d ? "$buttonPrimary" : "$buttonSecondary"
                    }
                    color={duration === d ? "white" : "$textSecondary"}
                    borderRadius={24}
                    onPress={() => setDuration(d)}
                  >
                    <Text
                      fontSize={14}
                      color={duration === d ? "white" : "$textSecondary"}
                    >
                      {d < 60 ? `${d}m` : `${d / 60}h`}
                    </Text>
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
                borderColor="$borderLight"
              />
            </YStack>

            {/* Notes */}
            <YStack gap="$2">
              <Text color="$textSecondary" fontSize={13} fontWeight="600">
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
                borderColor="$borderLight"
              />
            </YStack>

            {/* Submit Button */}
            <Button
              size="$5"
              backgroundColor="$buttonPrimary"
              color="white"
              borderRadius={24}
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
