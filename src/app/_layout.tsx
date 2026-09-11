import { useFonts } from "expo-font";
import { SplashScreen, Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import "../../i18next/i18next";

import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../store/auth.store";
import "./global.css";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();

  const { isLoading, isAuthenticated, initializeAuth } = useAuthStore();

  const [fontsLoaded, error] = useFonts({
    "QuickSand-Bold": require("../../assets/fonts/Quicksand-Bold.ttf"),
    "QuickSand-Medium": require("../../assets/fonts/Quicksand-Medium.ttf"),
    "QuickSand-Regular": require("../../assets/fonts/Quicksand-Regular.ttf"),
    "QuickSand-SemiBold": require("../../assets/fonts/Quicksand-SemiBold.ttf"),
    "QuickSand-Light": require("../../assets/fonts/Quicksand-Light.ttf"),
  });

  // =========================
  // Initialize Auth
  // =========================
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    initializeAuth().then((unsub) => {
      unsubscribe = unsub;
    });

    return () => {
      unsubscribe?.();
    };
  }, [initializeAuth]);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        router.replace("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  // =========================
  // Fonts + Auth Loading -> Splash Screen
  // =========================
  useEffect(() => {
    if (error) {
      throw error;
    }

    if (fontsLoaded && !isLoading) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, isLoading, error]);

  // =========================
  // Auth Routing
  // =========================
  useEffect(() => {
    if (!fontsLoaded || isLoading) {
      return;
    }

    const inAuthGroup = segments[0] === "(auth)";

    // Not authenticated
    if (!isAuthenticated) {
      if (!inAuthGroup) {
        router.replace("/sign-in");
      }

      return;
    }

    // Authenticated
    if (inAuthGroup) {
      router.replace("/");
    }
  }, [fontsLoaded, isLoading, isAuthenticated, segments, router]);

  // =========================
  // Loading
  // =========================
  if (!fontsLoaded || isLoading) {
    return null;
  }

  // =========================
  // App
  // =========================
  return <Stack screenOptions={{ headerShown: false }} />;
}
