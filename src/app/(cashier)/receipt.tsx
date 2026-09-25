import { useMemo } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { CheckCircle2, Share2 } from "lucide-react-native";

type ReceiptItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

export default function CashierReceipt() {
  const { orderId, items, total, payment, subtotal } = useLocalSearchParams<{
    orderId: string;
    items: string;
    total: string;
    payment: string;
    subtotal: string;
  }>();

  const parsedItems: ReceiptItem[] = useMemo(() => {
    try {
      return JSON.parse(items ?? "[]");
    } catch {
      return [];
    }
  }, [items]);

  const handleNewOrder = () => {
    router.replace("/(cashier)/pos" as any);
  };

  return (
    <SafeAreaView className="flex-1 bg-[#FDF8F3]">
      <View className="px-5 py-4 items-center">
        <View className="size-20 rounded-full bg-[#7A9E7E]/10 items-center justify-center mb-4">
          <CheckCircle2 size={40} color="#7A9E7E" />
        </View>

        <Text className="h1-bold text-dark-100 text-center mb-1">
          Order Completed
        </Text>
        <Text className="paragraph-regular text-gray-500 text-center">
          #{orderId ? orderId.slice(0, 8).toUpperCase() : "—"}
        </Text>
      </View>

      <View className="flex-1 px-5 pb-24">
        <View className="bg-white rounded-3xl p-5 shadow-md shadow-dark-100/5 mb-4">
          <Text className="h3-bold text-dark-100 mb-4">Order Summary</Text>

          <View className="gap-y-3 mb-4">
            {parsedItems.map((item) => (
              <View
                key={item.id}
                className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-x-2">
                  <Text className="paragraph-bold text-dark-100">
                    {item.name}
                  </Text>
                  <Text className="small-bold text-gray-400">
                    ×{item.quantity}
                  </Text>
                </View>
                <Text className="paragraph-bold text-primary">
                  {item.price * item.quantity} EGP
                </Text>
              </View>
            ))}
          </View>

          <View className="border-t border-gray-200 pt-3 gap-y-2">
            <View className="flex-row items-center justify-between">
              <Text className="paragraph-regular text-gray-500">Subtotal</Text>
              <Text className="paragraph-bold text-dark-100">
                {subtotal ?? total} EGP
              </Text>
            </View>
            <View className="flex-row items-center justify-between">
              <Text className="paragraph-regular text-gray-500">Payment</Text>
              <Text className="paragraph-bold text-dark-100">{payment}</Text>
            </View>
            <View className="flex-row items-center justify-between border-t border-gray-200 pt-2 mt-2">
              <Text className="h3-bold text-dark-100">Total</Text>
              <Text className="h3-bold text-primary">{total} EGP</Text>
            </View>
          </View>
        </View>

        <View className="flex-row items-center justify-between gap-x-3">
          <Pressable
            onPress={handleNewOrder}
            className="flex-1 bg-primary rounded-full py-4 items-center">
            <Text className="paragraph-bold text-white">New Order</Text>
          </Pressable>
          <Pressable className="bg-dark-100 rounded-full p-3" onPress={() => {}}>
            <Share2 size={20} color="#ffffff" />
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
