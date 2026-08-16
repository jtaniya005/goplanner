import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAuth } from "@/context/AuthContext";

export default function Profile() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert("Log out", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log out",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/login");
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.avatar}>
        <Ionicons name="person" size={40} color="#4A90E2" />
      </View>
      <Text style={styles.name}>{user?.name || "Traveler"}</Text>
      <Text style={styles.email}>{user?.email}</Text>

      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Home currency</Text>
          <Text style={styles.rowValue}>{user?.homeCurrency || "USD"}</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={18} color="#E25C5C" />
        <Text style={styles.logoutText}>Log out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D0D0D", alignItems: "center", paddingTop: 80, paddingHorizontal: 24 },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#333",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  name: { color: "white", fontSize: 20, fontWeight: "700" },
  email: { color: "#888", fontSize: 13, marginTop: 4, marginBottom: 24 },
  card: {
    width: "100%",
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    padding: 16,
    marginBottom: 30,
  },
  row: { flexDirection: "row", justifyContent: "space-between" },
  rowLabel: { color: "#999", fontSize: 14 },
  rowValue: { color: "white", fontSize: 14, fontWeight: "600" },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#E25C5C",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  logoutText: { color: "#E25C5C", fontWeight: "700" },
});
