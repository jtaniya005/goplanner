import React, { useState, useCallback } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
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
import { tripApi, Trip, getCurrencySymbol } from "@/lib/api";
import { colors, fonts, destinationGradient } from "@/lib/theme";
import { LinearGradient } from "expo-linear-gradient";

interface EditableActivity {
  start: string;
  end: string;
  activity: string;
  location: string;
  estimatedCost: string;
  weatherSensitive: boolean;
}

export default function ItineraryEditorScreen() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Selector state
  const [showTripDropdown, setShowTripDropdown] = useState(false);

  // Edit states
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<EditableActivity>({
    start: "",
    end: "",
    activity: "",
    location: "",
    estimatedCost: "",
    weatherSensitive: false,
  });

  // Add states
  const [isAdding, setIsAdding] = useState(false);
  const [addForm, setAddForm] = useState<EditableActivity>({
    start: "09:00",
    end: "10:00",
    activity: "",
    location: "",
    estimatedCost: "",
    weatherSensitive: false,
  });

  const loadTrips = useCallback(async () => {
    try {
      const res = await tripApi.list();
      setTrips(res.data);
      if (res.data.length > 0) {
        setSelectedTrip((prev) => {
          const currentId = prev?._id;
          const matched = res.data.find((t) => t._id === currentId);
          if (matched) {
            return matched;
          } else {
            setSelectedDay(1);
            return res.data[0];
          }
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

  const handleTripSelect = (trip: Trip) => {
    setSelectedTrip(trip);
    setSelectedDay(1);
    setShowTripDropdown(false);
    setEditingIndex(null);
    setIsAdding(false);
  };

  const currentDayData = selectedTrip?.itinerary.find((d) => d.day === selectedDay);
  const activities = currentDayData?.activities || [];

  // Start editing an activity
  const startEditing = (idx: number, act: any) => {
    setEditingIndex(idx);
    setIsAdding(false);
    setEditForm({
      start: act.start,
      end: act.end,
      activity: act.activity,
      location: act.location || "",
      estimatedCost: String(act.estimatedCost || ""),
      weatherSensitive: !!act.weatherSensitive,
    });
  };

  const handleSaveEdit = async (idx: number) => {
    if (!selectedTrip || !id) return;
    if (!editForm.activity.trim() || !editForm.start.trim() || !editForm.end.trim()) {
      Toast.show({ type: "error", text1: "Required fields", text2: "Time and activity name are required." });
      return;
    }

    setActionLoading(true);
    try {
      const res = await tripApi.editActivity(selectedTrip._id, selectedDay, idx, {
        start: editForm.start.trim(),
        end: editForm.end.trim(),
        activity: editForm.activity.trim(),
        location: editForm.location.trim(),
        estimatedCost: Number(editForm.estimatedCost) || 0,
        weatherSensitive: editForm.weatherSensitive,
      });
      setSelectedTrip(res.data);
      setEditingIndex(null);
      Toast.show({ type: "success", text1: "Activity updated" });
    } catch {
      Toast.show({ type: "error", text1: "Update failed" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteAct = async (idx: number) => {
    if (!selectedTrip) return;
    const confirm = Platform.OS === "web"
      ? window.confirm("Remove this activity?")
      : true; // native prompt handled inside or bypass

    if (!confirm) return;

    setActionLoading(true);
    try {
      const res = await tripApi.deleteActivity(selectedTrip._id, selectedDay, idx);
      setSelectedTrip(res.data);
      Toast.show({ type: "success", text1: "Activity removed" });
    } catch {
      Toast.show({ type: "error", text1: "Removal failed" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddActivity = async () => {
    if (!selectedTrip) return;
    if (!addForm.activity.trim() || !addForm.start.trim() || !addForm.end.trim()) {
      Toast.show({ type: "error", text1: "Required fields", text2: "Time and activity name are required." });
      return;
    }

    setActionLoading(true);
    try {
      const res = await tripApi.addActivity(selectedTrip._id, selectedDay, {
        start: addForm.start.trim(),
        end: addForm.end.trim(),
        activity: addForm.activity.trim(),
        location: addForm.location.trim(),
        estimatedCost: Number(addForm.estimatedCost) || 0,
        weatherSensitive: addForm.weatherSensitive,
      });
      setSelectedTrip(res.data);
      setIsAdding(false);
      setAddForm({
        start: "09:00",
        end: "10:00",
        activity: "",
        location: "",
        estimatedCost: "",
        weatherSensitive: false,
      });
      Toast.show({ type: "success", text1: "Activity added" });
    } catch {
      Toast.show({ type: "error", text1: "Addition failed" });
    } finally {
      setActionLoading(false);
    }
  };

  const symbol = selectedTrip ? getCurrencySymbol(selectedTrip.currency) : "$";
  const id = selectedTrip?._id;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Itinerary Editor</Text>
        <Text style={styles.subtitle}>Directly edit and manage your trip schedules</Text>

        {trips.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="calendar-outline" size={48} color={colors.textFaint} />
            <Text style={styles.emptyText}>No trips found. Plan a trip first to edit its days.</Text>
          </View>
        ) : (
          <>
            {/* Trip Selector Trigger */}
            <Text style={styles.label}>Select Trip</Text>
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
                    style={[styles.dropdownItem, t._id === id && styles.dropdownItemActive]}
                    onPress={() => handleTripSelect(t)}
                  >
                    <Text style={[styles.dropdownItemText, t._id === id && styles.dropdownItemTextActive]}>
                      {t.destination} ({t.days} days)
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Day Selector Tabs */}
            {selectedTrip && (
              <View style={styles.daySelectorWrapper}>
                <Text style={styles.label}>Select Day</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.daysScroll}>
                  {Array.from({ length: selectedTrip.days }).map((_, i) => {
                    const dayNum = i + 1;
                    const isActive = dayNum === selectedDay;
                    return (
                      <TouchableOpacity
                        key={dayNum}
                        style={[styles.dayTab, isActive && styles.dayTabActive]}
                        onPress={() => {
                          setSelectedDay(dayNum);
                          setEditingIndex(null);
                          setIsAdding(false);
                        }}
                      >
                        <Text style={[styles.dayTabText, isActive && styles.dayTabTextActive]}>
                          Day {dayNum}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* Activity List & Forms */}
            <View style={styles.activitiesHeaderRow}>
              <Text style={styles.sectionTitle}>Activities</Text>
              {!isAdding && editingIndex === null && (
                <TouchableOpacity style={styles.addShortcutBtn} onPress={() => setIsAdding(true)}>
                  <Ionicons name="add-circle" size={18} color={colors.primary} />
                  <Text style={styles.addShortcutText}>Add New</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Add activity form box */}
            {isAdding && (
              <View style={styles.formCard}>
                <Text style={styles.formCardTitle}>Add Activity</Text>
                <View style={styles.row}>
                  <TextInput
                    placeholder="09:00"
                    placeholderTextColor="#666"
                    value={addForm.start}
                    onChangeText={(val) => setAddForm({ ...addForm, start: val })}
                    style={[styles.input, styles.timeInput]}
                  />
                  <Text style={styles.dash}>–</Text>
                  <TextInput
                    placeholder="10:00"
                    placeholderTextColor="#666"
                    value={addForm.end}
                    onChangeText={(val) => setAddForm({ ...addForm, end: val })}
                    style={[styles.input, styles.timeInput]}
                  />
                </View>
                <TextInput
                  placeholder="Activity Name *"
                  placeholderTextColor="#666"
                  value={addForm.activity}
                  onChangeText={(val) => setAddForm({ ...addForm, activity: val })}
                  style={[styles.input, styles.marginV]}
                />
                <View style={styles.row}>
                  <TextInput
                    placeholder="Location"
                    placeholderTextColor="#666"
                    value={addForm.location}
                    onChangeText={(val) => setAddForm({ ...addForm, location: val })}
                    style={[styles.input, styles.flex1]}
                  />
                  <TextInput
                    placeholder={`Cost (${symbol})`}
                    placeholderTextColor="#666"
                    keyboardType="number-pad"
                    value={addForm.estimatedCost}
                    onChangeText={(val) => setAddForm({ ...addForm, estimatedCost: val })}
                    style={[styles.input, styles.costInput]}
                  />
                </View>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setAddForm({ ...addForm, weatherSensitive: !addForm.weatherSensitive })}
                  style={styles.checkboxRow}
                >
                  <Ionicons
                    name={addForm.weatherSensitive ? "checkbox" : "square-outline"}
                    size={18}
                    color={addForm.weatherSensitive ? colors.primary : colors.textMuted}
                  />
                  <Text style={styles.checkboxText}>Outdoor/weather-sensitive</Text>
                </TouchableOpacity>
                <View style={styles.formButtonsRow}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsAdding(false)}>
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.saveBtn} onPress={handleAddActivity}>
                    <Text style={styles.saveBtnText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Activities List */}
            {activities.length === 0 && !isAdding ? (
              <View style={styles.noActivitiesBox}>
                <Text style={styles.noActivitiesText}>No activities scheduled for this day.</Text>
              </View>
            ) : (
              activities.map((act, idx) => {
                const isEditing = idx === editingIndex;

                if (isEditing) {
                  return (
                    <View key={idx} style={styles.formCard}>
                      <Text style={styles.formCardTitle}>Edit Activity</Text>
                      <View style={styles.row}>
                        <TextInput
                          placeholder="09:00"
                          placeholderTextColor="#666"
                          value={editForm.start}
                          onChangeText={(val) => setEditForm({ ...editForm, start: val })}
                          style={[styles.input, styles.timeInput]}
                        />
                        <Text style={styles.dash}>–</Text>
                        <TextInput
                          placeholder="10:00"
                          placeholderTextColor="#666"
                          value={editForm.end}
                          onChangeText={(val) => setEditForm({ ...editForm, end: val })}
                          style={[styles.input, styles.timeInput]}
                        />
                      </View>
                      <TextInput
                        placeholder="Activity Name *"
                        placeholderTextColor="#666"
                        value={editForm.activity}
                        onChangeText={(val) => setEditForm({ ...editForm, activity: val })}
                        style={[styles.input, styles.marginV]}
                      />
                      <View style={styles.row}>
                        <TextInput
                          placeholder="Location"
                          placeholderTextColor="#666"
                          value={editForm.location}
                          onChangeText={(val) => setEditForm({ ...editForm, location: val })}
                          style={[styles.input, styles.flex1]}
                        />
                        <TextInput
                          placeholder={`Cost (${symbol})`}
                          placeholderTextColor="#666"
                          keyboardType="number-pad"
                          value={editForm.estimatedCost}
                          onChangeText={(val) => setEditForm({ ...editForm, estimatedCost: val })}
                          style={[styles.input, styles.costInput]}
                        />
                      </View>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() =>
                          setEditForm({ ...editForm, weatherSensitive: !editForm.weatherSensitive })
                        }
                        style={styles.checkboxRow}
                      >
                        <Ionicons
                          name={editForm.weatherSensitive ? "checkbox" : "square-outline"}
                          size={18}
                          color={editForm.weatherSensitive ? colors.primary : colors.textMuted}
                        />
                        <Text style={styles.checkboxText}>Outdoor/weather-sensitive</Text>
                      </TouchableOpacity>
                      <View style={styles.formButtonsRow}>
                        <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditingIndex(null)}>
                          <Text style={styles.cancelBtnText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.saveBtn} onPress={() => handleSaveEdit(idx)}>
                          <Text style={styles.saveBtnText}>Save</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                }

                // Default activity card view (ticket-style visual language)
                const [gStart, gEnd] = selectedTrip
                  ? destinationGradient(selectedTrip.destination)
                  : [colors.primary, colors.primaryMuted];

                return (
                  <View key={idx} style={[styles.activityCard, act.status === "cancelled" && styles.activityCancelled]}>
                    <LinearGradient
                      colors={[gStart, gEnd]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                      style={styles.leftLine}
                    />
                    <View style={styles.activityCardContent}>
                      <View style={styles.activityInfoCol}>
                        <Text style={styles.activityTime}>{act.start}–{act.end}</Text>
                        <Text style={styles.activityName}>{act.activity}</Text>
                        {!!act.location && (
                          <View style={styles.locationContainer}>
                            <Ionicons name="location-outline" size={12} color={colors.textMuted} />
                            <Text style={styles.activityLocation} numberOfLines={1}>{act.location}</Text>
                          </View>
                        )}
                        {act.estimatedCost > 0 && (
                          <Text style={styles.activityCost}>{symbol}{act.estimatedCost}</Text>
                        )}
                      </View>

                      {/* Manage Actions */}
                      <View style={styles.activityActionsCol}>
                        <TouchableOpacity onPress={() => startEditing(idx, act)} style={styles.actActionBtn} activeOpacity={0.7}>
                          <Ionicons name="create-outline" size={18} color={colors.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDeleteAct(idx)} style={[styles.actActionBtn, { marginTop: 12 }]} activeOpacity={0.7}>
                          <Ionicons name="trash-outline" size={18} color={colors.danger} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
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
  daySelectorWrapper: { marginTop: 10 },
  daysScroll: { marginTop: 8 },
  dayTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dayTabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  dayTabText: { color: colors.textMuted, fontSize: 13, fontFamily: fonts.bold },
  dayTabTextActive: { color: "white" },
  activitiesHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 28,
    marginBottom: 12,
    flexWrap: "wrap",
    gap: 8,
  },
  sectionTitle: { color: colors.textPrimary, fontSize: 18, fontFamily: fonts.bold },
  addShortcutBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 4 },
  addShortcutText: { color: colors.primary, fontSize: 13, fontFamily: fonts.bold },
  noActivitiesBox: {
    backgroundColor: colors.surface,
    padding: 24,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  noActivitiesText: { color: colors.textMuted, fontSize: 14, fontFamily: fonts.medium },
  empty: { alignItems: "center", marginTop: 40, gap: 10 },
  emptyText: { color: colors.textMuted, fontSize: 14, textAlign: "center", fontFamily: fonts.medium },
  activityCard: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  activityCancelled: { opacity: 0.4 },
  leftLine: { width: 5, alignSelf: "stretch" },
  activityCardContent: { flex: 1, flexDirection: "row", paddingVertical: 14, paddingHorizontal: 16, alignItems: "center" },
  activityInfoCol: { flex: 1, paddingRight: 12 },
  activityTime: { color: colors.primary, fontSize: 12, fontFamily: fonts.bold, marginBottom: 4 },
  activityName: { color: colors.textPrimary, fontSize: 15, fontFamily: fonts.bold, marginBottom: 2 },
  locationContainer: { flexDirection: "row", alignItems: "center", marginTop: 4, gap: 4 },
  activityLocation: { color: colors.textMuted, fontSize: 12, fontFamily: fonts.medium },
  activityCost: { color: colors.secondary, fontSize: 12, fontFamily: fonts.bold, marginTop: 6 },
  activityActionsCol: { width: 36, flexShrink: 0, alignItems: "center", justifyContent: "center" },
  actActionBtn: { padding: 4 },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  formCardTitle: { color: colors.textPrimary, fontSize: 15, fontFamily: fonts.bold, marginBottom: 12 },
  input: {
    backgroundColor: "#182C40", // dark tinted form input
    padding: 10,
    borderRadius: 8,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    fontFamily: fonts.medium,
    fontSize: 13,
  },
  row: { flexDirection: "row", alignItems: "center" },
  flex1: { flex: 1 },
  timeInput: { width: 64, textAlign: "center" },
  dash: { color: colors.textMuted, paddingHorizontal: 6 },
  marginV: { marginVertical: 8 },
  costInput: { width: 90, marginLeft: 10 },
  checkboxRow: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  checkboxText: { color: colors.textMuted, fontSize: 12, marginLeft: 6, fontFamily: fonts.medium },
  formButtonsRow: { flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 14 },
  cancelBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8, backgroundColor: "transparent" },
  cancelBtnText: { color: colors.textMuted, fontFamily: fonts.bold, fontSize: 13 },
  saveBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, backgroundColor: colors.primary },
  saveBtnText: { color: "white", fontFamily: fonts.bold, fontSize: 13 },
});
