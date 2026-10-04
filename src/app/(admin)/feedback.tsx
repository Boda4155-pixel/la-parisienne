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
        <TouchableOpacity onPress={()=>router.back()} style={s.back}><Ionicons name="chevron-forward" size={22} color="#111"/></TouchableOpacity>
        <Text style={s.h1}>الاقتراحات والشكاوي</Text>
        <View style={{width:42}}/>
      </View>

      <View style={s.tabs}>
        <TouchableOpacity onPress={()=>setFilter('all')} style={[s.tab, filter==='all'&&s.tabActive]}><Text style={[s.tabTxt, filter==='all'&&s.tabTxtActive]}>الكل</Text></TouchableOpacity>
        <TouchableOpacity onPress={()=>setFilter('complaint')} style={[s.tab, filter==='complaint'&&s.tabActive]}><Text style={[s.tabTxt, filter==='complaint'&&s.tabTxtActive]}>شكاوي</Text></TouchableOpacity>
        <TouchableOpacity onPress={()=>setFilter('suggestion')} style={[s.tab, filter==='suggestion'&&s.tabActive]}><Text style={[s.tabTxt, filter==='suggestion'&&s.tabTxtActive]}>اقتراحات</Text></TouchableOpacity>
      </View>

      {loading? <ActivityIndicator color="#16A34A" style={{marginTop:40}}/> : (
        <FlatList data={data} keyExtractor={i=>i.id} contentContainerStyle={{padding:16, paddingBottom:100}}
          ListEmptyComponent={<Text style={{color:'#999', textAlign:'center', marginTop:40, fontWeight:'600'}}>لا يوجد رسائل</Text>}
          renderItem={({item})=>(
            <View style={s.card}>
              <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center'}}>
                <TouchableOpacity onPress={()=>del(item.id)} style={s.trash}><Ionicons name="trash-outline" size={18} color="#EF4444"/></TouchableOpacity>
                <View style={[s.badge, {backgroundColor: item.type==='complaint'? '#FEF2F2' : '#F0FDF4', borderColor: item.type==='complaint'? '#FECACA' : '#BBF7D0'}]}>
                  <Text style={[s.badgeTxt, {color: item.type==='complaint'? '#DC2626' : '#16A34A'}]}>{item.type==='complaint'?'شكوى':'اقتراح'}</Text>
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
  bg:{flex:1, backgroundColor:'#FFFFFF'},
  header:{flexDirection:'row', justifyContent:'space-between', alignItems:'center', padding:12, borderBottomWidth:1, borderBottomColor:'#F0F0F0', backgroundColor:'#FFFFFF'},
  h1:{color:'#111', fontWeight:'800', fontSize:17},
  back:{width:42, height:42, borderRadius:21, backgroundColor:'#FFFFFF', justifyContent:'center', alignItems:'center', borderWidth:1, borderColor:'#E5E5E5'},

  tabs:{flexDirection:'row', gap:8, padding:12, backgroundColor:'#F9F9F9'},
  tab:{flex:1, height:42, borderRadius:20, backgroundColor:'#FFFFFF', justifyContent:'center', alignItems:'center', borderWidth:1, borderColor:'#E5E5E5'},
  tabActive:{backgroundColor:'#16A34A', borderColor:'#16A34A'},
  tabTxt:{color:'#555', fontWeight:'700', fontSize:13},
  tabTxtActive:{color:'#FFFFFF'},

  card:{backgroundColor:'#FFFFFF', borderRadius:16, padding:14, borderWidth:1, borderColor:'#E5E5E5', marginBottom:10},
  badge:{paddingHorizontal:12, paddingVertical:5, borderRadius:20, borderWidth:1},
  badgeTxt:{fontSize:11, fontWeight:'800'},
  trash:{width:34, height:34, borderRadius:8, backgroundColor:'#FEF2F2', justifyContent:'center', alignItems:'center', borderWidth:1, borderColor:'#FECACA'},
  name:{color:'#555', fontSize:12, marginTop:10, textAlign:'right', fontWeight:'600'},
  msg:{color:'#111', fontSize:14, marginTop:8, lineHeight:22, textAlign:'right', fontWeight:'600'},
  date:{color:'#999', fontSize:10, marginTop:10, textAlign:'right', fontWeight:'500'}
});