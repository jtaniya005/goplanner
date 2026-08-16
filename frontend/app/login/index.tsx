import { router } from "expo-router";
import { useState } from "react";
import { Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import Toast from "react-native-toast-message";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";

export default function LoginScreen() {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isFocusedEmail, setIsFocusedEmail] = useState(false);
  const [isFocusedPassword, setIsFocusedPassword] = useState(false);

  const handleLogin = () => {
    if (email.length > 0 && password.length > 0) {
      Toast.show({
        type: "success",
        text1: "Login Successful",
        text2: "Welcome to GoPlanner 🎉",
      });

      setTimeout(() => {
        router.replace("./(tabs)/dashboard");
      }, 1000);
    } else {
      Toast.show({
        type: "error",
        text1: "Invalid Credentials",
        text2: "Please enter any email and password to continue",
      });
    }
  };

  return (
    <LinearGradient
      colors={["#090A0F", "#1A1B26"]}
      style={styles.container}
    >
      <View style={styles.content}>
        <Image 
          source={require("../../assets/images/splash.png")}
          style={styles.logo}
          resizeMode="contain"
        />

        <BlurView intensity={20} tint="dark" style={styles.card}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to continue</Text>

          <View style={[styles.inputContainer, isFocusedEmail && styles.inputFocused]}>
            <TextInput
              placeholder="Email"
              placeholderTextColor="#888"
              value={email}
              onChangeText={setEmail}
              style={styles.input}
              onFocus={() => setIsFocusedEmail(true)}
              onBlur={() => setIsFocusedEmail(false)}
            />
          </View>

          <View style={[styles.inputContainer, isFocusedPassword && styles.inputFocused]}>
            <TextInput
              placeholder="Password"
              placeholderTextColor="#888"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              style={styles.input}
              onFocus={() => setIsFocusedPassword(true)}
              onBlur={() => setIsFocusedPassword(false)}
            />
          </View>

          <TouchableOpacity style={styles.buttonContainer} onPress={handleLogin} activeOpacity={0.8}>
            <LinearGradient
              colors={["#00F2FE", "#4FACFE"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.button}
            >
              <Text style={styles.buttonText}>Login</Text>
            </LinearGradient>
          </TouchableOpacity>
        </BlurView>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 30,
  },
  card: {
    width: "100%",
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    overflow: "hidden",
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    color: "white",
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#888",
    marginBottom: 30,
  },
  inputContainer: {
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  inputFocused: {
    borderColor: "#4FACFE",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  input: {
    padding: 16,
    color: "white",
    fontSize: 16,
  },
  buttonContainer: {
    width: "100%",
    marginTop: 10,
    borderRadius: 12,
    overflow: "hidden",
  },
  button: {
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 18,
    letterSpacing: 0.5,
  },
});
