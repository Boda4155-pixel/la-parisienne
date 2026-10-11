import Ionicons from "@expo/vector-icons/Ionicons";
import * as Location from 'expo-location';
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { supabase } from "./(customer)/../../../lib/supabase";
import { useAuthStore } from "./(customer)/../../../store/auth.store";
import { useCartStore } from "./(customer)/../../../store/cart.store";
import { useLocationStore } from "./(customer)/../../../store/location.store";

const DELIVERY_FEES: Record<string, number> = { "Nasr City": 50, "Maadi": 40, "New Cairo": 100, "Heliopolis": 45, "Sheikh Zayed": 80, "6th October": 80, "El Rehab": 60, "Cairo": 50 };
const FREE_LIMIT = 500;

const reverseGeocode = async (lat: number, lng: number) => {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, { headers: { 'User-Agent': 'LaParisienne/1.0' } });
    const data = await res.json();
    const addr = data.address || {};
    const area = addr.suburb || addr.neighbourhood || addr.city_district || addr.village || '';
    const city = addr.city || addr.town || addr.county || 'Cairo';
    const street = addr.road || addr.street || '';
    const label = area? `${area} - ${street}` : (street || city);
    return { label: label.slice(0, 40), street: street || data.display_name?.split(',')[0] || '', full: data.display_name, city, area };
  } catch { return { label: `${lat.toFixed(4)}, ${lng.toFixed(4)}`, street: '', full: '', city: 'Cairo', area: '' }; }
};

