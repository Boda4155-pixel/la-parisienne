import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../../lib/supabase';
import { ADMIN_COLORS } from "../../../lib/adminTheme";

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
        <TouchableOpacity onPress={()=>router.back()} style={s.back}><Ionicons name="chevron-forward" size={22} color={ADMIN_COLORS.textPrimary}/></TouchableOpacity>
        <Text style={s.h1}>الاقتراحات والشكاوي</Text>
        <View style={{width:42}}/>
      </View>

      <View style={s.tabs}>
        <TouchableOpacity onPress={()=>setFilter('all')} style={[s.tab, filter==='all'&&s.tabActive]}><Text style={[s.tabTxt, filter==='all'&&s.tabTxtActive]}>الكل</Text></TouchableOpacity>
        <TouchableOpacity onPress={()=>setFilter('complaint')} style={[s.tab, filter==='complaint'&&s.tabActive]}><Text style={[s.tabTxt, filter==='complaint'&&s.tabTxtActive]}>شكاوي</Text></TouchableOpacity>
        <TouchableOpacity onPress={()=>setFilter('suggestion')} style={[s.tab, filter==='suggestion'&&s.tabActive]}><Text style={[s.tabTxt, filter==='suggestion'&&s.tabTxtActive]}>اقتراحات</Text></TouchableOpacity>
      </View>

      {loading? <ActivityIndicator color={ADMIN_COLORS.textPrimary} style={{marginTop:40}}/> : (
        <FlatList data={data} keyExtractor={i=>i.id} contentContainerStyle={{padding:16, paddingBottom:100}}
          ListEmptyComponent={<Text style={{color:ADMIN_COLORS.textSecondary, textAlign:'center', marginTop:40, fontWeight:'600'}}>لا يوجد رسائل</Text>}
          renderItem={({item})=>(
            <View style={s.card}>
              <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center'}}>
                <TouchableOpacity onPress={()=>del(item.id)} style={s.trash}><Ionicons name="trash-outline" size={18} color={ADMIN_COLORS.danger}/></TouchableOpacity>
                <View style={[s.badge, {backgroundColor: item.type==='complaint'? ADMIN_COLORS.dangerBg : ADMIN_COLORS.backgroundSecondary, borderColor: item.type==='complaint'? ADMIN_COLORS.dangerBorder : ADMIN_COLORS.border}]}>
                  <Text style={[s.badgeTxt, {color: item.type==='complaint'? ADMIN_COLORS.danger : ADMIN_COLORS.textPrimary}]}>{item.type==='complaint'?'شكوى':'اقتراح'}</Text>
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
  bg:{flex:1, backgroundColor:ADMIN_COLORS.backgroundSecondary},
  header:{flexDirection:'row', justifyContent:'space-between', alignItems:'center', padding:12, borderBottomWidth:1, borderBottomColor:ADMIN_COLORS.border, backgroundColor:ADMIN_COLORS.card},
  h1:{color:ADMIN_COLORS.textPrimary, fontWeight:'800', fontSize:17},
  back:{width:42, height:42, borderRadius:21, backgroundColor:ADMIN_COLORS.card, justifyContent:'center', alignItems:'center', borderWidth:1, borderColor:ADMIN_COLORS.border},

  tabs:{flexDirection:'row', gap:8, padding:12, backgroundColor:ADMIN_COLORS.backgroundSecondary},
  tab:{flex:1, height:42, borderRadius:20, backgroundColor:ADMIN_COLORS.card, justifyContent:'center', alignItems:'center', borderWidth:1, borderColor:ADMIN_COLORS.border},
  tabActive:{backgroundColor:ADMIN_COLORS.primary, borderColor:ADMIN_COLORS.primary},
  tabTxt:{color:ADMIN_COLORS.textSecondary, fontWeight:'700', fontSize:13},
  tabTxtActive:{color:ADMIN_COLORS.primaryText},

  card:{backgroundColor:ADMIN_COLORS.card, borderRadius:16, padding:14, borderWidth:1, borderColor:ADMIN_COLORS.border, marginBottom:10},
  badge:{paddingHorizontal:12, paddingVertical:5, borderRadius:20, borderWidth:1},
  badgeTxt:{fontSize:11, fontWeight:'800'},
  trash:{width:34, height:34, borderRadius:8, backgroundColor:ADMIN_COLORS.dangerBg, justifyContent:'center', alignItems:'center', borderWidth:1, borderColor:ADMIN_COLORS.dangerBorder},
  name:{color:ADMIN_COLORS.textSecondary, fontSize:12, marginTop:10, textAlign:'right', fontWeight:'600'},
  msg:{color:ADMIN_COLORS.textPrimary, fontSize:14, marginTop:8, lineHeight:22, textAlign:'right', fontWeight:'600'},
  date:{color:ADMIN_COLORS.textSecondary, fontSize:10, marginTop:10, textAlign:'right', fontWeight:'500'}
});