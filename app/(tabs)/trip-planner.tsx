import { StyleSheet, Text, View } from "react-native";

export default function TripPlanner() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Trip Planner</Text>
      <Text style={styles.subtitle}>Plan multi-day trips with ease</Text>

      <View style={styles.card}>
        <Text style={styles.cardText}>No trips created yet!</Text>
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
