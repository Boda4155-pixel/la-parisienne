import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { PlusCircle, MinusCircle } from "lucide-react-native";
import { supabase } from "../../../lib/supabase";

type Product = {
  id: string;
  name: string;
  price: number;
  image_url?: string | null;
};

type CartItem = Product & { quantity: number };

type PaymentMethod = "cash" | "card";

export default function Cashier() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [payment, setPayment] = useState<PaymentMethod>("cash");
  const [loading, setLoading] = useState(true);

  // Fetch products from Supabase on mount
  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("products")
          .select("*")
          .order("name");

        if (error) {
          console.error("Error fetching products:", error);
          Alert.alert("Error", error.message);
          return;
        }

        setProducts(data ?? []);
      } catch (err) {
        console.error("Error fetching products:", err);
        Alert.alert("Error", "Failed to fetch products");
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  // Filter products by search term using useMemo for better performance
  const filtered = useMemo(() => {
    if (search.trim()) {
      const term = search.toLowerCase();
      return products.filter((p) => p.name.toLowerCase().includes(term));
    }
    return [...products];
  }, [search, products]);

  // Add product to cart: if exists, qty + 1; otherwise, add with qty 1
  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  // Update quantity: increase or decrease by delta; remove if qty reaches 0
  const updateQty = (id: string, delta: number) => {
    setCart((prev) => {
      const updated = prev.map((item) =>
        item.id === id ? { ...item, quantity: item.quantity + delta } : item,
      );
      return updated.filter((item) => item.quantity > 0);
    });
  };

  // Calculate subtotal: sum of price * qty
  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  // Handle checkout: insert order, then clear cart and show alert
  const handleCheckout = async () => {
    if (cart.length === 0) {
      Alert.alert("العربة فارغة", "الرجاء إضافة منتجات إلى العربة أولاً");
      return;
    }

    try {
      const { error } = await supabase.from("orders").insert({
        items: cart,
        total: subtotal,
        status: "completed",
        payment_method: payment,
        created_at: new Date().toISOString(),
      });

      if (error) {
        Alert.alert("Error", error.message);
        return;
      }

      setCart([]);
      Alert.alert("تم الدفع", "تم إرسال الطلب بنجاح ✅");
    } catch (err: any) {
      Alert.alert("Error", err.message ?? "حدث خطأ غير متوقع");
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ backgroundColor: "#FFFBF2", flex: 1 }}>
        <View className="flex-1 items-center justify-center py-12">
          <ActivityIndicator size="large" />
          <Text className="mt-4 text-dark-100">جاري تحميل المنتجات...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ backgroundColor: "#FFFBF2", flex: 1 }}>
      <View style={{ flex: 1, flexDirection: "row" }}>
        {/* LEFT: Products grid - 3 columns */}
        <View
          style={{
            flex: 1,
            borderRightWidth: 1,
            borderColor: "#e5e7eb",
          }}
        >
          <View className="flex-row items-center justify-between p-4">
            <Text className="h3-bold text-dark-100">المنتجات</Text>
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search..."
              placeholderTextColor="#9ca3af"
              className="border border-gray-200 rounded-full px-4 py-2 paragraph-regular text-dark-100 w-40"
            />
          </View>

          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            numColumns={3}
            horizontal={false}
            contentContainerStyle={{ padding: 16, gap: 12 }}
            renderItem={({ item }) => (
              <View
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: 20,
                  padding: 12,
                  minWidth: "33.333%",
                  justifyContent: "center",
                  alignItems: "center",
                  shadowColor: "#000",
                  shadowOpacity: 0.05,
                  shadowRadius: 8,
                  elevation: 2,
                }}
              >
                <Text className="h4-bold text-dark-100 mt-2">
                  {item.name}
                </Text>
                <Text className="h5-bold text-primary mt-2">
                  {item.price} ج.م
                </Text>
                <Pressable
                  onPress={() => addToCart(item)}
                  style={{
                    marginTop: 8,
                    backgroundColor: "#C9A86A",
                    borderRadius: 12,
                    paddingVertical: 6,
                    paddingHorizontal: 12,
                  }}
                >
                  <Text className="paragraph-bold text-white">
                    Add
                  </Text>
                </Pressable>
              </View>
            )}
          />
        </View>

        {/* RIGHT: Cart */}
        <ScrollView
          style={{ flex: 1, backgroundColor: "#ffffff" }}
          contentContainerStyle={{ padding: 20 }}
        >
          <Text className="h3-bold text-dark-100 mb-4">سلة المشتريات</Text>

          {cart.length === 0 ? (
            <View className="flex-1 items-center justify-center py-8">
              <Text className="text-gray-500">العربة فارغة</Text>
            </View>
          ) : (
            <View>
              {cart.map((item) => (
                <View
                  key={item.id}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 12,
                    paddingBottom: 8,
                    borderBottomWidth: 1,
                    borderColor: "#f3f4f6",
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Text className="h4-bold text-dark-100">
                      {item.name}
                    </Text>
                    <Text className="h5-bold text-primary">
                      {item.price} ج.م
                    </Text>
                  </View>

                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <Pressable
                      onPress={() => updateQty(item.id, -1)}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 50,
                        backgroundColor: "#f3f4f6",
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <MinusCircle size={18} color="#6b7280" />
                    </Pressable>

                    <Text className="h4-bold text-dark-100 mx-2">
                      {item.quantity}
                    </Text>

                    <Pressable
                      onPress={() => updateQty(item.id, 1)}
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

                  <Text className="h5-bold text-primary">
                    {item.price * item.quantity} ج.م
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Subtotal */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 16,
              paddingTop: 16,
              borderTopWidth: 1,
              borderColor: "#e5e7eb",
            }}
          >
            <Text className="h4-bold text-dark-100">المجموع الفرعي</Text>
            <Text className="h5-bold text-primary">
              {subtotal} ج.م
            </Text>
          </View>

          {/* Total */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 12,
              paddingBottom: 12,
              borderBottomWidth: 1,
              borderColor: "#e5e7eb",
            }}
          >
            <Text className="h3-bold text-dark-100">المجموع</Text>
            <Text className="h3-bold text-primary">
              {subtotal} ج.م
            </Text>
          </View>

          {/* Payment method selector: Cash / Card */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 16,
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
                ...(payment === "cash" && {
                  borderWidth: 2,
                  borderColor: "#C9A86A",
                }),
              }}
            >
              <Text className="h5-bold text-white">
                {payment === "cash" ? "Cash" : "Card"}
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
                ...(payment === "card" && {
                  borderWidth: 2,
                  borderColor: "#C9A86A",
                }),
              }}
            >
              <Text className="h5-bold text-white">
                {payment === "card" ? "Card" : "Cash"}
              </Text>
            </Pressable>
          </View>

          {/* Checkout button - golden #C9A86A */}
          <Pressable
            onPress={handleCheckout}
            style={{
              marginTop: 24,
              backgroundColor: "#C9A86A",
              borderRadius: 12,
              padding: 14,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text className="h3-bold text-white">
              Checkout
            </Text>
          </Pressable>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}