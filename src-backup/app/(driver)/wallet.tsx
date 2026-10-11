import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { supabase } from '../../../lib/supabase';
const BLACK='#000000';

export default function Wallet(){
  const [bal,setBal]=useState<number | null>(null);
  const [count,setCount]=useState<number>(0);
  const [loading,setLoading]=useState(true);

  useEffect(()=>{(async()=>{
    const {data:{user}}=await supabase.auth.getUser();
    if(!user){ setLoading(false); setBal(0); return; }
    const {data,count:cnt}=await supabase.from('orders').select('total',{count:'exact'}).eq('driver_id',user.id).eq('status','delivered');
    const sum = data?.reduce((s:number,o:any)=>s+Number(o.total||0),0)?? 0;
    setBal(sum); setCount(cnt||0); setLoading(false);
  })()},[]);

  if(loading) return <View style={s.center}><ActivityIndicator color={BLACK}/></View>;

  return(
    <View style={s.c}>
      <View style={s.blackCard}>
        <Text style={s.label}>الرصيد الحالي</Text>
        <Text style={s.value}>{bal} EGP</Text>
        <Text style={s.small}>{count} طلب تم توصيله</Text>
      </View>
    </View>
  );
}

const s=StyleSheet.create({
  c:{flex:1,backgroundColor:'#F8F8F8',padding:16,paddingTop:60},
  center:{flex:1,justifyContent:'center',alignItems:'center',backgroundColor:'#F8F8F8'},
  blackCard:{backgroundColor:BLACK,borderRadius:20,padding:24,alignItems:'center'},
  label:{color:'#aaa',fontSize:13},
  value:{color:'#fff',fontSize:36,fontWeight:'900',marginTop:8},
  small:{color:'#aaa',fontSize:12,marginTop:8},
});