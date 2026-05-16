import { router } from "expo-router";
import { useState } from "react";
import { Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import Toast from "react-native-toast-message";

export default function LoginScreen() {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    if (email === "admin@gmail.com" && password === "admin123") {
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
        text2: "Please check your email or password",
      });
    }
  };

  return (
    <View style={styles.container}>
      <Image 
        source={require("../../assets/images/splash.png")}
        style={styles.logo}
        resizeMode="contain"
      />
      <TextInput
        placeholder="Email"
        placeholderTextColor="#888"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
      />

      <TextInput
        placeholder="Password"
        placeholderTextColor="#888"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={styles.input}
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0D0D0D",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 25,
  },
  logo: {
    width: 140,
    height: 140,
    marginBottom: 10,
  },
  title: {
    fontSize: 32,
    color: "white",
    fontWeight: "600",
    marginBottom: 40,
  },
  input: {
    width: "100%",
    backgroundColor: "#1a1a1a",
    padding: 14,
    borderRadius: 10,
    color: "white",
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#333",
  },
  button: {
    width: "100%",
    backgroundColor: "#4A90E2",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 18,
  },
});
