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
    <View style={styles.container}>

      {/* PROFILE PIC */}
      <Image 
        source={{ uri: user.profilePic }} 
        style={styles.profilePic} 
      />

      {/* USER NAME */}
      <Text style={styles.name}>{user.name}</Text>

      {/* USER EMAIL */}
      <Text style={styles.email}>{user.email}</Text>

      {/* ACCOUNT CREATED DATE */}
      <Text style={styles.date}>Account Created: {user.createdAt}</Text>

      {/* ALL TRIPS BUTTON */}
      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>View All Trips</Text>
      </TouchableOpacity>

      {/* LOGOUT BUTTON */}
      <TouchableOpacity 
        style={[styles.button, styles.logoutButton]} 
        onPress={handleLogout}
      >
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    paddingTop: 80,
  },

  profilePic: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: "#333",
    marginBottom: 20
  },

  name: {
    fontSize: 24,
    color: "#fff",
    fontWeight: "600",
    marginBottom: 5
  },

  email: {
    fontSize: 16,
    color: "#bbb",
    marginBottom: 5
  },

  date: {
    fontSize: 14,
    color: "#666",
    marginBottom: 40
  },

  button: {
    width: "85%",
    backgroundColor: "#1a1a1a",
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#333",
  },

  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "500",
  },

  logoutButton: {
    backgroundColor: "#300",
    borderColor: "#600",
  },

  logoutText: {
    color: "#ff6666",
    fontSize: 18,
    fontWeight: "600",
  },
});
