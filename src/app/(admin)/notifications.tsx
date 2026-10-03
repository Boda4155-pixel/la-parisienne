import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../../lib/supabase';

export default function NotificationsPage(){
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cfg, setCfg] = useState<any>({new_orders:true, sound:true, low_stock:false});

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('store_settings').select('value').eq('key','notifications').single();
    if(data?.value) setCfg(data.value);
    setLoading(false);
  };
  useEffect(()=>{load()},[]);
  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from('store_settings').update({ value: cfg }).eq('key','notifications');
    setSaving(false);
    if(error) Alert.alert(error.message); else Alert.alert(t('admin.notifications.saved'));
  };

  if(loading) return <View style={{flex:1, backgroundColor:'#0F0F0F', justifyContent:'center', alignItems:'center'}}><ActivityIndicator color="#E8C87A"/></View>;

  return (
    <View style={{flex:1, backgroundColor:'#0F0F0F', paddingTop:50}}>
      <View style={{flexDirection:'row', justifyContent:'space-between', padding:16, alignItems:'center'}}>
        <TouchableOpacity onPress={()=>router.back()} style={{width:36,height:36,borderRadius:18,backgroundColor:'#1A1A1A',justifyContent:'center',alignItems:'center',borderWidth:1,borderColor:'#222'}}><Ionicons name="chevron-forward" size={20} color="#fff"/></TouchableOpacity>
        <Text style={{color:'#fff', fontWeight:'bold', fontSize:18}}>{t('admin.notifications.title')}</Text>
        <TouchableOpacity onPress={save} style={{backgroundColor:'#E8C87A', paddingHorizontal:16, height:36, borderRadius:18, justifyContent:'center'}}><Text style={{fontWeight:'bold', fontSize:12}}>{saving?'...':t('common:save')}</Text></TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={{padding:16, gap:10}}>
        <View style={card}><Switch value={cfg.new_orders} onValueChange={v=>setCfg({...cfg,new_orders:v})} trackColor={{true:'#E8C87A', false:'#333'}}/><View style={{alignItems:'flex-end'}}><Text style={label}>{t('admin.notifications.newOrders')}</Text><Text style={sub}>{t('admin.notifications.newOrdersDesc')}</Text></View></View>
        <View style={card}><Switch value={cfg.sound} onValueChange={v=>setCfg({...cfg,sound:v})} trackColor={{true:'#E8C87A', false:'#333'}}/><View style={{alignItems:'flex-end'}}><Text style={label}>{t('admin.notifications.soundAlert')}</Text><Text style={sub}>{t('admin.notifications.soundAlertDesc')}</Text></View></View>
        <View style={card}><Switch value={cfg.low_stock} onValueChange={v=>setCfg({...cfg,low_stock:v})} trackColor={{true:'#E8C87A', false:'#333'}}/><View style={{alignItems:'flex-end'}}><Text style={label}>{t('admin.notifications.lowStock')}</Text><Text style={sub}>{t('admin.notifications.lowStockDesc')}</Text></View></View>
      </ScrollView>
    </View>
  );
}
const card = {backgroundColor:'#161616', borderRadius:14, padding:16, flexDirection:'row', justifyContent:'space-between', alignItems:'center', borderWidth:1, borderColor:'#222'} as any
const label = {color:'#fff', fontWeight:'bold'} as any
const sub = {color:'#888', fontSize:11} as any