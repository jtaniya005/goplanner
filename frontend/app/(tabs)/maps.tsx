import { StyleSheet, Text, View } from "react-native";

export default function Maps() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Maps</Text>
      <Text style={styles.subtitle}>Explore routes and locations</Text>

      <View style={styles.mapBox}>
        <Text style={styles.mapText}>Map Preview Coming Soon</Text>
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
  mapBox: {
    backgroundColor: "#162033",
    height: 250,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
  },
  mapText: {
    color: "#aaa",
  },
});
