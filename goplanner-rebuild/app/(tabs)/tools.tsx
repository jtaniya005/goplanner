import React, { useState, useEffect, useCallback } from "react";
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
import { tripApi, currencyApi, toolsApi, Trip, getCurrencySymbol } from "@/lib/api";
import { colors, fonts } from "@/lib/theme";

interface PackingCategory {
  name: string;
  items: string[];
}

export default function ToolsScreen() {
  // Common states
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loadingTrips, setLoadingTrips] = useState(true);

  // 1. Budget Splitter state
  const [splitterBudget, setSplitterBudget] = useState("12000");
  const [splitterDays, setSplitterDays] = useState("4");

  // 2. Currency Converter state
  const [convAmount, setConvAmount] = useState("100");
  const [convFrom, setConvFrom] = useState("USD");
  const [convTo, setConvTo] = useState("INR");
  const [convResult, setConvResult] = useState<number | null>(null);
  const [convLoading, setConvLoading] = useState(false);

  // 3. AI Packing List state
  const [packDest, setPackDest] = useState("");
  const [packDays, setPackDays] = useState("3");
  const [packType, setPackType] = useState("City"); // Beach, City, Hiking, Business
  const [packLoading, setPackLoading] = useState(false);
  const [packingList, setPackingList] = useState<PackingCategory[]>([]);
  const [checkedItems, setCheckedItems] = useState<{ [key: string]: boolean }>({});

  // 4. Countdown state
  const [countdownText, setCountdownText] = useState<string | null>(null);

  // Load trips
  const loadTrips = useCallback(async () => {
    try {
      const res = await tripApi.list();
      const tripList = res.data || [];
      setTrips(tripList);

      // Compute next upcoming trip countdown
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const upcoming = tripList
        .filter((t) => t.startDate && new Date(t.startDate) >= today)
        .sort((a, b) => new Date(a.startDate!).getTime() - new Date(b.startDate!).getTime());

      if (upcoming.length > 0) {
        const next = upcoming[0];
        const diffTime = new Date(next.startDate!).getTime() - today.getTime();
        const diffDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
        if (diffDays === 0) {
          setCountdownText(`Today is your trip to ${next.destination}! 🎉`);
        } else if (diffDays === 1) {
          setCountdownText(`1 day until ${next.destination} ✈️`);
        } else {
          setCountdownText(`${diffDays} days until ${next.destination} ✈️`);
        }
      } else {
        setCountdownText(null);
      }
    } catch {
      // ignore silently
    } finally {
      setLoadingTrips(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTrips();
    }, [loadTrips])
  );

  // Currency Converter Live Sync
  useEffect(() => {
    const num = parseFloat(convAmount);
    if (isNaN(num) || num <= 0) {
      setConvResult(null);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setConvLoading(true);
      try {
        const res = await currencyApi.convert(num, convFrom, convTo);
        setConvResult(res);
      } catch {
        setConvResult(null);
      } finally {
        setConvLoading(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [convAmount, convFrom, convTo]);

  // AI Packing list trigger
  const handleGeneratePacking = async () => {
    if (!packDest.trim()) {
      Toast.show({ type: "error", text1: "Destination Required" });
      return;
    }
    const daysNum = parseInt(packDays);
    if (isNaN(daysNum) || daysNum < 1 || daysNum > 30) {
      Toast.show({ type: "error", text1: "Invalid Days", text2: "Enter a number of days between 1 and 30." });
      return;
    }

    setPackLoading(true);
    setCheckedItems({});
    try {
      const res = await toolsApi.getPackingList({
        destination: packDest.trim(),
        days: daysNum,
        tripType: packType,
      });
      setPackingList(res.data);
      Toast.show({ type: "success", text1: "Packing list generated!" });
    } catch {
      Toast.show({ type: "error", text1: "Generation Failed" });
    } finally {
      setPackLoading(false);
    }
  };

  const toggleCheck = (itemKey: string) => {
    setCheckedItems((prev) => ({ ...prev, [itemKey]: !prev[itemKey] }));
  };

  // Budget Splitter Math
  const bAmount = parseFloat(splitterBudget) || 0;
  const bDays = parseInt(splitterDays) || 1;
  const allowancePerDay = bDays > 0 ? Math.round((bAmount / bDays) * 100) / 100 : 0;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Trip Toolkit</Text>
        <Text style={styles.subtitle}>Interactive utilities for seamless travel prep</Text>

        {/* TOOL 1: TRIP COUNTDOWN */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>Upcoming Trip Countdown</Text>
          {loadingTrips ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: 10 }} />
          ) : countdownText ? (
            <View style={styles.countdownBox}>
              <Ionicons name="time-outline" size={24} color={colors.primary} />
              <Text style={styles.countdownTitle}>{countdownText}</Text>
            </View>
          ) : (
            <View style={styles.countdownEmpty}>
              <Ionicons name="airplane-outline" size={20} color={colors.textFaint} />
              <Text style={styles.countdownEmptyText}>
                No upcoming trips with dates found. Set a start date on a trip to start counting down!
              </Text>
            </View>
          )}
        </View>

        {/* TOOL 2: BUDGET SPLITTER */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>Budget Splitter</Text>
          <View style={styles.row}>
            <View style={styles.flex1}>
              <Text style={styles.label}>Total Budget</Text>
              <TextInput
                style={styles.input}
                value={splitterBudget}
                onChangeText={setSplitterBudget}
                keyboardType="decimal-pad"
                placeholder="e.g. 20000"
                placeholderTextColor="#666"
              />
            </View>
            <View style={[styles.flex1, { marginLeft: 12 }]}>
              <Text style={styles.label}>Days</Text>
              <TextInput
                style={styles.input}
                value={splitterDays}
                onChangeText={setSplitterDays}
                keyboardType="number-pad"
                placeholder="e.g. 5"
                placeholderTextColor="#666"
              />
            </View>
          </View>

          {allowancePerDay > 0 && (
            <View style={styles.splitterResult}>
              <Text style={styles.splitterResultVal}>
                {getCurrencySymbol("INR")}{allowancePerDay.toLocaleString()}
              </Text>
              <Text style={styles.splitterResultLabel}>RECOMMENDED DAILY ALLOWANCE</Text>

              {/* Simple daily progress splits rendering */}
              <View style={styles.barContainer}>
                {Array.from({ length: Math.min(bDays, 5) }).map((_, i) => (
                  <View key={i} style={styles.barRow}>
                    <Text style={styles.barText}>Day {i + 1}</Text>
                    <View style={styles.barTrack}>
                      <View style={[styles.barFill, { width: "100%" }]} />
                    </View>
                    <Text style={styles.barAmt}>{getCurrencySymbol("INR")}{allowancePerDay}</Text>
                  </View>
                ))}
                {bDays > 5 && (
                  <Text style={styles.moreDaysText}>+ {bDays - 5} more days remaining</Text>
                )}
              </View>
            </View>
          )}
        </View>

        {/* TOOL 3: CURRENCY CONVERTER */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>Live Currency Converter</Text>
          <View style={styles.row}>
            <View style={{ flex: 1.5 }}>
              <Text style={styles.label}>Amount</Text>
              <TextInput
                style={styles.input}
                value={convAmount}
                onChangeText={setConvAmount}
                keyboardType="decimal-pad"
                placeholder="100"
                placeholderTextColor="#666"
              />
            </View>
            <View style={[styles.flex1, { marginLeft: 10 }]}>
              <Text style={styles.label}>From</Text>
              <View style={styles.dropdownWrap}>
                <TextInput
                  style={[styles.input, { textAlign: "center" }]}
                  value={convFrom}
                  onChangeText={(v) => setConvFrom(v.toUpperCase())}
                  maxLength={3}
                  autoCapitalize="characters"
                />
              </View>
            </View>
            <View style={[styles.flex1, { marginLeft: 10 }]}>
              <Text style={styles.label}>To</Text>
              <View style={styles.dropdownWrap}>
                <TextInput
                  style={[styles.input, { textAlign: "center" }]}
                  value={convTo}
                  onChangeText={(v) => setConvTo(v.toUpperCase())}
                  maxLength={3}
                  autoCapitalize="characters"
                />
              </View>
            </View>
          </View>

          {/* Result displaying */}
          <View style={styles.converterResultBox}>
            {convLoading ? (
              <ActivityIndicator color={colors.primary} />
            ) : convResult !== null ? (
              <View style={styles.converterResultContent}>
                <Text style={styles.convResultLabel}>
                  {convAmount} {convFrom} equals
                </Text>
                <Text style={styles.convResultText}>
                  {getCurrencySymbol(convTo)} {convResult.toFixed(2)} {convTo}
                </Text>
                <Text style={styles.rateCaption}>Powered by Frankfurter API · Live Rates</Text>
              </View>
            ) : (
              <Text style={styles.convEmptyText}>Enter values to convert currency</Text>
            )}
          </View>
        </View>

        {/* TOOL 4: AI PACKING CHECKLIST */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>AI Packing List Generator</Text>
          <Text style={styles.label}>Destination *</Text>
          <TextInput
            style={styles.input}
            value={packDest}
            onChangeText={setPackDest}
            placeholder="e.g. Goa, India"
            placeholderTextColor="#666"
          />

          <View style={styles.row}>
            <View style={styles.flex1}>
              <Text style={styles.label}>Days</Text>
              <TextInput
                style={styles.input}
                value={packDays}
                onChangeText={setPackDays}
                keyboardType="number-pad"
                placeholder="3"
                placeholderTextColor="#666"
              />
            </View>
            <View style={[styles.flex1, { marginLeft: 12 }]}>
              <Text style={styles.label}>Trip Type</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeChipsRow}>
                {["Beach", "City", "Hiking", "Business"].map((type) => {
                  const active = type === packType;
                  return (
                    <TouchableOpacity
                      key={type}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => setPackType(type)}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{type}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={handleGeneratePacking}
            disabled={packLoading}
          >
            {packLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name="shirt-outline" size={16} color="white" />
                <Text style={styles.actionBtnText}>Generate Packing List</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Generated checklists */}
          {packingList.length > 0 && (
            <View style={styles.packingResults}>
              {packingList.map((cat, catIdx) => (
                <View key={catIdx} style={styles.packingCatBlock}>
                  <Text style={styles.packingCatName}>{cat.name}</Text>
                  {cat.items.map((item, itemIdx) => {
                    const itemKey = `${catIdx}-${itemIdx}`;
                    const isChecked = !!checkedItems[itemKey];

                    return (
                      <TouchableOpacity
                        key={itemIdx}
                        style={styles.checkItemRow}
                        onPress={() => toggleCheck(itemKey)}
                        activeOpacity={0.8}
                      >
                        <Ionicons
                          name={isChecked ? "checkbox" : "square-outline"}
                          size={18}
                          color={isChecked ? colors.primary : colors.textMuted}
                        />
                        <Text style={[styles.checkItemText, isChecked && styles.checkItemChecked]}>
                          {item}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scrollContent: { padding: 20, paddingTop: 60, paddingBottom: 80 },
  title: { color: colors.textPrimary, fontSize: 24, fontFamily: fonts.bold },
  subtitle: { color: colors.textMuted, fontSize: 13, marginTop: 4, marginBottom: 24, fontFamily: fonts.medium },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 20,
  },
  cardHeader: { color: colors.primary, fontSize: 16, fontFamily: fonts.bold, marginBottom: 14 },
  label: { color: colors.textMuted, fontSize: 12, fontFamily: fonts.medium, marginBottom: 6, marginTop: 10 },
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
  row: { flexDirection: "row", alignItems: "center" },
  flex1: { flex: 1 },
  dropdownWrap: { width: "100%" },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 10,
    marginTop: 16,
    gap: 6,
  },
  actionBtnText: { color: "white", fontFamily: fonts.bold, fontSize: 14 },
  countdownBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#182C40",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primaryMuted,
    gap: 12,
  },
  countdownTitle: { color: colors.textPrimary, fontSize: 16, fontFamily: fonts.bold, flex: 1 },
  countdownEmpty: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    gap: 6,
  },
  countdownEmptyText: { color: colors.textMuted, fontSize: 12, fontFamily: fonts.medium, textAlign: "center" },
  splitterResult: { marginTop: 16, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 14 },
  splitterResultVal: { color: colors.textPrimary, fontSize: 26, fontFamily: fonts.bold },
  splitterResultLabel: { color: colors.textMuted, fontSize: 10, fontFamily: fonts.medium, letterSpacing: 1 },
  barContainer: { marginTop: 12, gap: 8 },
  barRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  barText: { color: colors.textMuted, fontSize: 12, width: 44, fontFamily: fonts.medium },
  barTrack: { flex: 1, height: 6, backgroundColor: colors.border, borderRadius: 3, marginHorizontal: 10 },
  barFill: { height: "100%", backgroundColor: colors.primary, borderRadius: 3 },
  barAmt: { color: colors.textPrimary, fontSize: 12, fontFamily: fonts.bold, width: 64, textAlign: "right" },
  moreDaysText: { color: colors.textFaint, fontSize: 11, fontFamily: fonts.medium, textAlign: "center", marginTop: 4 },
  converterResultBox: {
    backgroundColor: "#1C1F26",
    padding: 14,
    borderRadius: 10,
    marginTop: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  converterResultContent: { alignItems: "center" },
  convResultLabel: { color: colors.textMuted, fontSize: 12, fontFamily: fonts.medium },
  convResultText: { color: colors.secondary, fontSize: 20, fontFamily: fonts.bold, marginTop: 4 },
  rateCaption: { color: colors.textFaint, fontSize: 9, fontFamily: fonts.medium, marginTop: 6 },
  convEmptyText: { color: colors.textMuted, fontSize: 12, fontFamily: fonts.medium },
  typeChipsRow: { flexDirection: "row", marginTop: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#182C40",
    marginRight: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.textMuted, fontSize: 12, fontFamily: fonts.bold },
  chipTextActive: { color: "white" },
  packingResults: { marginTop: 20, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 14 },
  packingCatBlock: { marginBottom: 16 },
  packingCatName: { color: colors.primary, fontSize: 14, fontFamily: fonts.bold, marginBottom: 8 },
  checkItemRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8, gap: 8 },
  checkItemText: { color: colors.textPrimary, fontSize: 13, fontFamily: fonts.medium },
  checkItemChecked: { color: colors.textFaint, textDecorationLine: "line-through" },
});
