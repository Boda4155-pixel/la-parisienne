import { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useTranslation } from "react-i18next";
import { router } from "expo-router";
import {
  MinusCircle,
  PlusCircle,
  ShoppingCart,
} from "lucide-react-native";
import { supabase } from "../../../lib/supabase";
import { useCartStore } from "../../../store/cart.store";

type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image_url?: string | null;
};

type PaymentMethod = "cash" | "card";

export default function CashierCheckout() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const { items, clearCart, increaseQty, decreaseQty, getTotalPrice } =
    useCartStore.getState();

  const [payment, setPayment] = useState<PaymentMethod>("cash");
  const [loading, setLoading] = useState(false);

  const total = getTotalPrice();

  const handleCheckout = async () => {
    if (items.length === 0) {
      Alert.alert(t("cashier.cartEmpty", "Cart is empty"), t("cashier.addProductsFirst", "Add products to cart first"));
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("orders")
        .insert({
          items: items.map((item) => ({
            productId: item.id,
            productName: item.name,
            unitPrice: item.price,
            quantity: item.quantity,
          })),
          total,
          status: "completed",
          payment_method: payment,
          created_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (error) {
        Alert.alert("Error", error.message);
        return;
      }

      clearCart();
      const receiptHref = `/(cashier)/receipt?orderId=${data.id}&total=${total}&payment=${payment}&subtotal=${total}&itemCount=${items.reduce((sum, item) => sum + item.quantity, 0)}`;
      router.push(receiptHref as any);
    } catch (err: any) {
      Alert.alert("Error", err.message ?? "حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
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
          <Text className="h3-bold text-dark-100 mt-4">
            {t("cashier.cartEmpty", "Cart is empty")}
          </Text>
          <Text className="text-gray-500 text-center mt-2">
            {t("cashier.browseProducts", "Browse products to get started")}
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
            <Text className="h5-bold text-white">
              {t("cashier.products", "Products")}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ backgroundColor: "#FFFBF2", flex: 1 }}>
      <View style={{ flex: 1, padding: 20 }}>
        <Text className="h3-bold text-dark-100 mb-4">
          {t("cashier.checkout", "Checkout")}
        </Text>

        <ScrollView
          style={{ flex: 1, backgroundColor: "#ffffff", borderRadius: 16, padding: 20 }}
        >
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
                    {item.price} EGP × {item.quantity}
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
                  {(item.price * item.quantity).toFixed(2)} EGP
                </Text>
              </View>
            )}
          />

          {/* Payment method selector: Cash / Card */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 16,
              marginBottom: 24,
            }}
          >
            <Pressable
              onPress={() => setPayment("cash")}
              style={{
                flex: 1,
                backgroundColor: payment === "cash" ? "#C9A86A" : "#ffffff",
                borderRadius: 12,
                padding: 12,
                marginRight: 8,
                justifyContent: "center",
                alignItems: "center",
                ...(payment === "cash" && { borderWidth: 2, borderColor: "#C9A86A" }),
              }}
            >
              <Text className="h5-bold text-white">
                {payment === "cash" ? t("cashier.cash", "Cash") : t("cashier.card", "Card")}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setPayment("card")}
              style={{
                flex: 1,
                backgroundColor: payment === "card" ? "#C9A86A" : "#ffffff",
                borderRadius: 12,
                padding: 12,
                marginLeft: 8,
                justifyContent: "center",
                alignItems: "center",
                ...(payment === "card" && { borderWidth: 2, borderColor: "#C9A86A" }),
              }}
            >
              <Text className="h5-bold text-white">
                {payment === "card" ? t("cashier.card", "Card") : t("cashier.cash", "Cash")}
              </Text>
            </Pressable>
          </View>

          {/* Total */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingBottom: 12,
              borderBottomWidth: 1,
              borderColor: "#e5e7eb",
              marginBottom: 16,
            }}
          >
            <Text className="h3-bold text-dark-100">{t("cashier.total", "Total")}</Text>
            <Text className="h3-bold text-primary">{total.toFixed(2)} EGP</Text>
          </View>

          {/* Checkout button */}
          <Pressable
            onPress={handleCheckout}
            disabled={loading}
            style={{
              backgroundColor: "#C9A86A",
              borderRadius: 12,
              padding: 14,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text className="h3-bold text-white">
              {loading ? t("common.saving", "Saving...") : t("cashier.confirmPayment", "Confirm Payment")}
            </Text>
          </Pressable>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}