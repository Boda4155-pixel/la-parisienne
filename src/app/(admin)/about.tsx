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
        <TouchableOpacity onPress={()=>router.back()} style={s.back}><Ionicons name="chevron-forward" size={22} color="#fff"/></TouchableOpacity>
        <Text style={s.h1}>حول التطبيق</Text>
        <TouchableOpacity onPress={save} style={s.saveTop}>
          {saving? <ActivityIndicator size="small" color="#000"/> : <Ionicons name="checkmark" size={22} color="#000"/>}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS==='ios'?'padding':undefined}>
        {loading? <ActivityIndicator color="#E8C87A" style={{marginTop:60}}/> : (
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
              <TextInput value={version} onChangeText={setVersion} style={s.input} placeholder="1.0.0" placeholderTextColor="#555"/>

              <Text style={[s.label,{marginTop:16}]}>وصف التطبيق</Text>
              <TextInput
                value={desc}
                onChangeText={setDesc}
                multiline
                style={s.textArea}
                textAlignVertical="top"
                placeholder="اكتب وصف التطبيق هنا..."
                placeholderTextColor="#555"
              />
            </View>

            <View style={s.cardRow}>
              <Ionicons name="heart" size={18} color="#E8C87A"/>
              <Text style={s.byTxt}>by Abdelrahman ❤️</Text>
            </View>

            {/* الزرار ده كان نازل تحت - دلوقتي فوق و ظاهر */}
            <TouchableOpacity onPress={save} style={s.saveBig}>
              {saving? <ActivityIndicator color="#000"/> : <><Ionicons name="save-outline" size={20} color="#000"/><Text style={s.saveBigTxt}>حفظ التغييرات</Text></>}
            </TouchableOpacity>
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}
const s = StyleSheet.create({
  bg:{flex:1, backgroundColor:'#0F0F0F'},
  header:{flexDirection:'row', justifyContent:'space-between', alignItems:'center', padding:12, borderBottomWidth:1, borderBottomColor:'#1A1A1A', backgroundColor:'#0F0F0F'},
  h1:{color:'#fff', fontWeight:'bold', fontSize:17}, back:{width:42, height:42, borderRadius:21, backgroundColor:'#1A1A1A', justifyContent:'center', alignItems:'center', borderWidth:1, borderColor:'#222'},
  saveTop:{width:42, height:42, borderRadius:21, backgroundColor:'#E8C87A', justifyContent:'center', alignItems:'center'},
  hero:{backgroundColor:'#1A1A1A', borderRadius:20, padding:24, alignItems:'center', borderWidth:1, borderColor:'#222', marginBottom:12},
  logo:{width:90, height:90, borderRadius:45, backgroundColor:'#E8C87A', justifyContent:'center', alignItems:'center'}, logoTxt:{color:'#000', fontWeight:'bold', fontSize:32},
  appName:{color:'#fff', fontWeight:'bold', fontSize:18, marginTop:12}, verBadge:{backgroundColor:'#222', paddingHorizontal:12, paddingVertical:5, borderRadius:20, marginTop:8}, verTxt:{color:'#888', fontSize:11},
  card:{backgroundColor:'#161616', borderRadius:16, padding:16, borderWidth:1, borderColor:'#222', marginBottom:12},
  label:{color:'#888', fontSize:12, marginBottom:8, textAlign:'right'}, input:{backgroundColor:'#0F0F0F', borderWidth:1, borderColor:'#222', borderRadius:12, color:'#fff', paddingHorizontal:14, height:52, textAlign:'right'},
  textArea:{backgroundColor:'#0F0F0F', borderWidth:1, borderColor:'#222', borderRadius:12, color:'#fff', padding:14, minHeight:180, textAlign:'right'},
  cardRow:{backgroundColor:'#161616', borderRadius:14, padding:14, borderWidth:1, borderColor:'#222', flexDirection:'row', alignItems:'center', gap:8, justifyContent:'center', marginBottom:12},
  byTxt:{color:'#888', fontSize:12},
  saveBig:{backgroundColor:'#E8C87A', height:56, borderRadius:16, flexDirection:'row', justifyContent:'center', alignItems:'center', gap:8}, saveBigTxt:{color:'#000', fontWeight:'bold', fontSize:15}
});