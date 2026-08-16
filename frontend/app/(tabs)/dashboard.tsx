import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function Dashboard() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>GoPlanner Dashboard</Text>

      <View style={styles.cardContainer}>

        {/* Trip Planner */}
        <TouchableOpacity 
          style={styles.card} 
          onPress={() => router.push("./trip-planner")}
        >
          <Ionicons name="airplane-outline" size={40} color="#4A90E2" />
          <Text style={styles.cardText}>Trip Planner</Text>
        </TouchableOpacity>

        {/* Day Planner */}
        <TouchableOpacity 
          style={styles.card} 
          onPress={() => router.push("./day-planner")}
        >
          <Ionicons name="calendar-outline" size={40} color="#4A90E2" />
          <Text style={styles.cardText}>Day Planner</Text>
        </TouchableOpacity>

        {/* Maps */}
        <TouchableOpacity 
          style={styles.card} 
          onPress={() => router.push("./maps")}
        >
          <Ionicons name="map-outline" size={40} color="#4A90E2" />
          <Text style={styles.cardText}>Maps</Text>
        </TouchableOpacity>

        {/* Manual Planner */}
        <TouchableOpacity 
          style={styles.card} 
          onPress={() => router.push("./manual-trip")}
        >
          <Ionicons name="pencil-outline" size={40} color="#4A90E2" />
          <Text style={styles.cardText}>Plan Trip Manually</Text>
        </TouchableOpacity>

        {/*Weather*/}
        <TouchableOpacity 
          style={styles.card} 
          onPress={() => router.push("./weather")}
        >
          <Ionicons name="cloud-outline" size={40} color="#4A90E2" />
          <Text style={styles.cardText}>Weather</Text>
        </TouchableOpacity>

      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0D0D0D",
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  title: {
    color: "white",
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
  },
  cardContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    width: "48%",
    height: 150,
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#333",
  },
  cardText: {
    color: "white",
    marginTop: 10,
    fontSize: 16,
    fontWeight: "600",
  },
});
