import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../../lib/supabase';

export default function TermsConditions(){
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const insets = useSafeAreaInsets();
  const [text, setText] = useState('');
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(()=>{ 
    (async()=>{
      setLoading(true);
      const {data, error} = await supabase.from('app_settings').select('value').eq('key','terms_conditions').maybeSingle();
      if(data?.value) setText(data.value);
      setLoading(false);
    })(); 
  },[]);

  const handleSave = async () => {
    if(!text.trim()){
      Alert.alert('خطأ','اكتب الشروط الأول');
      return;
    }
    setSaving(true);
    const {error} = await supabase.from('app_settings').upsert(
      {key:'terms_conditions', value:text, updated_at: new Date().toISOString()},
      {onConflict:'key'}
    );
    setSaving(false);
    if(error){ 
      Alert.alert('Error', error.message); 
      return; 
    }
    setEditing(false);
    Alert.alert('تم ✅','تم حفظ الشروط والأحكام وهيظهر للعملاء حالا');
  };

  return (
    <View style={s.bg}>
      <View style={[s.header, {paddingTop: insets.top + 12}]}>
        <TouchableOpacity onPress={()=>router.back()} style={s.back}>
          <Ionicons name="chevron-forward" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={s.h1}>{t('admin.terms.title','الشروط والأحكام')}</Text>
        <TouchableOpacity 
          onPress={()=> editing ? handleSave() : setEditing(true)} 
          style={[s.editBtn, {backgroundColor: editing ? '#25D366' : '#E8C87A'}]}
        >
          {saving ? <ActivityIndicator size="small" color="#000"/> : <Ionicons name={editing ? "checkmark" : "create-outline"} size={22} color="#000"/>}
        </TouchableOpacity>
      </View>

      {loading ? <ActivityIndicator color="#E8C87A" style={{marginTop:60}}/> : (
        <ScrollView contentContainerStyle={{padding:16, paddingBottom: insets.bottom + 30}} keyboardShouldPersistTaps="handled">
          <View style={s.card}>
            <View style={s.iconHead}><Ionicons name="document-text" size={32} color="#E8C87A"/></View>
            <Text style={s.title}>الشروط والأحكام</Text>
            <Text style={s.sub}>القواعد المنظمة لاستخدام التطبيق</Text>
          </View>

          <View style={s.inputCard}>
            <Text style={[s.label, {textAlign: isRTL ? 'right':'left'}]}>
              {editing ? 'اكتب الشروط هنا...' : 'الشروط والأحكام الحالية'}
            </Text>
            {editing ? (
              <TextInput 
                value={text} 
                onChangeText={setText} 
                multiline 
                autoFocus
                placeholder="مثال: 1- لا يمكن استرجاع الطلب بعد التأكيد..."
                placeholderTextColor="#555"
                style={[s.textArea, {textAlign: isRTL ? 'right':'left'}]} 
                textAlignVertical="top"
              />
            ) : (
              <TouchableOpacity onPress={()=>setEditing(true)} activeOpacity={0.7}>
                <Text style={[s.viewText, {textAlign: isRTL ? 'right':'left'}]}>
                  {text || 'اضغط على علامة القلم فوق لكتابة الشروط...'}
                </Text>
                <Text style={s.hint}>دوس هنا للتعديل</Text>
              </TouchableOpacity>
            )}
          </View>

          {editing && (
            <TouchableOpacity onPress={handleSave} style={s.saveBig}>
              <Ionicons name="checkmark-circle" size={20} color="#000"/>
              <Text style={s.saveBigTxt}>حفظ للعملاء ✅</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}
    </View>
  );
}
const s = StyleSheet.create({
  bg:{flex:1, backgroundColor:'#0F0F0F'},
  header:{flexDirection:'row', justifyContent:'space-between', alignItems:'center', padding:12, borderBottomWidth:1, borderBottomColor:'#1A1A1A'},
  h1:{color:'#fff', fontWeight:'bold', fontSize:17}, 
  back:{width:42, height:42, borderRadius:21, backgroundColor:'#1A1A1A', justifyContent:'center', alignItems:'center', borderWidth:1, borderColor:'#222'},
  editBtn:{width:42, height:42, borderRadius:21, justifyContent:'center', alignItems:'center'},
  card:{backgroundColor:'#1A1A1A', borderRadius:20, padding:20, alignItems:'center', borderWidth:1, borderColor:'#222', marginBottom:16},
  iconHead:{width:64, height:64, borderRadius:32, backgroundColor:'#E8C87A20', justifyContent:'center', alignItems:'center', marginBottom:12, borderWidth:1, borderColor:'#E8C87A30'},
  title:{color:'#fff', fontWeight:'bold', fontSize:16}, sub:{color:'#666', fontSize:11, marginTop:6},
  inputCard:{backgroundColor:'#161616', borderRadius:16, padding:14, borderWidth:1, borderColor:'#222'},
  label:{color:'#E8C87A', fontSize:12, marginBottom:10, fontWeight:'bold'},
  textArea:{backgroundColor:'#0F0F0F', borderWidth:1, borderColor:'#E8C87A', borderRadius:12, color:'#fff', padding:14, minHeight:250, fontSize:14, lineHeight:22},
  viewText:{color:'#CCC', fontSize:14, lineHeight:22, minHeight:100},
  hint:{color:'#E8C87A', fontSize:11, marginTop:12, textAlign:'center'},
  saveBig:{backgroundColor:'#E8C87A', height:56, borderRadius:16, flexDirection:'row', justifyContent:'center', alignItems:'center', gap:8, marginTop:16},
  saveBigTxt:{color:'#000', fontWeight:'bold', fontSize:15}
});