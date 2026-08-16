import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Circle } from "react-native-svg";
import { colors, fonts, destinationGradient } from "@/lib/theme";
import { getCurrencySymbol, Trip } from "@/lib/api";

type TripTicketCardProps = {
  item: Trip;
  onPress: () => void;
};

export default function TripTicketCard({ item, onPress }: TripTicketCardProps) {
  const symbol = getCurrencySymbol(item.currency);
  const [gradientStart, gradientEnd] = destinationGradient(item.destination);

  // Budget calculations
  const budget = item.budget ?? 0;
  const cost = item.totalEstimatedCost ?? 0;
  const budgetPct = budget > 0 ? Math.min(2, cost / budget) : 0;
  const isOverBudget = item.overBudget || (budget > 0 && cost > budget);

  // SVG circular progress parameters
  const radius = 16;
  const strokeWidth = 3;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(1, budget > 0 ? cost / budget : 0);
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.95}>
      {/* 5px Gradient Strip at the top */}
      <LinearGradient
        colors={[gradientStart, gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradientStrip}
      />

      <View style={styles.cardContent}>
        {/* Left Column: Ticket Info */}
        <View style={styles.leftCol}>
          <Text style={styles.destination} numberOfLines={1}>
            {item.destination}
          </Text>
          <Text style={styles.meta}>
            {item.days} day{item.days === 1 ? "" : "s"}
            {budget > 0 ? ` · Budget ${symbol}${budget}` : " · No budget"}
          </Text>
          <Text style={[styles.cost, isOverBudget && styles.overBudgetCost]}>
            Est. {symbol}{cost}
            {isOverBudget && " — over budget"}
          </Text>
        </View>

        {/* Divider Section: Vertical Dashed Divider + Notches */}
        <View style={styles.dividerCol}>
          <View style={styles.notchTop} />
          <View style={styles.dashedLine} />
          <View style={styles.notchBottom} />
        </View>

        {/* Right Column: Progress Ring / Plane Icon */}
        <View style={styles.rightCol}>
          {budget > 0 ? (
            <View style={styles.progressWrapper}>
              <Svg width={40} height={40} viewBox="0 0 40 40">
                <Circle
                  cx="20"
                  cy="20"
                  r={radius}
                  stroke={colors.border}
                  strokeWidth={strokeWidth}
                  fill="transparent"
                />
                <Circle
                  cx="20"
                  cy="20"
                  r={radius}
                  stroke={isOverBudget ? colors.danger : colors.secondary}
                  strokeWidth={strokeWidth}
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  transform="rotate(-90 20 20)"
                />
              </Svg>
              <View style={styles.iconOverlay}>
                <Ionicons
                  name={isOverBudget ? "alert-circle" : "wallet-outline"}
                  size={14}
                  color={isOverBudget ? colors.danger : colors.secondary}
                />
              </View>
            </View>
          ) : (
            <View style={styles.airplaneWrapper}>
              <Ionicons name="airplane-outline" size={20} color={colors.textMuted} />
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
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
  gradientStrip: {
    height: 5,
    width: "100%",
  },
  cardContent: {
    flexDirection: "row",
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  leftCol: {
    flex: 1,
    paddingRight: 8,
  },
  destination: {
    color: colors.textPrimary,
    fontSize: 18,
    fontFamily: fonts.bold,
  },
  meta: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 4,
    fontFamily: fonts.medium,
  },
  cost: {
    color: colors.secondary,
    fontSize: 13,
    marginTop: 6,
    fontWeight: "600",
    fontFamily: fonts.medium,
  },
  overBudgetCost: {
    color: colors.danger,
  },
  dividerCol: {
    height: "100%",
    width: 24,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  dashedLine: {
    width: 0,
    height: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
  },
  notchTop: {
    position: "absolute",
    top: -24, // aligned at top edge of content wrapper
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.bg,
  },
  notchBottom: {
    position: "absolute",
    bottom: -24, // aligned at bottom edge of content wrapper
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.bg,
  },
  rightCol: {
    width: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  progressWrapper: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  iconOverlay: {
    position: "absolute",
  },
  airplaneWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1D2027",
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
});
