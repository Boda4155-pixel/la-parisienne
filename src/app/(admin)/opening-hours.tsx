import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../../lib/supabase';

const DAYS_KEYS = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];

export default function OpeningHours(){
  const { t } = useTranslation();
  const [hours, setHours] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('opening_hours').select('*').order('day');
    if(error) Alert.alert(t('common:error'), error.message);
    setHours(data||[]);
    setLoading(false);
  };
  useEffect(()=>{load()},[]);

  const update = (idx:number, field:string, val:any) => {
    const copy = [...hours];
    copy[idx][field] = val;
    setHours(copy);
  };

  const saveAll = async () => {
    if(hours.length===0) return Alert.alert(t('admin.openingHours.noData'));
    setSaving(true);
    for(const h of hours){
      const { error } = await supabase.from('opening_hours').update({
        is_open: h.is_open,
        open_time: h.open_time,
        close_time: h.close_time
      }).eq('day', h.day);
      if(error) Alert.alert(t('admin.openingHours.saveError'), error.message);
    }
    setSaving(false);
    Alert.alert(t('admin.openingHours.savedAdmin'));
  };

  const seedFromAdmin = async () => {
    const initial = DAYS_KEYS.map((_,i)=>({day:i, is_open:true, open_time:'09:00', close_time:'23:00'}));
    const { error } = await supabase.from('opening_hours').insert(initial);
    if(error) Alert.alert(error.message);
    else load();
  };

  if(loading){
    return <View style={[s.bg,{justifyContent:'center',alignItems:'center'}]}><ActivityIndicator color="#E8C87A" size="large"/><Text style={{color:'#888', marginTop:10}}>{t('admin.openingHours.loading')}</Text></View>
  }

  return (
    <View style={s.bg}>
      <View style={s.header}>
        <TouchableOpacity onPress={()=>router.back()} style={s.back}><Ionicons name="chevron-forward" size={20} color="#fff"/></TouchableOpacity>
        <Text style={s.h1}>{t('admin.openingHours.title')}</Text>
        <TouchableOpacity onPress={saveAll} style={s.saveBtn}><Text style={{fontWeight:'bold', fontSize:12}}>{saving?'...':t('common:save')}</Text></TouchableOpacity>
      </View>

      {hours.length===0? (
        <View style={{flex:1, justifyContent:'center', alignItems:'center', padding:20}}>
          <Ionicons name="time-outline" size={60} color="#333"/>
          <Text style={{color:'#fff', fontWeight:'bold', marginTop:12}}>{t('admin.openingHours.emptyTitle')}</Text>
          <Text style={{color:'#888', fontSize:12, marginTop:4, textAlign:'center'}}>{t('admin.openingHours.emptyDesc')}</Text>
          <TouchableOpacity onPress={seedFromAdmin} style={s.saveBig}><Text style={{fontWeight:'bold'}}>{t('admin.openingHours.createWeek')}</Text></TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{padding:16, gap:10, paddingBottom:100}}>
          {hours.map((h,i)=>(
            <View key={h.day} style={[s.card,!h.is_open && {opacity:0.5}]}>
              <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center'}}>
                <Switch value={h.is_open} onValueChange={(v)=>update(i,'is_open',v)} trackColor={{true:'#E8C87A', false:'#333'}} thumbColor={h.is_open?'#000':'#888'}/>
                <Text style={s.day}>{t(`admin.openingHours.days.${DAYS_KEYS[h.day]}`)}</Text>
                <View style={s.iconBox}><Ionicons name={h.is_open?'time':'time-outline'} size={18} color="#E8C87A"/></View>
              </View>
              {h.is_open && (
                <View style={{flexDirection:'row', gap:8, marginTop:12}}>
                  <View style={{flex:1}}>
                    <Text style={s.label}>{t('admin.openingHours.open')}</Text>
                    <TextInput value={h.open_time} onChangeText={(v)=>update(i,'open_time',v)} style={s.input} placeholderTextColor="#666"/>
                  </View>
                  <View style={{flex:1}}>
                    <Text style={s.label}>{t('admin.openingHours.close')}</Text>
                    <TextInput value={h.close_time} onChangeText={(v)=>update(i,'close_time',v)} style={s.input} placeholderTextColor="#666"/>
                  </View>
                </View>
              )}
            </View>
          ))}
          <TouchableOpacity style={s.saveBig} onPress={saveAll}>
            <Text style={{fontWeight:'bold'}}>{t('admin.openingHours.saveAdmin')}</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}
const s = StyleSheet.create({
  bg:{flex:1, backgroundColor:'#0F0F0F'},
  header:{flexDirection:'row', justifyContent:'space-between', alignItems:'center', padding:16, paddingTop:50},
  h1:{color:'#fff', fontWeight:'bold', fontSize:18}, back:{width:36, height:36, borderRadius:18, backgroundColor:'#1A1A1A', justifyContent:'center', alignItems:'center', borderWidth:1, borderColor:'#222'},
  saveBtn:{backgroundColor:'#E8C87A', paddingHorizontal:16, height:36, borderRadius:18, justifyContent:'center', alignItems:'center'},
  card:{backgroundColor:'#161616', borderRadius:16, padding:14, borderWidth:1, borderColor:'#222'},
  day:{color:'#fff', fontWeight:'bold', fontSize:14}, iconBox:{width:32, height:32, borderRadius:8, backgroundColor:'#1E1E1E', justifyContent:'center', alignItems:'center'},
  label:{color:'#888', fontSize:10, textAlign:'center', marginBottom:4}, input:{backgroundColor:'#0F0F0F', borderWidth:1, borderColor:'#222', borderRadius:10, color:'#fff', textAlign:'center', height:44},
  saveBig:{backgroundColor:'#E8C87A', height:50, borderRadius:14, justifyContent:'center', alignItems:'center', marginTop:20, paddingHorizontal:20}
});