export default function Checkout() {
  const insets = useSafeAreaInsets();
  const { getTotalPrice, clearCart } = useCartStore() as any;
  const { profile } = useAuthStore() as any;
  const { selected, setSelected, isLocating, setIsLocating } = useLocationStore();
  const subtotal = getTotalPrice();

  const [allAddresses, setAllAddresses] = useState<any[]>([]);
  const [coord, setCoord] = useState({ lat: selected?.lat || 30.0596, lng: selected?.lng || 31.3428 });
  const [street, setStreet] = useState(selected?.street || "");
  const [addressLabel, setAddressLabel] = useState(selected?.label || "Detecting location...");
  const [fullAddressText, setFullAddressText] = useState(selected?.fullAddress || "");
  const [building, setBuilding] = useState("");
  const [apt, setApt] = useState("");
  const [floor, setFloor] = useState("");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [mapLoading, setMapLoading] = useState(true);
  const [showSheet, setShowSheet] = useState(false);

  useEffect(() => {
    (async () => {
      if (selected) {
        setCoord({ lat: selected.lat, lng: selected.lng });
        setAddressLabel(selected.label);
        setStreet(selected.street);
        setFullAddressText(selected.fullAddress);
        setMapLoading(false);
        return;
      }
      try {
        setIsLocating(true);
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status!== 'granted') { setMapLoading(false); setIsLocating(false); setAddressLabel("Tap to select location"); return; }
        let loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const real = await reverseGeocode(loc.coords.latitude, loc.coords.longitude);
        const newLoc = { label: real.label, street: real.street, fullAddress: real.full, lat: loc.coords.latitude, lng: loc.coords.longitude, city: real.city, area: real.area };
        setSelected(newLoc as any);
        setCoord({ lat: loc.coords.latitude, lng: loc.coords.longitude });
        setAddressLabel(real.label);
        setFullAddressText(real.full);
        setStreet(real.street);
      } finally { setIsLocating(false); setMapLoading(false); }
    })();
  }, []);

  useFocusEffect(useCallback(() => {
    if (selected) {
      setCoord({ lat: selected.lat, lng: selected.lng });
      setAddressLabel(selected.label);
      setStreet(selected.street);
      setFullAddressText(selected.fullAddress);
      setMapLoading(false);
    }
    (async () => {
      const { data } = await supabase.from("customer_addresses").select("*").order("is_default", { ascending: false });
      if (data?.length) setAllAddresses(data);
    })();
  }, [selected]));

  const onMapMove = async (lat: number, lng: number) => {
    setCoord({ lat, lng });
    const real = await reverseGeocode(lat, lng);
    setAddressLabel(real.label);
    setFullAddressText(real.full);
    setStreet(real.street);
    setSelected({ label: real.label, street: real.street, fullAddress: real.full, lat, lng, city: real.city, area: real.area } as any);
  };

  const useCurrentLocation = async () => {
    setShowSheet(false);
    setMapLoading(true);
    let loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    const real = await reverseGeocode(loc.coords.latitude, loc.coords.longitude);
    setCoord({ lat: loc.coords.latitude, lng: loc.coords.longitude });
    setAddressLabel(real.label);
    setFullAddressText(real.full);
    setStreet(real.street);
    setSelected({ label: real.label, street: real.street, fullAddress: real.full, lat: loc.coords.latitude, lng: loc.coords.longitude, city: real.city, area: real.area } as any);
    setMapLoading(false);
  };

  const fee = subtotal >= FREE_LIMIT? 0 : (DELIVERY_FEES[selected?.city || selected?.area || "Cairo"]?? 50);
  const total = subtotal + fee;

  const mapHtml = `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"/><link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/><script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script><style>html,body,#map{height:100%;margin:0;padding:0}.leaflet-control-attribution{display:none}</style></head><body><div id="map"></div><script>var map=L.map('map',{zoomControl:false,attributionControl:false}).setView([${coord.lat},${coord.lng}],16);L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19}).addTo(map);map.on('moveend',function(){var c=map.getCenter();window.ReactNativeWebView.postMessage(JSON.stringify(c));});map.on('click',function(e){map.setView(e.latlng,16);});</script></body></html>`;

  const placeOrder = async () => {
    if (loading) return;
    if (!building ||!phone) { Alert.alert("Incomplete", "Please fill building and phone"); return; }
    setLoading(true);
    try {
      const full = `${addressLabel} | ${fullAddressText} | Building ${building}, Apt ${apt}, Floor ${floor} | Notes: ${notes}`;
      const { error } = await supabase.rpc('create_secure_order', {
        p_address_id: null, p_street: street, p_building: building, p_apartment: apt, p_floor: floor,
        p_phone: phone, p_notes: notes, p_lat: coord.lat, p_lng: coord.lng, p_payment_method: 'cash', p_delivery_address_text: full
      });
      if (error) throw error;
      clearCart();
      router.replace("/(customer)/orders" as any);
    } catch (e: any) { Alert.alert("Failed", e.message); } finally { setLoading(false); }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFBF5" }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: insets.top + 12, paddingBottom: 14 }}>
        <Pressable onPress={() => router.back()} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "#fff", borderWidth: 1, borderColor: "#F0E6D9", justifyContent: 'center', alignItems: 'center' }}>
          <Ionicons name="arrow-back" size={20} color="#2B2117" />
        </Pressable>
        <Text style={{ fontWeight: '900', fontSize: 18, color: "#2B2117", marginLeft: 14 }}>Checkout</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 140, gap: 16 }}>
        <View style={{ height: 220, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: "#F0E6D9", backgroundColor: "#fff" }}>
          {mapLoading? (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <ActivityIndicator color="#0A84FF" />
              <Text style={{ marginTop: 8, color: '#888', fontSize: 12 }}>Detecting location...</Text>
            </View>
          ) : (
            <View style={{ flex: 1 }}>
              <WebView source={{ html: mapHtml }} originWhitelist={['*']} scrollEnabled={false} onMessage={(e) => { const { lat, lng } = JSON.parse(e.nativeEvent.data); onMapMove(lat, lng); }} style={{ flex: 1 }} />
              <View style={{ position: 'absolute', left: '50%', top: '50%', marginLeft: -20, marginTop: -48, alignItems: 'center', pointerEvents: 'none' }}>
                <View style={{ backgroundColor: '#000', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginBottom: 8 }}>
                  <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>Your order will be delivered here</Text>
                </View>
                <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: '#0A84FF', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#fff' }}>
                  <Ionicons name="location-sharp" size={22} color="#fff" />
                </View>
              </View>
              <Pressable onPress={() => router.push("/(customer)/delivery-location" as any)} style={{ position: 'absolute', bottom: 10, right: 10, backgroundColor: '#fff', paddingHorizontal: 12, height: 32, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 6, elevation: 3 }}>
                <Text style={{ fontWeight: '700', fontSize: 11 }}>Full map</Text>
                <Ionicons name="expand-outline" size={14} />
              </Pressable>
            </View>
          )}
        </View>

        <View style={{ backgroundColor: "#fff", borderRadius: 20, padding: 14, borderWidth: 1, borderColor: "#F0E6D9", flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#E8F0FE', justifyContent: 'center', alignItems: 'center' }}>
              <Ionicons name="location" size={18} color="#0A84FF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '800', color: "#2B2117", fontSize: 13 }} numberOfLines={1}>{isLocating? "Detecting..." : addressLabel}</Text>
              <Text style={{ color: "#8B7355", marginTop: 2, fontSize: 11 }} numberOfLines={1}>{fullAddressText || street || "Drag map to adjust"}</Text>
            </View>
          </View>
          <Pressable onPress={() => setShowSheet(true)} style={{ backgroundColor: "#2B2117", paddingHorizontal: 18, height: 34, borderRadius: 17, justifyContent: 'center' }}>
            <Text style={{ fontWeight: '800', color: '#fff', fontSize: 12 }}>Change</Text>
          </Pressable>
        </View>

        <View style={{ gap: 10 }}>
          <Text style={{ fontWeight: '900', color: "#2B2117", letterSpacing: 1, fontSize: 11 }}>ADDRESS DETAILS</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={{ flex: 1, backgroundColor: "#fff", borderRadius: 24, borderWidth: 1, borderColor: "#E8DDD0", paddingHorizontal: 14, height: 48, justifyContent: 'center' }}>
              <TextInput placeholder="Building" value={building} onChangeText={setBuilding} style={{ fontWeight: '600', fontSize: 13 }} />
            </View>
            <View style={{ flex: 1, backgroundColor: "#fff", borderRadius: 24, borderWidth: 1, borderColor: "#E8DDD0", paddingHorizontal: 14, height: 48, justifyContent: 'center' }}>
              <TextInput placeholder="Apt" value={apt} onChangeText={setApt} keyboardType="number-pad" style={{ fontWeight: '600', fontSize: 13 }} />
            </View>
            <View style={{ flex: 1, backgroundColor: "#fff", borderRadius: 24, borderWidth: 1, borderColor: "#E8DDD0", paddingHorizontal: 14, height: 48, justifyContent: 'center' }}>
              <TextInput placeholder="Floor" value={floor} onChangeText={setFloor} keyboardType="number-pad" style={{ fontWeight: '600', fontSize: 13 }} />
            </View>
          </View>
          <View style={{ backgroundColor: "#fff", borderRadius: 24, borderWidth: 1, borderColor: "#E8DDD0", paddingHorizontal: 16, height: 52, justifyContent: 'center' }}>
            <TextInput placeholder="Street" value={street} onChangeText={setStreet} style={{ fontWeight: '600', fontSize: 13 }} />
          </View>
          <View style={{ backgroundColor: "#fff", borderRadius: 24, borderWidth: 1, borderColor: "#E8DDD0", paddingHorizontal: 16, height: 52, justifyContent: 'center' }}>
            <TextInput placeholder="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" style={{ fontWeight: '600', fontSize: 13 }} />
          </View>
          <View style={{ backgroundColor: "#fff", borderRadius: 24, borderWidth: 1, borderColor: "#E8DDD0", paddingHorizontal: 16, height: 56, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="create-outline" size={16} color="#B8A89A" />
            <TextInput placeholder="Add delivery notes (optional)" value={notes} onChangeText={setNotes} style={{ flex: 1, fontWeight: '500', fontSize: 12 }} />
          </View>
        </View>

        <View style={{ backgroundColor: "#fff", borderRadius: 20, padding: 16, borderWidth: 1, borderColor: "#F0E6D9", gap: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: "#8B7355" }}>Subtotal</Text>
            <Text style={{ fontWeight: '700' }}>{subtotal} EGP</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: "#8B7355" }}>Delivery</Text>
            <Text style={{ fontWeight: '700' }}>{fee === 0? "FREE" : `${fee} EGP`}</Text>
          </View>
          <View style={{ height: 1, backgroundColor: "#F0E6D9", marginVertical: 6 }} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontWeight: '900', fontSize: 16 }}>Total</Text>
            <Text style={{ fontWeight: '900', fontSize: 16 }}>{total} EGP</Text>
          </View>
        </View>
      </ScrollView>

      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: "#FFFBF5", borderTopWidth: 1, borderColor: "#F0E6D9", paddingBottom: insets.bottom + 16 }}>
        <Pressable disabled={loading} onPress={placeOrder} style={{ height: 56, borderRadius: 28, backgroundColor: loading? "#D9C5B0" : "#2B2117", justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontWeight: '900', fontSize: 15 }}>{loading? "Processing..." : `Place Order - ${total} EGP`}</Text>
        </Pressable>
      </View>

      <Modal visible={showSheet} animationType="slide" transparent onRequestClose={() => setShowSheet(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%', paddingBottom: insets.bottom }}>
            <View style={{ padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' }}>
              <Text style={{ fontWeight: '900', fontSize: 18 }}>Choose delivery location</Text>
              <Pressable onPress={() => setShowSheet(false)} style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name="close" size={18} />
              </Pressable>
            </View>
            <FlatList
              data={allAddresses}
              keyExtractor={i => i.id}
              style={{ maxHeight: 320 }}
              ListHeaderComponent={<Text style={{ fontWeight: '800', fontSize: 13, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>Saved addresses</Text>}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => {
                    const rev = { label: item.area || item.city, street: item.address_line, fullAddress: item.address_line, lat: item.latitude, lng: item.longitude, city: item.city, area: item.area };
                    setSelected(rev as any);
                    setTimeout(() => setShowSheet(false), 100);
                  }}
                  style={{ flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 14, gap: 12, borderBottomWidth: 1, borderBottomColor: '#f8f8f8' }}
                >
                  <Ionicons name="location-outline" size={20} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '700', fontSize: 12 }}>{item.label || 'Home'}</Text>
                    <Text style={{ color: '#666', fontSize: 11, marginTop: 4 }} numberOfLines={2}>{item.address_line}, {item.area} - {item.city}</Text>
                  </View>
                </Pressable>
              )}
            />
            <View style={{ padding: 16, gap: 10 }}>
              <Pressable onPress={() => { setShowSheet(false); router.push("/(customer)/delivery-location" as any); }} style={{ height: 56, borderWidth: 1, borderColor: '#eee', borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center' }}><Ionicons name="location" size={18} /></View>
                  <View><Text style={{ fontWeight: '700', fontSize: 13 }}>Deliver to a different location</Text><Text style={{ color: '#888', fontSize: 11 }}>Choose location on map</Text></View>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#999" />
              </Pressable>
              <Pressable onPress={useCurrentLocation} style={{ height: 56, borderWidth: 1, borderColor: '#eee', borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center' }}><Ionicons name="navigate" size={18} /></View>
                  <View><Text style={{ fontWeight: '700', fontSize: 13 }}>Deliver to current location</Text><Text style={{ color: '#888', fontSize: 11 }}>Use GPS</Text></View>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#999" />
              </Pressable>
              <Pressable onPress={() => { setShowSheet(false); router.push("/(customer)/delivery-location" as any); }} style={{ height: 50, borderRadius: 25, backgroundColor: '#0A84FF', justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 8, marginTop: 6 }}>
                <Ionicons name="add" size={20} color="#fff" />
                <Text style={{ color: '#fff', fontWeight: '900', fontSize: 14 }}>Add new address</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}