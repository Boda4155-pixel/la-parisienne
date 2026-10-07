import { useFocusEffect } from "expo-router";
import { Banknote, CheckCircle2, ChevronDown, ChevronUp, Clock, CreditCard, MapPin, Package, Truck } from "lucide-react-native";
import { useCallback, useState } from "react";
import { FlatList, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../../lib/supabase";
import { useAuthStore } from "../../../store/auth.store";

const C = { orange:"#FF6B00", white:"#fff", gray:"#8E8E93", light:"#F6F6F6", border:"#EEEEEE", green:"#22C55E", blue:"#3B82F6" };

const STATUS_CONFIG:any = {
  pending: { label:"قيد الانتظار", color:"#F59E0B", bg:"#FEF3C7", icon: Clock },
  preparing: { label:"جاري التجهيز", color:"#3B82F6", bg:"#DBEAFE", icon: Package },
  out_for_delivery: { label:"في الطريق", color:"#8B5CF6", bg:"#EDE9FE", icon: Truck },
  delivered: { label:"تم التوصيل", color:"#22C55E", bg:"#DCFCE7", icon: CheckCircle2 },
  cancelled: { label:"ملغي", color:"#EF4444", bg:"#FEE2E2", icon: Clock },
};

const TABS = [
  { key:"all", label:"الكل" },
  { key:"pending", label:"منتظر" },
  { key:"preparing", label:"يتجهز" },
  { key:"out_for_delivery", label:"في الطريق" },
  { key:"delivered", label:"تم" },
];

export default function Orders(){
  const { profile } = useAuthStore() as any;
  const [orders, setOrders] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");
  const [expanded, setExpanded] = useState<string|null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    if(!profile?.id) return;
    setRefreshing(true);
    const { data, error } = await supabase
      .from("orders")
      .select(`*, order_items(*, products(name, image_url))`)
      .eq("user_id", profile.id)
      .order("created_at", {ascending:false});
    if(!error && data) setOrders(data);
    setRefreshing(false);
  };

  useFocusEffect(useCallback(()=>{ load(); 
    const ch = supabase.channel('orders-realtime').on('postgres_changes',{event:'*',schema:'public',table:'orders', filter:`user_id=eq.${profile?.id}`},()=>load()).subscribe();
    return ()=>{ supabase.removeChannel(ch); }
  },[profile?.id]));

  const filtered = filter==="all" ? orders : orders.filter(o=>o.status===filter);

  const renderItem = ({item}:{item:any}) => {
    const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
    const Icon = cfg.icon;
    const isOpen = expanded===item.id;
    const date = new Date(item.created_at).toLocaleDateString('ar-EG',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});

    return (
      <View style={{ backgroundColor:'#fff', borderRadius:20, borderWidth:1, borderColor:C.border, marginBottom:14, overflow:'hidden' }}>
        {/* Header */}
        <Pressable onPress={()=> setExpanded(isOpen? null : item.id)} style={{ padding:16 }}>
          <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center' }}>
            <View style={{ flexDirection:'row', alignItems:'center', gap:8, backgroundColor:cfg.bg, paddingHorizontal:10, paddingVertical:6, borderRadius:20 }}>
              <Icon size={14} color={cfg.color} />
              <Text style={{ color:cfg.color, fontWeight:'800', fontSize:12 }}>{cfg.label}</Text>
            </View>
            <Text style={{ color:C.gray, fontSize:12 }}>{date}</Text>
          </View>

          <View style={{ flexDirection:'row', justifyContent:'space-between', marginTop:12 }}>
            <Text style={{ fontWeight:'900', fontSize:16 }}>#{item.id.slice(0,8).toUpperCase()}</Text>
            <Text style={{ fontWeight:'900', fontSize:16 }}>EGP {item.total || item.total_amount}</Text>
          </View>

          <View style={{ flexDirection:'row', justifyContent:'space-between', marginTop:8, alignItems:'center' }}>
            <View style={{ flexDirection:'row', alignItems:'center', gap:4 }}>
              {item.payment_method==='cash' ? <Banknote size={14} color={C.gray}/> : <CreditCard size={14} color={C.gray}/>}
              <Text style={{ color:C.gray, fontSize:12 }}>{item.payment_method==='cash' ? 'كاش عند الاستلام' : 'فيزا عند الاستلام'} • {item.order_items?.length||0} منتجات</Text>
            </View>
            {isOpen ? <ChevronUp size={18} color={C.gray}/> : <ChevronDown size={18} color={C.gray}/>}
          </View>
        </Pressable>

        {isOpen && (
          <View style={{ borderTopWidth:1, borderColor:C.border, backgroundColor:"#FFFBF8" }}>
            <View style={{ padding:16, gap:10 }}>
              {item.order_items?.map((it:any)=>(
                <View key={it.id} style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center' }}>
                  <Text style={{ fontWeight:'700' }}>EGP {it.price * it.quantity}</Text>
                  <View style={{ flexDirection:'row', gap:8, alignItems:'center', flex:1, justifyContent:'flex-end' }}>
                    <View style={{ alignItems:'flex-end' }}>
                      <Text style={{ fontWeight:'700', textAlign:'right' }} numberOfLines={1}>{it.products?.name || 'منتج'}</Text>
                      <Text style={{ color:C.gray, fontSize:12 }}>x{it.quantity}</Text>
                    </View>
                    <View style={{ width:40, height:40, borderRadius:10, backgroundColor:C.light }} />
                  </View>
                </View>
              ))}
            </View>

            <View style={{ padding:16, gap:6, borderTopWidth:1, borderColor:C.border, borderStyle:'dashed' as any }}>
              <View style={{ flexDirection:'row', justifyContent:'space-between' }}><Text style={{color:C.gray}}>Subtotal</Text><Text>EGP {(item.total||item.total_amount) - (item.delivery_fee||0)}</Text></View>
              <View style={{ flexDirection:'row', justifyContent:'space-between' }}><Text style={{color:C.gray}}>Delivery</Text><Text>{item.delivery_fee===0? 'FREE' : `EGP ${item.delivery_fee}`}</Text></View>
              {item.delivery_address_text && (
                <View style={{ flexDirection:'row', gap:6, marginTop:8, backgroundColor:'#fff', padding:10, borderRadius:12, borderWidth:1, borderColor:C.border }}>
                  <MapPin size={14} color={C.orange} style={{marginTop:2}}/>
                  <Text style={{ flex:1, textAlign:'right', color:C.gray, fontSize:12 }}>{item.delivery_address_text}</Text>
                </View>
              )}
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex:1, backgroundColor:C.light }}>
      <View style={{ padding:16, backgroundColor:'#fff' }}>
        <Text style={{ fontWeight:'900', fontSize:22, textAlign:'right' }}>طلباتي</Text>
        <Text style={{ color:C.gray, textAlign:'right', marginTop:2 }}>{orders.length} طلب حتى الان</Text>
      </View>

      <View style={{ backgroundColor:'#fff', borderBottomWidth:1, borderColor:C.border }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ padding:12, gap:8, flexDirection:'row-reverse' }}>
          {TABS.map(t=>(
            <Pressable key={t.key} onPress={()=> setFilter(t.key)} style={{ paddingHorizontal:16, height:36, borderRadius:18, backgroundColor: filter===t.key? C.orange : C.light, justifyContent:'center' }}>
              <Text style={{ fontWeight:'800', color: filter===t.key? '#fff' : C.gray }}>{t.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={i=>i.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding:16, paddingBottom:100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} colors={[C.orange]} />}
        ListEmptyComponent={
          <View style={{ alignItems:'center', marginTop:80, gap:10 }}>
            <View style={{ width:80, height:80, borderRadius:40, backgroundColor:'#fff', justifyContent:'center', alignItems:'center' }}><Package size={32} color={C.gray}/></View>
            <Text style={{ fontWeight:'800', fontSize:16 }}>لسه مفيش طلبات</Text>
            <Text style={{ color:C.gray }}>اول اوردر هيظهر هنا</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}