import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../../lib/supabase';

export default function PrivacyPolicy(){
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const insets = useSafeAreaInsets();
  const [text, setText] = useState('');
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(()=>{ (async()=>{
    const {data} = await supabase.from('app_settings').select('value').eq('key','privacy_policy').single();
    if(data?.value) setText(data.value); else setText('Privacy Policy...\nسياسة الخصوصية...');
    setLoading(false);
  })(); },[]);

  const save = async () => {
    setSaving(true);
    const {error} = await supabase.from('app_settings').upsert({key:'privacy_policy', value:text});
    setSaving(false);
    if(error){ Alert.alert('Error', error.message); return; }
    setEditing(false);
    Alert.alert(t('common:save','تم'), t('admin.privacy.saved','تم حفظ سياسة الخصوصية ✅'));
  };

  return (
    <View style={s.bg}>
      <View style={[s.header, {paddingTop: insets.top + 10}]}>
        <TouchableOpacity onPress={()=>router.back()} style={s.back}><Ionicons name="chevron-forward" size={20} color="#fff"/></TouchableOpacity>
        <Text style={s.h1}>{t('profile.privacyPolicy','سياسة الخصوصية')}</Text>
        <TouchableOpacity onPress={()=> editing ? save() : setEditing(true)} style={s.saveBtn}>
          {saving ? <ActivityIndicator size="small" color="#000"/> : <Ionicons name={editing?'checkmark':'create-outline'} size={20} color="#000"/>}
        </TouchableOpacity>
      </View>

      {loading ? <ActivityIndicator color="#E8C87A" style={{marginTop:50}}/> : (
        <ScrollView contentContainerStyle={{padding:16, paddingBottom: insets.bottom + 20}}>
          <View style={s.card}>
            <View style={s.iconHead}><Ionicons name="shield-checkmark" size={32} color="#E8C87A"/></View>
            <Text style={s.title}>{t('admin.privacy.title','سياسة الخصوصية')}</Text>
          </View>
          {editing ? (
            <TextInput value={text} onChangeText={setText} multiline style={[s.editInput, {textAlign: isRTL ? 'right':'left'}]} textAlignVertical="top"/>
          ) : (
            <View style={s.textCard}><Text style={[s.privacyText, {textAlign: isRTL ? 'right':'left'}]}>{text}</Text></View>
          )}
        </ScrollView>
      )}
    </View>
  );
}
const s = StyleSheet.create({
  bg:{flex:1, backgroundColor:'#0F0F0F'},
  header:{flexDirection:'row', justifyContent:'space-between', alignItems:'center', padding:12, borderBottomWidth:1, borderBottomColor:'#1A1A1A'},
  h1:{color:'#fff', fontWeight:'bold', fontSize:16}, back:{width:36, height:36, borderRadius:18, backgroundColor:'#1A1A1A', justifyContent:'center', alignItems:'center', borderWidth:1, borderColor:'#222'},
  saveBtn:{width:36, height:36, borderRadius:18, backgroundColor:'#E8C87A', justifyContent:'center', alignItems:'center'},
  card:{backgroundColor:'#1A1A1A', borderRadius:20, padding:20, alignItems:'center', borderWidth:1, borderColor:'#222', marginBottom:12},
  iconHead:{width:60, height:60, borderRadius:30, backgroundColor:'#E8C87A20', justifyContent:'center', alignItems:'center', marginBottom:12},
  title:{color:'#fff', fontWeight:'bold', fontSize:16},
  textCard:{backgroundColor:'#161616', borderRadius:16, padding:16, borderWidth:1, borderColor:'#222'},
  privacyText:{color:'#CCC', fontSize:13, lineHeight:22},
  editInput:{backgroundColor:'#161616', borderRadius:16, padding:16, borderWidth:1, borderColor:'#E8C87A', color:'#fff', fontSize:13, lineHeight:22, minHeight:400},
});