import { PRIORITY_COLORS, PRIORITY_LABELS, type Priority } from "@/constants";
import { trpc } from "@/lib/api";
import { getSessionTypeStyle } from "@/utils/sessionTypeColors";
import { getSessionTypeIcon } from "@/utils/sessionTypeIcons";
import { Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import { useState } from "react";
import { Alert, Pressable, RefreshControl, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Button,
  Card,
  Input,
  Sheet,
  Spinner,
  Text,
  useTheme,
  XStack,
  YStack,
} from "tamagui";
import { ColorPicker, IconSelector } from "../components";

export function SessionTypesScreen() {
  const theme = useTheme();
  const [showCreateSheet, setShowCreateSheet] = useState(false);

  // Fetch session types
  const typesQuery = trpc.sessionTypes.list.useQuery();

  const handleRefresh = () => {
    typesQuery.refetch();
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: "Session Types",
          headerBackTitle: "Back",
          headerStyle: {
            backgroundColor: theme.pageBg.val,
          },
          headerTintColor: theme.textPrimary.val,
          headerTitleStyle: {
            fontWeight: "600",
            color: theme.textPrimary.val,
          },
          headerRight: () => (
            <Pressable
              onPress={() => setShowCreateSheet(true)}
              style={{ marginRight: 8 }}
            >
              <Ionicons name="add" size={24} color={theme.buttonPrimary.val} />
            </Pressable>
          ),
        }}
      />
      <SafeAreaView
        style={{ flex: 1, backgroundColor: theme.pageBg.val }}
        edges={["bottom"]}
      >
        <YStack flex={1}>
          {/* Types List */}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 16 }}
            refreshControl={
              <RefreshControl
                refreshing={typesQuery.isFetching}
                onRefresh={handleRefresh}
              />
            }
          >
            {typesQuery.isLoading ? (
              <YStack padding="$8" alignItems="center">
                <Spinner size="large" color="$accent" />
              </YStack>
            ) : typesQuery.data?.length === 0 ? (
              <Card
                padding="$6"
                backgroundColor="$cardBg"
                borderRadius={16}
                shadowColor="#000"
                shadowOffset={{ width: 0, height: 2 }}
                shadowOpacity={0.05}
                shadowRadius={8}
                elevation={2}
              >
                <YStack alignItems="center" gap="$3">
                  <Ionicons
                    name="layers-outline"
                    size={48}
                    color={theme.textSecondary.val}
                  />
                  <Text color="$textSecondary" textAlign="center" fontSize={14}>
                    No session types yet
                  </Text>
                  <Button
                    size="$3"
                    backgroundColor="$buttonPrimary"
                    color="white"
                    borderRadius={24}
                    onPress={() => setShowCreateSheet(true)}
                  >
                    Create Type
                  </Button>
                </YStack>
              </Card>
            ) : (
              <YStack gap="$3">
                {typesQuery.data?.map((type) => (
                  <TypeCard key={type.id} type={type} />
                ))}
              </YStack>
            )}
          </ScrollView>

          {/* Create Sheet */}
          <CreateTypeSheet
            open={showCreateSheet}
            onClose={() => setShowCreateSheet(false)}
          />
        </YStack>
      </SafeAreaView>
    </>
  );
}

// -----------------------------------------------------------------------------
// Type Card Component
// -----------------------------------------------------------------------------

interface TypeCardProps {
  type: {
    id: string;
    name: string;
    category: string | null;
    priority: number;
    color: string | null;
    icon: string | null;
    completedCount: number;
  };
}

