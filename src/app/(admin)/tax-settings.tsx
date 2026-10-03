import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../../lib/supabase';

export default function TaxService(){
  const { t } = useTranslation();
  const [tax, setTax] = useState('');
  const [service, setService] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('store_fees').select('*').eq('id',1).single();
    if(data){
      setTax(String(data.tax_rate));
      setService(String(data.service_rate));
    }
    setLoading(false);
  };
  useEffect(()=>{load()},[]);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from('store_fees').upsert({
      id:1,
      tax_rate: Number(tax||0),
      service_rate: Number(service||0),
      updated_at: new Date().toISOString()
    });
    setSaving(false);
    if(error) Alert.alert(t('common:error'), error.message);
    else Alert.alert(t('admin.taxService.saved'), t('admin.taxService.savedDesc'));
  };

  if(loading) return <View style={[s.bg,{justifyContent:'center',alignItems:'center'}]}><ActivityIndicator color="#E8C87A"/></View>;

  return (
    <View style={s.bg}>
      <View style={s.header}>
        <TouchableOpacity onPress={()=>router.back()} style={s.back}><Ionicons name="chevron-forward" size={20} color="#fff"/></TouchableOpacity>
        <Text style={s.h1}>{t('admin.taxService.title')}</Text>
        <TouchableOpacity onPress={save} style={s.saveBtn}><Text style={{fontWeight:'bold', fontSize:12}}>{saving?'...':t('common:save')}</Text></TouchableOpacity>
      </View>

      <View style={{padding:16, gap:16}}>
        <View style={s.card}>
          <View style={s.rowHead}><Ionicons name="receipt-outline" size={20} color="#E8C87A"/><Text style={s.title}>{t('admin.taxService.taxRate')}</Text></View>
          <TextInput value={tax} onChangeText={setTax} keyboardType="numeric" placeholder="14" placeholderTextColor="#666" style={s.input}/>
          <Text style={s.hint}>{t('admin.taxService.taxHint')}</Text>
        </View>

        <View style={s.card}>
          <View style={s.rowHead}><Ionicons name="restaurant-outline" size={20} color="#E8C87A"/><Text style={s.title}>{t('admin.taxService.serviceRate')}</Text></View>
          <TextInput value={service} onChangeText={setService} keyboardType="numeric" placeholder="0" placeholderTextColor="#666" style={s.input}/>
          <Text style={s.hint}>{t('admin.taxService.serviceHint')}</Text>
        </View>

        <View style={s.preview}>
          <Text style={s.prevTitle}>{t('admin.taxService.preview')}</Text>
          <Text style={s.prevText}>{t('admin.taxService.previewExample')}</Text>
          <Text style={s.prevText}>{t('admin.taxService.previewTax', { rate: tax||0, value: (100 * Number(tax||0)/100).toFixed(0) })}</Text>
          <Text style={s.prevText}>{t('admin.taxService.previewService', { rate: service||0, value: (100 * Number(service||0)/100).toFixed(0) })}</Text>
          <Text style={s.prevTotal}>{t('admin.taxService.previewTotal', { total: 100 + 100*Number(tax||0)/100 + 100*Number(service||0)/100 })}</Text>
        </View>

        <TouchableOpacity style={s.saveBig} onPress={save}><Text style={{fontWeight:'bold'}}>{t('admin.taxService.saveAdmin')}</Text></TouchableOpacity>
      </View>
    </View>
  );
}
const s = StyleSheet.create({
  bg:{flex:1, backgroundColor:'#0F0F0F'},
  header:{flexDirection:'row', justifyContent:'space-between', alignItems:'center', padding:16, paddingTop:50},
  h1:{color:'#fff', fontWeight:'bold', fontSize:18}, back:{width:36, height:36, borderRadius:18, backgroundColor:'#1A1A1A', justifyContent:'center', alignItems:'center', borderWidth:1, borderColor:'#222'},
  saveBtn:{backgroundColor:'#E8C87A', paddingHorizontal:16, height:36, borderRadius:18, justifyContent:'center'},
  card:{backgroundColor:'#161616', borderRadius:16, padding:16, borderWidth:1, borderColor:'#222'},
  rowHead:{flexDirection:'row', alignItems:'center', gap:8, justifyContent:'flex-end', marginBottom:12}, title:{color:'#fff', fontWeight:'bold'},
  input:{backgroundColor:'#0F0F0F', borderWidth:1, borderColor:'#222', borderRadius:10, color:'#fff', height:50, textAlign:'center', fontSize:18, fontWeight:'bold'},
  hint:{color:'#666', fontSize:11, textAlign:'center', marginTop:8},
  preview:{backgroundColor:'#1E1E1E', borderRadius:16, padding:16, borderWidth:1, borderColor:'#E8C87A33', borderStyle:'dashed'},
  prevTitle:{color:'#E8C87A', fontWeight:'bold', textAlign:'center', marginBottom:8}, prevText:{color:'#AAA', fontSize:12, textAlign:'center'}, prevTotal:{color:'#fff', fontWeight:'bold', textAlign:'center', marginTop:8, fontSize:16},
  saveBig:{backgroundColor:'#E8C87A', height:52, borderRadius:14, justifyContent:'center', alignItems:'center', marginTop:10}
});