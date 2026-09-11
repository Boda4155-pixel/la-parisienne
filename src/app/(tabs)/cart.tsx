import { router } from "expo-router";
import { ShoppingBag } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { FlatList, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import CartItem from "../../../components/CartItem";
import { useCartStore } from "../../../store/cart.store";

export default function Cart() {
  const { t } = useTranslation();

  const items = useCartStore((state) => state.items);
  const totalItems = useCartStore((state) => state.getTotalItems());
  const totalPrice = useCartStore((state) => state.getTotalPrice());

  if (items.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center px-8 ">
        <ShoppingBag size={56} color="#D1D5DB" />

        <Text className="h2-bold text-dark-100 mt-6 text-center">
          {t("cart.emptyTitle")}
        </Text>

        <Text className="paragraph-regular text-gray-100 text-center mt-2">
          {t("cart.emptyDescription")}
        </Text>

        <Pressable
          onPress={() => router.push("/(tabs)")}
          className="bg-dark-100 rounded-full px-8 py-4 mt-6"
        >
          <Text className="paragraph-bold text-white">
            {t("cart.browseProducts")}
          </Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white pb-32">
      <View className="flex-row items-center justify-center px-5 py-3">
        <Text className="h1-bold text-dark-100">
          {t("cart.title")} ({totalItems})
        </Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerClassName="px-5 gap-y-4 pb-4"
        renderItem={({ item }) => <CartItem item={item} />}
      />

      <View className="border-t border-gray-100 px-5 py-4 gap-y-4">
        <View className="flex-row items-center justify-between">
          <Text className="paragraph-regular text-gray-100">
            {t("cart.subtotal")}
          </Text>
          <Text className="paragraph-bold text-dark-100">
            {totalPrice} {t("common.currency")}
          </Text>
        </View>

        <Pressable
          onPress={() => router.push("/checkout")}
          className="bg-dark-100 rounded-full py-4 items-center"
        >
          <Text className="paragraph-bold text-white">
            {t("cart.checkout")}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
