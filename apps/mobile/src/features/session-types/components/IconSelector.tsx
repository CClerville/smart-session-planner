// =============================================================================
// ICON SELECTOR COMPONENT
// =============================================================================
// Component for selecting Ionicons icons from a grid.
// =============================================================================

import { DEFAULT_ICONS, type IconName } from "@/utils/sessionTypeIcons";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, ScrollView, TextInput } from "react-native";
import { Text, useTheme, XStack, YStack } from "tamagui";

// -----------------------------------------------------------------------------
// Props
// -----------------------------------------------------------------------------

interface IconSelectorProps {
  value: string | null | undefined;
  onChange: (icon: string | null) => void;
}

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export function IconSelector({ value, onChange }: IconSelectorProps) {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState("");

  // Filter icons based on search query
  const filteredIcons = DEFAULT_ICONS.filter((icon) =>
    icon.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleIconSelect = (icon: IconName) => {
    onChange(icon);
  };

  const handleClear = () => {
    onChange(null);
    setSearchQuery("");
  };

  return (
    <YStack gap="$3">
      {/* Header */}
      <XStack justifyContent="space-between" alignItems="center">
        <Text color="$textSecondary" fontSize={13} fontWeight="600">
          Icon
        </Text>
        {value && (
          <Pressable onPress={handleClear}>
            <Ionicons
              name="close-circle"
              size={20}
              color={theme.textSecondary.val}
            />
          </Pressable>
        )}
      </XStack>

      {/* Search Input */}
      <XStack
        alignItems="center"
        gap="$2"
        paddingHorizontal="$3"
        paddingVertical="$2"
        backgroundColor="$cardBg"
        borderRadius={12}
        borderWidth={1}
        borderColor="$borderLight"
      >
        <Ionicons name="search" size={18} color={theme.textSecondary.val} />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search icons..."
          placeholderTextColor={theme.textSecondary.val}
          style={{
            flex: 1,
            fontSize: 14,
            color: theme.textPrimary.val,
          }}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery("")}>
            <Ionicons
              name="close-circle"
              size={18}
              color={theme.textSecondary.val}
            />
          </Pressable>
        )}
      </XStack>

      {/* Icon Grid */}
      <ScrollView
        style={{ maxHeight: 200 }}
        showsVerticalScrollIndicator={false}
      >
        <XStack flexWrap="wrap" gap="$2">
          {filteredIcons.length > 0 ? (
            filteredIcons.map((icon) => {
              const isSelected = value === icon;
              return (
                <Pressable
                  key={icon}
                  onPress={() => handleIconSelect(icon)}
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    backgroundColor: isSelected
                      ? theme.buttonPrimary.val
                      : theme.cardBg.val,
                    borderWidth: isSelected ? 2 : 1,
                    borderColor: isSelected
                      ? theme.buttonPrimary.val
                      : theme.borderLight.val,
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Ionicons
                    name={icon}
                    size={24}
                    color={
                      isSelected
                        ? "#FFFFFF"
                        : theme.textPrimary.val
                    }
                  />
                </Pressable>
              );
            })
          ) : (
            <YStack
              padding="$4"
              alignItems="center"
              width="100%"
            >
              <Text color="$textSecondary" fontSize={14}>
                No icons found
              </Text>
            </YStack>
          )}
        </XStack>
      </ScrollView>

      {/* Selected Icon Preview */}
      {value && (
        <XStack
          alignItems="center"
          gap="$2"
          padding="$3"
          backgroundColor="$cardBg"
          borderRadius={12}
          borderWidth={1}
          borderColor="$borderLight"
        >
          <Text color="$textSecondary" fontSize={13}>
            Selected:
          </Text>
          <XStack
            width={32}
            height={32}
            borderRadius={8}
            backgroundColor={theme.buttonPrimary.val}
            justifyContent="center"
            alignItems="center"
          >
            <Ionicons name={value as IconName} size={20} color="#FFFFFF" />
          </XStack>
          <Text color="$textPrimary" fontSize={13} fontWeight="500">
            {value}
          </Text>
        </XStack>
      )}
    </YStack>
  );
}

