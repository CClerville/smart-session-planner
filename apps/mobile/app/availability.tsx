// =============================================================================
// AVAILABILITY SCREEN
// =============================================================================
// Set weekly availability windows for session scheduling.
// =============================================================================

import { useState, useEffect } from "react";
import { ScrollView, Alert } from "react-native";
import { Stack } from "expo-router";
import {
  YStack,
  XStack,
  Text,
  Card,
  Button,
  Spinner,
  Sheet,
  Input,
} from "tamagui";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { trpc } from "../lib/trpc";
import { DAYS_OF_WEEK } from "../lib/constants";

// Time slot type
interface TimeSlot {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export default function AvailabilityScreen() {
  const utils = trpc.useUtils();

  // Fetch current availability
  const availabilityQuery = trpc.availability.get.useQuery();

  // Local state for editing
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [selectedDay, setSelectedDay] = useState(0);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize slots from query data
  useEffect(() => {
    if (availabilityQuery.data) {
      setSlots(
        availabilityQuery.data.map((a) => ({
          dayOfWeek: a.dayOfWeek,
          startTime: a.startTime,
          endTime: a.endTime,
        }))
      );
    }
  }, [availabilityQuery.data]);

  // Upsert mutation
  const upsertMutation = trpc.availability.upsert.useMutation({
    onSuccess: () => {
      utils.availability.invalidate();
      setHasChanges(false);
      Alert.alert("Success", "Availability updated successfully");
    },
    onError: (err) => {
      Alert.alert("Error", err.message);
    },
  });

  const handleSave = () => {
    upsertMutation.mutate(slots);
  };

  const handleAddSlot = (startTime: string, endTime: string) => {
    setSlots((prev) => [...prev, { dayOfWeek: selectedDay, startTime, endTime }]);
    setHasChanges(true);
    setShowAddSheet(false);
  };

  const handleRemoveSlot = (index: number) => {
    setSlots((prev) => prev.filter((_, i) => i !== index));
    setHasChanges(true);
  };

  // Group slots by day
  const slotsByDay = DAYS_OF_WEEK.map((_, dayIndex) =>
    slots
      .map((slot, index) => ({ ...slot, originalIndex: index }))
      .filter((slot) => slot.dayOfWeek === dayIndex)
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
  );

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Availability",
          headerBackTitle: "Back",
          headerRight: () =>
            hasChanges ? (
              <Button
                size="$3"
                chromeless
                onPress={handleSave}
                disabled={upsertMutation.isPending}
              >
                {upsertMutation.isPending ? (
                  <Spinner size="small" color="$brand" />
                ) : (
                  <Text color="$brand" fontWeight="600">
                    Save
                  </Text>
                )}
              </Button>
            ) : null,
        }}
      />
      <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16 }}
        >
          {availabilityQuery.isLoading ? (
            <YStack padding="$8" alignItems="center">
              <Spinner size="large" color="$brand" />
            </YStack>
          ) : (
            <YStack gap="$4">
              <Text color="$gray10" fontSize="$3">
                Set your available time windows for each day. The suggestion
                algorithm will use this to recommend optimal session times.
              </Text>

              {DAYS_OF_WEEK.map((day, dayIndex) => (
                <Card key={day} padding="$3" backgroundColor="$gray2">
                  <YStack gap="$2">
                    <XStack justifyContent="space-between" alignItems="center">
                      <Text color="$color12" fontWeight="600" fontSize="$4">
                        {day}
                      </Text>
                      <Button
                        size="$2"
                        circular
                        backgroundColor="$brand"
                        icon={<Ionicons name="add" size={16} color="white" />}
                        onPress={() => {
                          setSelectedDay(dayIndex);
                          setShowAddSheet(true);
                        }}
                      />
                    </XStack>

                    {slotsByDay[dayIndex]?.length === 0 ? (
                      <Text color="$gray10" fontSize="$2" fontStyle="italic">
                        No availability set
                      </Text>
                    ) : (
                      <YStack gap="$2">
                        {slotsByDay[dayIndex]?.map((slot) => (
                          <XStack
                            key={slot.originalIndex}
                            alignItems="center"
                            justifyContent="space-between"
                            padding="$2"
                            backgroundColor="$gray4"
                            borderRadius="$2"
                          >
                            <XStack alignItems="center" gap="$2">
                              <Ionicons name="time-outline" size={16} color="#6B7280" />
                              <Text color="$color12">
                                {slot.startTime} - {slot.endTime}
                              </Text>
                            </XStack>
                            <Button
                              size="$2"
                              circular
                              chromeless
                              icon={
                                <Ionicons
                                  name="close-circle"
                                  size={20}
                                  color="#EF4444"
                                />
                              }
                              onPress={() => handleRemoveSlot(slot.originalIndex)}
                            />
                          </XStack>
                        ))}
                      </YStack>
                    )}
                  </YStack>
                </Card>
              ))}
            </YStack>
          )}
        </ScrollView>

        {/* Add Time Slot Sheet */}
        <AddSlotSheet
          open={showAddSheet}
          onClose={() => setShowAddSheet(false)}
          onAdd={handleAddSlot}
          dayName={DAYS_OF_WEEK[selectedDay] ?? ""}
        />
      </SafeAreaView>
    </>
  );
}

