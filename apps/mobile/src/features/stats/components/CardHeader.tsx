import { Ionicons } from "@expo/vector-icons";
import { Text, XStack, useTheme } from "tamagui";

interface CardHeaderProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  iconColor?: string;
}

export function CardHeader({
  icon,
  title,
  iconColor,
}: CardHeaderProps) {
  const theme = useTheme();
  return (
    <XStack alignItems="center" gap="$2" marginBottom="$4">
      <Ionicons
        name={icon}
        size={20}
        color={iconColor ?? theme.accent.val}
      />
      <Text color="$textPrimary" fontSize={18} fontWeight="600">
        {title}
      </Text>
    </XStack>
  );
}

