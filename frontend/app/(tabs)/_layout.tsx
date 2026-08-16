import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { BlurView } from "expo-blur";
import { StyleSheet, View } from "react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { 
          position: 'absolute',
          backgroundColor: 'rgba(9, 10, 15, 0.65)',
          borderTopWidth: 0,
          elevation: 0,
          height: 60,
        },
        tabBarBackground: () => (
          <BlurView tint="dark" intensity={50} style={StyleSheet.absoluteFill} />
        ),
        tabBarActiveTintColor: "#00F2FE",
        tabBarInactiveTintColor: "#888",
        tabBarShowLabel: false,
      }}
    >
      {/* ✔ DASHBOARD TAB */}
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size, focused }) => (
            <View style={focused ? styles.activeIcon : null}>
              <Ionicons name={focused ? "home" : "home-outline"} size={26} color={color} />
            </View>
          ),
        }}
      />

      {/* ✔ PROFILE TAB */}
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size, focused }) => (
            <View style={focused ? styles.activeIcon : null}>
              <Ionicons name={focused ? "person" : "person-outline"} size={26} color={color} />
            </View>
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

const styles = StyleSheet.create({
  activeIcon: {
    backgroundColor: "rgba(0, 242, 254, 0.15)",
    padding: 8,
    borderRadius: 12,
  },
});
