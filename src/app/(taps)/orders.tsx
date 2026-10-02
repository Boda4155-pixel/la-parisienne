import { router } from "expo-router";
import { Package } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useSupabaseQuery } from "../../../hooks/useSupabaseQuery";
import { getOrders } from "../../../lib/queries";
import { useAuthStore } from "../../../store/auth.store";

const STATUS_COLORS: Record<string, string> = {
  pending: "#D4A574",
  confirmed: "#7A9E7E",
  preparing: "#B18C55",
  out_for_delivery: "#8B6F8B",
  delivered: "#4A7C59",
  cancelled: "#C0392B",
};

export default function Orders() {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);

  const {
    data: orders,
    loading,
    error,
  } = useSupabaseQuery({
    fn: getOrders,
    params: { userId: user?.id ?? "" },
    skip: !user,
  });

  if (!user) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center px-8">
        <Package size={56} color="#D1D5DB" />
        <Text className="h2-bold text-dark-100 mt-6 text-center">
          {t("orders.loginRequired")}
        </Text>
        <Pressable
          onPress={() => router.push("/sign-in")}
          className="bg-dark-100 rounded-full px-8 py-4 mt-6"
        >
          <Text className="paragraph-bold text-white">{t("orders.login")}</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-5 py-3">
        <Text className="h1-bold text-dark-100">{t("tabs.orders")}</Text>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#FE8C00" />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-5">
          <Text className="paragraph-regular text-gray-100 text-center">
            {t("common.errorLoading")}
          </Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          contentContainerClassName="px-5 pt-2 gap-y-3 pb-28"
          renderItem={({ item }) => (
            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/order/[id]",
                  params: { id: item.id },
                })
              }
              className="border border-gray-200 rounded-2xl p-4"
            >
              <View className="flex-row items-center justify-between">
                <Text className="paragraph-bold text-dark-100">
                  #{item.id.slice(0, 8).toUpperCase()}
                </Text>

                <View
                  className="rounded-full px-3 py-1"
                  style={{
                    backgroundColor: STATUS_COLORS[item.status] ?? "#9CA3AF",
                  }}
                >
                  <Text className="small-bold text-white">
                    {t(`orders.status.${item.status}`)}
                  </Text>
                </View>
              </View>

              <Text className="paragraph-regular text-gray-100 mt-2">
                {new Date(item.created_at).toLocaleDateString()}
              </Text>

              <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-gray-100">
                <Text className="paragraph-regular text-gray-100">
                  {t("orders.total")}
                </Text>
                <Text className="paragraph-bold text-dark-100">
                  {item.total} {t("common.currency")}
                </Text>
              </View>
            </Pressable>
          )}
          ListEmptyComponent={
            <View className="items-center py-16 px-8">
              <Package size={48} color="#D1D5DB" />
              <Text className="paragraph-regular text-gray-100 mt-4 text-center">
                {t("orders.empty")}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
