import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, ScrollView, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../../lib/supabase';
import { ADMIN_COLORS } from "../../../lib/adminTheme";

export default function PrinterSettings(){
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cfg, setCfg] = useState<any>({auto_print:true, show_logo:true, paper_size:'80mm', printer_name:''});

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('store_settings').select('value').eq('key','printer').single();
    if(data?.value) setCfg(data.value);
    setLoading(false);
  };
  useEffect(()=>{load()},[]);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from('store_settings').update({ value: cfg, updated_at: new Date().toISOString() }).eq('key','printer');
    setSaving(false);
    if(error) Alert.alert('Error', error.message);
    else Alert.alert(t('admin.printer.saved'));
  };

  if(loading) return <View style={{flex:1, backgroundColor:ADMIN_COLORS.background, justifyContent:'center', alignItems:'center'}}><ActivityIndicator color={ADMIN_COLORS.textPrimary}/></View>;

  return (
    <View style={{flex:1, backgroundColor:ADMIN_COLORS.background, paddingTop:50}}>
      <View style={{flexDirection:'row', justifyContent:'space-between', padding:16, alignItems:'center', borderBottomWidth:1, borderBottomColor:ADMIN_COLORS.border, backgroundColor:ADMIN_COLORS.card}}>
        <TouchableOpacity onPress={()=>router.back()} style={{width:36,height:36,borderRadius:18,backgroundColor:ADMIN_COLORS.card,justifyContent:'center',alignItems:'center',borderWidth:1,borderColor:ADMIN_COLORS.border}}><Ionicons name="chevron-forward" size={20} color={ADMIN_COLORS.textPrimary}/></TouchableOpacity>
        <Text style={{color:ADMIN_COLORS.textPrimary, fontWeight:'800', fontSize:18}}>{t('admin.printer.title')}</Text>
        <TouchableOpacity onPress={save} style={{backgroundColor:ADMIN_COLORS.primary, paddingHorizontal:18, height:36, borderRadius:18, justifyContent:'center'}}><Text style={{fontWeight:'800', fontSize:12, color:ADMIN_COLORS.primaryText}}>{saving?'...':t('common:save')}</Text></TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={{padding:16, gap:12}}>
        <View style={card}><Text style={label}>{t('admin.printer.autoPrint')}</Text><Switch value={cfg.auto_print} onValueChange={v=>setCfg({...cfg, auto_print:v})} trackColor={{true:ADMIN_COLORS.primary, false:ADMIN_COLORS.border}} thumbColor={ADMIN_COLORS.textPrimary} /></View>
        <View style={card}><Text style={label}>{t('admin.printer.showLogo')}</Text><Switch value={cfg.show_logo} onValueChange={v=>setCfg({...cfg, show_logo:v})} trackColor={{true:ADMIN_COLORS.primary, false:ADMIN_COLORS.border}} thumbColor={ADMIN_COLORS.textPrimary} /></View>
        <View style={card}><Text style={label}>{t('admin.printer.paperSize')}</Text><Text style={sub}>{cfg.paper_size}</Text></View>
        <View style={cardCol}>
          <Text style={label}>{t('admin.printer.printerName')}</Text>
          <TextInput value={cfg.printer_name} onChangeText={v=>setCfg({...cfg, printer_name:v})} placeholder="BT: MTP-58 / 192.168.1.100" placeholderTextColor={ADMIN_COLORS.textMuted} style={input}/>
        </View>
        <TouchableOpacity style={btn} onPress={save}><Text style={btnTxt}>{t('admin.printer.saveAdmin')}</Text></TouchableOpacity>
      </ScrollView>
    </View>
  );
}
const card = {backgroundColor:ADMIN_COLORS.card, borderRadius:14, padding:16, flexDirection:'row', justifyContent:'space-between', alignItems:'center', borderWidth:1, borderColor:ADMIN_COLORS.border} as any
const cardCol = {backgroundColor:ADMIN_COLORS.card, borderRadius:14, padding:16, borderWidth:1, borderColor:ADMIN_COLORS.border, gap:8} as any
const label = {color:ADMIN_COLORS.textPrimary, fontSize:13, fontWeight:'700'} as any
const sub = {color:ADMIN_COLORS.textPrimary, fontSize:12, fontWeight:'700', backgroundColor:ADMIN_COLORS.cardSecondary, paddingHorizontal:10, paddingVertical:4, borderRadius:8, borderWidth:1, borderColor:ADMIN_COLORS.borderLight} as any
const input = {backgroundColor:ADMIN_COLORS.inputBg, borderWidth:1, borderColor:ADMIN_COLORS.border, borderRadius:10, color:ADMIN_COLORS.textPrimary, height:46, paddingHorizontal:12, marginTop:8, fontWeight:'600'} as any
const btn = {backgroundColor:ADMIN_COLORS.primary, height:52, borderRadius:14, justifyContent:'center', alignItems:'center'} as any
const btnTxt = {fontWeight:'800', color:ADMIN_COLORS.primaryText, fontSize:14} as any