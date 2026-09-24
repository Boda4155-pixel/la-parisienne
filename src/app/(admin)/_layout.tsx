import { Stack, Slot } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { useEffect } from "react";
import { router } from "expo-router";
import { useAuthStore } from "../../../store/auth.store";
import AdminLayout from "../../../components/admin/AdminLayout";

export default function AdminLayoutRoute() {
  const { profile, isAuthenticated, isLoading } = useAuthStore();
  const isAdmin = profile?.role === "admin";

  // Redirect non-admins to home
  useEffect(() => {
    if (!isLoading && isAuthenticated && !isAdmin) {
      router.replace("/");
    }
  }, [isLoading, isAuthenticated, isAdmin]);

  // Show loading while auth is initializing
  if (isLoading || !isAuthenticated) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#FDF8F3",
        }}
      >
        <ActivityIndicator size="large" color="#FE8C00" />
      </View>
    );
  }

  // Non-admin user should have been redirected
  if (!isAdmin) {
    return null;
  }

  // Slot must stay in the route layout so Expo Router renders the active child screen.
  return (
    <AdminLayout>
      <Slot />
    </AdminLayout>
  );
}
