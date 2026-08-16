import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: "#000" },
        tabBarActiveTintColor: "#fff",
      }}
    >
      {/* ✔ DASHBOARD TAB */}
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />

      {/* ✔ PROFILE TAB */}
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />

      {/* ❌ HIDDEN ROUTES (NOT IN TAB BAR) */}
      <Tabs.Screen name="maps" options={{ href: null }} />
      <Tabs.Screen name="weather" options={{ href: null }} />
      <Tabs.Screen name="day-planner" options={{ href: null }} />
      <Tabs.Screen name="trip-planner" options={{ href: null }} />
      <Tabs.Screen name="manual-trip" options={{ href: null }} />
    </Tabs>
  );
}
