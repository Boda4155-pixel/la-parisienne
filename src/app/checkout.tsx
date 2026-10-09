import { router, useFocusEffect } from "expo-router";
import { ArrowLeft, Banknote, Building2, Check, CreditCard, Hash, Layers, MapPin, Phone } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { Alert, FlatList, Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../store/auth.store";
import { useCartStore } from "../../store/cart.store";

const C = { orange: "#FF6B00", white: "#fff", gray: "#8E8E93", light: "#F6F6F6", border: "#EEEEEE" };
const DELIVERY_FEES: Record<string, number> = { "مدينة نصر": 50, "المعادي": 40, "التجمع": 100, "مصر الجديدة": 45, "زايد": 80, "اكتوبر": 80 };
const FREE_LIMIT = 500;

export default function Checkout() {
  const { items, getTotalPrice, clearCart } = useCartStore() as any;
  const { profile } = useAuthStore() as any;
  const subtotal = getTotalPrice();
  const [selectedAddress, setSelectedAddress] = useState<any>(null);
  const [allAddresses, setAllAddresses] = useState<any[]>([]);
  const [showAddrModal, setShowAddrModal] = useState(false);
  const [coord, setCoord] = useState({ lat: 30.0444, lng: 31.2357 });
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'visa_machine'>('cash');
  const [street, setStreet] = useState(""); const [building, setBuilding] = useState("");
  const [apt, setApt] = useState(""); const [floor, setFloor] = useState("");
  const [phone, setPhone] = useState(profile?.phone || ""); const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const loadAddresses = async () => {
    const { data } = await supabase.from("addresses").select("*").eq("user_id", profile?.id).order("is_default", { ascending: false });
    if(data?.length){ setAllAddresses(data); if(!selectedAddress) { setSelectedAddress(data[0]); applyAddress(data[0]); } }
  };
  const applyAddress = (addr:any) => {
    setSelectedAddress(addr); setStreet(addr.street||""); setBuilding(addr.building||"");
    setApt(addr.apartment||""); setFloor(addr.floor||""); setPhone(addr.phone||profile?.phone||"");
    if(addr.lat) setCoord({ lat: addr.lat, lng: addr.lng }); setShowAddrModal(false);
  }
  useEffect(()=>{ loadAddresses(); },[]);
  useFocusEffect(useCallback(()=>{ loadAddresses(); },[]));

  const area = selectedAddress?.city || "مدينة نصر";
  const fee = subtotal >= FREE_LIMIT? 0 : (DELIVERY_FEES[area]?? 50);
  const total = subtotal + fee;

  const mapHtml = `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"/><link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/><script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script><style>html,body,#map{height:100%;margin:0;padding:0}</style></head><body><div id="map"></div><script>var map=L.map('map',{zoomControl:false,attributionControl:false}).setView([${coord.lat},${coord.lng}],16);L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);var m=L.marker([${coord.lat},${coord.lng}],{draggable:true}).addTo(map);m.on('dragend',function(){var p=m.getLatLng();window.ReactNativeWebView.postMessage(JSON.stringify(p));});map.on('click',function(e){m.setLatLng(e.latlng);window.ReactNativeWebView.postMessage(JSON.stringify(e.latlng));});</script></body></html>`;

  const placeOrder = async () => {
    if(loading) return;
    if(!street ||!building ||!phone){ Alert.alert("كمل البيانات", "الشارع والعمارة والموبايل مطلوبين"); return; }
    setLoading(true);
    try{
      const fullAddress = `${street}, عمارة ${building}, شقة ${apt}, دور ${floor} - ${notes}`;

      // ✅ الحل المتأمن: السعر بيتحسب في السيرفر مش هنا
      const { data: orderId, error } = await supabase.rpc('create_secure_order', {
        p_address_id: selectedAddress?.id || null,
        p_street: street,
        p_building: building,
        p_apartment: apt,
        p_floor: floor,
        p_phone: phone,
        p_notes: notes,
        p_lat: coord.lat,
        p_lng: coord.lng,
        p_payment_method: paymentMethod,
        p_delivery_address_text: fullAddress
      });

      if(error) throw error;

      clearCart();
      Alert.alert("تم ✅", `الاوردر اتعمل - الدفع: ${paymentMethod==='cash'? 'كاش' : 'فيزا عند الاستلام'}`);
      router.replace("/(tabs)/orders" as any);

    }catch(e:any){
      console.log("ORDER FAIL", e);
      Alert.alert("فشل تنفيذ الاوردر", e.message);
    }finally{ setLoading(false); }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.white }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 }}>
        <Pressable onPress={() => router.back()} style={{ width:44, height:44, borderRadius:22, borderWidth:1, borderColor:C.border, justifyContent:'center', alignItems:'center' }}><ArrowLeft size={20} /></Pressable>
        <Text style={{ fontWeight:'900', fontSize:20 }}>Checkout</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding:16, gap:16, paddingBottom:130 }}>
        <View style={{ height:220, borderRadius:20, overflow:'hidden', borderWidth:1, borderColor:C.border }}>
          <WebView source={{ html: mapHtml }} originWhitelist={['*']} scrollEnabled={false} onMessage={(e)=>{ const {lat,lng}=JSON.parse(e.nativeEvent.data); setCoord({lat,lng}); }} />
        </View>

        <View style={{ borderWidth:1, borderColor:C.border, borderRadius:20, padding:14, flexDirection:'row', justifyContent:'space-between' }}>
          <Pressable onPress={()=> setShowAddrModal(true)} style={{ backgroundColor:C.orange, paddingHorizontal:18, height:36, borderRadius:18, justifyContent:'center' }}>
            <Text style={{ fontWeight:'800', color:'#fff' }}>Change</Text>
          </Pressable>
          <View style={{ alignItems:'flex-end', flex:1, marginRight:12 }}>
            <View style={{ flexDirection:'row', gap:6, alignItems:'center' }}><Text style={{ fontWeight:'800' }}>{area}</Text><MapPin size={16} color={C.orange}/></View>
            <Text style={{ color:C.gray, marginTop:4, textAlign:'right' }} numberOfLines={2}>{street || "اختار عنوان"}</Text>
            <Text style={{ color:C.gray, fontSize:11 }}>{coord.lat.toFixed(5)}, {coord.lng.toFixed(5)}</Text>
          </View>
        </View>

        <View style={{ gap:10 }}>
          <Text style={{ fontWeight:'900', textAlign:'right' }}>تفاصيل العنوان</Text>
          <View style={{ flexDirection:'row', gap:10 }}>
            <View style={{ flex:1, backgroundColor:C.light, borderRadius:14, flexDirection:'row', alignItems:'center', paddingHorizontal:12, height:50 }}><Layers size={16} color={C.gray}/><TextInput placeholder="الدور" value={floor} onChangeText={setFloor} style={{ flex:1, textAlign:'right', marginLeft:8 }} keyboardType="number-pad"/></View>
            <View style={{ flex:1, backgroundColor:C.light, borderRadius:14, flexDirection:'row', alignItems:'center', paddingHorizontal:12, height:50 }}><Hash size={16} color={C.gray}/><TextInput placeholder="الشقة" value={apt} onChangeText={setApt} style={{ flex:1, textAlign:'right', marginLeft:8 }} keyboardType="number-pad"/></View>
            <View style={{ flex:1, backgroundColor:C.light, borderRadius:14, flexDirection:'row', alignItems:'center', paddingHorizontal:12, height:50 }}><Building2 size={16} color={C.gray}/><TextInput placeholder="العمارة" value={building} onChangeText={setBuilding} style={{ flex:1, textAlign:'right', marginLeft:8 }} /></View>
          </View>
          <View style={{ backgroundColor:C.light, borderRadius:14, flexDirection:'row', alignItems:'center', paddingHorizontal:12, height:50 }}><MapPin size={16} color={C.gray}/><TextInput placeholder="الشارع واسم المنطقة" value={street} onChangeText={setStreet} style={{ flex:1, textAlign:'right', marginLeft:8 }} /></View>
          <View style={{ backgroundColor:C.light, borderRadius:14, flexDirection:'row', alignItems:'center', paddingHorizontal:12, height:50 }}><Phone size={16} color={C.gray}/><TextInput placeholder="رقم الموبايل" value={phone} onChangeText={setPhone} style={{ flex:1, textAlign:'right', marginLeft:8 }} keyboardType="phone-pad"/></View>
          <View style={{ backgroundColor:C.light, borderRadius:14, paddingHorizontal:12, height:80 }}><TextInput placeholder="ملاحظات" value={notes} onChangeText={setNotes} style={{ flex:1, textAlign:'right', textAlignVertical:'top', marginTop:10 }} multiline/></View>
        </View>

        <View style={{ gap:10 }}>
          <Text style={{ fontWeight:'900', fontSize:18, textAlign:'right' }}>Pay with</Text>
          <Pressable onPress={()=> setPaymentMethod('cash')} style={{ borderWidth:1.5, borderColor: paymentMethod==='cash'? C.orange : C.border, borderRadius:16, padding:16, flexDirection:'row', justifyContent:'space-between', alignItems:'center', backgroundColor: paymentMethod==='cash'? '#FFF4EE' : '#fff' }}>
            <View style={{ width:22, height:22, borderRadius:11, borderWidth:2, borderColor: paymentMethod==='cash'? C.orange : '#ccc', justifyContent:'center', alignItems:'center' }}>{paymentMethod==='cash' && <View style={{ width:10, height:10, borderRadius:5, backgroundColor:C.orange }} />}</View>
            <View style={{ flexDirection:'row', alignItems:'center', gap:8 }}><Text style={{ fontWeight:'700' }}>Cash on Delivery</Text><Banknote size={20} color={C.orange} /></View>
          </Pressable>
          <Pressable onPress={()=> setPaymentMethod('visa_machine')} style={{ borderWidth:1.5, borderColor: paymentMethod==='visa_machine'? C.orange : C.border, borderRadius:16, padding:16, flexDirection:'row', justifyContent:'space-between', alignItems:'center', backgroundColor: paymentMethod==='visa_machine'? '#FFF4EE' : '#fff' }}>
            <View style={{ width:22, height:22, borderRadius:11, borderWidth:2, borderColor: paymentMethod==='visa_machine'? C.orange : '#ccc', justifyContent:'center', alignItems:'center' }}>{paymentMethod==='visa_machine' && <View style={{ width:10, height:10, borderRadius:5, backgroundColor:C.orange }} />}</View>
            <View style={{ flexDirection:'row', alignItems:'center', gap:8 }}><Text style={{ fontWeight:'700' }}>Visa on Delivery</Text><CreditCard size={20} color={C.orange} /></View>
          </Pressable>
        </View>

        <View style={{ borderTopWidth:1, borderColor:C.border, paddingTop:14, gap:8 }}>
          <View style={{ flexDirection:'row', justifyContent:'space-between' }}><Text style={{ color:C.gray }}>Subtotal ({items.length})</Text><Text style={{ fontWeight:'700' }}>EGP {subtotal}</Text></View>
          <View style={{ flexDirection:'row', justifyContent:'space-between' }}><Text style={{ color:C.gray }}>Delivery ({area})</Text><Text style={{ fontWeight:'700', color: fee===0? C.orange : '#000' }}>{fee===0? "FREE" : `EGP ${fee}`}</Text></View>
          <View style={{ flexDirection:'row', justifyContent:'space-between', marginTop:6 }}><Text style={{ fontWeight:'900', fontSize:18 }}>Total</Text><Text style={{ fontWeight:'900', fontSize:18 }}>EGP {total}</Text></View>
          <Text style={{ fontSize:11, color:C.gray, textAlign:'right', marginTop:4 }}>السعر النهائي بيتحسب في السيرفر للأمان</Text>
        </View>
      </ScrollView>

      <Modal visible={showAddrModal} animationType="slide" transparent>
        <View style={{ flex:1, backgroundColor:'rgba(0,0,0,0.4)', justifyContent:'flex-end' }}>
          <View style={{ backgroundColor:'#fff', borderTopLeftRadius:24, borderTopRightRadius:24, maxHeight:'70%', padding:16 }}>
            <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
              <Pressable onPress={()=> setShowAddrModal(false)}><Text style={{ color:C.orange, fontWeight:'800' }}>Close</Text></Pressable>
              <Text style={{ fontWeight:'900', fontSize:18 }}>اختار العنوان</Text>
            </View>
            <FlatList data={allAddresses} keyExtractor={i=>i.id} renderItem={({item})=>(
              <Pressable onPress={()=> applyAddress(item)} style={{ padding:14, borderWidth:1, borderColor: selectedAddress?.id===item.id? C.orange : C.border, borderRadius:14, marginBottom:10, flexDirection:'row', justifyContent:'space-between', backgroundColor: selectedAddress?.id===item.id? '#FFF4EE' : '#fff' }}>
                {selectedAddress?.id===item.id && <Check size={18} color={C.orange}/>}
                <View style={{ alignItems:'flex-end', flex:1 }}><Text style={{ fontWeight:'800' }}>{item.city} - {item.label}</Text><Text style={{ color:C.gray, marginTop:2 }}>{item.street}</Text></View>
              </Pressable>
            )} />
            <Pressable onPress={()=> { setShowAddrModal(false); router.push("/addresses" as any); }} style={{ marginTop:8, height:50, borderRadius:14, borderWidth:1, borderColor:C.border, justifyContent:'center', alignItems:'center' }}><Text style={{ fontWeight:'800' }}>+ اضافة عنوان جديد</Text></Pressable>
          </View>
        </View>
      </Modal>

      <View style={{ position:'absolute', bottom:30, left:0, right:0, padding:16, backgroundColor:C.white, borderTopWidth:1, borderColor:C.border }}>
        <Pressable disabled={loading} onPress={placeOrder} style={{ height:56, borderRadius:28, backgroundColor: loading? '#ccc' : C.orange, justifyContent:'center', alignItems:'center' }}>
          <Text style={{ color:'white', fontWeight:'900', fontSize:16 }}>{loading? "جاري التنفيذ..." : `Place order • EGP ${total}.00`}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}