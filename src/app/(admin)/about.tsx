import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../../lib/supabase';
import { ADMIN_COLORS } from "../../../lib/adminTheme";

export default function AboutApp(){
  const insets = useSafeAreaInsets();
  const [desc, setDesc] = useState('');
  const [version, setVersion] = useState('1.0.0');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(()=>{ (async()=>{
    const {data} = await supabase.from('app_settings').select('key,value').in('key',['about_app','app_version']);
    data?.forEach((r:any)=>{ if(r.key==='about_app') setDesc(r.value); if(r.key==='app_version') setVersion(r.value); });
    if(!data?.find((r:any)=>r.key==='about_app')) setDesc('La Parisienne - مخبز فرنسي فاخر\nنقدم أفضل المخبوزات والحلويات الفرنسية بجودة عالية وطعم لا يقاوم.');
    setLoading(false);
  })(); },[]);

  const save = async () => {
    setSaving(true);
    await supabase.from('app_settings').upsert({key:'about_app', value:desc},{onConflict:'key'});
    await supabase.from('app_settings').upsert({key:'app_version', value:version},{onConflict:'key'});
    setSaving(false);
    Alert.alert('تم ✅','تم الحفظ وهيظهر للعملاء');
  };

  return (
    <View style={s.bg}>
      <View style={[s.header, {paddingTop: insets.top + 12}]}>
        <TouchableOpacity onPress={()=>router.back()} style={s.back}><Ionicons name="chevron-forward" size={22} color={ADMIN_COLORS.textPrimary}/></TouchableOpacity>
        <Text style={s.h1}>حول التطبيق</Text>
        <TouchableOpacity onPress={save} style={s.saveTop}>
          {saving? <ActivityIndicator size="small" color={ADMIN_COLORS.primaryText}/> : <Ionicons name="checkmark" size={22} color={ADMIN_COLORS.primaryText}/>}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={{flex:1, backgroundColor:ADMIN_COLORS.backgroundSecondary}} behavior={Platform.OS==='ios'?'padding':undefined}>
        {loading? <ActivityIndicator color={ADMIN_COLORS.textPrimary} style={{marginTop:60}}/> : (
          <ScrollView
            contentContainerStyle={{padding:16, paddingBottom: insets.bottom + 120}}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={s.hero}>
              <View style={s.logo}><Text style={s.logoTxt}>LP</Text></View>
              <Text style={s.appName}>La Parisienne</Text>
              <View style={s.verBadge}><Text style={s.verTxt}>Version {version} - la-parisienne</Text></View>
            </View>

            <View style={s.card}>
              <Text style={s.label}>رقم الاصدار</Text>
              <TextInput value={version} onChangeText={setVersion} style={s.input} placeholder="1.0.0" placeholderTextColor={ADMIN_COLORS.textSecondary}/>

              <Text style={[s.label,{marginTop:16}]}>وصف التطبيق</Text>
              <TextInput
                value={desc}
                onChangeText={setDesc}
                multiline
                style={s.textArea}
                textAlignVertical="top"
                placeholder="اكتب وصف التطبيق هنا..."
                placeholderTextColor={ADMIN_COLORS.textSecondary}
              />
            </View>

            <View style={s.cardRow}>
              <Ionicons name="heart" size={18} color={ADMIN_COLORS.textPrimary}/>
              <Text style={s.byTxt}>by Abdelrahman ❤️</Text>
            </View>

            <TouchableOpacity onPress={save} style={s.saveBig}>
              {saving? <ActivityIndicator color={ADMIN_COLORS.primaryText}/> : <><Ionicons name="save-outline" size={20} color={ADMIN_COLORS.primaryText}/><Text style={s.saveBigTxt}>حفظ التغييرات</Text></>}
            </TouchableOpacity>
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}
const s = StyleSheet.create({
  bg:{flex:1, backgroundColor:ADMIN_COLORS.background},
  header:{flexDirection:'row', justifyContent:'space-between', alignItems:'center', padding:12, borderBottomWidth:1, borderBottomColor:ADMIN_COLORS.border, backgroundColor:ADMIN_COLORS.card},
  h1:{color:ADMIN_COLORS.textPrimary, fontWeight:'800', fontSize:17}, back:{width:42, height:42, borderRadius:21, backgroundColor:ADMIN_COLORS.card, justifyContent:'center', alignItems:'center', borderWidth:1, borderColor:ADMIN_COLORS.border},
  saveTop:{width:42, height:42, borderRadius:21, backgroundColor:ADMIN_COLORS.primary, justifyContent:'center', alignItems:'center'},
  hero:{backgroundColor:ADMIN_COLORS.card, borderRadius:20, padding:24, alignItems:'center', borderWidth:1, borderColor:ADMIN_COLORS.border, marginBottom:12, shadowColor:'#000', shadowOpacity:0.03, shadowRadius:6, elevation:1},
  logo:{width:90, height:90, borderRadius:45, backgroundColor:ADMIN_COLORS.primary, justifyContent:'center', alignItems:'center'}, logoTxt:{color:ADMIN_COLORS.primaryText, fontWeight:'800', fontSize:32},
  appName:{color:ADMIN_COLORS.textPrimary, fontWeight:'800', fontSize:18, marginTop:12}, verBadge:{backgroundColor:ADMIN_COLORS.backgroundSecondary, paddingHorizontal:12, paddingVertical:5, borderRadius:20, marginTop:8, borderWidth:1, borderColor:ADMIN_COLORS.border}, verTxt:{color:ADMIN_COLORS.textPrimary, fontSize:11, fontWeight:'700'},
  card:{backgroundColor:ADMIN_COLORS.card, borderRadius:16, padding:16, borderWidth:1, borderColor:ADMIN_COLORS.border, marginBottom:12},
  label:{color:ADMIN_COLORS.textPrimary, fontSize:12, marginBottom:8, textAlign:'right', fontWeight:'700'}, input:{backgroundColor:ADMIN_COLORS.backgroundSecondary, borderWidth:1, borderColor:ADMIN_COLORS.border, borderRadius:12, color:ADMIN_COLORS.textPrimary, paddingHorizontal:14, height:52, textAlign:'right'},
  textArea:{backgroundColor:ADMIN_COLORS.backgroundSecondary, borderWidth:1, borderColor:ADMIN_COLORS.border, borderRadius:12, color:ADMIN_COLORS.textPrimary, padding:14, minHeight:180, textAlign:'right'},
  cardRow:{backgroundColor:ADMIN_COLORS.card, borderRadius:14, padding:14, borderWidth:1, borderColor:ADMIN_COLORS.border, flexDirection:'row', alignItems:'center', gap:8, justifyContent:'center', marginBottom:12},
  byTxt:{color:ADMIN_COLORS.textPrimary, fontSize:12, fontWeight:'600'},
  saveBig:{backgroundColor:ADMIN_COLORS.primary, height:56, borderRadius:16, flexDirection:'row', justifyContent:'center', alignItems:'center', gap:8}, saveBigTxt:{color:ADMIN_COLORS.primaryText, fontWeight:'800', fontSize:15}
});