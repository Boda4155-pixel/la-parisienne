import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import {
  MinusCircle,
  PlusCircle,
  ShoppingCart,
} from "lucide-react-native";
import { useCartStore } from "../../../store/cart.store";

type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image_url?: string | null;
};

export default function CashierCart() {
  const { items, clearCart, increaseQty, decreaseQty, getTotalPrice } =
    useCartStore.getState();

  const total = getTotalPrice();

  const handleCheckout = async () => {
    if (items.length === 0) {
      Alert.alert("السلة فارغة", "أضف منتجات إلى السلة أولاً");
      return;
    }

    // Navigate to checkout (we'll need to create this screen later)
    // For now, redirect to the receipt after creating order in pos.tsx flow
    router.push("/(cashier)/checkout" as any);
  };

  if (items.length === 0) {
    return (
      <SafeAreaView style={{ backgroundColor: "#FFFBF2", flex: 1 }}>
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
          }}
        >
          <ShoppingCart size={64} color="#9CA3AF" />
          <Text className="h3-bold text-dark-100 mt-4">السلة خالية</Text>
          <Text className="text-gray-500 text-center mt-2">
            أضف منتجات من صفحة المنتجات للبدء بطلبك
          </Text>
          <Pressable
            onPress={() => router.push("/(cashier)/products" as any)}
            style={{
              marginTop: 20,
              backgroundColor: "#C9A86A",
              borderRadius: 12,
              paddingHorizontal: 24,
              paddingVertical: 12,
            }}
          >
            <Text className="h5-bold text-white">المنتجات</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ backgroundColor: "#FFFBF2", flex: 1 }}>
      <View style={{ flex: 1, padding: 20 }}>
        <Text className="h3-bold text-dark-100 mb-4">سلة المشتريات</Text>

        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 16,
                paddingBottom: 12,
                borderBottomWidth: 1,
                borderColor: "#f3f4f6",
              }}
            >
              <View style={{ flex: 1 }}>
                <Text className="h5-bold text-dark-100">{item.name}</Text>
                <Text className="text-gray-500 text-sm">
                  {item.price} ج.م × {item.quantity}
                </Text>
              </View>

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Pressable
                  onPress={() => decreaseQty(item.id)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 50,
                    backgroundColor: "#F3F4F6",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <MinusCircle size={18} color="#6b7280" />
                </Pressable>

                <Text className="h4-bold text-dark-100 min-w-8 text-center">
                  {item.quantity}
                </Text>

                <Pressable
                  onPress={() => increaseQty(item.id)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 50,
                    backgroundColor: "#C9A86A",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <PlusCircle size={18} color="#ffffff" />
                </Pressable>
              </View>

              <Text className="h5-bold text-primary ml-4">
                {(item.price * item.quantity).toFixed(2)} ج.م
              </Text>
            </View>
          )}
        />

        {/* Subtotal */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingVertical: 16,
            borderTopWidth: 1,
            borderColor: "#e5e7eb",
            marginBottom: 8,
          }}
        >
          <Text className="h4-bold text-dark-100">المجموع الفرعي</Text>
          <Text className="h5-bold text-dark-100">{total.toFixed(2)} ج.م</Text>
        </View>

        <View style={{ flexDirection: "row", gap: 12 }}>
          <Pressable
            onPress={() => clearCart()}
            style={[
              {
                flex: 1,
                backgroundColor: "#EF4444",
                borderRadius: 12,
                padding: 14,
                justifyContent: "center",
                alignItems: "center",
              },
            ]}
          >
            <Text className="h4-bold text-white">إلغاء</Text>
          </Pressable>

          <Pressable
            onPress={handleCheckout}
            style={[
              {
                flex: 1,
                backgroundColor: "#C9A86A",
                borderRadius: 12,
                padding: 14,
                justifyContent: "center",
                alignItems: "center",
              },
            ]}
          >
            <Text className="h4-bold text-white">الدفع</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}