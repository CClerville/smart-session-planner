import { View } from "react-native";
import { XStack } from "tamagui";

interface ProgressBarItem {
  typeId: string;
  count: number;
  name: string;
  color?: string | null;
  priority?: number;
}

interface ProgressBarProps {
  items: ProgressBarItem[];
  total: number;
  getColor: (type: ProgressBarItem | string) => string;
}

export function ProgressBar({ items, total, getColor }: ProgressBarProps) {
  return (
    <XStack
      height={12}
      borderRadius={6}
      overflow="hidden"
      backgroundColor="#F3F4F6"
    >
      {items.map((item) => {
        const width = (item.count / total) * 100;
        const color = getColor(item);
        return (
          <View
            key={item.typeId}
            style={{
              width: `${width}%`,
              height: "100%",
              backgroundColor: color,
            }}
          />
        );
      })}
    </XStack>
  );
}

