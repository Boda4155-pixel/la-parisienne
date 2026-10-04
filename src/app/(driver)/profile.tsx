import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../../lib/supabase';

const t = {
  ar: { profile: 'البروفايل', personal: 'البيانات الشخصية', name: 'الاسم الكامل', phone: 'رقم الموبايل', email: 'البريد الالكتروني', save: 'حفظ التعديلات', saving: 'جاري الحفظ...', logout: 'تسجيل خروج', lang: 'اللغة', changePhoto: 'تغيير الصورة' },
  en: { profile: 'Profile', personal: 'Personal Info', name: 'Full Name', phone: 'Phone Number', email: 'Email', save: 'Save Changes', saving: 'Saving...', logout: 'Logout', lang: 'Language', changePhoto: 'Change Photo' },
  fr: { profile: 'Profil', personal: 'Infos Personnelles', name: 'Nom Complet', phone: 'Téléphone', email: 'Email', save: 'Enregistrer', saving: 'En cours...', logout: 'Déconnexion', lang: 'Langue', changePhoto: 'Changer Photo' },
};

export default function DriverProfile() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [lang, setLang] = useState<'ar'|'en'|'fr'>('ar');
  const tr = t[lang];

  useEffect(()=>{
    (async()=>{
      // نقرأ من نفس المفتاح اللي بتقرأ منه صفحة الطلبات
      const savedLang = await AsyncStorage.getItem('driver_lang') as any;
      if(savedLang) {
        setLang(savedLang);
      } else {
        // لو اول مرة، شوف القديم app_lang وانقله
        const old = await AsyncStorage.getItem('app_lang') as any;
        if(old) {
          setLang(old);
          await AsyncStorage.setItem('driver_lang', old);
        }
      }
      const { data: { user } } = await supabase.auth.getUser();
      if(!user) { setLoading(false); return; }
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
      setProfile(data || { full_name: user.email?.split('@')[0], phone:'', email:user.email, avatar_url:'' });
      setLoading(false);
    })()
  },[]);

  const changeLang = async (l:'ar'|'en'|'fr') => {
    setLang(l);
    // نفس المفتاح اللي صفحة الطلبات بتقرأه
    await AsyncStorage.setItem('driver_lang', l);
    await AsyncStorage.setItem('app_lang', l);
  }

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing:true, aspect:[1,1], quality:0.7 });
    if(result.canceled) return;
    try {
      setUploading(true);
      const { data: { user } } = await supabase.auth.getUser();
      const file = result.assets[0];
      const ext = file.uri.split('.').pop();
      const fileName = `${user?.id}-${Date.now()}.${ext}`;
      const response = await fetch(file.uri);
      const blob = await response.blob();
      const arrayBuffer = await new Response(blob).arrayBuffer();
      const { error: upError } = await supabase.storage.from('avatars').upload(fileName, arrayBuffer, { contentType: file.mimeType || 'image/jpeg', upsert: true });
      if(upError) throw upError;
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
      setProfile((p:any)=>({...p, avatar_url: publicUrl}));
      await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user?.id);
      Alert.alert("تم ✅","تم تحديث الصورة");
    } catch(e:any){ Alert.alert("خطأ", e.message); }
    finally{ setUploading(false); }
  }

  const save = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('profiles').update({ full_name: profile.full_name, phone: profile.phone }).eq('id', user?.id);
    setSaving(false);
    if(error) Alert.alert(error.message); else Alert.alert("تم ✅","تم حفظ البيانات");
  }

  if(loading) return <View style={{flex:1,justifyContent:'center',alignItems:'center',backgroundColor:'#FEF9F2'}}><ActivityIndicator color="#6F4C34" /></View>;

  return (
    <View style={{flex:1,backgroundColor:'#FEF9F2'}}>
      <View style={{backgroundColor:'#2D1E16',paddingTop:50,paddingBottom:20,paddingHorizontal:18,flexDirection:'row',alignItems:'center',gap:12}}>
        <TouchableOpacity onPress={()=>router.back()} style={{width:36,height:36,backgroundColor:'#3D2B20',borderRadius:18,justifyContent:'center',alignItems:'center'}}><Text style={{color:'white',fontSize:18}}>‹</Text></TouchableOpacity>
        <Text style={{color:'white',fontWeight:'900',fontSize:18}}>{tr.profile}</Text>
      </View>

      <ScrollView contentContainerStyle={{padding:16}}>
        <View style={{alignItems:'center',marginTop:10}}>
          <TouchableOpacity onPress={pickImage} style={{position:'relative'}}>
            {profile?.avatar_url? (
              <Image source={{uri: profile.avatar_url}} style={{width:90,height:90,borderRadius:45, borderWidth:2, borderColor:'#EADDCB'}} />
            ) : (
              <View style={{width:90,height:90,backgroundColor:'#E8DCCF',borderRadius:45,justifyContent:'center',alignItems:'center'}}><Text style={{fontSize:34,fontWeight:'900',color:'#2D1E16'}}>{profile?.full_name?.[0]?.toUpperCase()||'A'}</Text></View>
            )}
            <View style={{position:'absolute',bottom:0,right:0,width:28,height:28,backgroundColor:'#2D1E16',borderRadius:14,justifyContent:'center',alignItems:'center',borderWidth:2,borderColor:'white'}}>
              <Text style={{fontSize:12}}>📷</Text>
            </View>
            {uploading && <View style={{position:'absolute',width:90,height:90,borderRadius:45,backgroundColor:'rgba(0,0,0,0.5)',justifyContent:'center',alignItems:'center'}}><ActivityIndicator color="white"/></View>}
          </TouchableOpacity>
          <Text style={{fontWeight:'900',fontSize:18,marginTop:12}}>{profile?.full_name}</Text>
          <Text style={{color:'#8C7560',fontSize:12}}>{profile?.email}</Text>
          <TouchableOpacity onPress={pickImage} style={{marginTop:8}}><Text style={{color:'#3B82F6',fontWeight:'700',fontSize:12}}>{tr.changePhoto}</Text></TouchableOpacity>
        </View>

        <View style={{backgroundColor:'white',borderRadius:18,padding:16,marginTop:16,borderWidth:1,borderColor:'#EADDCB'}}>
          <Text style={{fontWeight:'900',fontSize:13,marginBottom:10}}>🌐 {tr.lang}</Text>
          <View style={{flexDirection:'row',gap:8}}>
            {(['ar','en','fr'] as const).map(l=>(
              <TouchableOpacity key={l} onPress={()=>changeLang(l)} style={{flex:1,paddingVertical:10,borderRadius:10,alignItems:'center',backgroundColor: lang===l? '#2D1E16' : '#FEF9F2', borderWidth:1, borderColor: lang===l? '#2D1E16' : '#EADDCB'}}>
                <Text style={{fontWeight:'900',fontSize:12,color: lang===l? 'white' : '#2D1E16'}}>{l==='ar'?'العربية': l==='en'?'English':'Français'}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{backgroundColor:'white',borderRadius:18,padding:16,marginTop:16,borderWidth:1,borderColor:'#EADDCB',gap:14}}>
          <Text style={{fontWeight:'900'}}>{tr.personal}</Text>
          <View><Text style={{fontSize:11,color:'#8C7560',marginBottom:6,fontWeight:'700'}}>{tr.name}</Text><TextInput value={profile?.full_name||''} onChangeText={t=>setProfile((p:any)=>({...p,full_name:t}))} style={{borderWidth:1,borderColor:'#EADDCB',borderRadius:12,padding:14,backgroundColor:'#FEF9F2',fontWeight:'600'}}/></View>
          <View><Text style={{fontSize:11,color:'#8C7560',marginBottom:6,fontWeight:'700'}}>{tr.phone}</Text><TextInput value={profile?.phone||''} onChangeText={t=>setProfile((p:any)=>({...p,phone:t}))} keyboardType='phone-pad' style={{borderWidth:1,borderColor:'#EADDCB',borderRadius:12,padding:14,backgroundColor:'#FEF9F2',fontWeight:'600'}}/></View>
          <View><Text style={{fontSize:11,color:'#8C7560',marginBottom:6,fontWeight:'700'}}>{tr.email}</Text><TextInput value={profile?.email||''} editable={false} style={{borderWidth:1,borderColor:'#EADDCB',borderRadius:12,padding:14,backgroundColor:'#F5F5F5',color:'#8C7560'}}/></View>
          <TouchableOpacity onPress={save} disabled={saving} style={{backgroundColor:'#2D1E16',paddingVertical:15,borderRadius:12,alignItems:'center',marginTop:4}}><Text style={{color:'white',fontWeight:'900'}}>{saving? tr.saving : tr.save}</Text></TouchableOpacity>
        </View>

        <TouchableOpacity onPress={async()=>{await supabase.auth.signOut(); router.replace('/(auth)/login')}} style={{backgroundColor:'white',borderWidth:1,borderColor:'#FECACA',paddingVertical:14,borderRadius:12,alignItems:'center',marginTop:16}}><Text style={{color:'#DC2626',fontWeight:'900'}}>{tr.logout}</Text></TouchableOpacity>
      </ScrollView>
    </View>
  )
}