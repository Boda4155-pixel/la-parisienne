import Ionicons from "@expo/vector-icons/Ionicons";
import { supabase } from "../../../../lib/supabase";
import { useCartStore } from "../../../../store/cart.store";

import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Product = {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  description: string | null;
  stock_quantity?: number;
};

export default function CustomerProduct() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const insets = useSafeAreaInsets();
  const addItem = useCartStore((s) => s.addItem);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase.from("products").select("id, name, price, image_url, description, stock_quantity").eq("id", id).single();
      setProduct(data as any);
      setLoading(false);
    })();
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;
    for (let i = 0; i < quantity; i++) {
      addItem({ id: product.id, name: product.name, price: Number(product.price), image_url: product.image_url || "" });
    }
    router.push("/(customer)/cart" as any);
  };

  if (loading ||!product) {
    return (
      <View style={{ flex: 1, backgroundColor: "#FFFBF5", justifyContent: "center", alignItems: "center", paddingTop: insets.top }}>
        <Text style={{ color: "#B8A89A", fontWeight: "700" }}>Loading...</Text>
      </View>
    );
  }

  const stock = product.stock_quantity?? 99;

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFBF5" }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 140 }}>
        {/* Image Hero - Full Bleed */}
        <View style={{ width: "100%", height: 380, backgroundColor: "#F5EDE3", borderBottomLeftRadius: 32, borderBottomRightRadius: 32, overflow: "hidden" }}>
          {product.image_url? (
            <Image source={{ uri: product.image_url }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
          ) : (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}><Ionicons name="image-outline" size={60} color="#D9C5B0" /></View>
          )}
          {/* Top Buttons */}
          <View style={{ position: "absolute", top: insets.top + 12, left: 20, right: 20, flexDirection: "row", justifyContent: "space-between" }}>
            <Pressable onPress={() => router.back()} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.9)", justifyContent: "center", alignItems: "center" }}>
              <Ionicons name="arrow-back" size={20} color="#2B2117" />
            </Pressable>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <Pressable style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.9)", justifyContent: "center", alignItems: "center" }}>
                <Ionicons name="heart-outline" size={20} color="#2B2117" />
              </Pressable>
              <Pressable style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.9)", justifyContent: "center", alignItems: "center" }}>
                <Ionicons name="share-social-outline" size={20} color="#2B2117" />
              </Pressable>
            </View>
          </View>
        </View>

        {/* Details Sheet */}
        <View style={{ marginTop: -28, backgroundColor: "#FFFBF5", borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingHorizontal: 24, paddingTop: 28 }}>
          {/* Title Row */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
            <View style={{ flex: 1, paddingRight: 16 }}>
              <View style={{ backgroundColor: "#fff", alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, borderWidth: 1, borderColor: "#F0E6D9", marginBottom: 10 }}>
                <Text style={{ fontSize: 10, fontWeight: "800", letterSpacing: 1, color: "#B89B7D" }}>FRENCH BAKERY • FRESH</Text>
              </View>
              <Text style={{ fontSize: 26, fontWeight: "900", color: "#2B2117", lineHeight: 32 }}>{product.name}</Text>
              <Text style={{ fontSize: 13, color: "#B8A89A", marginTop: 6, lineHeight: 18 }}>{product.description || "Buttery, flaky & baked fresh every morning in our Parisian oven."}</Text>
            </View>
            <View style={{ backgroundColor: "#2B2117", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 14 }}>
              <Text style={{ color: "#fff", fontWeight: "900", fontSize: 16 }}>{product.price} EGP</Text>
            </View>
          </View>

          {/* Quantity */}
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 24, backgroundColor: "#fff", borderRadius: 20, padding: 16, borderWidth: 1, borderColor: "#F0E6D9" }}>
            <View>
              <Text style={{ fontSize: 14, fontWeight: "800", color: "#2B2117" }}>Quantity</Text>
              <Text style={{ fontSize: 12, color: "#B8A89A", marginTop: 2 }}>{stock > 0? `${stock} in stock` : "Out of stock"}</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: "#FFFBF5", borderRadius: 24, paddingHorizontal: 8, height: 44, borderWidth: 1, borderColor: "#F0E6D9" }}>
              <Pressable onPress={() => setQuantity((q) => Math.max(1, q - 1))} style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: "#fff", justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "#F0E6D9" }}>
                <Ionicons name="remove" size={16} color="#2B2117" />
              </Pressable>
              <Text style={{ fontSize: 16, fontWeight: "900", color: "#2B2117", minWidth: 24, textAlign: "center" }}>{quantity}</Text>
              <Pressable onPress={() => setQuantity((q) => Math.min(q + 1, stock))} style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: "#2B2117", justifyContent: "center", alignItems: "center" }}>
                <Ionicons name="add" size={16} color="#fff" />
              </Pressable>
            </View>
          </View>

          {/* Features */}
          <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
            <View style={{ flex: 1, backgroundColor: "#fff", borderRadius: 16, padding: 14, borderWidth: 1, borderColor: "#F0E6D9", alignItems: "center" }}>
              <Text style={{ fontSize: 18 }}>🥐</Text><Text style={{ fontSize: 11, fontWeight: "700", color: "#2B2117", marginTop: 6 }}>Fresh Daily</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: "#fff", borderRadius: 16, padding: 14, borderWidth: 1, borderColor: "#F0E6D9", alignItems: "center" }}>
              <Text style={{ fontSize: 18 }}>🌾</Text><Text style={{ fontSize: 11, fontWeight: "700", color: "#2B2117", marginTop: 6 }}>Premium Flour</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: "#fff", borderRadius: 16, padding: 14, borderWidth: 1, borderColor: "#F0E6D9", alignItems: "center" }}>
              <Text style={{ fontSize: 18 }}>❤️</Text><Text style={{ fontSize: 11, fontWeight: "700", color: "#2B2117", marginTop: 6 }}>Made with Love</Text>
            </View>
          </View>

          {/* Ingredients */}
          <View style={{ marginTop: 24 }}>
            <Text style={{ fontSize: 15, fontWeight: "800", color: "#2B2117", marginBottom: 10 }}>Details</Text>
            <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#F0E6D9" }}>
              <Text style={{ fontSize: 13, color: "#6B5A4A", lineHeight: 20 }}>• French butter & organic flour{"\n"}• Baked at 180°C for perfect flakiness{"\n"}• Best enjoyed within 24h{"\n"}• Contains gluten, dairy</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action - Panier Button like design */}
      <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "#FFFBF5", paddingHorizontal: 20, paddingTop: 12, paddingBottom: insets.bottom + 12, borderTopWidth: 1, borderTopColor: "#F0E6D9" }}>
        <Pressable onPress={handleAddToCart} disabled={stock === 0} style={{ backgroundColor: stock === 0? "#D9C5B0" : "#2B2117", height: 58, borderRadius: 29, flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 24 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.15)", justifyContent: "center", alignItems: "center" }}>
              <Ionicons name="bag-handle" size={18} color="#fff" />
            </View>
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "800" }}>Add to Panier</Text>
          </View>
          <Text style={{ color: "#fff", fontSize: 15, fontWeight: "900" }}>{product.price * quantity} EGP</Text>
        </Pressable>
      </View>
    </View>
  );
}