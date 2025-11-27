// =============================================================================
// SESSION DETAIL SCREEN
// =============================================================================
// View and manage a single session.
// =============================================================================

import { Ionicons } from "@expo/vector-icons";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Button,
  Card,
  H2,
  ScrollView,
  Spinner,
  Text,
  XStack,
  YStack,
} from "tamagui";
import {
  formatDateTime,
  formatDuration,
  PRIORITY_COLORS,
  PRIORITY_LABELS,
  STATUS_COLORS,
  STATUS_LABELS,
  type Priority,
  type SessionStatus,
} from "../../lib/constants";
import { trpc } from "../../lib/trpc";

export default function SessionDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const id = params?.id;

  // Guard: Show loading if params not yet available
  if (!id) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center">
        <Spinner size="large" color="$brand" />
      </YStack>
    );
  }

  const utils = trpc.useUtils();

  // Fetch session details
  const sessionQuery = trpc.sessions.get.useQuery({ id });

  // Mutations
  const completeMutation = trpc.sessions.complete.useMutation({
    onSuccess: () => {
      utils.sessions.invalidate();
      utils.stats.invalidate();
    },
  });

  const deleteMutation = trpc.sessions.delete.useMutation({
    onSuccess: () => {
      utils.sessions.invalidate();
      utils.stats.invalidate();
      router.back();
    },
  });

  const handleComplete = () => {
    if (!id) return;

    Alert.alert("Complete Session", "Mark this session as completed?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Complete",
        onPress: () => completeMutation.mutate({ id }),
      },
    ]);
  };

  const handleDelete = () => {
    if (!id) return;

    Alert.alert(
      "Delete Session",
      "Are you sure you want to delete this session?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteMutation.mutate({ id }),
        },
      ]
    );
  };

  const session = sessionQuery.data;

  if (sessionQuery.isLoading) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center">
        <Spinner size="large" color="$brand" />
      </YStack>
    );
  }

  if (!session) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center" padding="$4">
        <Text color="$gray10">Session not found</Text>
        <Button marginTop="$4" onPress={() => router.back()}>
          Go Back
        </Button>
      </YStack>
    );
  }

  const typeColor =
    session.sessionType.color ??
    PRIORITY_COLORS[session.sessionType.priority as Priority];

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Session Details",
          headerBackTitle: "Back",
        }}
      />
      <SafeAreaView style={{ flex: 1 }} edges={["bottom"]}>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
          <YStack gap="$4">
            {/* Session Type Card */}
            <Card
              padding="$4"
              backgroundColor="$gray2"
              borderLeftWidth={4}
              borderLeftColor={typeColor}
            >
              <YStack gap="$2">
                <XStack justifyContent="space-between" alignItems="center">
                  <H2 color="$color12">{session.sessionType.name}</H2>
                  <XStack
                    paddingHorizontal="$3"
                    paddingVertical="$1"
                    backgroundColor={
                      STATUS_COLORS[session.status as SessionStatus] + "20"
                    }
                    borderRadius="$3"
                  >
                    <Text
                      color={STATUS_COLORS[session.status as SessionStatus]}
                      fontWeight="600"
                    >
                      {STATUS_LABELS[session.status as SessionStatus]}
                    </Text>
                  </XStack>
                </XStack>

                <XStack gap="$2" alignItems="center">
                  <XStack
                    paddingHorizontal="$2"
                    paddingVertical="$1"
                    backgroundColor={typeColor + "20"}
                    borderRadius="$2"
                  >
                    <Text color={typeColor} fontSize="$2" fontWeight="600">
                      {
                        PRIORITY_LABELS[
                          session.sessionType.priority as Priority
                        ]
                      }
                    </Text>
                  </XStack>
                </XStack>
              </YStack>
            </Card>

            {/* Time Details */}
            <Card padding="$4" backgroundColor="$gray2">
              <YStack gap="$3">
                <XStack alignItems="center" gap="$3">
                  <YStack
                    width={40}
                    height={40}
                    borderRadius="$3"
                    backgroundColor="$blue5"
                    justifyContent="center"
                    alignItems="center"
                  >
                    <Ionicons name="calendar" size={20} color="#3B82F6" />
                  </YStack>
                  <YStack>
                    <Text color="$gray10" fontSize="$2">
                      Start Time
                    </Text>
                    <Text color="$color12" fontWeight="600">
                      {formatDateTime(new Date(session.startTime))}
                    </Text>
                  </YStack>
                </XStack>

                <XStack alignItems="center" gap="$3">
                  <YStack
                    width={40}
                    height={40}
                    borderRadius="$3"
                    backgroundColor="$green5"
                    justifyContent="center"
                    alignItems="center"
                  >
                    <Ionicons name="time" size={20} color="#22C55E" />
                  </YStack>
                  <YStack>
                    <Text color="$gray10" fontSize="$2">
                      Duration
                    </Text>
                    <Text color="$color12" fontWeight="600">
                      {formatDuration(session.duration)}
                    </Text>
                  </YStack>
                </XStack>

                <XStack alignItems="center" gap="$3">
                  <YStack
                    width={40}
                    height={40}
                    borderRadius="$3"
                    backgroundColor="$orange5"
                    justifyContent="center"
                    alignItems="center"
                  >
                    <Ionicons name="flag" size={20} color="#F59E0B" />
                  </YStack>
                  <YStack>
                    <Text color="$gray10" fontSize="$2">
                      End Time
                    </Text>
                    <Text color="$color12" fontWeight="600">
                      {formatDateTime(new Date(session.endTime))}
                    </Text>
                  </YStack>
                </XStack>
              </YStack>
            </Card>

            {/* Notes */}
            {session.notes && (
              <Card padding="$4" backgroundColor="$gray2">
                <YStack gap="$2">
                  <Text color="$gray10" fontSize="$2" fontWeight="600">
                    Notes
                  </Text>
                  <Text color="$color12">{session.notes}</Text>
                </YStack>
              </Card>
            )}

            {/* Actions */}
            <YStack gap="$2">
              {session.status === "SCHEDULED" && (
                <Button
                  size="$5"
                  backgroundColor="$green9"
                  color="white"
                  onPress={handleComplete}
                  disabled={completeMutation.isPending}
                  icon={
                    completeMutation.isPending ? (
                      <Spinner color="white" />
                    ) : (
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color="white"
                      />
                    )
                  }
                >
                  Mark as Completed
                </Button>
              )}

              <Button
                size="$5"
                backgroundColor="$red4"
                color="$red10"
                onPress={handleDelete}
                disabled={deleteMutation.isPending}
                icon={
                  deleteMutation.isPending ? (
                    <Spinner color="$red10" />
                  ) : (
                    <Ionicons name="trash-outline" size={20} color="#EF4444" />
                  )
                }
              >
                Delete Session
              </Button>
            </YStack>
          </YStack>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