function TypeCard({ type }: TypeCardProps) {
  const theme = useTheme();
  const utils = trpc.useUtils();

  const deleteMutation = trpc.sessionTypes.delete.useMutation({
    onSuccess: () => {
      utils.sessionTypes.list.invalidate();
    },
  });

  const handleDelete = () => {
    Alert.alert(
      "Delete Session Type",
      `Are you sure you want to delete "${type.name}"? This will also delete all sessions of this type.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteMutation.mutate({ id: type.id }),
        },
      ]
    );
  };

  const style = getSessionTypeStyle(type.color, type.priority, type.name);
  const icon = getSessionTypeIcon(type.icon, type.name);

  return (
    <Card
      padding="$3"
      backgroundColor="$cardBg"
      borderRadius={16}
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
          <Ionicons name={icon} size={22} color={style.icon} />
        </YStack>

        {/* Type info */}
        <YStack flex={1}>
          <Text color="$textPrimary" fontWeight="600" fontSize={16}>
            {type.name}
          </Text>
          <XStack gap="$2" alignItems="center">
            <XStack
              paddingHorizontal="$2"
              paddingVertical="$1"
              backgroundColor={
                PRIORITY_COLORS[type.priority as Priority] + "20"
              }
              borderRadius={8}
            >
              <Text
                fontSize={12}
                color={PRIORITY_COLORS[type.priority as Priority]}
                fontWeight="600"
              >
                {PRIORITY_LABELS[type.priority as Priority]}
              </Text>
            </XStack>
            {type.category && (
              <Text color="$textSecondary" fontSize={13}>
                {type.category}
              </Text>
            )}
          </XStack>
        </YStack>

        {/* Stats & Actions */}
        <YStack alignItems="flex-end" gap="$2">
          <Text color="$textSecondary" fontSize={13}>
            {type.completedCount} completed
          </Text>
          <Button
            size="$2"
            chromeless
            circular
            icon={
              <Ionicons
                name="trash-outline"
                size={18}
                color={theme.danger.val}
              />
            }
            onPress={handleDelete}
            disabled={deleteMutation.isPending}
          />
        </YStack>
      </XStack>
    </Card>
  );
}

// -----------------------------------------------------------------------------
// Create Type Sheet
// -----------------------------------------------------------------------------

interface CreateTypeSheetProps {
  open: boolean;
  onClose: () => void;
}

function CreateTypeSheet({ open, onClose }: CreateTypeSheetProps) {
  const theme = useTheme();
  const utils = trpc.useUtils();

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState<Priority>(3);
  const [color, setColor] = useState<string | null>(null);
  const [icon, setIcon] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const createMutation = trpc.sessionTypes.create.useMutation({
    onSuccess: () => {
      utils.sessionTypes.list.invalidate();
      resetForm();
      onClose();
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const resetForm = () => {
    setName("");
    setCategory("");
    setPriority(3);
    setColor(null);
    setIcon(null);
    setError(null);
  };

  const handleCreate = () => {
    setError(null);

    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    createMutation.mutate({
      name: name.trim(),
      category: category.trim() || undefined,
      priority,
      color: color || undefined,
      icon: icon || undefined,
    });
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(isOpen: boolean) => {
        if (!isOpen) {
          resetForm();
          onClose();
        }
      }}
      snapPoints={[85]}
      dismissOnSnapToBottom
    >
      <Sheet.Overlay />
      <Sheet.Frame padding="$4">
        <Sheet.Handle />

        <ScrollView
          contentContainerStyle={{ paddingBottom: 16 }}
          showsVerticalScrollIndicator={true}
        >
          <YStack gap="$4" marginTop="$4">
            <Text
              color="$textPrimary"
              fontSize={28}
              fontWeight="700"
              fontFamily="InterBold"
            >
              New Session Type
            </Text>

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

            <YStack gap="$2">
              <Text color="$textSecondary" fontSize={13} fontWeight="600">
                Name
              </Text>
              <Input
                placeholder="e.g., Deep Work, Exercise"
                value={name}
                onChangeText={setName}
                size="$5"
                borderWidth={1}
                borderColor="$borderLight"
              />
            </YStack>

            <YStack gap="$2">
              <Text color="$textSecondary" fontSize={13} fontWeight="600">
                Category (optional)
              </Text>
              <Input
                placeholder="e.g., Work, Health"
                value={category}
                onChangeText={setCategory}
                size="$5"
                borderWidth={1}
                borderColor="$borderLight"
              />
            </YStack>

            <YStack gap="$2">
              <Text color="$textSecondary" fontSize={13} fontWeight="600">
                Priority
              </Text>
              <XStack gap="$2">
                {([1, 2, 3, 4, 5] as Priority[]).map((p) => (
                  <Button
                    key={p}
                    flex={1}
                    size="$4"
                    backgroundColor={
                      priority === p ? PRIORITY_COLORS[p] : "$buttonSecondary"
                    }
                    borderRadius={24}
                    onPress={() => setPriority(p)}
                  >
                    <Text
                      color={priority === p ? "white" : "$textSecondary"}
                      fontSize={14}
                    >
                      {p}
                    </Text>
                  </Button>
                ))}
              </XStack>
              <Text color="$textSecondary" fontSize={13} textAlign="center">
                {PRIORITY_LABELS[priority]}
              </Text>
            </YStack>

            {/* Color Picker */}
            <ColorPicker value={color} onChange={setColor} />

            {/* Icon Selector */}
            <IconSelector value={icon} onChange={setIcon} />

            <XStack gap="$3" marginTop="$2">
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
                color="white"
                borderRadius={24}
                onPress={handleCreate}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? (
                  <Spinner color="white" />
                ) : (
                  "Create"
                )}
              </Button>
            </XStack>
          </YStack>
        </ScrollView>
      </Sheet.Frame>
    </Sheet>
  );
}
