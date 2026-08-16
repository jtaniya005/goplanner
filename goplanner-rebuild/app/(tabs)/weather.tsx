import React, { useState, useCallback } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { tripApi, weatherApi, Trip } from "@/lib/api";
import { colors, fonts } from "@/lib/theme";

interface ForecastDay {
  day: number;
  date: string;
  available: boolean;
  condition?: string;
  tempMaxC?: number;
  tempMinC?: number;
  precipitationProbability?: number;
  isBadWeather?: boolean;
}

export default function WeatherScreen() {
  // Standalone lookup state
  const [destination, setDestination] = useState("");
  const [days, setDays] = useState("3");
  const [startDate, setStartDate] = useState("");
  const [searching, setSearching] = useState(false);
  const [forecast, setForecast] = useState<ForecastDay[]>([]);
  const [resolvedPlace, setResolvedPlace] = useState<{ resolvedName: string } | null>(null);

  // Trips list state
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loadingTrips, setLoadingTrips] = useState(true);
  const [refreshingTripId, setRefreshingTripId] = useState<string | null>(null);

  const loadTrips = useCallback(async () => {
    try {
      const res = await tripApi.list();
      setTrips(res.data);
    } catch {
      Toast.show({ type: "error", text1: "Error loading trips" });
    } finally {
      setLoadingTrips(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTrips();
    }, [loadTrips])
  );

  const handleLookup = async () => {
    if (!destination.trim()) {
      Toast.show({ type: "error", text1: "Missing info", text2: "Destination is required." });
      return;
    }
    const numDays = parseInt(days);
    if (isNaN(numDays) || numDays < 1 || numDays > 16) {
      Toast.show({ type: "error", text1: "Invalid days", text2: "Days must be between 1 and 16." });
      return;
    }

    setSearching(true);
    try {
      const res = await weatherApi.lookup(destination.trim(), numDays, startDate.trim() || undefined);
      setForecast(res.data);
      setResolvedPlace(res.place);
      Toast.show({ type: "success", text1: "Forecast loaded" });
    } catch (err) {
      Toast.show({ type: "error", text1: "Lookup failed", text2: "Could not find weather data." });
    } finally {
      setSearching(false);
    }
  };

  const handleRefreshTripWeather = async (trip: Trip) => {
    if (!trip.startDate) {
      if (Platform.OS === "web") {
        window.alert("This trip has no start date set. Weather forecast integration requires a start date.");
      } else {
        alert("Weather forecast integration requires a start date.");
      }
      return;
    }

    setRefreshingTripId(trip._id);
    try {
      const res = await tripApi.refreshWeather(trip._id);
      // Reload trips to update the list's weather cache
      await loadTrips();
      if (res.atRisk && res.atRisk.length > 0) {
        Toast.show({
          type: "info",
          text1: `${res.atRisk.length} activities at risk`,
          text2: "Bad weather forecast — tap the re-plan icon on flagged activities in trip details.",
        });
      } else {
        Toast.show({ type: "success", text1: "Weather updated successfully" });
      }
    } catch (err) {
      Toast.show({ type: "error", text1: "Weather update failed" });
    } finally {
      setRefreshingTripId(null);
    }
  };

  const getWeatherIconName = (condition?: string): keyof typeof Ionicons.glyphMap => {
    if (!condition) return "help-circle-outline";
    const cond = condition.toLowerCase();
    if (cond.includes("clear") || cond.includes("sunny")) return "sunny-outline";
    if (cond.includes("cloud") || cond.includes("overcast")) return "cloudy-outline";
    if (cond.includes("rain") || cond.includes("drizzle") || cond.includes("shower")) return "rainy-outline";
    if (cond.includes("snow") || cond.includes("ice") || cond.includes("rime")) return "snow-outline";
    if (cond.includes("thunder") || cond.includes("storm")) return "thunderstorm-outline";
    return "cloud-outline";
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Weather Center</Text>
        <Text style={styles.subtitle}>Lookup standalone forecasts or refresh saved trips</Text>

        {/* Standalone Lookup form */}
        <View style={styles.lookupCard}>
          <Text style={styles.lookupTitle}>Search Forecast</Text>
          <Text style={styles.label}>Destination *</Text>
          <TextInput
            placeholder="e.g. Udaipur, India"
            placeholderTextColor="#888"
            value={destination}
            onChangeText={setDestination}
            style={styles.input}
          />

          <View style={styles.row}>
            <View style={styles.flex1}>
              <Text style={styles.label}>Days (1–16) *</Text>
              <TextInput
                placeholder="7"
                placeholderTextColor="#888"
                keyboardType="number-pad"
                value={days}
                onChangeText={setDays}
                style={styles.input}
              />
            </View>
            <View style={[styles.flex1, { marginLeft: 12 }]}>
              <Text style={styles.label}>Start Date (optional)</Text>
              <TextInput
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#888"
                value={startDate}
                onChangeText={setStartDate}
                style={styles.input}
              />
            </View>
          </View>

          <TouchableOpacity style={styles.searchBtn} onPress={handleLookup} disabled={searching}>
            {searching ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="search" size={16} color="white" />
                <Text style={styles.searchBtnText}>Check Weather</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Standalone results horizontal slider */}
        {resolvedPlace && (
          <View style={styles.resultsWrapper}>
            <Text style={styles.resolvedName}>{resolvedPlace.resolvedName}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.forecastScroll}>
              {forecast.map((f) => (
                <View key={f.day} style={[styles.forecastCard, f.isBadWeather && styles.forecastCardBad]}>
                  <Text style={styles.forecastDay}>Day {f.day}</Text>
                  <Text style={styles.forecastDate}>
                    {f.date ? new Date(f.date).toLocaleDateString(undefined, { day: "numeric", month: "short" }) : `Day ${f.day}`}
                  </Text>
                  <View style={styles.iconContainer}>
                    <Ionicons
                      name={getWeatherIconName(f.condition)}
                      size={28}
                      color={f.isBadWeather ? colors.danger : colors.secondary}
                    />
                  </View>
                  <Text style={styles.forecastCondition} numberOfLines={1}>
                    {f.available ? f.condition : "Unavailable"}
                  </Text>
                  {f.available && (
                    <>
                      <Text style={styles.forecastTemps}>
                        {Math.round(f.tempMaxC || 0)}° / {Math.round(f.tempMinC || 0)}°
                      </Text>
                      {f.precipitationProbability !== null && (
                        <Text style={styles.precipText}>
                          💧 {f.precipitationProbability}%
                        </Text>
                      )}
                    </>
                  )}
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Saved Trips Weather List */}
        <Text style={styles.sectionTitle}>Saved Trips Forecasts</Text>
        {loadingTrips ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 10 }} />
        ) : trips.length === 0 ? (
          <View style={styles.emptyTrips}>
            <Text style={styles.emptyTripsText}>No planned trips to refresh.</Text>
          </View>
        ) : (
          trips.map((t) => (
            <View key={t._id} style={styles.tripWeatherCard}>
              <View style={styles.tripInfo}>
                <Text style={styles.tripDest} numberOfLines={1}>{t.destination}</Text>
                <Text style={styles.tripMeta}>
                  {t.days} days{t.startDate ? ` · starts ${new Date(t.startDate).toLocaleDateString()}` : " · no start date"}
                </Text>
                {t.itinerary[0]?.weatherSummary?.condition ? (
                  <View style={styles.weatherSummaryRow}>
                    <Ionicons name="cloud-outline" size={13} color={colors.primary} />
                    <Text style={styles.summaryText}>
                      Cached: {t.itinerary[0].weatherSummary.condition} ({Math.round(t.itinerary[0].weatherSummary.tempMaxC || 0)}°C)
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.noWeatherCache}>No cached weather forecast.</Text>
                )}
              </View>

              <TouchableOpacity
                style={styles.refreshBtn}
                onPress={() => handleRefreshTripWeather(t)}
                disabled={refreshingTripId === t._id}
              >
                {refreshingTripId === t._id ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Ionicons name="refresh-outline" size={18} color={colors.primary} />
                )}
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scrollContent: { padding: 20, paddingTop: 60, paddingBottom: 80 },
  title: { color: colors.textPrimary, fontSize: 24, fontFamily: fonts.bold },
  subtitle: { color: colors.textMuted, fontSize: 13, marginTop: 4, marginBottom: 24, fontFamily: fonts.medium },
  lookupCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
  },
  lookupTitle: { color: colors.textPrimary, fontSize: 16, fontFamily: fonts.bold, marginBottom: 12 },
  label: { color: colors.textPrimary, fontSize: 13, fontFamily: fonts.medium, marginBottom: 6, marginTop: 10 },
  input: {
    backgroundColor: "#182C40", // dark tinted form input
    padding: 12,
    borderRadius: 10,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    fontFamily: fonts.medium,
    fontSize: 14,
  },
  row: { flexDirection: "row", alignItems: "center" },
  flex1: { flex: 1 },
  searchBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 10,
    marginTop: 16,
    gap: 6,
  },
  searchBtnText: { color: "white", fontFamily: fonts.bold, fontSize: 14 },
  resultsWrapper: { marginBottom: 28 },
  resolvedName: { color: colors.primary, fontSize: 14, fontFamily: fonts.bold, marginBottom: 10 },
  forecastScroll: { flexDirection: "row" },
  forecastCard: {
    width: 100,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    marginRight: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  forecastCardBad: { borderColor: colors.danger, backgroundColor: "#2A1A1D" },
  forecastDay: { color: colors.textMuted, fontSize: 11, fontFamily: fonts.medium },
  forecastDate: { color: colors.textPrimary, fontSize: 12, fontFamily: fonts.bold, marginVertical: 2 },
  iconContainer: { marginVertical: 8 },
  forecastCondition: { color: colors.textMuted, fontSize: 11, fontFamily: fonts.medium },
  forecastTemps: { color: colors.textPrimary, fontSize: 12, fontFamily: fonts.bold, marginTop: 4 },
  precipText: { color: "#5CB88A", fontSize: 11, fontFamily: fonts.bold, marginTop: 2 },
  sectionTitle: { color: colors.textPrimary, fontSize: 18, fontFamily: fonts.bold, marginBottom: 12 },
  emptyTrips: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
  },
  emptyTripsText: { color: colors.textMuted, fontSize: 13, fontFamily: fonts.medium },
  tripWeatherCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tripInfo: { flex: 1, paddingRight: 8 },
  tripDest: { color: colors.textPrimary, fontSize: 15, fontFamily: fonts.bold },
  tripMeta: { color: colors.textMuted, fontSize: 12, fontFamily: fonts.medium, marginTop: 2 },
  weatherSummaryRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 },
  summaryText: { color: colors.textMuted, fontSize: 12, fontFamily: fonts.medium },
  noWeatherCache: { color: colors.textFaint, fontSize: 11, fontFamily: fonts.medium, marginTop: 6 },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#182C40", // subtle primary blue tint bg
    justifyContent: "center",
    alignItems: "center",
  },
});
