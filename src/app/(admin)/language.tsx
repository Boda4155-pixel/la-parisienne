import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, I18nManager, Text, TouchableOpacity, View } from 'react-native';
import { changeAppLanguage } from '../../../i18next/i18next';
import { supabase } from '../../../lib/supabase';

const langs = [
  {code:'en', native:'English', flag:'🇬🇧'},
  {code:'ar', native:'العربية', flag:'🇪🇬'},
  {code:'fr', native:'Français', flag:'🇫🇷'}
];

export default function LanguageScreen(){
  const { i18n, t } = useTranslation();
  const [current, setCurrent] = useState(i18n.language || 'en');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const saved = await AsyncStorage.getItem('app_lang');
    if(saved) setCurrent(saved);
    // من Supabase كمان
    const { data: { user } } = await supabase.auth.getUser();
    if(user){
      const { data } = await supabase.from('profiles').select('language').eq('id', user.id).maybeSingle();
      if(data?.language) setCurrent(data.language);
    }
    setLoading(false);
  };
  useEffect(()=>{load()},[]);

  const select = async (code:string) => {
    if(code === current) return;
    setSaving(code);
    try{
      // 1- غير اللغة لحظيا في الاب كله - من غير ريستارت
      await changeAppLanguage(code);
      setCurrent(code);
      await AsyncStorage.setItem('app_lang', code);

      // 2- احفظ في Supabase حقيقي (background)
      const { data: { user } } = await supabase.auth.getUser();
      if(user){
        const { error } = await supabase.from('profiles').update({ language: code } as any).eq('id', user.id);
        if(error){
          await supabase.from('store_settings').upsert({ key: 'user_lang_'+user.id, value: { lang: code } }, { onConflict:'key' });
        }
      }

      // 3- لو عربي فعل RTL (اختياري)
      if(code === 'ar' && !I18nManager.isRTL){
        // I18nManager.forceRTL(true); // شيل الكومنت لو عايز يقلب الاتجاه
      }

      Alert.alert('تم ✅', `Language changed to ${code.toUpperCase()}`);
    }catch(e:any){ 
      Alert.alert('Error', e.message); 
    }finally{
      setSaving(null);
    }
  };

  if(loading) return <View style={{flex:1, backgroundColor:'#0F0F0F', justifyContent:'center', alignItems:'center'}}><ActivityIndicator color="#E8C87A"/></View>;

  return (
    <View style={{flex:1, backgroundColor:'#0F0F0F', paddingTop:60, padding:16}}>
      <TouchableOpacity onPress={()=>router.back()} style={{flexDirection:'row', gap:6, alignItems:'center'}}>
        <Ionicons name="chevron-forward" size={20} color="#fff"/><Text style={{color:'#fff'}}>Back</Text>
      </TouchableOpacity>

      <Text style={{color:'#fff', fontSize:22, fontWeight:'bold', marginTop:20, textAlign:'right'}}>Language • اللغة - فوري</Text>
      <Text style={{color:'#888', fontSize:12, marginTop:4, textAlign:'right'}}>التغيير فوري من غير ما الابلكيشن يقفل</Text>

      <View style={{marginTop:20, gap:12}}>
        {langs.map(l=>{
          const active = current===l.code;
          const isSaving = saving === l.code;
          return (
            <TouchableOpacity key={l.code} onPress={()=>select(l.code)} disabled={!!saving} style={{backgroundColor: active ? '#E8C87A' : '#161616', borderRadius:16, padding:18, flexDirection:'row', justifyContent:'space-between', alignItems:'center', borderWidth:1, borderColor: active ? '#E8C87A' : '#222', opacity: saving ? 0.6 : 1}}>
              <View style={{flexDirection:'row', alignItems:'center', gap:10}}>
                {active && <Ionicons name="checkmark-circle" size={24} color="#000"/>}
                {isSaving && <ActivityIndicator color="#000" size="small"/>}
              </View>
              <View style={{flexDirection:'row', alignItems:'center', gap:8}}>
                <Text style={{color: active ? '#000' : '#fff', fontWeight:'bold', fontSize:16}}>{l.native}</Text>
                <Text style={{fontSize:20}}>{l.flag}</Text>
              </View>
            </TouchableOpacity>
          )
        })}
      </View>

      <View style={{marginTop:30, backgroundColor:'#161616', borderRadius:12, padding:12, borderWidth:1, borderColor:'#222'}}>
        <Text style={{color:'#888', fontSize:11, textAlign:'center'}}>Current: {current.toUpperCase()} • i18n: {i18n.language}</Text>
      </View>
    </View>
  );
}