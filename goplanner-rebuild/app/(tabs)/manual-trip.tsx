import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { tripApi, getCurrencySymbol } from "@/lib/api";
import { colors, fonts } from "@/lib/theme";
import { useAuth } from "@/context/AuthContext";

interface ActivityInput {
  start: string;
  end: string;
  activity: string;
  location: string;
  estimatedCost: string;
  weatherSensitive: boolean;
}

interface DayInput {
  day: number;
  activities: ActivityInput[];
}

export default function ManualTripScreen() {
  const { user } = useAuth();
  const [destination, setDestination] = useState("");
  const [days, setDays] = useState("3");
  const [budget, setBudget] = useState("");
  const [startDate, setStartDate] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Initialize itinerary with 3 days
  const [itinerary, setItinerary] = useState<DayInput[]>([
    { day: 1, activities: [] },
    { day: 2, activities: [] },
    { day: 3, activities: [] },
  ]);

  const handleDaysChange = (text: string) => {
    setDays(text);
    const num = parseInt(text) || 0;
    if (num < 1 || num > 30) return;

    setItinerary((prev) => {
      const next = [...prev];
      if (next.length < num) {
        for (let i = next.length + 1; i <= num; i++) {
          next.push({ day: i, activities: [] });
        }
      } else if (next.length > num) {
        return next.slice(0, num);
      }
      return next;
    });
  };

  const addActivityField = (dayIdx: number) => {
    setItinerary((prev) => {
      const next = [...prev];
      next[dayIdx].activities.push({
        start: "09:00",
        end: "10:00",
        activity: "",
        location: "",
        estimatedCost: "",
        weatherSensitive: false,
      });
      return next;
    });
  };

  const removeActivityField = (dayIdx: number, actIdx: number) => {
    setItinerary((prev) => {
      const next = [...prev];
      next[dayIdx].activities.splice(actIdx, 1);
      return next;
    });
  };

  const updateActivityField = (
    dayIdx: number,
    actIdx: number,
    field: keyof ActivityInput,
    value: any
  ) => {
    setItinerary((prev) => {
      const next = [...prev];
      const act = next[dayIdx].activities[actIdx];
      (act as any)[field] = value;
      return next;
    });
  };

  const handleSave = async () => {
    if (!destination.trim()) {
      Toast.show({ type: "error", text1: "Missing info", text2: "Destination is required." });
      return;
    }
    const numDays = parseInt(days);
    if (isNaN(numDays) || numDays < 1 || numDays > 30) {
      Toast.show({ type: "error", text1: "Invalid days", text2: "Days must be between 1 and 30." });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        destination: destination.trim(),
        days: numDays,
        description: description.trim() || undefined,
        budget: budget.trim() ? Number(budget) : null,
        startDate: startDate.trim() || null,
        itinerary: itinerary.map((d) => ({
          day: d.day,
          activities: d.activities.map((a) => ({
            start: a.start.trim() || "09:00",
            end: a.end.trim() || "10:00",
            activity: a.activity.trim() || "Activity",
            location: a.location.trim() || "",
            estimatedCost: Number(a.estimatedCost) || 0,
            weatherSensitive: a.weatherSensitive,
          })),
        })),
      };

      const res = await tripApi.createManual(payload);
      Toast.show({ type: "success", text1: "Trip created", text2: "Enjoy your manually planned trip!" });
      router.push(`/trip/${res.data._id}`);
    } catch (err) {
      Toast.show({ type: "error", text1: "Save failed", text2: "Could not create manual trip." });
    } finally {
      setSubmitting(false);
    }
  };

  const homeSymbol = getCurrencySymbol(user?.homeCurrency || "INR");

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Manual Trip Planner</Text>
        <Text style={styles.subtitle}>Build your own custom itinerary day by day</Text>

        {/* Form Fields */}
        <Text style={styles.label}>Destination *</Text>
        <TextInput
          placeholder="e.g. Jaipur, India"
          placeholderTextColor="#888"
          value={destination}
          onChangeText={setDestination}
          style={styles.input}
        />

        <View style={styles.row}>
          <View style={styles.flex1}>
            <Text style={styles.label}>Days (1–30) *</Text>
            <TextInput
              placeholder="3"
              placeholderTextColor="#888"
              keyboardType="number-pad"
              value={days}
              onChangeText={handleDaysChange}
              style={styles.input}
            />
          </View>
          <View style={[styles.flex1, { marginLeft: 12 }]}>
            <Text style={styles.label}>Budget ({homeSymbol})</Text>
            <TextInput
              placeholder="e.g. 15000"
              placeholderTextColor="#888"
              keyboardType="decimal-pad"
              value={budget}
              onChangeText={setBudget}
              style={styles.input}
            />
          </View>
        </View>

        <Text style={styles.label}>Start Date (YYYY-MM-DD, optional)</Text>
        <TextInput
          placeholder="e.g. 2026-08-20"
          placeholderTextColor="#888"
          value={startDate}
          onChangeText={setStartDate}
          style={styles.input}
        />

        <Text style={styles.label}>Description / Notes (optional)</Text>
        <TextInput
          placeholder="e.g. Family vacation"
          placeholderTextColor="#888"
          value={description}
          onChangeText={setDescription}
          style={[styles.input, styles.multiline]}
          multiline
        />

        {/* Days and Activities */}
        <Text style={styles.sectionHeader}>Itinerary Details</Text>

        {itinerary.map((dayData, dayIdx) => (
          <View key={dayData.day} style={styles.dayCard}>
            <Text style={styles.dayTitle}>Day {dayData.day}</Text>

            {dayData.activities.map((act, actIdx) => (
              <View key={actIdx} style={styles.activityRow}>
                <View style={styles.row}>
                  <TextInput
                    placeholder="09:00"
                    placeholderTextColor="#666"
                    value={act.start}
                    onChangeText={(val) => updateActivityField(dayIdx, actIdx, "start", val)}
                    style={[styles.input, styles.timeInput]}
                  />
                  <Text style={styles.dash}>–</Text>
                  <TextInput
                    placeholder="10:00"
                    placeholderTextColor="#666"
                    value={act.end}
                    onChangeText={(val) => updateActivityField(dayIdx, actIdx, "end", val)}
                    style={[styles.input, styles.timeInput]}
                  />
                  <TouchableOpacity
                    onPress={() => removeActivityField(dayIdx, actIdx)}
                    style={styles.deleteBtn}
                  >
                    <Ionicons name="trash-outline" size={18} color={colors.danger} />
                  </TouchableOpacity>
                </View>

                <TextInput
                  placeholder="Activity Name *"
                  placeholderTextColor="#666"
                  value={act.activity}
                  onChangeText={(val) => updateActivityField(dayIdx, actIdx, "activity", val)}
                  style={[styles.input, styles.marginV]}
                />

                <View style={styles.row}>
                  <TextInput
                    placeholder="Location"
                    placeholderTextColor="#666"
                    value={act.location}
                    onChangeText={(val) => updateActivityField(dayIdx, actIdx, "location", val)}
                    style={[styles.input, styles.flex1]}
                  />
                  <TextInput
                    placeholder={`Cost (${homeSymbol})`}
                    placeholderTextColor="#666"
                    keyboardType="number-pad"
                    value={act.estimatedCost}
                    onChangeText={(val) => updateActivityField(dayIdx, actIdx, "estimatedCost", val)}
                    style={[styles.input, styles.costInput]}
                  />
                </View>

                {/* Weather checkbox */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() =>
                    updateActivityField(dayIdx, actIdx, "weatherSensitive", !act.weatherSensitive)
                  }
                  style={styles.checkboxRow}
                >
                  <Ionicons
                    name={act.weatherSensitive ? "checkbox" : "square-outline"}
                    size={18}
                    color={act.weatherSensitive ? colors.primary : colors.textMuted}
                  />
                  <Text style={styles.checkboxText}>Outdoor/weather-sensitive</Text>
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity style={styles.addActBtn} onPress={() => addActivityField(dayIdx)}>
              <Ionicons name="add" size={16} color={colors.primary} />
              <Text style={styles.addActText}>Add activity</Text>
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity style={styles.button} onPress={handleSave} disabled={submitting}>
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Save Trip</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scrollContent: { padding: 20, paddingTop: 60, paddingBottom: 80 },
  title: { color: colors.textPrimary, fontSize: 24, fontFamily: fonts.bold },
  subtitle: { color: colors.textMuted, fontSize: 13, marginTop: 4, marginBottom: 24, fontFamily: fonts.medium },
  label: { color: colors.textPrimary, fontSize: 13, fontFamily: fonts.medium, marginBottom: 6, marginTop: 14 },
  input: {
    backgroundColor: colors.surface,
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
  multiline: { minHeight: 60, textAlignVertical: "top" },
  sectionHeader: {
    color: colors.textPrimary,
    fontSize: 18,
    fontFamily: fonts.bold,
    marginTop: 28,
    marginBottom: 12,
  },
  dayCard: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dayTitle: {
    color: colors.primary,
    fontSize: 16,
    fontFamily: fonts.bold,
    marginBottom: 10,
  },
  activityRow: {
    backgroundColor: "#1C1F26", // slightly lighter dark backdrop
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  timeInput: { width: 70, textAlign: "center" },
  dash: { color: colors.textMuted, paddingHorizontal: 6, fontSize: 16 },
  deleteBtn: { padding: 8, marginLeft: "auto" },
  marginV: { marginVertical: 8 },
  costInput: { width: 100, marginLeft: 10 },
  checkboxRow: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  checkboxText: { color: colors.textMuted, fontSize: 12, marginLeft: 6, fontFamily: fonts.medium },
  addActBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.primaryMuted,
    borderStyle: "dashed",
    borderRadius: 8,
    marginTop: 6,
    gap: 4,
  },
  addActText: { color: colors.primary, fontSize: 13, fontFamily: fonts.bold },
  button: {
    backgroundColor: colors.primary,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
    minHeight: 50,
    justifyContent: "center",
  },
  buttonText: { color: "white", fontFamily: fonts.bold, fontSize: 16 },
});
