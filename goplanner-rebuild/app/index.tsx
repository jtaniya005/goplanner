import { router } from "expo-router";
import { useEffect } from "react";
import Splash from "./splash";
import { useAuth } from "@/context/AuthContext";

export default function Index() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    const timer = setTimeout(() => {
      router.replace(user ? "/(tabs)/dashboard" : "/login");
    }, 900);
    return () => clearTimeout(timer);
  }, [loading, user]);

  return <Splash />;
}
