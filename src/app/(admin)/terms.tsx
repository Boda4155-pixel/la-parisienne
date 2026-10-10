import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../../lib/supabase';
import { ADMIN_COLORS } from "../../../lib/adminTheme";

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

  if(loading) return <View style={[s.bg,{justifyContent:'center',alignItems:'center'}]}><ActivityIndicator color={ADMIN_COLORS.textPrimary}/></View>;

  return (
    <View style={s.bg}>
      <View style={s.header}>
        <TouchableOpacity onPress={()=>router.back()} style={s.back}><Ionicons name="chevron-forward" size={20} color={ADMIN_COLORS.textPrimary}/></TouchableOpacity>
        <Text style={s.h1}>{t('admin.taxService.title')}</Text>
        <TouchableOpacity onPress={save} style={s.saveBtn}><Text style={{fontWeight:'800', fontSize:12, color:ADMIN_COLORS.primaryText}}>{saving?'...':t('common:save')}</Text></TouchableOpacity>
      </View>

      <View style={{padding:16, gap:16}}>
        <View style={s.card}>
          <View style={s.rowHead}><Ionicons name="receipt-outline" size={20} color={ADMIN_COLORS.textPrimary}/><Text style={s.title}>{t('admin.taxService.taxRate')}</Text></View>
          <TextInput value={tax} onChangeText={setTax} keyboardType="numeric" placeholder="14" placeholderTextColor={ADMIN_COLORS.textMuted} style={s.input}/>
          <Text style={s.hint}>{t('admin.taxService.taxHint')}</Text>
        </View>

        <View style={s.card}>
          <View style={s.rowHead}><Ionicons name="restaurant-outline" size={20} color={ADMIN_COLORS.textPrimary}/><Text style={s.title}>{t('admin.taxService.serviceRate')}</Text></View>
          <TextInput value={service} onChangeText={setService} keyboardType="numeric" placeholder="0" placeholderTextColor={ADMIN_COLORS.textMuted} style={s.input}/>
          <Text style={s.hint}>{t('admin.taxService.serviceHint')}</Text>
        </View>

        <View style={s.preview}>
          <Text style={s.prevTitle}>{t('admin.taxService.preview')}</Text>
          <Text style={s.prevText}>{t('admin.taxService.previewExample')}</Text>
          <Text style={s.prevText}>{t('admin.taxService.previewTax', { rate: tax||0, value: (100 * Number(tax||0)/100).toFixed(0) })}</Text>
          <Text style={s.prevText}>{t('admin.taxService.previewService', { rate: service||0, value: (100 * Number(service||0)/100).toFixed(0) })}</Text>
          <Text style={s.prevTotal}>{t('admin.taxService.previewTotal', { total: 100 + 100*Number(tax||0)/100 + 100*Number(service||0)/100 })}</Text>
        </View>

        <TouchableOpacity style={s.saveBig} onPress={save}><Text style={{fontWeight:'800', color:ADMIN_COLORS.primaryText, fontSize:14}}>{t('admin.taxService.saveAdmin')}</Text></TouchableOpacity>
      </View>
    </View>
  );
}
const s = StyleSheet.create({
  bg:{flex:1, backgroundColor:ADMIN_COLORS.background},
  header:{flexDirection:'row', justifyContent:'space-between', alignItems:'center', padding:16, paddingTop:50, borderBottomWidth:1, borderBottomColor:ADMIN_COLORS.border, backgroundColor:ADMIN_COLORS.card},
  h1:{color:ADMIN_COLORS.textPrimary, fontWeight:'800', fontSize:18},
  back:{width:36, height:36, borderRadius:18, backgroundColor:ADMIN_COLORS.card, justifyContent:'center', alignItems:'center', borderWidth:1, borderColor:ADMIN_COLORS.border},
  saveBtn:{backgroundColor:ADMIN_COLORS.primary, paddingHorizontal:18, height:36, borderRadius:18, justifyContent:'center'},
  card:{backgroundColor:ADMIN_COLORS.card, borderRadius:16, padding:16, borderWidth:1, borderColor:ADMIN_COLORS.border},
  rowHead:{flexDirection:'row', alignItems:'center', gap:8, justifyContent:'flex-end', marginBottom:12},
  title:{color:ADMIN_COLORS.textPrimary, fontWeight:'800', fontSize:13},
  input:{backgroundColor:ADMIN_COLORS.inputBg, borderWidth:1, borderColor:ADMIN_COLORS.border, borderRadius:10, color:ADMIN_COLORS.textPrimary, height:52, textAlign:'center', fontSize:18, fontWeight:'800'},
  hint:{color:ADMIN_COLORS.textSecondary, fontSize:11, textAlign:'center', marginTop:8, fontWeight:'500'},
  preview:{backgroundColor:ADMIN_COLORS.cardSecondary, borderRadius:16, padding:16, borderWidth:1, borderColor:ADMIN_COLORS.borderLight, borderStyle:'dashed'},
  prevTitle:{color:ADMIN_COLORS.textPrimary, fontWeight:'800', textAlign:'center', marginBottom:8},
  prevText:{color:ADMIN_COLORS.textSecondary, fontSize:12, textAlign:'center', fontWeight:'600', lineHeight:18},
  prevTotal:{color:ADMIN_COLORS.primaryText, fontWeight:'800', textAlign:'center', marginTop:10, fontSize:16, backgroundColor:ADMIN_COLORS.primary, paddingVertical:6, borderRadius:8},
  saveBig:{backgroundColor:ADMIN_COLORS.primary, height:52, borderRadius:14, justifyContent:'center', alignItems:'center', marginTop:10}
});