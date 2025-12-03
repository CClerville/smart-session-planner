import { useAuth } from "@/features/auth";
import { Ionicons } from "@expo/vector-icons";
import { Link, router } from "expo-router";
import { Alert, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Card, Text, useTheme, XStack, YStack } from "tamagui";

// Menu item configuration
const MENU_ITEMS = [
  {
    href: "/availability" as const,
    icon: "time-outline" as const,
    iconBg: "#DBEAFE",
    iconColor: "#3B82F6",
    title: "Availability",
    subtitle: "Set your weekly availability",
  },
  {
    href: "/types" as const,
    icon: "stats-chart" as const,
    iconBg: "#DCFCE7",
    iconColor: "#22C55E",
    title: "Session Types",
    subtitle: "Create custom session types",
  },
  {
    href: "/suggestions" as const,
    icon: "bulb-outline" as const,
    iconBg: "#FEF3C7",
    iconColor: "#F59E0B",
    title: "Smart Suggestions",
    subtitle: "Get AI-powered scheduling tips",
  },
];

export function ProfileScreen() {
  const theme = useTheme();
  const { user, clearAuth } = useAuth();
  const handleLogout = () => {
    Alert.alert("Log Out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          await clearAuth();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: theme.pageBg.val }}
      edges={["top"]}
    >
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        {/* Header */}
        <Text
          color={"$textPrimary"}
          fontSize={28}
          fontWeight="700"
          fontFamily="InterBold"
          marginBottom="$4"
        >
          Settings
        </Text>

        {/* User Profile Card */}
        <Card
          backgroundColor={"$cardBg"}
          borderRadius={20}
          padding="$5"
          marginBottom="$4"
          shadowColor="#000"
          shadowOffset={{ width: 0, height: 2 }}
          shadowOpacity={0.05}
          shadowRadius={12}
          elevation={3}
        >
          <XStack alignItems="center" gap="$4">
            {/* Avatar */}
            <YStack
              width={64}
              height={64}
              borderRadius={32}
              backgroundColor={theme.accent.val}
              justifyContent="center"
              alignItems="center"
            >
              <Text color="#FFFFFF" fontSize={26} fontWeight="700">
                {(user?.name?.[0] ?? user?.email?.[0] ?? "U").toUpperCase()}
              </Text>
            </YStack>

            {/* User Info */}
            <YStack flex={1}>
              <Text color={"$textPrimary"} fontSize={18} fontWeight="600">
                {user?.name ?? "User"}
              </Text>
              <Text color={"$textSecondary"} fontSize={14}>
                {user?.email}
              </Text>
            </YStack>
          </XStack>
        </Card>

        {/* Menu Section */}
        <YStack gap="$3">
          <Text
            color={"$textSecondary"}
            fontSize={13}
            fontWeight="600"
            textTransform="uppercase"
            marginBottom="$1"
            marginLeft="$1"
          >
            Settings
          </Text>

          {MENU_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} asChild>
              <Card
                backgroundColor={"$cardBg"}
                borderRadius={16}
                padding="$4"
                pressStyle={{ opacity: 0.9, scale: 0.99 }}
                animation="quick"
                shadowColor="#000"
                shadowOffset={{ width: 0, height: 2 }}
                shadowOpacity={0.05}
                shadowRadius={8}
                elevation={2}
              >
                <XStack alignItems="center" gap="$3">
                  <YStack
                    width={44}
                    height={44}
                    borderRadius={12}
                    backgroundColor={item.iconBg}
                    justifyContent="center"
                    alignItems="center"
                  >
                    <Ionicons
                      name={item.icon}
                      size={22}
                      color={item.iconColor}
                    />
                  </YStack>
                  <YStack flex={1}>
                    <Text color={"$textPrimary"} fontSize={16} fontWeight="600">
                      {item.title}
                    </Text>
                    <Text color={"$textSecondary"} fontSize={13}>
                      {item.subtitle}
                    </Text>
                  </YStack>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={"$textSecondary"}
                  />
                </XStack>
              </Card>
            </Link>
          ))}
        </YStack>

        {/* Account Section */}
        <YStack marginTop="$5" gap="$3">
          <Text
            color={"$textSecondary"}
            fontSize={13}
            fontWeight="600"
            textTransform="uppercase"
            marginBottom="$1"
            marginLeft="$1"
          >
            Account
          </Text>

          <Button
            size="$4"
            backgroundColor={theme.danger.val}
            color="#FFFFFF"
            borderRadius={16}
            fontWeight="600"
            onPress={handleLogout}
            icon={<Ionicons name="log-out-outline" size={20} color="#FFFFFF" />}
          >
            Log Out
          </Button>
        </YStack>

        {/* App Version */}
        <YStack alignItems="center" marginTop="$6" marginBottom="$4">
          <Text color={"$textSecondary"} fontSize={12}>
            Smart Session Planner v1.0.0
          </Text>
        </YStack>
      </ScrollView>
    </SafeAreaView>
  );
}
