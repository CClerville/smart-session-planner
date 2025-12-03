import { DAYS_OF_WEEK } from "@/constants";
import { trpc } from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Button,
  Card,
  Input,
  Sheet,
  Spinner,
  Text,
  XStack,
  YStack,
  useTheme,
} from "tamagui";

interface TimeSlot {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export function AvailabilityScreen() {
  const theme = useTheme();
  const utils = trpc.useUtils();
  const availabilityQuery = trpc.availability.get.useQuery();

  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [selectedDay, setSelectedDay] = useState(0);
  const [hasChanges, setHasChanges] = useState(false);

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
    setSlots((prev) => [
      ...prev,
      { dayOfWeek: selectedDay, startTime, endTime },
    ]);
    setHasChanges(true);
    setShowAddSheet(false);
  };

  const handleRemoveSlot = (index: number) => {
    setSlots((prev) => prev.filter((_, i) => i !== index));
    setHasChanges(true);
  };

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
          headerStyle: {
            backgroundColor: theme.pageBg.val,
          },
          headerTintColor: theme.textPrimary.val,
          headerTitleStyle: {
            fontWeight: "600",
            color: theme.textPrimary.val,
          },
          headerRight: () =>
            hasChanges ? (
              <Pressable
                onPress={handleSave}
                disabled={upsertMutation.isPending}
              >
                {upsertMutation.isPending ? (
                  <Spinner size="small" color="$accent" />
                ) : (
                  <Text color="$accent" fontWeight="600" fontSize={16}>
                    Save
                  </Text>
                )}
              </Pressable>
            ) : null,
        }}
      />
      <SafeAreaView
        style={{ flex: 1, backgroundColor: theme.pageBg.val }}
        edges={["bottom"]}
      >
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
          {availabilityQuery.isLoading ? (
            <YStack padding="$8" alignItems="center">
              <Spinner size="large" color="$accent" />
            </YStack>
          ) : (
            <YStack gap="$4">
              <Text color="$textSecondary" fontSize={14} lineHeight={20}>
                Set your available time windows for each day. The suggestion
                algorithm will use this to recommend optimal session times.
              </Text>

              {DAYS_OF_WEEK.map((day, dayIndex) => (
                <Card
                  key={day}
                  backgroundColor="$cardBg"
                  borderRadius={16}
                  padding="$4"
                  shadowColor="#000"
                  shadowOffset={{ width: 0, height: 2 }}
                  shadowOpacity={0.05}
                  shadowRadius={8}
                  elevation={2}
                >
                  <YStack gap="$3">
                    <XStack justifyContent="space-between" alignItems="center">
                      <Text color="$textPrimary" fontWeight="600" fontSize={17}>
                        {day}
                      </Text>
                      <Pressable
                        onPress={() => {
                          setSelectedDay(dayIndex);
                          setShowAddSheet(true);
                        }}
                      >
                        <YStack
                          width={32}
                          height={32}
                          borderRadius={16}
                          backgroundColor="$buttonPrimary"
                          justifyContent="center"
                          alignItems="center"
                        >
                          <Ionicons name="add" size={18} color="#FFFFFF" />
                        </YStack>
                      </Pressable>
                    </XStack>

                    {slotsByDay[dayIndex]?.length === 0 ? (
                      <Text
                        color="$textSecondary"
                        fontSize={14}
                        fontStyle="italic"
                      >
                        No availability set
                      </Text>
                    ) : (
                      <YStack gap="$2">
                        {slotsByDay[dayIndex]?.map((slot) => (
                          <XStack
                            key={slot.originalIndex}
                            alignItems="center"
                            justifyContent="space-between"
                            padding="$3"
                            backgroundColor="$buttonSecondary"
                            borderRadius={12}
                          >
                            <XStack alignItems="center" gap="$2">
                              <Ionicons
                                name="time-outline"
                                size={18}
                                color="$textSecondary"
                              />
                              <Text color="$textPrimary" fontSize={15}>
                                {slot.startTime} - {slot.endTime}
                              </Text>
                            </XStack>
                            <Pressable
                              onPress={() =>
                                handleRemoveSlot(slot.originalIndex)
                              }
                            >
                              <Ionicons
                                name="close-circle"
                                size={22}
                                color={theme.danger.val}
                              />
                            </Pressable>
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
      <Sheet.Frame padding="$5" backgroundColor="$cardBg">
        <Sheet.Handle />

        <YStack gap="$4" marginTop="$4">
          <Text color="$textPrimary" fontSize={20} fontWeight="700">
            Add Time Window - {dayName}
          </Text>

          {error && (
            <XStack backgroundColor="$dangerBg" padding="$3" borderRadius={12}>
              <Text color="$danger" fontSize={14}>
                {error}
              </Text>
            </XStack>
          )}

          <XStack gap="$3" alignItems="center">
            <YStack flex={1} gap="$2">
              <Text color="$textSecondary" fontSize={13} fontWeight="600">
                Start Time
              </Text>
              <Input
                placeholder="09:00"
                value={startTime}
                onChangeText={setStartTime}
                size="$5"
                borderWidth={1}
                borderColor="$borderLight"
                borderRadius={12}
                backgroundColor="$cardBg"
              />
            </YStack>

            <Text color="$textSecondary" marginTop="$4">
              to
            </Text>

            <YStack flex={1} gap="$2">
              <Text color="$textSecondary" fontSize={13} fontWeight="600">
                End Time
              </Text>
              <Input
                placeholder="17:00"
                value={endTime}
                onChangeText={setEndTime}
                size="$5"
                borderWidth={1}
                borderColor="$borderLight"
                borderRadius={12}
                backgroundColor="$cardBg"
              />
            </YStack>
          </XStack>

          <Text color="$textSecondary" fontSize={13}>
            Use 24-hour format (e.g., 09:00, 14:30, 17:00)
          </Text>

          <XStack gap="$3">
            <Button
              flex={1}
              size="$5"
              backgroundColor="$buttonSecondary"
              color="$textPrimary"
              borderRadius={24}
              onPress={onClose}
            >
              Cancel
            </Button>
            <Button
              flex={1}
              size="$5"
              backgroundColor="$buttonPrimary"
              color="#FFFFFF"
              borderRadius={24}
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
