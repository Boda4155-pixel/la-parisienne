import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, I18nManager, Text, TouchableOpacity, View } from 'react-native';
import { changeAppLanguage } from '../../../i18next/i18next';
import { supabase } from '../../../lib/supabase';
import { ADMIN_COLORS } from "../../../lib/adminTheme";

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
      await changeAppLanguage(code);
      setCurrent(code);
      await AsyncStorage.setItem('app_lang', code);

      const { data: { user } } = await supabase.auth.getUser();
      if(user){
        const { error } = await supabase.from('profiles').update({ language: code } as any).eq('id', user.id);
        if(error){
          await supabase.from('store_settings').upsert({ key: 'user_lang_'+user.id, value: { lang: code } }, { onConflict:'key' });
        }
      }

      if(code === 'ar' && !I18nManager.isRTL){
        // I18nManager.forceRTL(true);
      }

      Alert.alert('تم ✅', `Language changed to ${code.toUpperCase()}`);
    }catch(e:any){ 
      Alert.alert('Error', e.message); 
    }finally{
      setSaving(null);
    }
  };

  if(loading) return <View style={{flex:1, backgroundColor:ADMIN_COLORS.backgroundSecondary, justifyContent:'center', alignItems:'center'}}><ActivityIndicator color={ADMIN_COLORS.textPrimary}/></View>;

  return (
    <View style={{flex:1, backgroundColor:ADMIN_COLORS.backgroundSecondary, paddingTop:60, padding:16}}>
      <TouchableOpacity onPress={()=>router.back()} style={{flexDirection:'row', gap:6, alignItems:'center', width:90, height:36, borderRadius:18, backgroundColor:ADMIN_COLORS.card, borderWidth:1, borderColor:ADMIN_COLORS.border, justifyContent:'center'}}>
        <Ionicons name="chevron-forward" size={20} color={ADMIN_COLORS.textPrimary}/><Text style={{color:ADMIN_COLORS.textPrimary, fontWeight:'700'}}>Back</Text>
      </TouchableOpacity>

      <Text style={{color:ADMIN_COLORS.textPrimary, fontSize:22, fontWeight:'800', marginTop:20, textAlign:'right'}}>Language • اللغة - فوري</Text>
      <Text style={{color:ADMIN_COLORS.textSecondary, fontSize:12, marginTop:4, textAlign:'right', fontWeight:'600'}}></Text>

      <View style={{marginTop:20, gap:12}}>
        {langs.map(l=>{
          const active = current===l.code;
          const isSaving = saving === l.code;
          return (
            <TouchableOpacity key={l.code} onPress={()=>select(l.code)} disabled={!!saving} style={{backgroundColor: active ? ADMIN_COLORS.primary : ADMIN_COLORS.card, borderRadius:16, padding:18, flexDirection:'row', justifyContent:'space-between', alignItems:'center', borderWidth:1, borderColor: active ? ADMIN_COLORS.primary : ADMIN_COLORS.border, opacity: saving ? 0.6 : 1}}>
              <View style={{flexDirection:'row', alignItems:'center', gap:10}}>
                {active && <Ionicons name="checkmark-circle" size={24} color={ADMIN_COLORS.primaryText}/>}
                {isSaving && <ActivityIndicator color={ADMIN_COLORS.primaryText} size="small"/>}
              </View>
              <View style={{flexDirection:'row', alignItems:'center', gap:8}}>
                <Text style={{color: active ? ADMIN_COLORS.primaryText : ADMIN_COLORS.textPrimary, fontWeight:'800', fontSize:16}}>{l.native}</Text>
                <Text style={{fontSize:20}}>{l.flag}</Text>
              </View>
            </TouchableOpacity>
          )
        })}
      </View>

      <View style={{marginTop:30, backgroundColor:ADMIN_COLORS.card, borderRadius:12, padding:12, borderWidth:1, borderColor:ADMIN_COLORS.border}}>
        <Text style={{color:ADMIN_COLORS.textPrimary, fontSize:11, textAlign:'center', fontWeight:'700'}}>Current: {current.toUpperCase()} • i18n: {i18n.language}</Text>
      </View>
    </View>
  );
}