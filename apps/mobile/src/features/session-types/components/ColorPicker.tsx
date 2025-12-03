// =============================================================================
// COLOR PICKER COMPONENT
// =============================================================================
// Component for selecting colors with predefined palette and hex input.
// =============================================================================

import { DEFAULT_COLOR_PALETTE } from "@/utils/sessionTypeColors";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Pressable, TextInput } from "react-native";
import { Text, useTheme, XStack, YStack } from "tamagui";

// -----------------------------------------------------------------------------
// Props
// -----------------------------------------------------------------------------

interface ColorPickerProps {
  value: string | null | undefined;
  onChange: (color: string | null) => void;
}

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  const theme = useTheme();
  const [showHexInput, setShowHexInput] = useState(false);
  const [hexValue, setHexValue] = useState(value?.replace("#", "") || "");

  // Sync hexValue when value prop changes externally
  useEffect(() => {
    setHexValue(value?.replace("#", "") || "");
  }, [value]);

  const handlePaletteSelect = (color: string) => {
    onChange(color);
    setShowHexInput(false);
    setHexValue(color.replace("#", ""));
  };

  const handleHexChange = (text: string) => {
    // Remove any non-hex characters
    const cleaned = text.replace(/[^0-9A-Fa-f]/g, "").slice(0, 6);
    setHexValue(cleaned);

    // If we have 6 characters, update the color
    if (cleaned.length === 6) {
      const hexColor = `#${cleaned}`;
      // Validate hex color
      if (/^#[0-9A-Fa-f]{6}$/i.test(hexColor)) {
        onChange(hexColor);
      }
    }
  };

  const handleHexBlur = () => {
    if (hexValue.length === 6) {
      const hexColor = `#${hexValue}`;
      if (/^#[0-9A-Fa-f]{6}$/i.test(hexColor)) {
        onChange(hexColor);
      } else {
        // Reset to current value if invalid
        setHexValue(value?.replace("#", "") || "");
      }
    } else if (hexValue.length === 0) {
      onChange(null);
    } else {
      // Reset to current value if incomplete
      setHexValue(value?.replace("#", "") || "");
    }
  };

  return (
    <YStack gap="$3">
      {/* Predefined Palette */}
      <YStack gap="$2">
        <Text color="$textSecondary" fontSize={13} fontWeight="600">
          Color
        </Text>
        <XStack flexWrap="wrap" gap="$2">
          {DEFAULT_COLOR_PALETTE.map((color) => {
            const isSelected = value === color;
            return (
              <Pressable
                key={color}
                onPress={() => handlePaletteSelect(color)}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: color,
                  borderWidth: isSelected ? 3 : 2,
                  borderColor: isSelected ? theme.textPrimary.val : "#E5E7EB",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                {isSelected && (
                  <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                )}
              </Pressable>
            );
          })}
        </XStack>
      </YStack>

      {/* Custom Hex Input */}
      <YStack gap="$2">
        <XStack justifyContent="space-between" alignItems="center">
          <Text color="$textSecondary" fontSize={13} fontWeight="600">
            Custom Color
          </Text>
          <Pressable onPress={() => setShowHexInput(!showHexInput)}>
            <Ionicons
              name={showHexInput ? "chevron-up" : "chevron-down"}
              size={20}
              color={theme.textSecondary.val}
            />
          </Pressable>
        </XStack>

        {showHexInput && (
          <XStack gap="$2" alignItems="center">
            <YStack
              width={40}
              height={40}
              borderRadius={20}
              backgroundColor={value || "#F3F4F6"}
              borderWidth={2}
              borderColor="#E5E7EB"
            />
            <TextInput
              value={hexValue}
              onChangeText={handleHexChange}
              onBlur={handleHexBlur}
              placeholder="FFFFFF"
              placeholderTextColor={theme.textSecondary.val}
              style={{
                flex: 1,
                height: 40,
                borderWidth: 1,
                borderColor: theme.borderLight.val,
                borderRadius: 8,
                paddingHorizontal: 12,
                fontSize: 14,
                color: theme.textPrimary.val,
                backgroundColor: theme.cardBg.val,
              }}
              maxLength={6}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Pressable
              onPress={() => {
                onChange(null);
                setHexValue("");
              }}
            >
              <Ionicons
                name="close-circle"
                size={24}
                color={theme.textSecondary.val}
              />
            </Pressable>
          </XStack>
        )}
      </YStack>
    </YStack>
  );
}
