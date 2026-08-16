import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useRequireAuth } from "@/context/AuthContext";
import { colors } from "@/lib/theme";

export default function TabLayout() {
  useRequireAuth();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textFaint,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
        }}
      />

      <Tabs.Screen
        name="tools"
        options={{
          title: "Tools",
          tabBarIcon: ({ color, size }) => <Ionicons name="construct-outline" size={size} color={color} />,
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
        }}
      />

      <Tabs.Screen name="manual-trip" options={{ href: null }} />
      <Tabs.Screen name="day-planner" options={{ href: null }} />
      <Tabs.Screen name="itinerary-editor" options={{ href: null }} />
      <Tabs.Screen name="maps" options={{ href: null }} />
      <Tabs.Screen name="weather" options={{ href: null }} />
      <Tabs.Screen name="trip-planner" options={{ href: null }} />
    </Tabs>
  );
}
