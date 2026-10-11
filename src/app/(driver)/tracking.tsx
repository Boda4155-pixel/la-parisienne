import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { supabase } from '../../../lib/supabase';
const BLACK='#000000';

export default function Tracking(){
  const {id} = useLocalSearchParams();
  const [order,setOrder]=useState<any>(null);
  const [loading,setLoading]=useState(true);

  useEffect(()=>{ load(); },[id]);

  const load = async()=>{
    try{
      setLoading(true);
      if(id && id!=='temp'){
        const {data} = await supabase.from('orders').select('*').eq('id',id as string).maybeSingle();
        setOrder(data || null);
      } else {
        const {data:{user}} = await supabase.auth.getUser();
        if(!user){ setOrder(null); setLoading(false); return; }
        const {data} = await supabase.from('orders').select('*').eq('driver_id',user.id).in('status',['out_for_delivery','picked_up']).order('created_at',{ascending:false}).limit(1).maybeSingle();
        setOrder(data || null);
      }
    }catch{ setOrder(null); }
    setLoading(false);
  };

  const delivered = async()=>{
    if(!order?.id) return;
    const {error} = await supabase.from('orders').update({status:'delivered'}).eq('id',order.id);
    if(!error) Alert.alert('تم ✓');
  };

  if(loading) return <View style={st.center}><ActivityIndicator color={BLACK}/></View>;

  if(!order){
    return(
      <View style={st.center}>
        <Text style={st.emptyTitle}>لا يوجد طلب نشط حالياً</Text>
        <Pressable style={st.blackBtn} onPress={load}><Text style={{color:'#fff',fontWeight:'800'}}>تحديث</Text></Pressable>
      </View>
    );
  }

  return(
    <View style={st.c}>
      <MapView style={st.map} initialRegion={{latitude:30.0444,longitude:31.2357,latitudeDelta:0.05,longitudeDelta:0.05}}>
        <Marker coordinate={{latitude:30.0444,longitude:31.2357}}/>
      </MapView>
      <View style={st.bottom}>
        <Text style={st.id}>طلب #{order.id.slice(0,6)}</Text>
        <Text style={st.addr}>{order.customer_address}</Text>
        <View style={{flexDirection:'row',gap:10,marginTop:14}}>
          <Pressable style={st.secBtn} onPress={()=>Linking.openURL(`tel:${order.customer_phone||'01000000000'}`)}><Text>اتصال</Text></Pressable>
          <Pressable style={st.blackBtn2} onPress={delivered}><Text style={{color:'#fff',fontWeight:'800'}}>تم التوصيل</Text></Pressable>
        </View>
      </View>
    </View>
  );
}

const st=StyleSheet.create({
  c:{flex:1},
  center:{flex:1,justifyContent:'center',alignItems:'center',backgroundColor:'#F8F8F8',padding:20,gap:14},
  emptyTitle:{fontWeight:'900',fontSize:16},
  map:{flex:1},
  bottom:{backgroundColor:'#fff',padding:16,borderTopLeftRadius:20,borderTopRightRadius:20},
  id:{fontWeight:'900',fontSize:13}, addr:{fontSize:12,color:'#888',marginTop:6},
  secBtn:{flex:1,backgroundColor:'#eee',padding:12,borderRadius:10,alignItems:'center'},
  blackBtn:{backgroundColor:BLACK,padding:12,borderRadius:10,alignItems:'center',paddingHorizontal:30},
  blackBtn2:{flex:1,backgroundColor:BLACK,padding:12,borderRadius:10,alignItems:'center'},
});