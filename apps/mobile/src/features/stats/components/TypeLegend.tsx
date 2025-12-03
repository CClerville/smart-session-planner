import { Text, XStack, YStack } from "tamagui";

interface TypeLegendItem {
  typeId: string;
  name: string;
  count: number;
  color?: string | null;
  priority?: number;
}

interface TypeLegendProps {
  types: TypeLegendItem[];
  getColor: (type: TypeLegendItem | string) => string;
}

export function TypeLegend({ types, getColor }: TypeLegendProps) {
  return (
    <XStack flexWrap="wrap" gap="$3" marginTop="$2">
      {types.map((type) => (
        <XStack key={type.typeId} alignItems="center" gap="$2">
          <YStack
            width={10}
            height={10}
            borderRadius={5}
            backgroundColor={getColor(type)}
          />
          <Text color="$textSecondary" fontSize={13}>
            {type.name} · {type.count}
          </Text>
        </XStack>
      ))}
    </XStack>
  );
}

