import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { ArrowLeft, Minus, Plus } from "lucide-react-native";
import { useEffect, useState } from "react";
import { FlatList, Image, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../../lib/supabase";
import { useCartStore } from "../../../store/cart.store";

const C = { bg: "#FFFCF7", white: "#fff", beige: "#F5EFE6", dark: "#1A1A1A", orange: "#FF6B00", gray: "#8E8E93", gold: "#C5A46A" };

export default function Cart() {
  const { items, increaseQty, decreaseQty, getTotalPrice, addItem } = useCartStore() as any;
  const [suggested, setSuggested] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const ids = items.map((i: any) => i.id);
      let q = supabase.from("products").select("*").eq("is_available", true).limit(8);
      if (ids.length) q = q.not("id", "in", `(${ids.join(",")})`);
      const { data } = await q;
      if (data) setSuggested(data);
    })();
  }, [items.length]);

  const saving = items.reduce((s: any, i: any) => s + ((i.original_price || i.price) - i.price) * i.quantity, 0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.white }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 }}>
        <Pressable onPress={() => router.back()} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: C.white, borderWidth: 1, borderColor: '#eee', justifyContent: 'center', alignItems: 'center' }}>
          <ArrowLeft size={20} />
        </Pressable>
        <View>
          <Text style={{ fontWeight: '900', fontSize: 18 }}>Cart</Text>
          <Text style={{ color: C.gray, fontSize: 12 }}>السلة ({items.length})</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 220 }}>
        {items.map((item: any) => (
          <View key={`${item.id}-${JSON.stringify(item.customizations)}`} style={{ padding: 16, flexDirection: 'row', borderBottomWidth: 8, borderColor: C.bg }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '800', fontSize: 16 }} numberOfLines={2}>{item.name}</Text>
              {item.customizations?.length > 0 && <Text style={{ color: C.orange, fontSize: 12, marginTop: 4, fontWeight: '700' }}>Edit • {item.customizations.map((c: any) => c.name).join(", ")}</Text>}
              <Text style={{ marginTop: 24, fontWeight: '900' }}>EGP {item.price * item.quantity}.00 {item.original_price ? <Text style={{ textDecorationLine: 'line-through', color: C.gray, fontWeight: '400' }}> EGP {item.original_price * item.quantity}.00</Text> : null}</Text>
            </View>
            <View>
              <Image source={{ uri: item.image_url || item.image }} style={{ width: 110, height: 110, borderRadius: 16, backgroundColor: C.beige }} />
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: C.white, borderRadius: 20, borderWidth: 1, borderColor: '#eee', marginTop: -18, alignSelf: 'center', paddingHorizontal: 6 }}>
                <Pressable onPress={() => decreaseQty(item.id, item.customizations)} style={{ padding: 10 }}><Minus size={16} color={C.orange} /></Pressable>
                <Text style={{ width: 24, textAlign: 'center', fontWeight: '800' }}>{item.quantity}</Text>
                <Pressable onPress={() => increaseQty(item.id, item.customizations)} style={{ padding: 10 }}><Plus size={16} color={C.orange} /></Pressable>
              </View>
            </View>
          </View>
        ))}

        {suggested.length > 0 && (
          <View style={{ paddingVertical: 16, backgroundColor: C.bg }}>
            <Text style={{ fontWeight: '900', fontSize: 18, paddingHorizontal: 16, marginBottom: 12 }}>You might also like...</Text>
            <FlatList
              horizontal
              data={suggested}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16 }}
              ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
              renderItem={({ item }) => {
                const save = (item.original_price || 0) - item.price;
                return (
                  <View style={{ width: 130 }}>
                    <View>
                      <Image source={{ uri: item.image_url }} style={{ width: 130, height: 110, borderRadius: 14, backgroundColor: C.white }} />
                      {save > 0 && <View style={{ position: 'absolute', top: 6, left: 6, backgroundColor: '#B9FF66', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}><Text style={{ fontSize: 10, fontWeight: '800' }}>Save EGP {save}.00</Text></View>}
                      <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); addItem(item); }} style={{ position: 'absolute', bottom: -12, right: 8, width: 32, height: 32, borderRadius: 16, backgroundColor: C.white, justifyContent: 'center', alignItems: 'center', elevation: 4 }}><Plus size={18} color={C.orange} /></Pressable>
                    </View>
                    <Text numberOfLines={2} style={{ fontWeight: '700', marginTop: 16, fontSize: 13 }}>{item.name}</Text>
                    <Text style={{ fontWeight: '800', fontSize: 13, marginTop: 4 }}>EGP {item.price}.00</Text>
                  </View>
                )
              }}
            />
          </View>
        )}
      </ScrollView>

      {saving > 0 && <View style={{ backgroundColor: '#FFF0E0', padding: 12, flexDirection: 'row', justifyContent: 'space-between', position: 'absolute', bottom: 88, left: 0, right: 0 }}><Text style={{ fontWeight: '600' }}>Great! You're saving EGP {saving}.00</Text><Text>🎉</Text></View>}

      {/* Bottom Buttons - الاتنين اورنج */}
      <View style={{ position: 'absolute', bottom: 125, left: 16, right: 16, flexDirection: 'row', gap: 12 }}>
        <Pressable onPress={() => router.replace('/(taps)' as any)} style={{ flex: 1, height: 54, borderRadius: 27, backgroundColor: '#FF6B00', justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontWeight: '900', color: 'white' }}>Add items</Text>
        </Pressable>
        <Pressable onPress={() => router.push('/checkout' as any)} style={{ flex: 1, height: 54, borderRadius: 27, backgroundColor: '#FF6B00', justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: 'white', fontWeight: '900' }}>Checkout</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}