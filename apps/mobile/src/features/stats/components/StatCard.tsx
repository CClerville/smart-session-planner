import { Text, YStack } from "tamagui";

interface StatCardProps {
  value: number;
  label: string;
  backgroundColor: string;
  valueColor: string;
  labelColor?: string;
}

export function StatCard({
  value,
  label,
  backgroundColor,
  valueColor,
  labelColor,
}: StatCardProps) {
  return (
    <YStack
      flex={1}
      alignItems="center"
      padding="$4"
      backgroundColor={backgroundColor}
      borderRadius={16}
    >
      <Text color={valueColor} fontSize={24} fontWeight="700">
        {value}
      </Text>
      <Text color={labelColor ?? valueColor} fontSize={12} fontWeight="500">
        {label}
      </Text>
    </YStack>
  );
}

