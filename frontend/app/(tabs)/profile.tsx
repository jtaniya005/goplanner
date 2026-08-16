import { router } from "expo-router";
import React from "react";
import {
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";

export default function Settings() {

  const user = {
    name: "Admin User",
    email: "admin@gmail.com",
    createdAt: "10 December 2025",
    profilePic: "https://i.pravatar.cc/200"
  };

  const handleLogout = () => {
    Alert.alert("Logout", "You have been logged out.");
    router.replace("../login/index")
  };

  return (
    <LinearGradient
      colors={["#090A0F", "#1A1B26"]}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      <BlurView intensity={20} tint="dark" style={styles.profileCard}>
        {/* PROFILE PIC */}
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: user.profilePic }} 
            style={styles.profilePic} 
          />
          <View style={styles.onlineIndicator} />
        </View>

        {/* USER NAME */}
        <Text style={styles.name}>{user.name}</Text>

        {/* USER EMAIL */}
        <Text style={styles.email}>{user.email}</Text>

        {/* ACCOUNT CREATED DATE */}
        <Text style={styles.date}>Member since: {user.createdAt}</Text>
      </BlurView>

      {/* ALL TRIPS BUTTON */}
      <TouchableOpacity activeOpacity={0.8} style={styles.buttonWrapper}>
        <LinearGradient
          colors={["#00F2FE", "#4FACFE"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.button}
        >
          <Ionicons name="list" size={20} color="white" style={styles.buttonIcon} />
          <Text style={styles.buttonText}>View All Trips</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* LOGOUT BUTTON */}
      <TouchableOpacity activeOpacity={0.8} style={styles.buttonWrapper} onPress={handleLogout}>
        <BlurView intensity={20} tint="dark" style={[styles.button, styles.logoutButton]}>
          <Ionicons name="log-out-outline" size={20} color="#ff6666" style={styles.buttonIcon} />
          <Text style={styles.logoutText}>Logout</Text>
        </BlurView>
      </TouchableOpacity>

    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  header: {
    width: "100%",
    marginBottom: 20,
  },
  title: {
    color: "white",
    fontSize: 32,
    fontWeight: "800",
  },
  profileCard: {
    width: "100%",
    padding: 30,
    borderRadius: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    marginBottom: 30,
    overflow: "hidden",
  },
  imageContainer: {
    position: "relative",
    marginBottom: 20,
  },
  profilePic: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: "#4FACFE",
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 5,
    right: 5,
    width: 20,
    height: 20,
    backgroundColor: "#1ABC9C",
    borderRadius: 10,
    borderWidth: 3,
    borderColor: "#090A0F",
  },
  name: {
    fontSize: 26,
    color: "#fff",
    fontWeight: "700",
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: "#00F2FE",
    marginBottom: 10,
    fontWeight: "500",
  },
  date: {
    fontSize: 14,
    color: "#888",
  },
  buttonWrapper: {
    width: "100%",
    marginBottom: 15,
    borderRadius: 16,
    overflow: "hidden",
  },
  button: {
    flexDirection: "row",
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonIcon: {
    marginRight: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  logoutButton: {
    backgroundColor: "rgba(255, 102, 102, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 102, 102, 0.3)",
  },
  logoutText: {
    color: "#ff6666",
    fontSize: 18,
    fontWeight: "700",
  },
});
