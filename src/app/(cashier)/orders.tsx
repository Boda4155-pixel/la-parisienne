import { Alert, FlatList, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  CheckCircle2,
  CircleDashed,
  Clock3,
  MessageCircle,
  Package,
  XCircle,
} from "lucide-react-native";
import { router } from "expo-router";
import {
  getPendingOrders,
  getTodayOrders,
  updateOrderStatus,
} from "../../../lib/queries";

const STATUS_COLORS: Record<string, string> = {
  pending: "#D4A574",
  confirmed: "#7A9E7E",
  preparing: "#B18C55",
  out_for_delivery: "#8B6F8B",
  delivered: "#4A7C59",
  cancelled: "#C0392B",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "cashier.orders.status.pending",
  confirmed: "cashier.orders.status.confirmed",
  preparing: "cashier.orders.status.preparing",
  out_for_delivery: "cashier.orders.status.out_for_delivery",
  delivered: "cashier.orders.status.delivered",
  cancelled: "cashier.orders.status.cancelled",
};

const safeT = (t: any, key: string, fallback: string): string => {
  const result = t(key, fallback);
  return typeof result === "string" ? result : fallback;
};

export default function CashierOrders() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const [pendingOrders, setPendingOrders] = useState<any[]>([]);
  const [todayOrders, setTodayOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const [pending, today] = await Promise.all([
        getPendingOrders(),
        getTodayOrders(),
      ]);
      setPendingOrders(pending);
      setTodayOrders(today);
    } catch (error: any) {
      Alert.alert(safeT(t, "common.error", "Error"), error.message ?? safeT(t, "cashier.orders.failedToLoad", "Failed to load orders"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleOrderAction = async (orderId: string, status: "confirmed" | "cancelled") => {
    try {
      await updateOrderStatus(orderId, status);
      Alert.alert(
        safeT(t, "common.success", "Success"),
        safeT(t, status === "confirmed" ? "cashier.orders.confirmed" : "cashier.orders.rejected", status === "confirmed" ? "Order Confirmed" : "Order Rejected")
      );
      loadOrders();
    } catch (error: any) {
      Alert.alert(safeT(t, "common.error", "Error"), error.message ?? safeT(t, "cashier.orders.failedToUpdate", "Failed to update order"));
    }
  };

  const handleEditOrder = (order: any) => {
    router.push(`/(cashier)/order-detail?id=${order.id}` as any);
  };

  const handleMessageCustomer = (order: any) => {
    Alert.alert(
      safeT(t, "cashier.orders.messageCustomer", "Message Customer"),
      safeT(t, "cashier.orders.messageFeatureComingSoon", "Messaging feature coming soon")
    );
  };

  const handleTrackDelivery = (order: any) => {
    Alert.alert(
      safeT(t, "cashier.orders.trackDelivery", "Track Delivery"),
      safeT(t, "cashier.orders.trackingFeatureComingSoon", "Delivery tracking coming soon")
    );
  };

  const renderOrderCard = (order: any, isPending: boolean) => {
    const statusLabel = safeT(t, STATUS_LABELS[order.status] ?? "common.unknown", order.status.replace("_", " "));
    return (
      <Pressable
        key={order.id}
        className="border border-gray-200 rounded-2xl p-4 mb-3 bg-white"
        style={{ flexDirection: isRTL ? "row-reverse" : "row" }}
      >
        <View className="flex-row items-center justify-between mb-2" style={{ flex: 1 }}>
          <View className="flex-row items-center gap-x-2" style={{ flexDirection: isRTL ? "row-reverse" : "row" }}>
            <View
              className="size-2 rounded-full"
              style={{ backgroundColor: STATUS_COLORS[order.status] ?? "#9CA3AF" }}
            />
            <Text className="h4-bold text-dark-100">
              #{order.id.slice(0, 8).toUpperCase()}
            </Text>
            <View
              className="rounded-full px-2 py-0.5"
              style={{ backgroundColor: STATUS_COLORS[order.status] ?? "#9CA3AF" }}
            >
              <Text className="small-bold text-white">{statusLabel}</Text>
            </View>
          </View>
          <Text className="small-bold text-primary">
            {order.total} EGP
          </Text>
        </View>

        <View className="flex-row items-center justify-between text-gray-500 small-regular" style={{ flexDirection: isRTL ? "row-reverse" : "row" }}>
          <Text>{order.customer_name ?? safeT(t, "cashier.orders.guest", "Guest")}</Text>
          <Text>{new Date(order.created_at).toLocaleTimeString()}</Text>
        </View>

        {isPending && (
          <View className="flex-row gap-x-2 mt-3 pt-3 border-t border-gray-100" style={{ flexDirection: isRTL ? "row-reverse" : "row" }}>
            <Pressable
              onPress={() => handleOrderAction(order.id, "confirmed")}
              className="flex-1 bg-[#7A9E7E] rounded-full px-4 py-2 flex-row items-center justify-center gap-x-1"
            >
              <CheckCircle2 size={14} color="#ffffff" />
              <Text className="small-bold text-white">{safeT(t, "cashier.orders.accept", "Accept")}</Text>
            </Pressable>
            <Pressable
              onPress={() => handleOrderAction(order.id, "cancelled")}
              className="flex-1 bg-[#C0392B] rounded-full px-4 py-2 flex-row items-center justify-center gap-x-1"
            >
              <XCircle size={14} color="#ffffff" />
              <Text className="small-bold text-white">{safeT(t, "cashier.orders.reject", "Reject")}</Text>
            </Pressable>
          </View>
        )}

        {!isPending && (
          <View className="flex-row gap-x-2 mt-3 pt-3 border-t border-gray-100" style={{ flexDirection: isRTL ? "row-reverse" : "row" }}>
            <Pressable
              onPress={() => handleEditOrder(order)}
              className="flex-1 bg-[#C9A86A] rounded-full px-4 py-2 flex-row items-center justify-center gap-x-1"
            >
              <Text className="small-bold text-white">{safeT(t, "cashier.orders.edit", "Edit")}</Text>
            </Pressable>
            <Pressable
              onPress={() => handleMessageCustomer(order)}
              className="flex-1 bg-[#7A9E7E] rounded-full px-4 py-2 flex-row items-center justify-center gap-x-1"
            >
              <MessageCircle size={14} color="#ffffff" />
              <Text className="small-bold text-white">{safeT(t, "cashier.orders.message", "Message")}</Text>
            </Pressable>
            {(order.status === "confirmed" || order.status === "preparing" || order.status === "out_for_delivery") && (
              <Pressable
                onPress={() => handleTrackDelivery(order)}
                className="flex-1 bg-[#8B6F8B] rounded-full px-4 py-2 flex-row items-center justify-center gap-x-1"
              >
                <Clock3 size={14} color="#ffffff" />
                <Text className="small-bold text-white">{safeT(t, "cashier.orders.track", "Track")}</Text>
              </Pressable>
            )}
          </View>
        )}
      </Pressable>
    );
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-[#FDF8F3] items-center justify-center">
        <Text className="h3-bold text-dark-100">{safeT(t, "common.loading", "Loading...")}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#FDF8F3]">
      <View className="px-5 py-3">
        <Text className="h1-bold text-dark-100">{safeT(t, "cashier.orders.title", "Orders")}</Text>
      </View>

      <ScrollView className="flex-1 px-5 pb-24">
        {pendingOrders.length > 0 && (
          <View className="mb-4">
            <Text className="h5-bold text-dark-100 mb-2">{safeT(t, "cashier.orders.pending", "Pending Orders")}</Text>
            {pendingOrders.map((order) => renderOrderCard(order, true))}
          </View>
        )}

        {todayOrders.length > 0 && (
          <View>
            <Text className="h5-bold text-dark-100 mb-2">{safeT(t, "cashier.orders.today", "Today's Orders")}</Text>
            {todayOrders.map((order) => renderOrderCard(order, false))}
          </View>
        )}

        {pendingOrders.length === 0 && todayOrders.length === 0 && (
          <View className="items-center py-16">
            <Package size={48} color="#D1D5DB" />
            <Text className="paragraph-regular text-gray-400 mt-4 text-center">
              {safeT(t, "cashier.orders.noOrders", "No orders yet")}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}