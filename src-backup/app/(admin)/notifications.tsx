import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../../lib/supabase';
import { ADMIN_COLORS } from "../../../lib/adminTheme";

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

  if(loading) return <View style={{flex:1, backgroundColor:ADMIN_COLORS.background, justifyContent:'center', alignItems:'center'}}><ActivityIndicator color={ADMIN_COLORS.textPrimary}/></View>;

  return (
    <View style={{flex:1, backgroundColor:ADMIN_COLORS.background, paddingTop:50}}>
      <View style={{flexDirection:'row', justifyContent:'space-between', padding:16, alignItems:'center', borderBottomWidth:1, borderBottomColor:ADMIN_COLORS.border, backgroundColor:ADMIN_COLORS.card}}>
        <TouchableOpacity onPress={()=>router.back()} style={{width:36,height:36,borderRadius:18,backgroundColor:ADMIN_COLORS.card,justifyContent:'center',alignItems:'center',borderWidth:1,borderColor:ADMIN_COLORS.border}}><Ionicons name="chevron-forward" size={20} color={ADMIN_COLORS.textPrimary}/></TouchableOpacity>
        <Text style={{color:ADMIN_COLORS.textPrimary, fontWeight:'800', fontSize:18}}>{t('admin.notifications.title')}</Text>
        <TouchableOpacity onPress={save} style={{backgroundColor:ADMIN_COLORS.primary, paddingHorizontal:18, height:36, borderRadius:18, justifyContent:'center'}}><Text style={{fontWeight:'800', fontSize:12, color:ADMIN_COLORS.primaryText}}>{saving?'...':t('common:save')}</Text></TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={{padding:16, gap:10}}>
        <View style={card}>
          <Switch value={cfg.new_orders} onValueChange={v=>setCfg({...cfg,new_orders:v})} trackColor={{true:ADMIN_COLORS.primary, false:ADMIN_COLORS.border}} thumbColor={ADMIN_COLORS.textPrimary} />
          <View style={{alignItems:'flex-end', flex:1, marginLeft:10}}>
            <Text style={label}>{t('admin.notifications.newOrders')}</Text>
            <Text style={sub}>{t('admin.notifications.newOrdersDesc')}</Text>
          </View>
        </View>
        <View style={card}>
          <Switch value={cfg.sound} onValueChange={v=>setCfg({...cfg,sound:v})} trackColor={{true:ADMIN_COLORS.primary, false:ADMIN_COLORS.border}} thumbColor={ADMIN_COLORS.textPrimary} />
          <View style={{alignItems:'flex-end', flex:1, marginLeft:10}}>
            <Text style={label}>{t('admin.notifications.soundAlert')}</Text>
            <Text style={sub}>{t('admin.notifications.soundAlertDesc')}</Text>
          </View>
        </View>
        <View style={card}>
          <Switch value={cfg.low_stock} onValueChange={v=>setCfg({...cfg,low_stock:v})} trackColor={{true:ADMIN_COLORS.primary, false:ADMIN_COLORS.border}} thumbColor={ADMIN_COLORS.textPrimary} />
          <View style={{alignItems:'flex-end', flex:1, marginLeft:10}}>
            <Text style={label}>{t('admin.notifications.lowStock')}</Text>
            <Text style={sub}>{t('admin.notifications.lowStockDesc')}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
const card = {backgroundColor:ADMIN_COLORS.card, borderRadius:14, padding:16, flexDirection:'row', justifyContent:'space-between', alignItems:'center', borderWidth:1, borderColor:ADMIN_COLORS.border} as any
const label = {color:ADMIN_COLORS.textPrimary, fontWeight:'700', fontSize:14, textAlign:'right'} as any
const sub = {color:ADMIN_COLORS.textSecondary, fontSize:11, marginTop:3, textAlign:'right', fontWeight:'500'} as any