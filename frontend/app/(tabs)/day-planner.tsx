import { StyleSheet, Text, View } from "react-native";

export default function DayPlanner() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Day Planner</Text>
      <Text style={styles.subtitle}>Plan your full day schedule</Text>

      <View style={styles.card}>
        <Text style={styles.cardText}>No day plans yet!</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0F1F",
    padding: 20,
  },
  title: {
    color: "white",
    fontSize: 28,
    fontWeight: "bold",
  },
  subtitle: {
    color: "#aaa",
    fontSize: 16,
    marginTop: 4,
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#162033",
    padding: 20,
    borderRadius: 12,
    marginTop: 10,
  },
  cardText: {
    color: "white",
    fontSize: 16,
  },
});
