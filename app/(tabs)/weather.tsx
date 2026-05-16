import { StyleSheet, Text, View } from 'react-native';

export default function Weather() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Weather Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0F1F",
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    color: "white",
    fontSize: 20,
  },
});
