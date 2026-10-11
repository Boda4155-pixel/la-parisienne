import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../../lib/supabase';
import { ADMIN_COLORS } from "../../../lib/adminTheme";

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
    return <View style={[s.bg,{justifyContent:'center',alignItems:'center'}]}><ActivityIndicator color={ADMIN_COLORS.textPrimary} size="large"/><Text style={{color:ADMIN_COLORS.textMuted, marginTop:10, fontWeight:'600'}}>{t('admin.openingHours.loading')}</Text></View>
  }

  return (
    <View style={s.bg}>
      <View style={s.header}>
        <TouchableOpacity onPress={()=>router.back()} style={s.back}><Ionicons name="chevron-forward" size={20} color={ADMIN_COLORS.textPrimary}/></TouchableOpacity>
        <Text style={s.h1}>{t('admin.openingHours.title')}</Text>
        <TouchableOpacity onPress={saveAll} style={s.saveBtn}><Text style={{fontWeight:'800', fontSize:12, color:ADMIN_COLORS.primaryText}}>{saving?'...':t('common:save')}</Text></TouchableOpacity>
      </View>

      {hours.length===0? (
        <View style={{flex:1, justifyContent:'center', alignItems:'center', padding:20, backgroundColor:ADMIN_COLORS.inputBg}}>
          <View style={{width:80, height:80, borderRadius:40, backgroundColor:ADMIN_COLORS.cardSecondary, justifyContent:'center', alignItems:'center', borderWidth:1, borderColor:ADMIN_COLORS.borderLight}}><Ionicons name="time-outline" size={40} color={ADMIN_COLORS.textPrimary}/></View>
          <Text style={{color:ADMIN_COLORS.textPrimary, fontWeight:'800', marginTop:12, fontSize:16}}>{t('admin.openingHours.emptyTitle')}</Text>
          <Text style={{color:ADMIN_COLORS.textMuted, fontSize:12, marginTop:4, textAlign:'center', fontWeight:'500'}}>{t('admin.openingHours.emptyDesc')}</Text>
          <TouchableOpacity onPress={seedFromAdmin} style={s.saveBig}><Text style={{fontWeight:'800', color:ADMIN_COLORS.primaryText}}>{t('admin.openingHours.createWeek')}</Text></TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{padding:16, gap:10, paddingBottom:100}} style={{backgroundColor:ADMIN_COLORS.inputBg}}>
          {hours.map((h,i)=>(
            <View key={h.day} style={[s.card,!h.is_open && {opacity:0.6}]}>
              <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center'}}>
                <Switch value={h.is_open} onValueChange={(v)=>update(i,'is_open',v)} trackColor={{true:ADMIN_COLORS.primary, false:ADMIN_COLORS.border}} thumbColor={ADMIN_COLORS.textPrimary}/>
                <Text style={s.day}>{t(`admin.openingHours.days.${DAYS_KEYS[h.day]}`)}</Text>
                <View style={s.iconBox}><Ionicons name={h.is_open?'time':'time-outline'} size={18} color={ADMIN_COLORS.primaryText}/></View>
              </View>
              {h.is_open && (
                <View style={{flexDirection:'row', gap:8, marginTop:12}}>
                  <View style={{flex:1}}>
                    <Text style={s.label}>{t('admin.openingHours.open')}</Text>
                    <TextInput value={h.open_time} onChangeText={(v)=>update(i,'open_time',v)} style={s.input} placeholderTextColor={ADMIN_COLORS.textMuted}/>
                  </View>
                  <View style={{flex:1}}>
                    <Text style={s.label}>{t('admin.openingHours.close')}</Text>
                    <TextInput value={h.close_time} onChangeText={(v)=>update(i,'close_time',v)} style={s.input} placeholderTextColor={ADMIN_COLORS.textMuted}/>
                  </View>
                </View>
              )}
            </View>
          ))}
          <TouchableOpacity style={s.saveBig} onPress={saveAll}>
            <Text style={{fontWeight:'800', color:ADMIN_COLORS.primaryText}}>{t('admin.openingHours.saveAdmin')}</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}
const s = StyleSheet.create({
  bg:{flex:1, backgroundColor:ADMIN_COLORS.background},
  header:{flexDirection:'row', justifyContent:'space-between', alignItems:'center', padding:16, paddingTop:50, borderBottomWidth:1, borderBottomColor:ADMIN_COLORS.border, backgroundColor:ADMIN_COLORS.card},
  h1:{color:ADMIN_COLORS.textPrimary, fontWeight:'800', fontSize:18}, back:{width:36, height:36, borderRadius:18, backgroundColor:ADMIN_COLORS.card, justifyContent:'center', alignItems:'center', borderWidth:1, borderColor:ADMIN_COLORS.border},
  saveBtn:{backgroundColor:ADMIN_COLORS.primary, paddingHorizontal:18, height:36, borderRadius:18, justifyContent:'center', alignItems:'center'},
  card:{backgroundColor:ADMIN_COLORS.card, borderRadius:16, padding:14, borderWidth:1, borderColor:ADMIN_COLORS.border},
  day:{color:ADMIN_COLORS.textPrimary, fontWeight:'800', fontSize:14}, iconBox:{width:32, height:32, borderRadius:8, backgroundColor:ADMIN_COLORS.primary, justifyContent:'center', alignItems:'center'},
  label:{color:ADMIN_COLORS.textPrimary, fontSize:10, textAlign:'center', marginBottom:6, fontWeight:'700'}, input:{backgroundColor:ADMIN_COLORS.inputBg, borderWidth:1, borderColor:ADMIN_COLORS.border, borderRadius:10, color:ADMIN_COLORS.textPrimary, textAlign:'center', height:44, fontWeight:'700'},
  saveBig:{backgroundColor:ADMIN_COLORS.primary, height:52, borderRadius:14, justifyContent:'center', alignItems:'center', marginTop:20, paddingHorizontal:20}
});