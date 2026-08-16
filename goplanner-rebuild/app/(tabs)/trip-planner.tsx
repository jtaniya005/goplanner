import { router } from "expo-router";
import { useState } from "react";
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
import Toast from "react-native-toast-message";
import { tripApi, getCurrencySymbol } from "@/lib/api";
import { useAuth, ApiError } from "@/context/AuthContext";
import { colors, fonts } from "@/lib/theme";

export default function TripPlanner() {
  const { user } = useAuth();
  const [destination, setDestination] = useState("");
  const [days, setDays] = useState("3");
  const [budget, setBudget] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleGenerate = async () => {
    if (!destination.trim()) {
      Toast.show({ type: "error", text1: "Destination required" });
      return;
    }
    const numDays = parseInt(days, 10);
    if (!Number.isFinite(numDays) || numDays < 1 || numDays > 30) {
      Toast.show({ type: "error", text1: "Enter a valid number of days (1–30)" });
      return;
    }

    setSubmitting(true);
    try {
      const res = await tripApi.create({
        destination: destination.trim(),
        days: numDays,
        description: description.trim() || undefined,
        budget: budget ? Number(budget) : null,
        currency: user?.homeCurrency || "USD",
        startDate: startDate.trim() || undefined,
      });
      if (res.meta?.budgetRevisionAttempted) {
        Toast.show({ type: "info", text1: "Trimmed to fit your budget", text2: "The plan was revised once to reduce cost." });
      }
      router.replace(`/trip/${res.data._id}`);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Could not generate itinerary. Please try again.";
      Toast.show({ type: "error", text1: "Generation failed", text2: message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={{ paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Plan a new trip</Text>
        <Text style={styles.subtitle}>AI builds a day-by-day itinerary from your preferences.</Text>

        <Text style={styles.label}>Destination</Text>
        <TextInput
          placeholder="e.g. Jaipur, India"
          placeholderTextColor="#888"
          value={destination}
          onChangeText={setDestination}
          style={styles.input}
        />

        <Text style={styles.label}>Number of days</Text>
        <TextInput
          placeholder="3"
          placeholderTextColor="#888"
          value={days}
          onChangeText={setDays}
          keyboardType="number-pad"
          style={styles.input}
        />

        <Text style={styles.label}>Budget (optional, {user?.homeCurrency || "USD"})</Text>
        <TextInput
          placeholder={user?.homeCurrency === "INR" ? "e.g. 30000" : "e.g. 400"}
          placeholderTextColor="#888"
          value={budget}
          onChangeText={setBudget}
          keyboardType="decimal-pad"
          style={styles.input}
        />
        <Text style={styles.hint}>
          If the AI's first plan runs over this budget, it automatically revises once to fit.
        </Text>

        <Text style={styles.label}>Start Date (optional)</Text>
        <TextInput
          placeholder="YYYY-MM-DD (e.g. 2026-08-20)"
          placeholderTextColor="#888"
          value={startDate}
          onChangeText={setStartDate}
          style={styles.input}
        />
        <Text style={styles.hint}>
          Providing a start date enables weather forecast integration.
        </Text>

        <Text style={styles.label}>Preferences (optional)</Text>
        <TextInput
          placeholder="e.g. love street food, prefer walking, traveling with kids"
          placeholderTextColor="#888"
          value={description}
          onChangeText={setDescription}
          style={[styles.input, styles.multiline]}
          multiline
        />

        <TouchableOpacity style={styles.button} onPress={handleGenerate} disabled={submitting}>
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Generate itinerary</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, paddingTop: 60, paddingHorizontal: 20 },
  title: { color: colors.textPrimary, fontSize: 24, fontFamily: fonts.bold },
  subtitle: { color: colors.textMuted, fontSize: 13, marginTop: 4, marginBottom: 24, fontFamily: fonts.medium },
  label: { color: colors.textPrimary, fontSize: 13, fontFamily: fonts.medium, marginBottom: 6, marginTop: 14 },
  input: {
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: 10,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
    fontFamily: fonts.medium,
  },
  multiline: { minHeight: 80, textAlignVertical: "top" },
  hint: { color: colors.textFaint, fontSize: 11, marginTop: 6, fontFamily: fonts.medium },
  button: {
    backgroundColor: colors.primary,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 28,
    minHeight: 50,
    justifyContent: "center",
  },
  buttonText: { color: "white", fontFamily: fonts.bold, fontSize: 16 },
});
