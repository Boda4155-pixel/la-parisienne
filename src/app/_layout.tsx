import { useFonts } from "expo-font";
import { SplashScreen, Stack, useRouter, useSegments } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useEffect } from "react";
import "../../i18next/i18next";

import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../store/auth.store";
import "./global.css";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();

  const { isLoading, isAuthenticated, profile, initializeAuth } = useAuthStore();

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
      router.replace(profile?.role === "admin" ? "/dashboard" : "/");
      return;
    }

    // Admin users should land on the admin dashboard, not customer screens
    if (profile?.role === "admin" && segments[0] !== "(admin)") {
      router.replace("/dashboard");
    }

    // Cashier users should land on the cashier POS, not customer screens
    if (profile?.role === "cashier" && (segments[0] as string) !== "(cashier)") {
      router.replace("/(cashier)/home" as any);
    }
  }, [fontsLoaded, isLoading, isAuthenticated, profile, segments, router]);

  // =========================
  // Loading
  // =========================
  if (!fontsLoaded || isLoading) {
    return null;
  }

  // =========================
  // App
  // =========================
  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </SafeAreaProvider>
  );
}
