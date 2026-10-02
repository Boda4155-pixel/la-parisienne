import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { supabase } from '../../../lib/supabase';
export default function Cashier(){
 const [orders,setOrders]=useState<any[]>([]); const [tab,setTab]=useState('pending'); const [loading,setLoading]=useState(true);
 const load=async()=>{ const {data}=await supabase.from('orders').select('*').order('created_at',{ascending:false}); if(data) setOrders(data); setLoading(false); }
 useEffect(()=>{ load(); const ch=supabase.channel('orders-live').on('postgres_changes',{event:'*',schema:'public',table:'orders'},()=>load()).subscribe(); return()=>{supabase.removeChannel(ch)} },[]);
 const updateStatus=async(id:string,status:string)=>{ await supabase.from('orders').update({status}).eq('id',id) }
 const list=orders.filter(o=>o.status===tab);
 if(loading) return <View style={{flex:1,justifyContent:'center',alignItems:'center',backgroundColor:'#FEF9F2'}}><ActivityIndicator size="large" color="#6F4C34"/></View>
 return(
  <View style={{flex:1,backgroundColor:'#FEF9F2'}}>
   <View style={{backgroundColor:'#2D1E16',padding:20,paddingTop:55}}><Text style={{color:'white',fontSize:22,fontWeight:'900'}}>الكاشير - La Parisienne</Text></View>
   <View style={{flexDirection:'row',gap:8,padding:12,backgroundColor:'white'}}>
    {[{k:'pending',t:'جديدة'},{k:'confirmed',t:'مقبولة'},{k:'cancelled',t:'مرفوضة'},{k:'delivered',t:'تم التوصيل'}].map(b=>(
     <TouchableOpacity key={b.k} onPress={()=>setTab(b.k)} style={{flex:1,backgroundColor:tab===b.k?'#6F4C34':'#FEF9F2',padding:10,borderRadius:12,alignItems:'center',borderWidth:1,borderColor:'#EADDCB'}}><Text style={{fontSize:12,fontWeight:'700',color:tab===b.k?'white':'#2D1E16'}}>{b.t}</Text></TouchableOpacity>
    ))}
   </View>
   <FlatList data={list} keyExtractor={i=>i.id} contentContainerStyle={{padding:12,gap:12}} ListEmptyComponent={<Text style={{textAlign:'center',marginTop:40}}>مفيش اوردرات</Text>}
    renderItem={({item})=>(
     <View style={{backgroundColor:'white',borderRadius:16,padding:16,borderWidth:1,borderColor:'#EADDCB'}}>
      <Text style={{fontWeight:'900'}}>#{item.id.slice(0,6)} - {item.payment_method}</Text>
      {item.status==='pending' && <View style={{flexDirection:'row',gap:10,marginTop:14}}><TouchableOpacity onPress={()=>updateStatus(item.id,'confirmed')} style={{flex:1,backgroundColor:'#6F4C34',padding:12,borderRadius:12,alignItems:'center'}}><Text style={{color:'white',fontWeight:'900'}}>قبول</Text></TouchableOpacity><TouchableOpacity onPress={()=>updateStatus(item.id,'cancelled')} style={{flex:1,backgroundColor:'#FEF9F2',padding:12,borderRadius:12,alignItems:'center',borderWidth:1,borderColor:'#EADDCB'}}><Text style={{fontWeight:'900'}}>رفض</Text></TouchableOpacity></View>}
      {item.status==='confirmed' && <TouchableOpacity onPress={()=>updateStatus(item.id,'delivered')} style={{marginTop:12,backgroundColor:'#2D1E16',padding:12,borderRadius:12,alignItems:'center'}}><Text style={{color:'white',fontWeight:'900'}}>تم التوصيل</Text></TouchableOpacity>}
     </View>
    )}
   />
  </View>
 )
}
