import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../../lib/supabase';

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
        <TouchableOpacity onPress={()=>router.back()} style={s.back}><Ionicons name="chevron-forward" size={22} color="#111"/></TouchableOpacity>
        <Text style={s.h1}>حول التطبيق</Text>
        <TouchableOpacity onPress={save} style={s.saveTop}>
          {saving? <ActivityIndicator size="small" color="#fff"/> : <Ionicons name="checkmark" size={22} color="#fff"/>}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={{flex:1, backgroundColor:'#F9F9F9'}} behavior={Platform.OS==='ios'?'padding':undefined}>
        {loading? <ActivityIndicator color="#16A34A" style={{marginTop:60}}/> : (
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
              <TextInput value={version} onChangeText={setVersion} style={s.input} placeholder="1.0.0" placeholderTextColor="#999"/>

              <Text style={[s.label,{marginTop:16}]}>وصف التطبيق</Text>
              <TextInput
                value={desc}
                onChangeText={setDesc}
                multiline
                style={s.textArea}
                textAlignVertical="top"
                placeholder="اكتب وصف التطبيق هنا..."
                placeholderTextColor="#999"
              />
            </View>

            <View style={s.cardRow}>
              <Ionicons name="heart" size={18} color="#16A34A"/>
              <Text style={s.byTxt}>by Abdelrahman ❤️</Text>
            </View>

            <TouchableOpacity onPress={save} style={s.saveBig}>
              {saving? <ActivityIndicator color="#fff"/> : <><Ionicons name="save-outline" size={20} color="#fff"/><Text style={s.saveBigTxt}>حفظ التغييرات</Text></>}
            </TouchableOpacity>
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}
const s = StyleSheet.create({
  bg:{flex:1, backgroundColor:'#FFFFFF'},
  header:{flexDirection:'row', justifyContent:'space-between', alignItems:'center', padding:12, borderBottomWidth:1, borderBottomColor:'#E5E5E5', backgroundColor:'#FFFFFF'},
  h1:{color:'#111', fontWeight:'800', fontSize:17}, back:{width:42, height:42, borderRadius:21, backgroundColor:'#FFFFFF', justifyContent:'center', alignItems:'center', borderWidth:1, borderColor:'#E5E5E5'},
  saveTop:{width:42, height:42, borderRadius:21, backgroundColor:'#16A34A', justifyContent:'center', alignItems:'center'},
  hero:{backgroundColor:'#FFFFFF', borderRadius:20, padding:24, alignItems:'center', borderWidth:1, borderColor:'#E5E5E5', marginBottom:12, shadowColor:'#000', shadowOpacity:0.03, shadowRadius:6, elevation:1},
  logo:{width:90, height:90, borderRadius:45, backgroundColor:'#16A34A', justifyContent:'center', alignItems:'center'}, logoTxt:{color:'#FFFFFF', fontWeight:'800', fontSize:32},
  appName:{color:'#111', fontWeight:'800', fontSize:18, marginTop:12}, verBadge:{backgroundColor:'#F0FDF4', paddingHorizontal:12, paddingVertical:5, borderRadius:20, marginTop:8, borderWidth:1, borderColor:'#BBF7D0'}, verTxt:{color:'#16A34A', fontSize:11, fontWeight:'700'},
  card:{backgroundColor:'#FFFFFF', borderRadius:16, padding:16, borderWidth:1, borderColor:'#E5E5E5', marginBottom:12},
  label:{color:'#111', fontSize:12, marginBottom:8, textAlign:'right', fontWeight:'700'}, input:{backgroundColor:'#F9F9F9', borderWidth:1, borderColor:'#E5E5E5', borderRadius:12, color:'#111', paddingHorizontal:14, height:52, textAlign:'right'},
  textArea:{backgroundColor:'#F9F9F9', borderWidth:1, borderColor:'#E5E5E5', borderRadius:12, color:'#111', padding:14, minHeight:180, textAlign:'right'},
  cardRow:{backgroundColor:'#FFFFFF', borderRadius:14, padding:14, borderWidth:1, borderColor:'#E5E5E5', flexDirection:'row', alignItems:'center', gap:8, justifyContent:'center', marginBottom:12},
  byTxt:{color:'#666', fontSize:12, fontWeight:'600'},
  saveBig:{backgroundColor:'#16A34A', height:56, borderRadius:16, flexDirection:'row', justifyContent:'center', alignItems:'center', gap:8}, saveBigTxt:{color:'#FFFFFF', fontWeight:'800', fontSize:15}
});