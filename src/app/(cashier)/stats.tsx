import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../../lib/supabase';

const GOLD = '#C5A059';
const BLACK = '#0A0A0A';
const GOLD_BORDER = '#E8DCC6';

export default function Stats() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [stats, setStats] = useState({total:0,revenue:0,today:0,todayRev:0,pending:0,completed:0});
  const [week, setWeek] = useState<any[]>([]);
  const [detailVisible, setDetailVisible] = useState(false);
  const [detailType, setDetailType] = useState<'all'|'today'>('all');
  const [detailOrders, setDetailOrders] = useState<any[]>([]);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('orders').select('*').order('created_at',{ascending:false});
    setOrders(data||[]);
    const getT = (o:any)=> parseFloat(o.total||o.total_amount||o.amount||0);
    const total = data?.length||0;
    const revenue = data?.reduce((s:any,o:any)=>s+getT(o),0)||0;
    const todayStr = new Date().toISOString().split('T')[0];
    const todayOrders = data?.filter((o:any)=>o.created_at?.startsWith(todayStr))||[];
    setStats({
      total,
      revenue,
      today: todayOrders.length,
      todayRev: todayOrders.reduce((s:any,o:any)=>s+getT(o),0),
      pending: data?.filter((o:any)=>['pending','new','accepted'].includes(o.status)).length||0,
      completed: data?.filter((o:any)=>['delivered','completed','done'].includes(o.status)).length||0
    });
    const w:any[]=[];
    for(let i=6;i>=0;i--){
      const d=new Date(); d.setDate(d.getDate()-i);
      const ds=d.toISOString().split('T')[0];
      const day=data?.filter((o:any)=>o.created_at?.startsWith(ds))||[];
      w.push({label:d.toLocaleDateString('ar-EG',{weekday:'short'}), count:day.length, rev:day.reduce((s:any,o:any)=>s+getT(o),0)});
    }
    setWeek(w);
    setLoading(false);
  };
  useEffect(()=>{ load(); },[]);
  const openDetails = (type: 'all'|'today') => {
    setDetailType(type);
    if(type==='all') setDetailOrders(orders);
    else {
      const todayStr = new Date().toISOString().split('T')[0];
      setDetailOrders(orders.filter((o:any)=>o.created_at?.startsWith(todayStr)));
    }
    setDetailVisible(true);
  };
  if(loading) return <View style={{flex:1,justifyContent:'center',alignItems:'center', backgroundColor:'#FAFAF8'}}><ActivityIndicator size="large" color={GOLD}/></View>;
  const maxRev = Math.max(...week.map(x=>x.rev),1);

  return (
    <View style={{flex:1, backgroundColor:'#FAFAF8'}}>
      <View style={{paddingTop:50, paddingBottom:18, paddingHorizontal:16, backgroundColor:BLACK, flexDirection:'row', justifyContent:'space-between', alignItems:'center', borderBottomWidth:1.5, borderColor:GOLD, borderBottomLeftRadius:22, borderBottomRightRadius:22}}>
        <TouchableOpacity onPress={load} style={{backgroundColor:'#1E1E1E', borderWidth:1, borderColor:GOLD, padding:8, borderRadius:20}}><Ionicons name="refresh" size={18} color={GOLD}/></TouchableOpacity>
        <Text style={{fontWeight:'900', fontSize:18, color:'white'}}>LA PARISIENNE • <Text style={{color:GOLD}}>الاحصائيات</Text></Text>
      </View>

      <ScrollView contentContainerStyle={{padding:12, paddingBottom:120}} refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={GOLD}/>}>
        <View style={{flexDirection:'row', gap:10}}>
          <TouchableOpacity onPress={()=>openDetails('all')} activeOpacity={0.8} style={{flex:1, backgroundColor:BLACK, borderWidth:1.5, borderColor:GOLD, borderRadius:16, padding:16}}>
            <Text style={{color:GOLD, fontSize:11, fontWeight:'700'}}>إجمالي المبيعات</Text>
            <Text style={{color:'white', fontWeight:'900', fontSize:22, marginTop:6}}>{stats.revenue.toFixed(0)} ج</Text>
            <View style={{flexDirection:'row', alignItems:'center', marginTop:6, gap:4}}><Ionicons name="chevron-forward" size={12} color="#777"/><Text style={{color:'#777', fontSize:10}}>اضغط للتفاصيل</Text></View>
          </TouchableOpacity>
          <TouchableOpacity onPress={()=>openDetails('today')} activeOpacity={0.8} style={{flex:1, backgroundColor:'white', borderRadius:16, padding:16, borderWidth:1, borderColor:GOLD_BORDER}}>
            <Text style={{color:'#888', fontSize:11, fontWeight:'700'}}>مبيعات اليوم</Text>
            <Text style={{fontWeight:'900', fontSize:22, marginTop:6, color:BLACK}}>{stats.todayRev.toFixed(0)} ج</Text>
            <Text style={{color:GOLD, fontSize:11, marginTop:4, fontWeight:'800'}}>{stats.today} طلب اليوم ✨</Text>
          </TouchableOpacity>
        </View>

        <View style={{backgroundColor:'white', borderWidth:1, borderColor:GOLD_BORDER, borderRadius:16, padding:16, marginTop:12}}>
          <Text style={{fontWeight:'900', marginBottom:12, color:BLACK}}>مبيعات آخر 7 أيام</Text>
          <View style={{flexDirection:'row', alignItems:'flex-end', justifyContent:'space-between', height:110}}>
            {week.map((d,i)=>{ const h=(d.rev/maxRev)*100; return <View key={i} style={{alignItems:'center', flex:1}}><Text style={{fontSize:9, fontWeight:'800', color:BLACK}}>{d.rev>0?d.rev.toFixed(0):'0'}</Text><View style={{width:28, height:Math.max(h,6), backgroundColor:i===6?BLACK:GOLD_BORDER, borderWidth:i===6?1:0, borderColor:GOLD, borderRadius:8, marginVertical:6}}/><Text style={{fontSize:10, fontWeight:'700'}}>{d.label}</Text><Text style={{fontSize:8,color:'#999'}}>{d.count}</Text></View> })}
          </View>
        </View>

        <View style={{backgroundColor:'white', borderWidth:1, borderColor:GOLD_BORDER, borderRadius:16, padding:16, marginTop:12}}>
          <Text style={{fontWeight:'900', marginBottom:10, color:BLACK}}>تفاصيل الطلبات</Text>
          <View style={{flexDirection:'row', justifyContent:'space-between'}}><Text style={{color:'#666'}}>الإجمالي</Text><Text style={{fontWeight:'900', color:BLACK}}>{stats.total}</Text></View>
          <View style={{flexDirection:'row', justifyContent:'space-between', marginTop:8}}><Text style={{color:'#666'}}>معلق</Text><Text style={{fontWeight:'900', color:GOLD}}>{stats.pending}</Text></View>
          <View style={{flexDirection:'row', justifyContent:'space-between', marginTop:8}}><Text style={{color:'#666'}}>مكتمل</Text><Text style={{fontWeight:'900', color:BLACK}}>{stats.completed}</Text></View>
        </View>
      </ScrollView>

      <Modal visible={detailVisible} animationType="slide" transparent>
        <View style={{flex:1, backgroundColor:'rgba(0,0,0,0.6)', justifyContent:'flex-end'}}>
          <View style={{backgroundColor:'white', borderTopLeftRadius:20, borderTopRightRadius:20, maxHeight:'85%', paddingBottom:30, borderTopWidth:2, borderColor:GOLD}}>
            <View style={{padding:16, flexDirection:'row', justifyContent:'space-between', alignItems:'center', borderBottomWidth:1, borderColor:'#f0f0f0'}}>
              <TouchableOpacity onPress={()=>setDetailVisible(false)} style={{backgroundColor:'#FAFAF8', borderWidth:1, borderColor:GOLD_BORDER, padding:8, borderRadius:20}}><Ionicons name="close" size={18} color={BLACK}/></TouchableOpacity>
              <Text style={{fontWeight:'900', fontSize:15, color:BLACK}}>{detailType==='all'? `إجمالي المبيعات - ${stats.revenue.toFixed(0)} ج` : `مبيعات اليوم - ${stats.todayRev.toFixed(0)} ج`}</Text>
              <View style={{width:34}}/>
            </View>
            {detailOrders.length===0? <View style={{padding:40, alignItems:'center'}}><Ionicons name="receipt-outline" size={40} color="#ccc"/><Text style={{color:'#888', marginTop:8}}>{detailType==='today'? 'لا يوجد مبيعات اليوم' : 'لا يوجد طلبات'}</Text></View> :
            <FlatList
              data={detailOrders}
              keyExtractor={(item, idx)=> item.id?.toString()||idx.toString()}
              contentContainerStyle={{padding:12}}
              renderItem={({item})=>(
                <View style={{backgroundColor:'#FBF6EC', borderWidth:1, borderColor:GOLD_BORDER, borderRadius:12, padding:12, marginBottom:8, flexDirection:'row', justifyContent:'space-between', alignItems:'center'}}>
                  <View>
                    <Text style={{fontWeight:'800', fontSize:13, color:BLACK}}>طلب #{item.id?.toString().slice(0,6) || '---'}</Text>
                    <Text style={{fontSize:11, color:'#888', marginTop:2}}>{new Date(item.created_at).toLocaleDateString('ar-EG')} - {item.status}</Text>
                  </View>
                  <Text style={{fontWeight:'900', fontSize:14, color:GOLD}}>{parseFloat(item.total||item.total_amount||0).toFixed(0)} ج</Text>
                </View>
              )}
            />}
            <View style={{padding:16, backgroundColor:BLACK, borderWidth:1, borderColor:GOLD, margin:12, borderRadius:12, flexDirection:'row', justifyContent:'space-between'}}>
              <Text style={{color:GOLD, fontWeight:'700'}}>الإجمالي</Text>
              <Text style={{color:'white', fontWeight:'900'}}>{detailType==='all'? stats.revenue.toFixed(0) : stats.todayRev.toFixed(0)} ج - {detailOrders.length} طلب</Text>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}