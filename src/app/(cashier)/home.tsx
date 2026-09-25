import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  SafeAreaView,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { supabase } from "../../../lib/supabase";
import { getPendingOrders, getTodayOrders } from "../../../lib/queries";

export default function CashierHome() {
  const [stats, setStats] = useState({
    totalOrders: 0,
    completed: 0,
    pending: 0,
    cancelled: 0,
    totalSales: 0,
  });
  const [loading, setLoading] = useState(true);

  // Fetch stats from Supabase
  useEffect(() => {
    async function fetchStats() {
      setLoading(true);
      try {
        // Get today's orders
        const todayOrders = await getTodayOrders();

        // Calculate stats
        const totalOrders = todayOrders.length;
        const completed = todayOrders.filter(o => o.status === "completed").length;
        const pending = todayOrders.filter(o => o.status === "pending").length;
        const cancelled = todayOrders.filter(o => o.status === "cancelled").length;
        const totalSales = todayOrders.reduce((sum, o) => sum + (o.total ?? 0), 0);

        setStats({
          totalOrders,
          completed,
          pending,
          cancelled,
          totalSales: Math.round(totalSales * 100) / 100, // Round to 2 decimals
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

  const handleNewOrder = () => {
    router.push("/(cashier)/cart" as any);
  };

  if (loading) {
    return (
      <SafeAreaView style={{ backgroundColor: "#FFFBF2", flex: 1 }}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" />
          <Text className="mt-4 text-dark-100">جاري التحميل...</Text>
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
            shadowColor: "#000",
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2,
          }}
        >
          <Text className="h3-bold text-dark-100 mb-2">مبيعات اليوم</Text>
          <Text className="h1-bold text-primary">
            {stats.totalSales?.toFixed(2)} ج.م
          </Text>
          <Text className="text-gray-500">إجمالي المبيعات</Text>
        </View>

        {/* 2x2 Stat Grid */}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
          {/* Total Orders */}
          <View
            style={{
              flex: 1,
              minWidth: 120,
              backgroundColor: "#ffffff",
              borderRadius: 16,
              padding: 16,
              shadowColor: "#000",
              shadowOpacity: 0.03,
              shadowRadius: 6,
              elevation: 1,
            }}
          >
            <Text className="text-gray-500 mb-2">إجمالي الطلبات</Text>
            <Text className="h2-bold text-dark-100">{stats.totalOrders}</Text>
          </View>

          {/* Completed */}
          <View
            style={{
              flex: 1,
              minWidth: 120,
              backgroundColor: "#ffffff",
              borderRadius: 16,
              padding: 16,
              shadowColor: "#000",
              shadowOpacity: 0.03,
              shadowRadius: 6,
              elevation: 1,
            }}
          >
            <Text className="text-gray-500 mb-2">مكتملة</Text>
            <Text className="h2-bold text-success">{stats.completed}</Text>
          </View>

          {/* Pending */}
          <View
            style={{
              flex: 1,
              minWidth: 120,
              backgroundColor: "#ffffff",
              borderRadius: 16,
              padding: 16,
              shadowColor: "#000",
              shadowOpacity: 0.03,
              shadowRadius: 6,
              elevation: 1,
            }}
          >
            <Text className="text-gray-500 mb-2">قيد الانتظار</Text>
            <Text className="h2-bold text-warning">{stats.pending}</Text>
          </View>

          {/* Cancelled */}
          <View
            style={{
              flex: 1,
              minWidth: 120,
              backgroundColor: "#ffffff",
              borderRadius: 16,
              padding: 16,
              shadowColor: "#000",
              shadowOpacity: 0.03,
              shadowRadius: 6,
              elevation: 1,
            }}
          >
            <Text className="text-gray-500 mb-2">ملغاة</Text>
            <Text className="h2-bold text-error">{stats.cancelled}</Text>
          </View>
        </View>

        {/* New Order Button */}
        <Pressable
          onPress={handleNewOrder}
          style={{
            marginTop: 24,
            backgroundColor: "#C9A86A",
            borderRadius: 12,
            padding: 16,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text className="h3-bold text-white">طلب جديد</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}