// -----------------------------------------------------------------------------
// Add Slot Sheet
// -----------------------------------------------------------------------------

interface AddSlotSheetProps {
  open: boolean;
  onClose: () => void;
  onAdd: (startTime: string, endTime: string) => void;
  dayName: string;
}

function AddSlotSheet({ open, onClose, onAdd, dayName }: AddSlotSheetProps) {
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [error, setError] = useState<string | null>(null);

  const handleAdd = () => {
    setError(null);

    // Validate time format
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(startTime)) {
      setError("Invalid start time format (use HH:MM)");
      return;
    }
    if (!timeRegex.test(endTime)) {
      setError("Invalid end time format (use HH:MM)");
      return;
    }
    if (startTime >= endTime) {
      setError("End time must be after start time");
      return;
    }

    onAdd(startTime, endTime);
    setStartTime("09:00");
    setEndTime("17:00");
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(isOpen: boolean) => {
        if (!isOpen) {
          setError(null);
          onClose();
        }
      }}
      snapPoints={[50]}
      dismissOnSnapToBottom
    >
      <Sheet.Overlay />
      <Sheet.Frame padding="$4">
        <Sheet.Handle />

        <YStack gap="$4" marginTop="$4">
          <Text color="$color12" fontSize="$6" fontWeight="700">
            Add Time Window - {dayName}
          </Text>

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

          <XStack gap="$3" alignItems="center">
            <YStack flex={1} gap="$2">
              <Text color="$gray11" fontSize="$2" fontWeight="600">
                Start Time
              </Text>
              <Input
                placeholder="09:00"
                value={startTime}
                onChangeText={setStartTime}
                size="$5"
                borderWidth={1}
                borderColor="$gray6"
              />
            </YStack>

            <Text color="$gray10" marginTop="$4">
              to
            </Text>

            <YStack flex={1} gap="$2">
              <Text color="$gray11" fontSize="$2" fontWeight="600">
                End Time
              </Text>
              <Input
                placeholder="17:00"
                value={endTime}
                onChangeText={setEndTime}
                size="$5"
                borderWidth={1}
                borderColor="$gray6"
              />
            </YStack>
          </XStack>

          <Text color="$gray10" fontSize="$2">
            Use 24-hour format (e.g., 09:00, 14:30, 17:00)
          </Text>

          <XStack gap="$3">
            <Button
              flex={1}
              size="$5"
              backgroundColor="$gray4"
              color="$color12"
              onPress={onClose}
            >
              Cancel
            </Button>
            <Button
              flex={1}
              size="$5"
              backgroundColor="$brand"
              color="white"
              onPress={handleAdd}
            >
              Add
            </Button>
          </XStack>
        </YStack>
      </Sheet.Frame>
    </Sheet>
  );
}

