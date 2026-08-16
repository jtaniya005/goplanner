import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { tripApi, Trip } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await tripApi.list();
      setTrips(res.data);
    } catch {
      // dashboard stays empty on error; trip-planner screen surfaces create errors
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Hi{user?.name ? `, ${user.name.split(" ")[0]}` : ""} 👋</Text>
        <Text style={styles.subtitle}>Your trips</Text>
      </View>

      <TouchableOpacity style={styles.newTripBtn} onPress={() => router.push("/(tabs)/trip-planner")}>
        <Ionicons name="add-circle" size={22} color="#fff" />
        <Text style={styles.newTripText}>Plan a new trip</Text>
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator color="#4A90E2" style={{ marginTop: 40 }} />
      ) : trips.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="airplane-outline" size={48} color="#333" />
          <Text style={styles.emptyText}>No trips yet — plan your first one above.</Text>
        </View>
      ) : (
        <FlatList
          data={trips}
          keyExtractor={(t) => t._id}
          contentContainerStyle={{ paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4A90E2" />}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} onPress={() => router.push(`/trip/${item._id}`)}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{item.destination}</Text>
                <Text style={styles.cardMeta}>
                  {item.days} day{item.days === 1 ? "" : "s"}
                  {item.budget ? ` · Budget $${item.budget}` : ""}
                </Text>
                <Text style={[styles.cardCost, item.overBudget && styles.overBudget]}>
                  Est. ${item.totalEstimatedCost}
                  {item.overBudget ? " — over budget" : ""}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#666" />
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D0D0D", paddingTop: 60, paddingHorizontal: 20 },
  header: { marginBottom: 16 },
  title: { color: "white", fontSize: 26, fontWeight: "bold" },
  subtitle: { color: "#888", fontSize: 14, marginTop: 2 },
  newTripBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4A90E2",
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 20,
    gap: 8,
  },
  newTripText: { color: "white", fontWeight: "700", fontSize: 16 },
  empty: { alignItems: "center", marginTop: 60, gap: 10 },
  emptyText: { color: "#666", fontSize: 14, textAlign: "center", paddingHorizontal: 30 },
  card: {
    backgroundColor: "#1a1a1a",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    flexDirection: "row",
    alignItems: "center",
  },
  cardTitle: { color: "white", fontSize: 17, fontWeight: "700" },
  cardMeta: { color: "#888", fontSize: 13, marginTop: 4 },
  cardCost: { color: "#4A90E2", fontSize: 13, marginTop: 6, fontWeight: "600" },
  overBudget: { color: "#E25C5C" },
});
