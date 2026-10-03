import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, ScrollView, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../../lib/supabase';

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

  if(loading) return <View style={{flex:1, backgroundColor:'#0F0F0F', justifyContent:'center', alignItems:'center'}}><ActivityIndicator color="#E8C87A"/></View>;

  return (
    <View style={{flex:1, backgroundColor:'#0F0F0F', paddingTop:50}}>
      <View style={{flexDirection:'row', justifyContent:'space-between', padding:16, alignItems:'center'}}>
        <TouchableOpacity onPress={()=>router.back()} style={{width:36,height:36,borderRadius:18,backgroundColor:'#1A1A1A',justifyContent:'center',alignItems:'center',borderWidth:1,borderColor:'#222'}}><Ionicons name="chevron-forward" size={20} color="#fff"/></TouchableOpacity>
        <Text style={{color:'#fff', fontWeight:'bold', fontSize:18}}>{t('admin.printer.title')}</Text>
        <TouchableOpacity onPress={save} style={{backgroundColor:'#E8C87A', paddingHorizontal:16, height:36, borderRadius:18, justifyContent:'center'}}><Text style={{fontWeight:'bold', fontSize:12}}>{saving?'...':t('common:save')}</Text></TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={{padding:16, gap:12}}>
        <View style={card}><Text style={label}>{t('admin.printer.autoPrint')}</Text><Switch value={cfg.auto_print} onValueChange={v=>setCfg({...cfg, auto_print:v})} trackColor={{true:'#E8C87A', false:'#333'}}/></View>
        <View style={card}><Text style={label}>{t('admin.printer.showLogo')}</Text><Switch value={cfg.show_logo} onValueChange={v=>setCfg({...cfg, show_logo:v})} trackColor={{true:'#E8C87A', false:'#333'}}/></View>
        <View style={card}><Text style={label}>{t('admin.printer.paperSize')}</Text><Text style={sub}>{cfg.paper_size}</Text></View>
        <View style={cardCol}>
          <Text style={label}>{t('admin.printer.printerName')}</Text>
          <TextInput value={cfg.printer_name} onChangeText={v=>setCfg({...cfg, printer_name:v})} placeholder="BT: MTP-58 / 192.168.1.100" placeholderTextColor="#555" style={input}/>
        </View>
        <TouchableOpacity style={btn} onPress={save}><Text style={{fontWeight:'bold'}}>{t('admin.printer.saveAdmin')}</Text></TouchableOpacity>
      </ScrollView>
    </View>
  );
}
const card = {backgroundColor:'#161616', borderRadius:14, padding:16, flexDirection:'row', justifyContent:'space-between', alignItems:'center', borderWidth:1, borderColor:'#222'} as any
const cardCol = {backgroundColor:'#161616', borderRadius:14, padding:16, borderWidth:1, borderColor:'#222', gap:8} as any
const label = {color:'#fff', fontSize:13} as any
const sub = {color:'#888', fontSize:12} as any
const input = {backgroundColor:'#0F0F0F', borderWidth:1, borderColor:'#222', borderRadius:10, color:'#fff', height:44, paddingHorizontal:12, marginTop:8} as any
const btn = {backgroundColor:'#E8C87A', height:50, borderRadius:14, justifyContent:'center', alignItems:'center'} as any