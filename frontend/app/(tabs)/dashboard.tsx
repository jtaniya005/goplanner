import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";

export default function Dashboard() {
  return (
    <LinearGradient
      colors={["#090A0F", "#1A1B26"]}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>GoPlanner Dashboard</Text>
        <Text style={styles.subtitle}>Where to next?</Text>

        <View style={styles.cardContainer}>

          {/* Trip Planner */}
          <TouchableOpacity 
            style={styles.cardWrapper} 
            onPress={() => router.push("./trip-planner")}
            activeOpacity={0.7}
          >
            <BlurView intensity={20} tint="dark" style={styles.card}>
              <View style={[styles.iconContainer, { backgroundColor: "rgba(0, 242, 254, 0.15)" }]}>
                <Ionicons name="airplane" size={32} color="#00F2FE" />
              </View>
              <Text style={styles.cardText}>Trip Planner</Text>
            </BlurView>
          </TouchableOpacity>

          {/* Day Planner */}
          <TouchableOpacity 
            style={styles.cardWrapper} 
            onPress={() => router.push("./day-planner")}
            activeOpacity={0.7}
          >
            <BlurView intensity={20} tint="dark" style={styles.card}>
              <View style={[styles.iconContainer, { backgroundColor: "rgba(163, 113, 247, 0.15)" }]}>
                <Ionicons name="calendar" size={32} color="#A371F7" />
              </View>
              <Text style={styles.cardText}>Day Planner</Text>
            </BlurView>
          </TouchableOpacity>

          {/* Maps */}
          <TouchableOpacity 
            style={styles.cardWrapper} 
            onPress={() => router.push("./maps")}
            activeOpacity={0.7}
          >
            <BlurView intensity={20} tint="dark" style={styles.card}>
              <View style={[styles.iconContainer, { backgroundColor: "rgba(79, 172, 254, 0.15)" }]}>
                <Ionicons name="map" size={32} color="#4FACFE" />
              </View>
              <Text style={styles.cardText}>Maps</Text>
            </BlurView>
          </TouchableOpacity>

          {/* Manual Planner */}
          <TouchableOpacity 
            style={styles.cardWrapper} 
            onPress={() => router.push("./manual-trip")}
            activeOpacity={0.7}
          >
            <BlurView intensity={20} tint="dark" style={styles.card}>
              <View style={[styles.iconContainer, { backgroundColor: "rgba(255, 159, 67, 0.15)" }]}>
                <Ionicons name="pencil" size={32} color="#FF9F43" />
              </View>
              <Text style={styles.cardText}>Plan Trip Manually</Text>
            </BlurView>
          </TouchableOpacity>

          {/*Weather*/}
          <TouchableOpacity 
            style={styles.cardWrapper} 
            onPress={() => router.push("./weather")}
            activeOpacity={0.7}
          >
            <BlurView intensity={20} tint="dark" style={styles.card}>
              <View style={[styles.iconContainer, { backgroundColor: "rgba(26, 188, 156, 0.15)" }]}>
                <Ionicons name="cloud" size={32} color="#1ABC9C" />
              </View>
              <Text style={styles.cardText}>Weather</Text>
            </BlurView>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  title: {
    color: "white",
    fontSize: 32,
    fontWeight: "800",
    marginBottom: 4,
  },
  subtitle: {
    color: "#888",
    fontSize: 16,
    marginBottom: 30,
  },
  cardContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  cardWrapper: {
    width: "48%",
    marginBottom: 16,
    borderRadius: 20,
    overflow: "hidden",
  },
  card: {
    padding: 20,
    height: 160,
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  cardText: {
    color: "white",
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 22,
  },
});
