import { useFonts } from "expo-font";
import { SplashScreen, Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "../../i18next/i18next";

import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../store/auth.store";
import "./global.css";

SplashScreen.preventAutoHideAsync();

const getRouteByRole = (role?: string | null) => {
  const r = role?.toLowerCase().trim() || "";
  if (r === 'admin') return '/(admin)/dashboard' as const;
  if (r === 'cashier') return '/(cashier)' as const;
  return '/(taps)' as const;
};

// الصفحات المسموح تفتحها من غير ما يرجعك الرئيسية
const ALLOWED_OUTSIDE = ["checkout", "addresses", "product", "[id]"];

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

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    initializeAuth().then((unsub) => { unsubscribe = unsub; });
    return () => { unsubscribe?.(); };
  }, [initializeAuth]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") router.replace("/" as any);
    });
    return () => subscription.unsubscribe();
  }, [router]);

  useEffect(() => {
    if (error) throw error;
    if (fontsLoaded &&!isLoading) SplashScreen.hideAsync();
  }, [fontsLoaded, isLoading, error]);

  useEffect(() => {
    if (!fontsLoaded || isLoading) return;

    const inAuthGroup = segments[0] === "(auth)";
    const currentGroup = segments[0] as string;

    // *** ده السطر اللي بيحل مشكلتك ***
    // لو انت في checkout سيبه يفتح عادي
    if (ALLOWED_OUTSIDE.includes(currentGroup) || currentGroup === "checkout") {
      return;
    }

    if (!isAuthenticated) {
      if (!inAuthGroup) router.replace("/(auth)/sign-in" as any);
      return;
    }

    if (!profile) return;

    const role = profile.role?.toLowerCase().trim() || "";

    if (inAuthGroup) {
      router.replace(getRouteByRole(role) as any);
      return;
    }

    if (role === "admin" && currentGroup!== "(admin)") {
      router.replace("/(admin)/dashboard" as any);
    } else if (role === "cashier" && currentGroup!== "(cashier)") {
      router.replace("/(cashier)" as any);
    } else if (!["admin","cashier"].includes(role) && currentGroup!== "(taps)" && currentGroup!== "(tabs)") {
      router.replace("/(taps)" as any);
    }
  }, [fontsLoaded, isLoading, isAuthenticated, profile, segments, router]);

  if (!fontsLoaded || isLoading) return null;

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(taps)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="checkout" options={{ headerShown: false }} />
        <Stack.Screen name="addresses" options={{ headerShown: false }} />
      </Stack>
    </SafeAreaProvider>
  );
}