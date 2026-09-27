import { router, useLocalSearchParams } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import PaymentInfoStripe from "../../../components/PaymentInfoStripe";
import { useSupabaseQuery } from "../../../hooks/useSupabaseQuery";
import { getOrderById } from "../../../lib/queries";
import { useAuthStore } from "../../../store/auth.store";

const STATUS_COLORS: Record<string, string> = {
  pending: "#D4A574",
  confirmed: "#7A9E7E",
  preparing: "#B18C55",
  out_for_delivery: "#8B6F8B",
  delivered: "#4A7C59",
  cancelled: "#C0392B",
};

export default function OrderDetails() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useAuthStore((state) => state.user);

  const { data, loading, error } = useSupabaseQuery({
    fn: getOrderById,
    params: { id: id!, userId: user?.id ?? "" },
    skip: !id || !user,
  });

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator color="#FE8C00" />
      </SafeAreaView>
    );
  }

  if (error || !data) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center px-5">
        <Text className="paragraph-regular text-gray-100 text-center">
          {t("common.errorLoading")}
        </Text>
      </SafeAreaView>
    );
  }

  const { order, items } = data;

  if (!order) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <Text className="paragraph-regular text-gray-100">Order not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center justify-between px-5 py-3">
        <Pressable onPress={() => router.back()}>
          <ChevronLeft size={24} color="#1a1a1a" />
        </Pressable>

        <Text className="h1-bold text-dark-100">
          #{order.id.slice(0, 8).toUpperCase()}
        </Text>

        <View className="size-6" />
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerClassName="px-5 pb-10 gap-y-4"
        ListHeaderComponent={
          <View className="gap-y-4 mb-2">
            <View
              className="self-start rounded-full px-4 py-2"
              style={{
                backgroundColor: STATUS_COLORS[order.status] ?? "#9CA3AF",
              }}
            >
              <Text className="paragraph-bold text-white">
                {t(`orders.status.${order.status}`)}
              </Text>
            </View>

            <Text className="paragraph-regular text-gray-100">
              {new Date(order.created_at).toLocaleString()}
            </Text>

            <Text className="h3-bold text-dark-100 mt-2">
              {t("orders.items")}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View className="flex-row items-center justify-between border border-gray-100 rounded-2xl p-4">
            <View className="flex-1">
              <Text className="paragraph-bold text-dark-100">
                {item.product_name}
              </Text>
              <Text className="paragraph-regular text-gray-100 mt-1">
                {item.quantity} × {item.unit_price} {t("common.currency")}
              </Text>
            </View>

            <Text className="paragraph-bold text-dark-100">
              {item.line_total} {t("common.currency")}
            </Text>
          </View>
        )}
        ListFooterComponent={
          <View className="border border-gray-200 rounded-2xl p-5 mt-4">
            <Text className="h3-bold text-dark-100 mb-4">
              {t("checkout.paymentSummary")}
            </Text>

            <PaymentInfoStripe
              label={t("checkout.subtotal")}
              value={`${order.subtotal} ${t("common.currency")}`}
            />
            <PaymentInfoStripe
              label={t("checkout.deliveryFee")}
              value={`${order.delivery_fee} ${t("common.currency")}`}
            />

            {order.discount_amount > 0 && (
              <PaymentInfoStripe
                label={t("checkout.discount")}
                value={`- ${order.discount_amount} ${t("common.currency")}`}
                valueStyle="!text-success"
              />
            )}

            <View className="border-t border-gray-200 my-2" />

            <PaymentInfoStripe
              label={t("checkout.total")}
              value={`${order.total} ${t("common.currency")}`}
              labelStyle="base-bold !text-dark-100"
              valueStyle="base-bold !text-dark-100"
            />
          </View>
        }
      />
    </SafeAreaView>
  );
}
