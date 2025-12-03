import { Text, YStack } from "tamagui";

interface BigStatProps {
  value: number | string;
  label: string;
}

export function BigStat({ value, label }: BigStatProps) {
  return (
    <YStack alignItems="center" flex={1}>
      <Text color="$textPrimary" fontSize={36} fontWeight="700">
        {value}
      </Text>
      <Text color="$textSecondary" fontSize={13}>
        {label}
      </Text>
    </YStack>
  );
}

