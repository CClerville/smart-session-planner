import { Card } from "tamagui";
import type { ReactNode } from "react";

interface StatsCardProps {
  children: ReactNode;
  padding?: string;
}

export function StatsCard({ children, padding = "$5" }: StatsCardProps) {
  return (
    <Card
      backgroundColor="$cardBg"
      borderRadius={20}
      padding={padding}
      shadowColor="#000"
      shadowOffset={{ width: 0, height: 2 }}
      shadowOpacity={0.05}
      shadowRadius={12}
      elevation={3}
    >
      {children}
    </Card>
  );
}

