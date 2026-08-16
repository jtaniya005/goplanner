import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useRequireAuth } from "@/context/AuthContext";

export default function TabLayout() {
  useRequireAuth();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: "#000" },
        tabBarActiveTintColor: "#fff",
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
        }}
      />

      {/* Reachable via navigation but not shown in the tab bar */}
      <Tabs.Screen name="trip-planner" options={{ href: null }} />
    </Tabs>
  );
}
