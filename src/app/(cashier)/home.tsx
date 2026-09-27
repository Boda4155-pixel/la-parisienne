import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  Text,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { router } from "expo-router";
import { supabase } from "../../../lib/supabase";
import { getTodayOrders } from "../../../lib/queries";

export default function CashierHome() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const [stats, setStats] = useState({
    totalOrders: 0,
    completed: 0,
    pending: 0,
    cancelled: 0,
    totalSales: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      try {
        const { data: todayOrders, error } = await getTodayOrders();
        if (error) throw error;
        const orders = todayOrders ?? [];
        const totalOrders = orders.length;
        const completed = orders.filter((o) => o.status === "completed").length;
        const pending = orders.filter((o) => o.status === "pending").length;
        const cancelled = orders.filter((o) => o.status === "cancelled").length;
        const totalSales = orders.reduce((sum, o) => sum + (o.total ?? 0), 0);

        setStats({
          totalOrders,
          completed,
          pending,
          cancelled,
          totalSales: Math.round(totalSales * 100) / 100,
        });
      } catch (error) {
        console.error("Error fetching home stats:", error);
        Alert.alert("Error", "Failed to load stats");
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={{ backgroundColor: "#FFFBF2", flex: 1 }}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" />
          <Text className="mt-4 text-dark-100">
            {t("common.loading", "Loading...")}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ backgroundColor: "#FFFBF2", flex: 1 }}>
      <View style={{ padding: 20 }}>
        {/* Today's Sales Card */}
        <View
          style={{
            backgroundColor: "#ffffff",
            borderRadius: 20,
            padding: 20,
            marginBottom: 20,
          }}
        >
          <Text className="h3-bold text-dark-100 mb-2">
            {t("cashier.todaysSales", "Today's Sales")}
          </Text>
          <Text className="h1-bold text-primary">
            {stats.totalSales.toFixed(2)} EGP
          </Text>
        </View>

        {/* 2x2 Stat Grid */}
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          {[
            { label: t("cashier.totalOrders", "Total Orders"), value: stats.totalOrders, color: "#181C2E" },
            { label: t("cashier.completed", "Completed"), value: stats.completed, color: "#7A9E7E" },
            { label: t("cashier.pending", "Pending"), value: stats.pending, color: "#FE8C00" },
            { label: t("cashier.cancelled", "Cancelled"), value: stats.cancelled, color: "#C0392B" },
          ].map((stat) => (
            <View
              key={stat.label}
              style={{
                flex: 1,
                minWidth: 120,
                backgroundColor: "#ffffff",
                borderRadius: 16,
                padding: 16,
              }}
            >
              <Text className="text-gray-500 mb-2">{stat.label}</Text>
              <Text className="h2-bold" style={{ color: stat.color }}>
                {stat.value}
              </Text>
            </View>
          ))}
        </View>

        {/* New Order Button */}
        <Pressable
          onPress={() => router.push("/(cashier)/cart" as any)}
          style={{
            marginTop: 24,
            backgroundColor: "#C9A86A",
            borderRadius: 12,
            padding: 16,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text className="h3-bold text-white">
            {t("cashier.newOrder", "New Order")}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}