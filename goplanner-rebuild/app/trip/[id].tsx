import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import { tripApi, Trip } from "@/lib/api";
import { ApiError, useRequireAuth } from "@/context/AuthContext";

export default function TripDetail() {
  useRequireAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingWeather, setCheckingWeather] = useState(false);
  const [replanningKey, setReplanningKey] = useState<string | null>(null);
  const [atRiskCount, setAtRiskCount] = useState(0);

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const res = await tripApi.get(id);
      setTrip(res.data);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Could not load this trip.";
      Toast.show({ type: "error", text1: "Load failed", text2: message });
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleCheckWeather = async () => {
    if (!id) return;
    setCheckingWeather(true);
    try {
      const res = await tripApi.refreshWeather(id);
      setTrip(res.data);
      setAtRiskCount(res.atRisk?.length || 0);
      if (res.atRisk?.length) {
        Toast.show({
          type: "info",
          text1: `${res.atRisk.length} activit${res.atRisk.length === 1 ? "y" : "ies"} at risk`,
          text2: "Bad weather forecast — tap the re-plan icon on flagged activities.",
        });
      } else {
        Toast.show({ type: "success", text1: "Forecast looks good", text2: "No outdoor activities at risk." });
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Could not fetch the forecast.";
      Toast.show({ type: "error", text1: "Weather check failed", text2: message });
    } finally {
      setCheckingWeather(false);
    }
  };

  const handleReplan = async (day: number, index: number, reason: "weather" | "closed" | "other") => {
    if (!id) return;
    const key = `${day}-${index}`;
    setReplanningKey(key);
    try {
      const res = await tripApi.replanActivity(id, day, index, reason);
      setTrip(res.data);
      Toast.show({ type: "success", text1: "Activity swapped" });
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Could not find a replacement.";
      Toast.show({ type: "error", text1: "Re-plan failed", text2: message });
    } finally {
      setReplanningKey(null);
    }
  };

  const promptReplan = (day: number, index: number, weatherSensitive: boolean) => {
    Alert.alert("Re-plan this activity", "Why does it need replacing?", [
      { text: "Bad weather", onPress: () => handleReplan(day, index, "weather"), style: weatherSensitive ? "default" : undefined },
      { text: "It's closed", onPress: () => handleReplan(day, index, "closed") },
      { text: "Just want something else", onPress: () => handleReplan(day, index, "other") },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const handleExport = (format: "ics" | "pdf") => {
    if (!id) return;
    Linking.openURL(tripApi.exportUrl(id, format));
  };

  const handleDelete = () => {
    if (!id) return;
    Alert.alert("Delete trip", "This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await tripApi.remove(id);
            router.replace("/(tabs)/dashboard");
          } catch {
            Toast.show({ type: "error", text1: "Could not delete trip" });
          }
        },
      },
    ]);
  };

  if (loading || !trip) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#4A90E2" />
      </View>
    );
  }

  const budgetPct = trip.budget ? Math.min(1, trip.totalEstimatedCost / trip.budget) : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 60 }}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDelete} hitSlop={10}>
          <Ionicons name="trash-outline" size={22} color="#E25C5C" />
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>{trip.destination}</Text>
      <Text style={styles.subtitle}>
        {trip.days} day{trip.days === 1 ? "" : "s"}
        {trip.description ? ` · ${trip.description}` : ""}
      </Text>

      {trip.budget ? (
        <View style={styles.budgetCard}>
          <View style={styles.budgetRow}>
            <Text style={styles.budgetLabel}>
              ${trip.totalEstimatedCost} of ${trip.budget} {trip.currency}
            </Text>
            {trip.overBudget && <Text style={styles.overBudgetTag}>Over budget</Text>}
          </View>
          <View style={styles.budgetBarBg}>
            <View
              style={[
                styles.budgetBarFill,
                { width: `${budgetPct * 100}%`, backgroundColor: trip.overBudget ? "#E25C5C" : "#4A90E2" },
              ]}
            />
          </View>
        </View>
      ) : (
        <Text style={styles.noBudget}>Est. total: ${trip.totalEstimatedCost} {trip.currency}</Text>
      )}

      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={handleCheckWeather} disabled={checkingWeather}>
          {checkingWeather ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="rainy-outline" size={16} color="#fff" />
              <Text style={styles.actionBtnText}>Check weather</Text>
            </>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => handleExport("ics")}>
          <Ionicons name="calendar-outline" size={16} color="#fff" />
          <Text style={styles.actionBtnText}>Calendar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => handleExport("pdf")}>
          <Ionicons name="document-text-outline" size={16} color="#fff" />
          <Text style={styles.actionBtnText}>PDF</Text>
        </TouchableOpacity>
      </View>

      {trip.itinerary.map((day) => (
        <View key={day.day} style={styles.dayBlock}>
          <View style={styles.dayHeaderRow}>
            <Text style={styles.dayHeader}>Day {day.day}</Text>
            {day.weatherSummary?.condition && (
              <Text style={styles.weatherTag}>
                {day.weatherSummary.condition}
                {day.weatherSummary.tempMaxC != null ? ` · ${Math.round(day.weatherSummary.tempMaxC)}°C` : ""}
              </Text>
            )}
          </View>

          {day.activities.map((act, idx) => {
            const key = `${day.day}-${idx}`;
            const flagged = act.weatherSensitive && day.weatherSummary?.condition && atRiskCount > 0;
            return (
              <View
                key={act._id || idx}
                style={[
                  styles.activityCard,
                  act.status === "cancelled" && styles.activityCancelled,
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.activityTime}>
                    {act.start}–{act.end}
                  </Text>
                  <Text style={styles.activityName}>{act.activity}</Text>
                  {!!act.location && <Text style={styles.activityLocation}>{act.location}</Text>}
                  {!!act.reason && (
                    <Text style={styles.activityReason}>
                      <Text style={{ fontWeight: "700" }}>Why: </Text>
                      {act.reason}
                    </Text>
                  )}
                  <View style={styles.activityFooterRow}>
                    {act.estimatedCost > 0 && <Text style={styles.activityCost}>${act.estimatedCost}</Text>}
                    {act.status === "replaced" && <Text style={styles.replacedTag}>Replaced</Text>}
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => promptReplan(day.day, idx, !!act.weatherSensitive)}
                  disabled={replanningKey === key}
                  style={styles.replanBtn}
                >
                  {replanningKey === key ? (
                    <ActivityIndicator size="small" color="#4A90E2" />
                  ) : (
                    <Ionicons name="sync-outline" size={18} color={flagged ? "#E2A25C" : "#4A90E2"} />
                  )}
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D0D0D", paddingTop: 55, paddingHorizontal: 20 },
  center: { flex: 1, backgroundColor: "#0D0D0D", alignItems: "center", justifyContent: "center" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  title: { color: "white", fontSize: 26, fontWeight: "bold" },
  subtitle: { color: "#888", fontSize: 13, marginTop: 4, marginBottom: 16 },
  budgetCard: { backgroundColor: "#1a1a1a", borderRadius: 12, padding: 14, marginBottom: 16 },
  budgetRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  budgetLabel: { color: "white", fontWeight: "600" },
  overBudgetTag: { color: "#E25C5C", fontSize: 12, fontWeight: "700" },
  budgetBarBg: { height: 8, borderRadius: 4, backgroundColor: "#2a2a2a", overflow: "hidden" },
  budgetBarFill: { height: 8, borderRadius: 4 },
  noBudget: { color: "#888", fontSize: 13, marginBottom: 16 },
  actionsRow: { flexDirection: "row", gap: 10, marginBottom: 24 },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#333",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    flex: 1,
    justifyContent: "center",
  },
  actionBtnText: { color: "white", fontSize: 12, fontWeight: "600" },
  dayBlock: { marginBottom: 22 },
  dayHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  dayHeader: { color: "#4A90E2", fontSize: 17, fontWeight: "700" },
  weatherTag: { color: "#888", fontSize: 12 },
  activityCard: {
    flexDirection: "row",
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#2a2a2a",
    alignItems: "flex-start",
  },
  activityCancelled: { opacity: 0.4 },
  activityTime: { color: "#4A90E2", fontSize: 12, fontWeight: "700", marginBottom: 2 },
  activityName: { color: "white", fontSize: 15, fontWeight: "700" },
  activityLocation: { color: "#999", fontSize: 12, marginTop: 2 },
  activityReason: { color: "#aaa", fontSize: 12, marginTop: 6, fontStyle: "italic" },
  activityFooterRow: { flexDirection: "row", gap: 10, marginTop: 8 },
  activityCost: { color: "#4A90E2", fontSize: 12, fontWeight: "700" },
  replacedTag: { color: "#E2A25C", fontSize: 11, fontWeight: "700" },
  replanBtn: { padding: 6, marginLeft: 8 },
});
