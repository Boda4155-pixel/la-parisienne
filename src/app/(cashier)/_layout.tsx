import { Tabs } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useEffect } from "react";
import { router } from "expo-router";
import { useAuthStore } from "../../../store/auth.store";
import CashierTabBar from "../../../components/cashier/CashierTabBar";

export default function CashierLayoutRoute() {
  const { profile, isAuthenticated, isLoading } = useAuthStore();
  const isCashier = profile?.role === "cashier";

  // Redirect non-cashiers to home
  useEffect(() => {
    if (!isLoading && isAuthenticated && !isCashier) {
      router.replace("/");
    }
  }, [isLoading, isAuthenticated, isCashier]);

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

  // Non-cashier user should have been redirected
  if (!isCashier) {
    return null;
  }

  return (
    <CashierTabBar>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: "Home",
          }}
        />
        <Tabs.Screen
          name="orders"
          options={{
            title: "Orders",
          }}
        />
        <Tabs.Screen
          name="products"
          options={{
            title: "Products",
          }}
        />
        <Tabs.Screen
          name="account"
          options={{
            title: "More",
          }}
        />
      </Tabs>
    </CashierTabBar>
  );
}