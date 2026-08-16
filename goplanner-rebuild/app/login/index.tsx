import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import { useAuth, ApiError } from "@/context/AuthContext";

export default function LoginScreen() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password) {
      Toast.show({ type: "error", text1: "Missing info", text2: "Email and password are required." });
      return;
    }
    if (submitting) return;

    setSubmitting(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(name, email, password);
      }
      Toast.show({ type: "success", text1: mode === "login" ? "Welcome back" : "Account created", text2: "Let's plan a trip 🎉" });
      router.replace("/(tabs)/dashboard");
    } catch (err) {
      const apiError = err instanceof ApiError ? err : null;
      const message = apiError ? apiError.message : "Something went wrong. Please try again.";

      if (mode === "register" && apiError?.status === 409) {
        setMode("login");
        setPassword("");
        Toast.show({
          type: "info",
          text1: "Account already exists",
          text2: "Switching to login with this email.",
        });
        return;
      }

      if (mode === "login" && apiError?.status === 401) {
        Toast.show({
          type: "error",
          text1: "Login failed",
          text2: "Wrong email or password. Try again or create a new account.",
        });
        return;
      }

      Toast.show({ type: "error", text1: mode === "login" ? "Login failed" : "Registration failed", text2: message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Image source={require("../../assets/images/splash.png")} style={styles.logo} resizeMode="contain" />
      <Text style={styles.title}>GoPlanner</Text>

      <View style={styles.tabRow}>
        <TouchableOpacity onPress={() => setMode("login")} style={[styles.tabBtn, mode === "login" && styles.tabBtnActive]}>
          <Text style={[styles.tabText, mode === "login" && styles.tabTextActive]}>Log In</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setMode("register")} style={[styles.tabBtn, mode === "register" && styles.tabBtnActive]}>
          <Text style={[styles.tabText, mode === "register" && styles.tabTextActive]}>Sign Up</Text>
        </TouchableOpacity>
      </View>

      {mode === "register" && (
        <TextInput
          placeholder="Name"
          placeholderTextColor="#888"
          value={name}
          onChangeText={setName}
          style={styles.input}
          autoCapitalize="words"
        />
      )}

      <TextInput
        placeholder="Email"
        placeholderTextColor="#888"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        placeholder="Password"
        placeholderTextColor="#888"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={styles.input}
      />
      {mode === "register" && <Text style={styles.hint}>At least 8 characters.</Text>}

      <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={submitting}>
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>{mode === "login" ? "Log In" : "Create Account"}</Text>
        )}
      </TouchableOpacity>
    </KeyboardAvoidingView>
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
  logo: { width: 120, height: 120, marginBottom: 6 },
  title: { fontSize: 28, color: "white", fontWeight: "700", marginBottom: 24 },
  tabRow: {
    flexDirection: "row",
    backgroundColor: "#1a1a1a",
    borderRadius: 10,
    padding: 4,
    marginBottom: 20,
    width: "100%",
  },
  tabBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: "center" },
  tabBtnActive: { backgroundColor: "#4A90E2" },
  tabText: { color: "#888", fontWeight: "600" },
  tabTextActive: { color: "white" },
  input: {
    width: "100%",
    backgroundColor: "#1a1a1a",
    padding: 14,
    borderRadius: 10,
    color: "white",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#333",
  },
  hint: { color: "#666", fontSize: 12, alignSelf: "flex-start", marginBottom: 12, marginTop: -6 },
  button: {
    width: "100%",
    backgroundColor: "#4A90E2",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
    minHeight: 50,
    justifyContent: "center",
  },
  buttonText: { color: "white", fontWeight: "600", fontSize: 18 },
});
