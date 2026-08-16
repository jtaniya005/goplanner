import React, { useState, useCallback } from "react";
import {
  ActivityIndicator,
  Linking,
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
import { tripApi, Trip } from "@/lib/api";
import { colors, fonts } from "@/lib/theme";

export default function MapsScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTripDropdown, setShowTripDropdown] = useState(false);

  const loadTrips = useCallback(async () => {
    try {
      const res = await tripApi.list();
      setTrips(res.data);
      if (res.data.length > 0) {
        setSelectedTrip((prev) => {
          const currentId = prev?._id;
          const matched = res.data.find((t) => t._id === currentId);
          return matched || res.data[0];
        });
      } else {
        setSelectedTrip(null);
      }
    } catch {
      Toast.show({ type: "error", text1: "Error loading trips" });
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTrips();
    }, [loadTrips])
  );

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      Toast.show({ type: "error", text1: "Missing query", text2: "Please type a destination to search." });
      return;
    }
    const query = encodeURIComponent(searchQuery.trim());
    const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
    Linking.openURL(url);
  };

  const handleOpenMap = (location: string) => {
    if (!selectedTrip) return;
    const query = encodeURIComponent(`${location}, ${selectedTrip.destination}`);
    const url = `https://www.google.com/maps/search/?api=1&query=${query}`;
    Linking.openURL(url);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Maps Overview</Text>
        <Text style={styles.subtitle}>Search any location or check trip destinations</Text>

        {/* Standalone Location Search Card */}
        <View style={styles.searchCard}>
          <Text style={styles.searchTitle}>Search Location</Text>
          <Text style={styles.label}>Destination *</Text>
          <View style={styles.searchRow}>
            <TextInput
              placeholder="Search any city or attraction..."
              placeholderTextColor="#888"
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={[styles.input, styles.flex1]}
            />
            <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
              <Ionicons name="search" size={18} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Your Trips</Text>

        {trips.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="map-outline" size={48} color={colors.textFaint} />
            <Text style={styles.emptyText}>No trips found. Plan a trip to see maps.</Text>
          </View>
        ) : (
          <>
            {/* Trip Selector Trigger */}
            <TouchableOpacity
              style={styles.selectorTrigger}
              onPress={() => setShowTripDropdown(!showTripDropdown)}
            >
              <Text style={styles.selectorTriggerText}>{selectedTrip?.destination}</Text>
              <Ionicons
                name={showTripDropdown ? "chevron-up" : "chevron-down"}
                size={20}
                color={colors.textMuted}
              />
            </TouchableOpacity>

            {/* Trip Dropdown Options */}
            {showTripDropdown && (
              <View style={styles.dropdownList}>
                {trips.map((t) => (
                  <TouchableOpacity
                    key={t._id}
                    style={[styles.dropdownItem, t._id === selectedTrip?._id && styles.dropdownItemActive]}
                    onPress={() => {
                      setSelectedTrip(t);
                      setShowTripDropdown(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.dropdownItemText,
                        t._id === selectedTrip?._id && styles.dropdownItemTextActive,
                      ]}
                    >
                      {t.destination}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Grouped Locations by Day */}
            {selectedTrip && (
              <View style={styles.itineraryWrapper}>
                {selectedTrip.itinerary.map((dayData) => {
                  const locationActivities = dayData.activities.filter(
                    (act) => act.location && act.location.trim() && act.status !== "cancelled"
                  );

                  return (
                    <View key={dayData.day} style={styles.dayBlock}>
                      <Text style={styles.dayHeader}>Day {dayData.day}</Text>
                      {locationActivities.length === 0 ? (
                        <Text style={styles.noLocations}>No locations saved for this day.</Text>
                      ) : (
                        locationActivities.map((act, actIdx) => (
                          <TouchableOpacity
                            key={actIdx}
                            style={styles.locationCard}
                            onPress={() => handleOpenMap(act.location)}
                            activeOpacity={0.8}
                          >
                            <View style={styles.pinIconWrapper}>
                              <Ionicons name="location-outline" size={18} color={colors.primary} />
                            </View>
                            <View style={styles.locationDetails}>
                              <Text style={styles.activityName}>{act.activity}</Text>
                              <Text style={styles.locationText} numberOfLines={1}>
                                {act.location}
                              </Text>
                              <Text style={styles.timeTag}>{act.start} – {act.end}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                          </TouchableOpacity>
                        ))
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" },
  scrollContent: { padding: 20, paddingTop: 60, paddingBottom: 80 },
  title: { color: colors.textPrimary, fontSize: 24, fontFamily: fonts.bold },
  subtitle: { color: colors.textMuted, fontSize: 13, marginTop: 4, marginBottom: 24, fontFamily: fonts.medium },
  label: { color: colors.textPrimary, fontSize: 13, fontFamily: fonts.medium, marginBottom: 6, marginTop: 14 },
  selectorTrigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectorTriggerText: { color: colors.textPrimary, fontSize: 15, fontFamily: fonts.bold },
  dropdownList: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 4,
    overflow: "hidden",
  },
  dropdownItem: { padding: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  dropdownItemActive: { backgroundColor: "#1C1F26" },
  dropdownItemText: { color: colors.textMuted, fontSize: 14, fontFamily: fonts.medium },
  dropdownItemTextActive: { color: colors.primary, fontFamily: fonts.bold },
  itineraryWrapper: { marginTop: 24 },
  dayBlock: { marginBottom: 22 },
  dayHeader: { color: colors.primary, fontSize: 17, fontFamily: fonts.bold, marginBottom: 10 },
  noLocations: { color: colors.textFaint, fontSize: 13, fontFamily: fonts.medium, paddingLeft: 6 },
  locationCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pinIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#182C40", // primary blue tint circle
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  locationDetails: { flex: 1, paddingRight: 8 },
  activityName: { color: colors.textPrimary, fontSize: 14, fontFamily: fonts.bold },
  locationText: { color: colors.textMuted, fontSize: 12, fontFamily: fonts.medium, marginTop: 2 },
  timeTag: { color: colors.primary, fontSize: 11, fontFamily: fonts.bold, marginTop: 4 },
  empty: { alignItems: "center", marginTop: 40, gap: 10 },
  emptyText: { color: colors.textMuted, fontSize: 14, textAlign: "center", fontFamily: fonts.medium },
  searchCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
  },
  searchTitle: { color: colors.textPrimary, fontSize: 16, fontFamily: fonts.bold, marginBottom: 12 },
  searchRow: { flexDirection: "row", alignItems: "center" },
  input: {
    backgroundColor: "#182C40",
    padding: 12,
    borderRadius: 10,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    fontFamily: fonts.medium,
    fontSize: 14,
  },
  flex1: { flex: 1 },
  searchBtn: {
    backgroundColor: colors.primary,
    width: 46,
    height: 46,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  sectionTitle: { color: colors.textPrimary, fontSize: 18, fontFamily: fonts.bold, marginBottom: 12 },
});
