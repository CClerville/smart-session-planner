import { Ionicons } from "@expo/vector-icons";
import { Text, XStack, YStack } from "tamagui";

interface MetricRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconBgColor: string;
  iconColor: string;
  title: string;
  description: string;
  value: number | string;
}

export function MetricRow({
  icon,
  iconBgColor,
  iconColor,
  title,
  description,
  value,
}: MetricRowProps) {
  return (
    <XStack justifyContent="space-between" alignItems="center">
      <XStack alignItems="center" gap="$3">
        <YStack
          width={44}
          height={44}
          borderRadius={22}
          backgroundColor={iconBgColor}
          justifyContent="center"
          alignItems="center"
        >
          <Ionicons name={icon} size={22} color={iconColor} />
        </YStack>
        <YStack>
          <Text color="$textPrimary" fontSize={15} fontWeight="600">
            {title}
          </Text>
          <Text color="$textSecondary" fontSize={13}>
            {description}
          </Text>
        </YStack>
      </XStack>
      <Text color="$textPrimary" fontSize={24} fontWeight="700">
        {value}
      </Text>
    </XStack>
  );
}

