// =============================================================================
// SESSION TYPES SCREEN
// =============================================================================
// Manage session types with CRUD operations.
// =============================================================================

import { useState } from "react";
import { ScrollView, RefreshControl, Alert } from "react-native";
import {
  YStack,
  XStack,
  Text,
  H2,
  Card,
  Button,
  Input,
  Spinner,
  Sheet,
} from "tamagui";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { trpc } from "../../lib/trpc";
import { PRIORITY_LABELS, PRIORITY_COLORS, type Priority } from "../../lib/constants";

export default function TypesScreen() {
  const [showCreateSheet, setShowCreateSheet] = useState(false);

  // Fetch session types
  const typesQuery = trpc.sessionTypes.list.useQuery();

  const handleRefresh = () => {
    typesQuery.refetch();
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
      <YStack flex={1}>
        {/* Header */}
        <XStack
          padding="$4"
          justifyContent="space-between"
          alignItems="center"
        >
          <H2 color="$color12">Session Types</H2>
          <Button
            size="$3"
            circular
            backgroundColor="$brand"
            icon={<Ionicons name="add" size={20} color="white" />}
            onPress={() => setShowCreateSheet(true)}
          />
        </XStack>

        {/* Types List */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingTop: 0 }}
          refreshControl={
            <RefreshControl
              refreshing={typesQuery.isFetching}
              onRefresh={handleRefresh}
            />
          }
        >
          {typesQuery.isLoading ? (
            <YStack padding="$8" alignItems="center">
              <Spinner size="large" color="$brand" />
            </YStack>
          ) : typesQuery.data?.length === 0 ? (
            <Card padding="$6" backgroundColor="$gray2">
              <YStack alignItems="center" gap="$3">
                <Ionicons name="layers-outline" size={48} color="#6B7280" />
                <Text color="$gray10" textAlign="center">
                  No session types yet
                </Text>
                <Button
                  size="$3"
                  backgroundColor="$brand"
                  color="white"
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
    completedCount: number;
  };
}

function TypeCard({ type }: TypeCardProps) {
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

  return (
    <Card padding="$3" backgroundColor="$gray2">
      <XStack alignItems="center" gap="$3">
        {/* Color indicator */}
        <YStack
          width={8}
          height={48}
          borderRadius="$2"
          backgroundColor={type.color ?? PRIORITY_COLORS[type.priority as Priority]}
        />

        {/* Type info */}
        <YStack flex={1}>
          <Text color="$color12" fontWeight="600" fontSize="$5">
            {type.name}
          </Text>
          <XStack gap="$2" alignItems="center">
            <XStack
              paddingHorizontal="$2"
              paddingVertical="$1"
              backgroundColor={PRIORITY_COLORS[type.priority as Priority] + "20"}
              borderRadius="$2"
            >
              <Text
                fontSize="$1"
                color={PRIORITY_COLORS[type.priority as Priority]}
                fontWeight="600"
              >
                {PRIORITY_LABELS[type.priority as Priority]}
              </Text>
            </XStack>
            {type.category && (
              <Text color="$gray10" fontSize="$2">
                {type.category}
              </Text>
            )}
          </XStack>
        </YStack>

        {/* Stats & Actions */}
        <YStack alignItems="flex-end" gap="$2">
          <Text color="$gray10" fontSize="$2">
            {type.completedCount} completed
          </Text>
          <Button
            size="$2"
            chromeless
            circular
            icon={<Ionicons name="trash-outline" size={18} color="#EF4444" />}
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
  const utils = trpc.useUtils();

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [priority, setPriority] = useState<Priority>(3);
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

        <YStack gap="$4" marginTop="$4">
          <Text color="$color12" fontSize="$6" fontWeight="700">
            New Session Type
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

          <YStack gap="$2">
            <Text color="$gray11" fontSize="$2" fontWeight="600">
              Name
            </Text>
            <Input
              placeholder="e.g., Deep Work, Exercise"
              value={name}
              onChangeText={setName}
              size="$5"
              borderWidth={1}
              borderColor="$gray6"
            />
          </YStack>

          <YStack gap="$2">
            <Text color="$gray11" fontSize="$2" fontWeight="600">
              Category (optional)
            </Text>
            <Input
              placeholder="e.g., Work, Health"
              value={category}
              onChangeText={setCategory}
              size="$5"
              borderWidth={1}
              borderColor="$gray6"
            />
          </YStack>

          <YStack gap="$2">
            <Text color="$gray11" fontSize="$2" fontWeight="600">
              Priority
            </Text>
            <XStack gap="$2">
              {([1, 2, 3, 4, 5] as Priority[]).map((p) => (
                <Button
                  key={p}
                  flex={1}
                  size="$4"
                  backgroundColor={
                    priority === p ? PRIORITY_COLORS[p] : "$gray4"
                  }
                  onPress={() => setPriority(p)}
                >
                  <Text color={priority === p ? "white" : "$gray10"}>{p}</Text>
                </Button>
              ))}
            </XStack>
            <Text color="$gray10" fontSize="$2" textAlign="center">
              {PRIORITY_LABELS[priority]}
            </Text>
          </YStack>

          <XStack gap="$3" marginTop="$2">
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
              onPress={handleCreate}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? <Spinner color="white" /> : "Create"}
            </Button>
          </XStack>
        </YStack>
      </Sheet.Frame>
    </Sheet>
  );
}

