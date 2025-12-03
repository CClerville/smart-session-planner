// =============================================================================
// SESSION DETAIL SCREEN
// =============================================================================
// View and manage a single session.
// =============================================================================

import { formatDateTime, formatDuration } from "@/utils";
import { getSessionTypeColor } from "@/utils/sessionTypeColors";
import { Ionicons } from "@expo/vector-icons";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Button,
  Card,
  ScrollView,
  Spinner,
  Text,
  useTheme,
  XStack,
  YStack,
} from "tamagui";
import {
  PRIORITY_LABELS,
  STATUS_COLORS,
  STATUS_LABELS,
  type Priority,
  type SessionStatus,
} from "@/constants";
import { trpc } from "@/lib/api";

export function SessionDetailScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ id: string }>();
  const id = params?.id;

  // Guard: Show loading if params not yet available
  if (!id) {
    return (
      <YStack
        flex={1}
        justifyContent="center"
        alignItems="center"
        backgroundColor="$pageBg"
      >
        <Spinner size="large" color="$accent" />
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
      <YStack
        flex={1}
        justifyContent="center"
        alignItems="center"
        backgroundColor="$pageBg"
      >
        <Spinner size="large" color="$accent" />
      </YStack>
    );
  }

  if (!session) {
    return (
      <YStack
        flex={1}
        justifyContent="center"
        alignItems="center"
        padding="$4"
        backgroundColor="$pageBg"
      >
        <Text color="$textSecondary" fontSize={14}>
          Session not found
        </Text>
        <Button
          marginTop="$4"
          backgroundColor="$buttonPrimary"
          color="white"
          borderRadius={24}
          onPress={() => router.back()}
        >
          Go Back
        </Button>
      </YStack>
    );
  }

  const typeColor = getSessionTypeColor(
    session.sessionType.color,
    session.sessionType.priority,
    session.sessionType.name
  );

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Session Details",
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
            {/* Session Type Card */}
            <Card
              padding="$4"
              backgroundColor="$cardBg"
              borderRadius={16}
              borderLeftWidth={4}
              borderLeftColor={typeColor}
              shadowColor="#000"
              shadowOffset={{ width: 0, height: 2 }}
              shadowOpacity={0.05}
              shadowRadius={8}
              elevation={2}
            >
              <YStack gap="$2">
                <XStack justifyContent="space-between" alignItems="center">
                  <Text
                    color="$textPrimary"
                    fontSize={24}
                    fontWeight="700"
                    fontFamily="InterBold"
                  >
                    {session.sessionType.name}
                  </Text>
                  <XStack
                    paddingHorizontal={12}
                    paddingVertical={4}
                    backgroundColor={
                      STATUS_COLORS[session.status as SessionStatus] + "20"
                    }
                    borderRadius={12}
                  >
                    <Text
                      color={STATUS_COLORS[session.status as SessionStatus]}
                      fontSize={13}
                      fontWeight="600"
                    >
                      {STATUS_LABELS[session.status as SessionStatus]}
                    </Text>
                  </XStack>
                </XStack>

                <XStack gap="$2" alignItems="center">
                  <XStack
                    paddingHorizontal={8}
                    paddingVertical={4}
                    backgroundColor={typeColor + "20"}
                    borderRadius={8}
                  >
                    <Text color={typeColor} fontSize={12} fontWeight="600">
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
            <Card
              padding="$4"
              backgroundColor="$cardBg"
              borderRadius={16}
              shadowColor="#000"
              shadowOffset={{ width: 0, height: 2 }}
              shadowOpacity={0.05}
              shadowRadius={8}
              elevation={2}
            >
              <YStack gap="$3">
                <XStack alignItems="center" gap="$3">
                  <YStack
                    width={40}
                    height={40}
                    borderRadius={12}
                    backgroundColor="#DBEAFE"
                    justifyContent="center"
                    alignItems="center"
                  >
                    <Ionicons name="calendar" size={20} color="#3B82F6" />
                  </YStack>
                  <YStack>
                    <Text color="$textSecondary" fontSize={13}>
                      Start Time
                    </Text>
                    <Text color="$textPrimary" fontSize={15} fontWeight="600">
                      {formatDateTime(new Date(session.startTime))}
                    </Text>
                  </YStack>
                </XStack>

                <XStack alignItems="center" gap="$3">
                  <YStack
                    width={40}
                    height={40}
                    borderRadius={12}
                    backgroundColor="#DCFCE7"
                    justifyContent="center"
                    alignItems="center"
                  >
                    <Ionicons name="time" size={20} color={theme.success.val} />
                  </YStack>
                  <YStack>
                    <Text color="$textSecondary" fontSize={13}>
                      Duration
                    </Text>
                    <Text color="$textPrimary" fontSize={15} fontWeight="600">
                      {formatDuration(session.duration)}
                    </Text>
                  </YStack>
                </XStack>

                <XStack alignItems="center" gap="$3">
                  <YStack
                    width={40}
                    height={40}
                    borderRadius={12}
                    backgroundColor="#FEF3C7"
                    justifyContent="center"
                    alignItems="center"
                  >
                    <Ionicons name="flag" size={20} color="#F59E0B" />
                  </YStack>
                  <YStack>
                    <Text color="$textSecondary" fontSize={13}>
                      End Time
                    </Text>
                    <Text color="$textPrimary" fontSize={15} fontWeight="600">
                      {formatDateTime(new Date(session.endTime))}
                    </Text>
                  </YStack>
                </XStack>
              </YStack>
            </Card>

            {/* Notes */}
            {session.notes && (
              <Card
                padding="$4"
                backgroundColor="$cardBg"
                borderRadius={16}
                shadowColor="#000"
                shadowOffset={{ width: 0, height: 2 }}
                shadowOpacity={0.05}
                shadowRadius={8}
                elevation={2}
              >
                <YStack gap="$2">
                  <Text color="$textSecondary" fontSize={13} fontWeight="600">
                    Notes
                  </Text>
                  <Text color="$textPrimary" fontSize={14}>
                    {session.notes}
                  </Text>
                </YStack>
              </Card>
            )}

            {/* Actions */}
            <YStack gap="$2">
              {session.status === "SCHEDULED" && (
                <Button
                  size="$5"
                  backgroundColor="$success"
                  color="white"
                  borderRadius={24}
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
                backgroundColor="$dangerBg"
                color="$danger"
                borderRadius={24}
                onPress={handleDelete}
                disabled={deleteMutation.isPending}
                icon={
                  deleteMutation.isPending ? (
                    <Spinner color="$danger" />
                  ) : (
                    <Ionicons
                      name="trash-outline"
                      size={20}
                      color={theme.danger.val}
                    />
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
