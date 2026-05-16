import { router } from "expo-router";
import { useEffect } from "react";
import Splash from "./splash";

export default function Index() {
  useEffect(() => {
    setTimeout(() => {
      router.replace("/login"); // go to login
    }, 2000); // 2 seconds splash
  }, []);

  return <Splash />;
}
