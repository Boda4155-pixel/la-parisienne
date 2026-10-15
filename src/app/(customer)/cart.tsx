import Ionicons from "@expo/vector-icons/Ionicons";
import { CUSTOMER_COLORS } from "../../../lib/customerTheme";
import { supabase } from "../../../lib/supabase";
import { useCartStore } from "../../../store/cart.store";

import { router } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, Image, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CartItemType } from "../../../type";

type Product = { id: string; name: string; price: number; image_url: string | null };

export default function CustomerCart() {
  const insets = useSafeAreaInsets();
  const C = CUSTOMER_COLORS;
  const { items, increaseQty, decreaseQty, removeItem, getTotalPrice, clearCart } = useCartStore() as any;
  const [suggested, setSuggested] = useState<Product[]>([]);
  const subtotal = getTotalPrice();
  const deliveryFee = 25;
  const total = subtotal + deliveryFee;

  useEffect(() => {
    (async () => {
      const ids = items.map((i: any) => i.id);
      let q = supabase.from("products").select("id, name, price, image_url").eq("is_active", true).limit(6);
      if (ids.length) q = q.not("id", "in", `(${ids.join(",")})`);
      const { data } = await q;
      setSuggested((data as any) || []);
    })();
  }, [items.length]);

  if (items.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: C.background, paddingTop: insets.top }}>
        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 14 }}>
          <Pressable onPress={() => router.back()} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: C.card, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: C.border }}>
            <Ionicons name="arrow-back" size={20} color={C.textPrimary} />
          </Pressable>
          <Text style={{ fontSize: 18, fontWeight: "900", color: C.textPrimary, marginLeft: 14 }}>Panier</Text>
        </View>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 32 }}>
          <View style={{ width: 120, height: 120, borderRadius: 60, backgroundColor: C.card, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: C.border, marginBottom: 20 }}>
            <Ionicons name="bag-handle-outline" size={48} color={C.textMuted} />
          </View>
          <Text style={{ fontSize: 20, fontWeight: "900", color: C.textPrimary }}>Your panier is empty</Text>
          <Text style={{ fontSize: 13, color: C.textMuted, marginTop: 8, textAlign: "center" }}>Add some fresh pastries and taste the French moment</Text>
          <Pressable onPress={() => router.push("/(customer)/menu" as any)} style={{ backgroundColor: C.textPrimary, marginTop: 20, height: 48, borderRadius: 24, paddingHorizontal: 28, justifyContent: "center" }}>
            <Text style={{ color: C.card, fontWeight: "800" }}>Browse Menu</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.background }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: insets.top + 12, paddingBottom: 16, backgroundColor: C.background }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Pressable onPress={() => router.back()} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: C.card, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: C.border }}>
            <Ionicons name="arrow-back" size={20} color={C.textPrimary} />
          </Pressable>
          <Text style={{ fontSize: 20, fontWeight: "900", color: C.textPrimary }}>Panier</Text>
          <View style={{ backgroundColor: C.textPrimary, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}><Text style={{ color: C.card, fontSize: 12, fontWeight: "800" }}>{items.length}</Text></View>
        </View>
        <Pressable onPress={() => clearCart()}><Text style={{ color: C.textSecondary, fontWeight: "700", fontSize: 13 }}>Clear</Text></Pressable>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => `${item.id}-${JSON.stringify(item.customizations || [])}`}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 200 }}
        renderItem={({ item }: { item: CartItemType }) => (
          <View style={{ flexDirection: "row", backgroundColor: C.card, borderRadius: 20, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: C.border, alignItems: "center" }}>
            <View style={{ width: 72, height: 72, borderRadius: 16, backgroundColor: C.searchBg, overflow: "hidden" }}>
              {item.image_url? <Image source={{ uri: item.image_url }} style={{ width: "100%", height: "100%" }} /> : <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}><Ionicons name="image-outline" size={24} color={C.textMuted} /></View>}
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ fontSize: 14, fontWeight: "800", color: C.textPrimary }} numberOfLines={1}>{item.name}</Text>
              <Text style={{ fontSize: 13, fontWeight: "700", color: C.textSecondary, marginTop: 2 }}>{item.price} EGP</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 8 }}>
                <Pressable onPress={() => decreaseQty(item.id, item.customizations)} style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: C.searchBg, borderWidth: 1, borderColor: C.border, justifyContent: "center", alignItems: "center" }}>
                  <Ionicons name="remove" size={14} color={C.textPrimary} />
                </Pressable>
                <Text style={{ fontSize: 14, fontWeight: "900", color: C.textPrimary, minWidth: 20, textAlign: "center" }}>{item.quantity}</Text>
                <Pressable onPress={() => increaseQty(item.id, item.customizations)} style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: C.textPrimary, justifyContent: "center", alignItems: "center" }}>
                  <Ionicons name="add" size={14} color={C.card} />
                </Pressable>
              </View>
            </View>
            <View style={{ alignItems: "flex-end", gap: 8 }}>
              <Text style={{ fontSize: 14, fontWeight: "900", color: C.textPrimary }}>{item.price * item.quantity} EGP</Text>
              <Pressable onPress={() => removeItem(item.id, item.customizations)} style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: "#FFF0F0", justifyContent: "center", alignItems: "center" }}>
                <Ionicons name="trash-outline" size={14} color="#EF4444" />
              </Pressable>
            </View>
          </View>
        )}
        ListFooterComponent={
          <View style={{ marginTop: 12 }}>
            <View style={{ backgroundColor: C.card, borderRadius: 20, padding: 16, borderWidth: 1, borderColor: C.border }}>
              <Text style={{ fontSize: 14, fontWeight: "800", color: C.textPrimary, marginBottom: 12 }}>Order Summary</Text>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                <Text style={{ color: C.textMuted, fontSize: 13 }}>Subtotal</Text><Text style={{ fontWeight: "700", color: C.textPrimary, fontSize: 13 }}>{subtotal} EGP</Text>
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                <Text style={{ color: C.textMuted, fontSize: 13 }}>Delivery</Text><Text style={{ fontWeight: "700", color: C.textPrimary, fontSize: 13 }}>{deliveryFee} EGP</Text>
              </View>
              <View style={{ height: 1, backgroundColor: C.border, marginVertical: 10 }} />
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <Text style={{ fontWeight: "900", color: C.textPrimary, fontSize: 15 }}>Total</Text><Text style={{ fontWeight: "900", color: C.textPrimary, fontSize: 15 }}>{total} EGP</Text>
              </View>
            </View>
            {suggested.length>0 && (
              <View style={{ marginTop: 20 }}>
                <Text style={{ fontSize: 15, fontWeight: "800", color: C.textPrimary, marginBottom: 12 }}>Add a little extra?</Text>
                <FlatList data={suggested} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}
                  keyExtractor={i=>i.id}
                  renderItem={({item})=>(
                    <View style={{ width: 110, backgroundColor: C.card, borderRadius: 16, padding: 8, borderWidth: 1, borderColor: C.border }}>
                      <View style={{ width: "100%", height: 70, borderRadius: 12, backgroundColor: C.searchBg, overflow: "hidden" }}>
                        {item.image_url? <Image source={{uri:item.image_url}} style={{width:"100%",height:"100%"}}/> : null}
                      </View>
                      <Text style={{ fontSize: 11, fontWeight: "700", color: C.textPrimary, marginTop: 6 }} numberOfLines={1}>{item.name}</Text>
                      <Text style={{ fontSize: 11, fontWeight: "800", color: C.textSecondary }}>{item.price} EGP</Text>
                      <Pressable onPress={()=> { (useCartStore.getState() as any).addItem({ id: item.id, name: item.name, price: Number(item.price), image_url: item.image_url || "" }) }} style={{ marginTop: 6, backgroundColor: C.textPrimary, height: 26, borderRadius: 13, justifyContent: "center", alignItems: "center" }}><Ionicons name="add" size={14} color={C.card}/></Pressable>
                    </View>
                  )}
                />
              </View>
            )}
          </View>
        }
      />

      <View style={{ position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: C.background, paddingHorizontal: 20, paddingTop: 14, paddingBottom: insets.bottom + 14, borderTopWidth: 1, borderTopColor: C.border }}>
        <Pressable onPress={() => router.push("/checkout" as any)} style={{ backgroundColor: C.textPrimary, height: 58, borderRadius: 29, flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 24 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Text style={{ color: C.card, fontSize: 16, fontWeight: "800" }}>Checkout</Text>
            <Ionicons name="arrow-forward" size={18} color={C.card}/>
          </View>
          <Text style={{ color: C.card, fontSize: 15, fontWeight: "900" }}>{total} EGP</Text>
        </Pressable>
      </View>
    </View>
  );
}