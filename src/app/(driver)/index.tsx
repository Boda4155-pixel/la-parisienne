import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { supabase } from '../../../lib/supabase';
const BLACK='#000000';

export default function Home(){
  const router=useRouter();
  const [order,setOrder]=useState<any>(null);
  const [loading,setLoading]=useState(true);

  useEffect(()=>{ load(); },[]);
  const load = async()=>{
    setLoading(true);
    const {data} = await supabase.from('orders').select('*').eq('status','pending').is('driver_id',null).limit(1).maybeSingle();
    setOrder(data || null);
    setLoading(false);
  };

  const accept=async()=>{
    const {data:{user}}=await supabase.auth.getUser();
    if(!order) return;
    await supabase.from('orders').update({driver_id:user?.id,status:'out_for_delivery'}).eq('id',order.id);
    router.push({pathname:'/(driver)/tracking',params:{id:order.id}} as any);
  };

  if(loading) return <View style={s.center}><ActivityIndicator color={BLACK}/></View>;

  return(
    <ScrollView style={s.c} contentContainerStyle={{padding:16,paddingTop:60}}>
      <Text style={s.h}>الرئيسية</Text>
      {!order? (
        <View style={s.emptyCard}>
          <Text style={s.emptyT}>لا يوجد طلبات متاحة حالياً</Text>
        </View>
      ) : (
        <View style={s.card}>
          <View style={s.badge}><Text style={s.badgeT}>طلب جديد</Text></View>
          <Text style={s.title}>{order.restaurant || order.customer_name}</Text>
          <Text style={s.sub}>{order.total} ج.م</Text>
          <Text style={s.addr}>{order.customer_address}</Text>
          <Pressable style={s.blackBtn} onPress={accept}><Text style={s.blackTxt}>قبول الطلب</Text></Pressable>
        </View>
      )}
    </ScrollView>
  );
}

const s=StyleSheet.create({
  c:{flex:1,backgroundColor:'#F8F8F8'},
  center:{flex:1,justifyContent:'center',alignItems:'center',backgroundColor:'#F8F8F8'},
  h:{fontWeight:'900',fontSize:18,textAlign:'center'},
  emptyCard:{backgroundColor:'#fff',borderRadius:20,padding:30,marginTop:20,alignItems:'center',borderWidth:1,borderColor:'#eee'},
  emptyT:{fontWeight:'800',fontSize:14},
  card:{backgroundColor:'#fff',borderRadius:20,padding:16,marginTop:20,borderWidth:1,borderColor:'#eee'},
  badge:{backgroundColor:BLACK,alignSelf:'flex-start',paddingHorizontal:10,paddingVertical:4,borderRadius:20},
  badgeT:{color:'#fff',fontSize:10,fontWeight:'800'},
  title:{fontWeight:'900',fontSize:18,marginTop:12},
  sub:{marginTop:6,color:'#555'},
  addr:{marginTop:8,fontSize:12,color:'#888'},
  blackBtn:{backgroundColor:BLACK,padding:14,borderRadius:12,alignItems:'center',marginTop:16},
  blackTxt:{color:'#fff',fontWeight:'800'},
});