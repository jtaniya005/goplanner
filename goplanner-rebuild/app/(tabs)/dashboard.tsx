import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { tripApi, Trip, getCurrencySymbol } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { colors, fonts } from "@/lib/theme";
import TripTicketCard from "@/components/TripTicketCard";

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

  const tripCount = trips.length;
  const symbol = getCurrencySymbol(user?.homeCurrency || "INR");
  const totalCost = trips.reduce((sum, t) => sum + (t.totalEstimatedCost || 0), 0);
  const statsEyebrow = `${tripCount} TRIP${tripCount === 1 ? "" : "S"} · ${symbol}${totalCost.toLocaleString()} PLANNED`;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Hi{user?.name ? `, ${user.name.split(" ")[0]}` : ""} 👋</Text>
        <Text style={styles.eyebrow}>{statsEyebrow.toUpperCase()}</Text>
      </View>

      {/* Horizontal Shortcuts Row */}
      <View style={{ height: 85, marginBottom: 28, marginTop: 8 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.shortcutsContent}
        >
          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.shortcutTile}
            onPress={() => router.push("/(tabs)/manual-trip")}
          >
            <View style={[styles.iconBadge, { backgroundColor: "rgba(74, 144, 226, 0.15)" }]}>
              <Ionicons name="create-outline" size={16} color="#4A90E2" />
            </View>
            <Text style={styles.shortcutLabel} numberOfLines={1}>Manual</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.shortcutTile}
            onPress={() => router.push("/(tabs)/day-planner")}
          >
            <View style={[styles.iconBadge, { backgroundColor: "rgba(92, 184, 138, 0.15)" }]}>
              <Ionicons name="calendar-outline" size={16} color="#5CB88A" />
            </View>
            <Text style={styles.shortcutLabel} numberOfLines={1}>Planner</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.shortcutTile}
            onPress={() => router.push("/(tabs)/itinerary-editor")}
          >
            <View style={[styles.iconBadge, { backgroundColor: "rgba(226, 162, 76, 0.15)" }]}>
              <Ionicons name="pencil-outline" size={16} color="#E2A24C" />
            </View>
            <Text style={styles.shortcutLabel} numberOfLines={1}>Itinerary</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.shortcutTile}
            onPress={() => router.push("/(tabs)/maps")}
          >
            <View style={[styles.iconBadge, { backgroundColor: "rgba(76, 201, 217, 0.15)" }]}>
              <Ionicons name="map-outline" size={16} color="#4CC9D9" />
            </View>
            <Text style={styles.shortcutLabel} numberOfLines={1}>Maps</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            style={styles.shortcutTile}
            onPress={() => router.push("/(tabs)/weather")}
          >
            <View style={[styles.iconBadge, { backgroundColor: "rgba(142, 36, 170, 0.15)" }]}>
              <Ionicons name="rainy-outline" size={16} color="#8E24AA" />
            </View>
            <Text style={styles.shortcutLabel} numberOfLines={1}>Weather</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      <TouchableOpacity style={styles.newTripBtn} onPress={() => router.push("/(tabs)/trip-planner")}>
        <View style={styles.addBadge}>
          <Ionicons name="add" size={16} color={colors.primary} />
        </View>
        <Text style={styles.newTripText}>Plan a new trip</Text>
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : trips.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="airplane-outline" size={48} color={colors.textFaint} />
          <Text style={styles.emptyText}>No trips yet — plan your first one above.</Text>
        </View>
      ) : (
        <FlatList
          data={trips}
          keyExtractor={(t) => t._id}
          contentContainerStyle={{ paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          renderItem={({ item }) => (
            <TripTicketCard
              item={item}
              onPress={() => router.push(`/trip/${item._id}`)}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingTop: 60, paddingHorizontal: 20 },
  header: { marginBottom: 20 },
  title: { color: colors.textPrimary, fontSize: 26, fontFamily: fonts.bold },
  eyebrow: { color: colors.textMuted, fontSize: 11, fontFamily: fonts.medium, letterSpacing: 1.5, marginTop: 4 },
  newTripBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: colors.primaryMuted,
    borderStyle: "dashed",
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 24,
    gap: 8,
  },
  addBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#182C40", // subtle primary blue tint background
    justifyContent: "center",
    alignItems: "center",
  },
  newTripText: { color: colors.primary, fontSize: 16, fontFamily: fonts.bold },
  empty: { alignItems: "center", marginTop: 60, gap: 10 },
  emptyText: { color: colors.textMuted, fontSize: 14, textAlign: "center", paddingHorizontal: 30, fontFamily: fonts.medium },
  shortcutsContent: {
    paddingRight: 10,
    gap: 12,
    flexDirection: "row",
  },
  shortcutTile: {
    width: 76,
    height: 76,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    padding: 8,
  },
  iconBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  shortcutLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontFamily: fonts.medium,
    textAlign: "center",
  },
});
