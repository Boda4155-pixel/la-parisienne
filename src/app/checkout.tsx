import { router } from "expo-router";
import { ArrowLeft, Bike, MapPin } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../store/auth.store";
import { useCartStore } from "../../store/cart.store";

const C = { orange: "#FF6B00", bg: "#F5F5F5", white: "#fff", dark: "#1A1A1A", gray: "#8E8E93" };

// 
const DELIVERY_FEES: Record<string, number> = {
  "مدينة نصر": 50,
  "المعادي": 40,
  "التجمع": 100,
  "مصر الجديدة": 45,
  "زايد": 80,
  "اكتوبر": 80,
};
const FREE_DELIVERY_LIMIT = 500;

export default function Checkout() {
  const { items, getTotalPrice, clearCart } = useCartStore() as any;
  const { profile } = useAuthStore() as any;
  const subtotal = getTotalPrice();
  const [selectedAddress, setSelectedAddress] = useState<any>(null);
  const [addresses, setAddresses] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("addresses").select("*").eq("user_id", profile?.id).order("is_default", { ascending: false });
      if (data?.length) {
        setAddresses(data);
        setSelectedAddress(data[0]);
      }
    })();
  }, []);

  const area = selectedAddress?.city || selectedAddress?.area || "مدينة نصر";
  const deliveryFee = DELIVERY_FEES[area]?? 50;
  const finalDeliveryFee = subtotal >= FREE_DELIVERY_LIMIT? 0 : deliveryFee;
  const needForFree = FREE_DELIVERY_LIMIT - subtotal;
  const total = subtotal + finalDeliveryFee;

  const placeOrder = async () => {
    if (!selectedAddress) {
      router.push("/addresses" as any);
      return;
    }
    const { data: order } = await supabase.from("orders").insert({
      user_id: profile.id,
      total_amount: total,
      delivery_fee: finalDeliveryFee,
      address_id: selectedAddress.id,
      status: "pending"
    }).select().single();

    if (order) {
      for (let item of items) {
        await supabase.from("order_items").insert({ order_id: order.id, product_id: item.id, quantity: item.quantity, price: item.price });
      }
      clearCart();
      router.replace("/(taps)/orders" as any);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.white }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 }}>
        <Pressable onPress={() => router.back()} style={{ width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: '#eee', justifyContent: 'center', alignItems: 'center' }}>
          <ArrowLeft size={20} />
        </Pressable>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ fontWeight: '900', fontSize: 20 }}>Checkout</Text>
          <Text style={{ color: C.gray, fontSize: 13 }}>{area}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 120 }}>

        {/* Address Card - زي طلبات */}
        <View style={{ borderWidth: 1, borderColor: '#eee', borderRadius: 20, overflow: 'hidden', backgroundColor: C.white }}>
          {/* Map Preview - شكل طلبات */}
          <View style={{ height: 110, backgroundColor: '#E8F0E8', justifyContent: 'center', alignItems: 'center' }}>
            <Image source={{ uri: `https://maps.googleapis.com/maps/api/staticmap?center=Cairo&zoom=12&size=600x200&markers=color:orange|Cairo&key=demo` }} style={{ width: '100%', height: '100%' }} />
            <View style={{ position: 'absolute', backgroundColor: C.white, padding: 8, borderRadius: 20, elevation: 4 }}>
              <MapPin size={24} color={C.orange} fill={C.orange} />
            </View>
          </View>
          <View style={{ padding: 14, flexDirection: 'row', justifyContent: 'space-between' }}>
            <Pressable onPress={() => router.push("/addresses" as any)}>
              <Text style={{ fontWeight: '800', textDecorationLine: 'underline' }}>Change</Text>
            </Pressable>
            <View style={{ alignItems: 'flex-end', flex: 1, marginRight: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ fontWeight: '800' }}>{selectedAddress?.label || area}</Text>
                <MapPin size={18} color={C.orange} />
              </View>
              <Text style={{ color: C.gray, marginTop: 4, textAlign: 'right' }}>{selectedAddress?.street || "لم يتم اختيار عنوان"}</Text>
              <Text style={{ color: C.gray, fontSize: 12, marginTop: 2 }}>المنطقة: {area}</Text>
            </View>
          </View>
        </View>

        {/* Delivery */}
        <View style={{ borderWidth: 1, borderColor: '#eee', borderRadius: 20, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Bike size={24} color={C.orange} />
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontWeight: '900' }}>Delivery</Text>
            <Text style={{ color: C.gray, fontSize: 13 }}>Arriving in approx. 20 - 40 mins</Text>
          </View>
        </View>

        {/* Pay */}
        <View>
          <Text style={{ fontWeight: '900', fontSize: 20, textAlign: 'right', marginBottom: 8 }}>Pay with</Text>
          <View style={{ borderWidth: 1, borderColor: '#eee', borderRadius: 16, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: C.orange, borderWidth: 5, borderColor: '#FFD0B0' }} />
            <Text style={{ fontWeight: '700' }}>💵 Cash on Delivery</Text>
          </View>
        </View>

        {/* Summary */}
        <View>
          <Text style={{ fontWeight: '900', fontSize: 20, textAlign: 'right', marginBottom: 12 }}>Payment summary</Text>
          <View style={{ gap: 10 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Text style={{ color: C.gray }}>Subtotal ({items.length} items)</Text><Text style={{ fontWeight: '700' }}>EGP {subtotal}.00</Text></View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Text style={{ color: C.gray }}>Delivery fee ({area})</Text><Text style={{ fontWeight: '700' }}>{finalDeliveryFee === 0? "FREE" : `EGP ${finalDeliveryFee}.00`}</Text></View>
            {needForFree > 0 && needForFree < 200 && (
              <Text style={{ color: C.orange, textAlign: 'right', fontSize: 13, marginTop: 4 }}>اطلب بـ {needForFree} جنيه كمان والتوصيل يبقى مجاني!</Text>
            )}
            <View style={{ height: 1, backgroundColor: '#eee', marginVertical: 8 }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Text style={{ fontWeight: '900', fontSize: 18 }}>Total amount</Text><Text style={{ fontWeight: '900', fontSize: 18 }}>EGP {total}.00</Text></View>
          </View>
        </View>
      </ScrollView>

      <View style={{ position: 'absolute', bottom: 30, left: 0, right: 0, padding: 16, backgroundColor: C.white, borderTopWidth: 1, borderColor: '#eee' }}>
        <Pressable onPress={placeOrder} style={{ height: 56, borderRadius: 28, backgroundColor: C.orange, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: 'white', fontWeight: '900', fontSize: 16 }}>Place order • EGP {total}.00</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}