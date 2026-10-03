import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../../lib/supabase';

export default function FeedbackAdmin(){
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all'|'complaint'|'suggestion'>('all');

  const load = async () => {
    setLoading(true);
    let q = supabase.from('customer_feedback').select('*').order('created_at',{ascending:false});
    if(filter!== 'all') q = q.eq('type', filter);
    const {data} = await q;
    setData(data||[]); setLoading(false);
  };
  useEffect(()=>{ load(); },[filter]);

  const del = async (id:string) => {
    Alert.alert('حذف','تحذف الرسالة؟',[
      {text:'لا'},{text:'حذف', style:'destructive', onPress: async()=>{
        await supabase.from('customer_feedback').delete().eq('id',id); load();
      }}
    ])
  };

  return (
    <View style={s.bg}>
      <View style={[s.header, {paddingTop: insets.top+12}]}>
        <TouchableOpacity onPress={()=>router.back()} style={s.back}><Ionicons name="chevron-forward" size={22} color="#fff"/></TouchableOpacity>
        <Text style={s.h1}>الاقتراحات والشكاوي</Text>
        <View style={{width:42}}/>
      </View>

      <View style={s.tabs}>
        <TouchableOpacity onPress={()=>setFilter('all')} style={[s.tab, filter==='all'&&s.tabActive]}><Text style={[s.tabTxt, filter==='all'&&s.tabTxtActive]}>الكل</Text></TouchableOpacity>
        <TouchableOpacity onPress={()=>setFilter('complaint')} style={[s.tab, filter==='complaint'&&s.tabActive]}><Text style={[s.tabTxt, filter==='complaint'&&s.tabTxtActive]}>شكاوي</Text></TouchableOpacity>
        <TouchableOpacity onPress={()=>setFilter('suggestion')} style={[s.tab, filter==='suggestion'&&s.tabActive]}><Text style={[s.tabTxt, filter==='suggestion'&&s.tabTxtActive]}>اقتراحات</Text></TouchableOpacity>
      </View>

      {loading? <ActivityIndicator color="#E8C87A" style={{marginTop:40}}/> : (
        <FlatList data={data} keyExtractor={i=>i.id} contentContainerStyle={{padding:16, paddingBottom:100}}
          ListEmptyComponent={<Text style={{color:'#555', textAlign:'center', marginTop:40}}>لا يوجد رسائل</Text>}
          renderItem={({item})=>(
            <View style={s.card}>
              <View style={{flexDirection:'row', justifyContent:'space-between'}}>
                <TouchableOpacity onPress={()=>del(item.id)}><Ionicons name="trash-outline" size={18} color="#ff4444"/></TouchableOpacity>
                <View style={[s.badge, {backgroundColor: item.type==='complaint'? '#ff444420' : '#25D36620'}]}>
                  <Text style={[s.badgeTxt, {color: item.type==='complaint'? '#ff4444' : '#25D366'}]}>{item.type==='complaint'?'شكوى':'اقتراح'}</Text>
                </View>
              </View>
              <Text style={s.name}>{item.name} - {item.phone}</Text>
              <Text style={s.msg}>{item.message}</Text>
              <Text style={s.date}>{new Date(item.created_at).toLocaleString('ar-EG')}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}
const s = StyleSheet.create({
  bg:{flex:1, backgroundColor:'#0F0F0F'},
  header:{flexDirection:'row', justifyContent:'space-between', alignItems:'center', padding:12, borderBottomWidth:1, borderBottomColor:'#1A1A1A'},
  h1:{color:'#fff', fontWeight:'bold', fontSize:17}, back:{width:42, height:42, borderRadius:21, backgroundColor:'#1A1A1A', justifyContent:'center', alignItems:'center', borderWidth:1, borderColor:'#222'},
  tabs:{flexDirection:'row', gap:8, padding:12}, tab:{flex:1, height:40, borderRadius:20, backgroundColor:'#1A1A1A', justifyContent:'center', alignItems:'center', borderWidth:1, borderColor:'#222'},
  tabActive:{backgroundColor:'#E8C87A', borderColor:'#E8C87A'}, tabTxt:{color:'#888', fontWeight:'bold'}, tabTxtActive:{color:'#000'},
  card:{backgroundColor:'#161616', borderRadius:16, padding:14, borderWidth:1, borderColor:'#222', marginBottom:10},
  badge:{paddingHorizontal:10, paddingVertical:4, borderRadius:20}, badgeTxt:{fontSize:11, fontWeight:'bold'},
  name:{color:'#888', fontSize:12, marginTop:8, textAlign:'right'}, msg:{color:'#fff', fontSize:14, marginTop:6, lineHeight:20, textAlign:'right'}, date:{color:'#444', fontSize:10, marginTop:8, textAlign:'right'}
});