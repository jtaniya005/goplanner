import { Image, StyleSheet, View } from "react-native";

// Purely presentational — app/index.tsx owns the auth-aware redirect timing
// so this component doesn't need (and shouldn't have) its own navigation.
export default function SplashScreen() {
  return (
    <View style={styles.container}>
      <Image 
        source={require("../assets/images/splash.png")}
        style={styles.logo}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0D0D0D",
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 250,
    height: 250,
  },
});
