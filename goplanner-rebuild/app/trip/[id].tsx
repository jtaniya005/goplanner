import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import { useFocusEffect } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import { tripApi, Trip, getToken, getCurrencySymbol } from "@/lib/api";
import { ApiError, useRequireAuth } from "@/context/AuthContext";
import { colors, fonts } from "@/lib/theme";

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
    if (!id || !trip) return;
    if (!trip.startDate) {
      if (Platform.OS === "web") {
        window.alert("This trip has no start date set — weather forecast integration requires a start date.");
      } else {
        Alert.alert("No start date", "Weather forecast integration requires a start date.");
      }
      return;
    }
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
    if (Platform.OS === "web") {
      const choice = window.prompt(
        "Re-plan this activity. Why does it need replacing?\n\n" +
        "1. Bad weather\n" +
        "2. It's closed\n" +
        "3. Just want something else\n\n" +
        "Enter selection (1-3):"
      );
      if (choice === "1") handleReplan(day, index, "weather");
      else if (choice === "2") handleReplan(day, index, "closed");
      else if (choice === "3") handleReplan(day, index, "other");
    } else {
      Alert.alert("Re-plan this activity", "Why does it need replacing?", [
        { text: "Bad weather", onPress: () => handleReplan(day, index, "weather"), style: weatherSensitive ? "default" : undefined },
        { text: "It's closed", onPress: () => handleReplan(day, index, "closed") },
        { text: "Just want something else", onPress: () => handleReplan(day, index, "other") },
        { text: "Cancel", style: "cancel" },
      ]);
    }
  };

  const handleExport = async (format: "ics" | "pdf") => {
    if (!id) return;
    if (Platform.OS === "web") {
      // Get token synchronously on web to prevent browser pop-up blocker from blocking window.open
      const token = localStorage.getItem("goplanner_token");
      const url = tripApi.exportUrl(id, format, token);
      window.open(url, "_blank");
    } else {
      const token = await getToken();
      Linking.openURL(tripApi.exportUrl(id, format, token));
    }
  };

  const handleOpenMap = (location: string) => {
    const query = encodeURIComponent(location);
    const url = Platform.select({
      ios: `maps://0,0?q=${query}`,
      android: `geo:0,0?q=${query}`,
      default: `https://www.google.com/maps/search/?api=1&query=${query}`,
    });
    Linking.openURL(url);
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)/dashboard");
    }
  };

  const handleDelete = () => {
    if (!id) return;
    const performDelete = async () => {
      try {
        await tripApi.remove(id);
        router.replace("/(tabs)/dashboard");
      } catch {
        Toast.show({ type: "error", text1: "Could not delete trip" });
      }
    };

    if (Platform.OS === "web") {
      const confirm = window.confirm("Delete trip? This can't be undone.");
      if (confirm) {
        performDelete();
      }
    } else {
      Alert.alert("Delete trip", "This can't be undone.", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: performDelete,
        },
      ]);
    }
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
        <TouchableOpacity onPress={handleBack} hitSlop={10}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDelete} hitSlop={10}>
          <Ionicons name="trash-outline" size={22} color="#E25C5C" />
        </TouchableOpacity>
      </View>

      <View style={styles.titleRow}>
        <Text style={styles.title}>{trip.destination}</Text>
        <TouchableOpacity onPress={() => handleOpenMap(trip.destination)} style={styles.mapBtn} hitSlop={10}>
          <Ionicons name="map-outline" size={20} color="#4A90E2" />
        </TouchableOpacity>
      </View>
      <Text style={styles.subtitle}>
        {trip.days} day{trip.days === 1 ? "" : "s"}
        {trip.description ? ` · ${trip.description}` : ""}
      </Text>

      {trip.budget ? (
        <View style={styles.budgetCard}>
          <View style={styles.budgetRow}>
            <Text style={styles.budgetLabel}>
              {getCurrencySymbol(trip.currency)}{trip.totalEstimatedCost} of {getCurrencySymbol(trip.currency)}{trip.budget} {trip.currency}
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
        <Text style={styles.noBudget}>Est. total: {getCurrencySymbol(trip.currency)}{trip.totalEstimatedCost} {trip.currency}</Text>
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
                  {!!act.location && (
                    <TouchableOpacity
                      onPress={() => handleOpenMap(act.location)}
                      style={styles.locationRow}
                      hitSlop={5}
                    >
                      <Ionicons name="location-outline" size={13} color="#888" style={{ marginRight: 4 }} />
                      <Text style={styles.activityLocation}>{act.location}</Text>
                    </TouchableOpacity>
                  )}
                  {!!act.reason && (
                    <Text style={styles.activityReason}>
                      <Text style={{ fontWeight: "700" }}>Why: </Text>
                      {act.reason}
                    </Text>
                  )}
                  <View style={styles.activityFooterRow}>
                    {act.estimatedCost > 0 && <Text style={styles.activityCost}>{getCurrencySymbol(trip.currency)}{act.estimatedCost}</Text>}
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
  container: { flex: 1, backgroundColor: colors.bg, paddingTop: 55, paddingHorizontal: 20 },
  center: { flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  title: { color: colors.textPrimary, fontSize: 26, fontFamily: fonts.bold },
  subtitle: { color: colors.textMuted, fontSize: 13, marginTop: 4, marginBottom: 16, fontFamily: fonts.medium },
  budgetCard: { backgroundColor: colors.surface, borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: colors.border },
  budgetRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  budgetLabel: { color: colors.textPrimary, fontFamily: fonts.medium },
  overBudgetTag: { color: colors.danger, fontSize: 12, fontFamily: fonts.bold },
  budgetBarBg: { height: 8, borderRadius: 4, backgroundColor: colors.border, overflow: "hidden" },
  budgetBarFill: { height: 8, borderRadius: 4 },
  noBudget: { color: colors.textMuted, fontSize: 13, marginBottom: 16, fontFamily: fonts.medium },
  actionsRow: { flexDirection: "row", gap: 10, marginBottom: 24 },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    flex: 1,
    justifyContent: "center",
  },
  actionBtnText: { color: colors.textPrimary, fontSize: 12, fontFamily: fonts.medium },
  dayBlock: { marginBottom: 22 },
  dayHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  dayHeader: { color: colors.primary, fontSize: 17, fontFamily: fonts.bold },
  weatherTag: { color: colors.textMuted, fontSize: 12, fontFamily: fonts.medium },
  activityCard: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "flex-start",
  },
  activityCancelled: { opacity: 0.4 },
  activityTime: { color: colors.primary, fontSize: 12, fontFamily: fonts.bold, marginBottom: 2 },
  activityName: { color: colors.textPrimary, fontSize: 15, fontFamily: fonts.bold },
  activityLocation: { color: colors.textMuted, fontSize: 12 },
  activityReason: { color: colors.textMuted, fontSize: 12, marginTop: 6, fontStyle: "italic", fontFamily: fonts.medium },
  activityFooterRow: { flexDirection: "row", gap: 10, marginTop: 8 },
  activityCost: { color: colors.primary, fontSize: 12, fontFamily: fonts.bold },
  replacedTag: { color: colors.secondary, fontSize: 11, fontFamily: fonts.bold },
  replanBtn: { padding: 6, marginLeft: 8 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 2 },
  mapBtn: { padding: 4 },
  locationRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
});
