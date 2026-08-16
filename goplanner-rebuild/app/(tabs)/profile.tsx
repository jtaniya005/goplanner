import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useCallback, useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import Toast from "react-native-toast-message";
import { useAuth } from "@/context/AuthContext";
import { tripApi, getCurrencySymbol } from "@/lib/api";
import { colors, fonts } from "@/lib/theme";

export default function Profile() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({ trips: 0, days: 0, budget: 0 });

  const fetchStats = useCallback(async () => {
    try {
      const res = await tripApi.list();
      const tripsData = res.data || [];
      const tripsCount = tripsData.length;
      const daysCount = tripsData.reduce((sum, t) => sum + (t.days || 0), 0);
      const budgetSum = tripsData.reduce((sum, t) => sum + (t.budget || 0), 0);
      setStats({ trips: tripsCount, days: daysCount, budget: budgetSum });
    } catch {
      // ignore
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchStats();
    }, [fetchStats])
  );

  const handleLogout = () => {
    const performLogout = async () => {
      await logout();
      router.replace("/login");
    };

    if (Platform.OS === "web") {
      const confirm = window.confirm("Log out? Are you sure?");
      if (confirm) {
        performLogout();
      }
    } else {
      Alert.alert("Log out", "Are you sure?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Log out",
          style: "destructive",
          onPress: performLogout,
        },
      ]);
    }
  };

  const homeSymbol = getCurrencySymbol(user?.homeCurrency || "INR");

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Custom Avatar with Gradient Ring */}
      <View style={styles.avatarContainer}>
        <LinearGradient
          colors={["#4A90E2", "#8E24AA"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientRing}
        >
          <View style={styles.avatarInner}>
            {user?.name ? (
              <Text style={styles.avatarText}>
                {user.name.trim().charAt(0).toUpperCase()}
              </Text>
            ) : (
              <Ionicons name="person" size={32} color={colors.primary} />
            )}
          </View>
        </LinearGradient>
      </View>

      {/* Identity block */}
      <Text style={styles.name}>{user?.name || "Traveler"}</Text>
      <Text style={styles.email}>{user?.email}</Text>

      {/* Travel Stats Row (Eyebrow Stat Line style) */}
      <View style={styles.statsRow}>
        <View style={styles.statBlock}>
          <Text style={styles.statNumber}>{stats.trips}</Text>
          <Text style={styles.statLabel}>TRIPS</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBlock}>
          <Text style={styles.statNumber}>{stats.days}</Text>
          <Text style={styles.statLabel}>DAYS</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBlock}>
          <Text style={styles.statNumber}>
            {homeSymbol}{stats.budget.toLocaleString()}
          </Text>
          <Text style={styles.statLabel}>BUDGET</Text>
        </View>
      </View>

      {/* Settings Currency Row */}
      <TouchableOpacity
        style={styles.settingsCard}
        onPress={() =>
          Toast.show({
            type: "info",
            text1: "Currency Settings",
            text2: "Changing currency is coming soon!",
          })
        }
        activeOpacity={0.8}
      >
        <Text style={styles.settingsLabel}>Home currency</Text>
        <View style={styles.settingsValueContainer}>
          <Text style={styles.settingsValue}>{user?.homeCurrency || "USD"}</Text>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={colors.textMuted}
            style={{ marginLeft: 6 }}
          />
        </View>
      </TouchableOpacity>

      {/* Log out button */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
        <Ionicons name="log-out-outline" size={18} color={colors.danger} />
        <Text style={styles.logoutText}>Log out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  contentContainer: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 40,
    alignItems: "center",
    flexGrow: 1,
  },
  avatarContainer: {
    marginBottom: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  gradientRing: {
    width: 90,
    height: 90,
    borderRadius: 45,
    padding: 3, // border thickness
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInner: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: colors.textPrimary,
    fontSize: 36,
    fontFamily: fonts.bold,
  },
  name: {
    color: colors.textPrimary,
    fontSize: 22,
    fontFamily: fonts.bold,
  },
  email: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 4,
    marginBottom: 24,
    fontFamily: fonts.medium,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 16,
    paddingHorizontal: 10,
    width: "100%",
    marginBottom: 24,
  },
  statBlock: {
    flex: 1,
    alignItems: "center",
  },
  statNumber: {
    color: colors.textPrimary,
    fontSize: 18,
    fontFamily: fonts.bold,
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 10,
    fontFamily: fonts.medium,
    letterSpacing: 1,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.border,
  },
  settingsCard: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 40,
  },
  settingsLabel: {
    color: colors.textMuted,
    fontSize: 14,
    fontFamily: fonts.medium,
  },
  settingsValueContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingsValue: {
    color: colors.textPrimary,
    fontSize: 14,
    fontFamily: fonts.bold,
  },
  logoutBtn: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1.5,
    borderColor: colors.danger,
    backgroundColor: colors.surface,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: "auto", // pushes logout button to the bottom
  },
  logoutText: {
    color: colors.danger,
    fontSize: 16,
    fontFamily: fonts.bold,
  },
});
