import { router } from "expo-router";
import { useEffect } from "react";
import { StyleSheet } from "react-native";
import Animated, { ZoomIn, ZoomOut } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

export default function SplashScreen() {
  useEffect(() => {
    const timer = setTimeout(() => {
      router.navigate("./login/index");
    }, 2500); // 2.5 seconds

    return () => clearTimeout(timer);
  }, []);

  return (
    <LinearGradient
      colors={["#090A0F", "#1A1B26"]}
      style={styles.container}
    >
      <Animated.Image 
        source={require("../assets/images/splash.png")}
        style={styles.logo}
        resizeMode="contain"
        entering={ZoomIn.duration(1000)}
        exiting={ZoomOut.duration(500)}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 250,
    height: 250,
  },
});
