import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../../lib/supabase';
import { useLang } from '../../lib/language';

export default function Profile(){
  const insets=useSafeAreaInsets();
  const router=useRouter();
  const {lang,t,setLang}=useLang();
  const [p,setP]=useState<any>(null);
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    (async()=>{
      const {data:{user}} = await supabase.auth.getUser();
      if(!user){ setLoading(false); return; }
      const {data} = await supabase.from('driver_profiles').select('*').eq('id',user.id).maybeSingle();
      setP(data || {email:user.email, full_name: 'Driver'});
      setLoading(false);
    })()
  },[]);

  const logout = async()=>{
    await supabase.auth.signOut();
    router.replace('/(auth)/login');
  }

  if(loading) return <View style={{flex:1,justifyContent:'center',alignItems:'center', paddingTop:insets.top}}><ActivityIndicator color="#000"/></View>;

  return(
    <ScrollView style={{flex:1,backgroundColor:'#F8F8F8', paddingTop:insets.top}} contentContainerStyle={{paddingBottom:130}}>
      <Text style={s.title}>حسابي</Text>

      {/* البروفايل */}
      <View style={s.card}>
        <View style={{flexDirection:'row', alignItems:'center', gap:12}}>
          <View style={s.avatar}><Text style={{color:'#fff', fontWeight:'900', fontSize:18}}>B</Text></View>
          <View style={{flex:1}}>
            <Text style={{fontWeight:'900',fontSize:16}}>{p?.full_name || 'Driver'}</Text>
            <Text style={{color:'#666',marginTop:2}}>{p?.email}</Text>
          </View>
        </View>
      </View>

      {/* الرصيد */}
      <View style={[s.card, {backgroundColor:'#000'}]}>
        <Text style={{color:'#aaa', fontSize:12}}>الرصيد الحالي</Text>
        <Text style={{color:'#fff', fontWeight:'900', fontSize:28, marginTop:6}}>0 MAD</Text>
        <Pressable onPress={()=>router.push('/(driver)/wallet')} style={{marginTop:12, backgroundColor:'#fff', paddingVertical:12, borderRadius:10, alignItems:'center'}}>
          <Text style={{fontWeight:'800'}}>View Wallet / عرض المحفظة</Text>
        </Pressable>
      </View>

      {/* اللغة */}
      <View style={s.card}>
        <View style={{flexDirection:'row', alignItems:'center', gap:6, marginBottom:12}}>
          <Text style={{fontWeight:'800'}}>اللغة 🌐</Text>
          <Text style={{fontSize:11, color:'#2E7D32', fontWeight:'700', backgroundColor:'#E8F5E9', paddingHorizontal:6, paddingVertical:2, borderRadius:6}}>بتتغير فورا ✅</Text>
        </View>
        <View style={{flexDirection:'row',gap:8}}>
          <Pressable onPress={()=>setLang('AR')} style={[s.langBtn, lang==='AR'&&s.langActive]}><Text style={[s.langText, lang==='AR'&&{color:'#fff'}]}>AR عربي</Text></Pressable>
          <Pressable onPress={()=>setLang('EN')} style={[s.langBtn, lang==='EN'&&s.langActive]}><Text style={[s.langText, lang==='EN'&&{color:'#fff'}]}>EN</Text></Pressable>
          <Pressable onPress={()=>setLang('FR')} style={[s.langBtn, lang==='FR'&&s.langActive]}><Text style={[s.langText, lang==='FR'&&{color:'#fff'}]}>FR</Text></Pressable>
        </View>
      </View>

      {/* بس طلباتي - شيلت الاتنين اللي علمت عليهم */}
      <View style={s.card}>
        <Pressable onPress={()=>router.push('/(driver)/orders')} style={s.row}>
          <Ionicons name="receipt-outline" size={20} color="#000"/>
          <Text style={s.rowText}>طلباتي</Text>
          <Ionicons name="chevron-forward" size={18} color="#999"/>
        </Pressable>
      </View>

      <Pressable onPress={logout} style={[s.card,{backgroundColor:'#FFEAEA', borderColor:'#FFC9C9', flexDirection:'row', justifyContent:'center', alignItems:'center', gap:8}]}>
        <Ionicons name="log-out-outline" size={20} color="#D00000"/>
        <Text style={{color:'#D00000',fontWeight:'900'}}>خروج</Text>
      </Pressable>

      <Text style={{textAlign:'center', color:'#bbb', fontSize:11, marginTop:10}}>La Parisienne - Driver App</Text>
    </ScrollView>
  );
}

const s=StyleSheet.create({
  title:{fontWeight:'900',fontSize:20,textAlign:'center',marginVertical:16},
  card:{backgroundColor:'#fff',marginHorizontal:16,marginBottom:12,borderRadius:16,padding:16,borderWidth:1,borderColor:'#eee'},
  avatar:{width:48,height:48,borderRadius:24,backgroundColor:'#000',justifyContent:'center',alignItems:'center'},
  langBtn:{flex:1,paddingVertical:12,borderRadius:10,backgroundColor:'#F0F0F0',alignItems:'center'},
  langActive:{backgroundColor:'#000'},
  langText:{fontWeight:'800',fontSize:12},
  row:{flexDirection:'row', alignItems:'center', gap:12, paddingVertical:6},
  rowText:{flex:1, fontWeight:'600', fontSize:14},
});