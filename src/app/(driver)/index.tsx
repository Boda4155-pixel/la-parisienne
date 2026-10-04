import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../../lib/supabase';

type Lang = 'ar' | 'en' | 'fr';

const LANGS = {
  ar: {
    online: 'Online', today: 'TODAY', cash: 'CASH', order: 'أوردر', pound: 'جنيه',
    noActive: 'مفيش أوردر نشط', pull: 'اسحب للأسفل للتحديث', available: 'أوردرات متاحة',
    active: 'الطلب النشط', client: 'العميل', phone: 'الموبايل', address: 'العنوان',
    details: 'تفاصيل الطلب', total: 'الإجمالي', payment: 'طريقة الدفع',
    call: 'اتصال', whatsapp: 'واتساب', map: 'فتح في الخرائط',
    delivered: '✓ تم التوصيل', take: 'استلام', noOrders: 'لا يوجد أوردرات حاليا',
  },
  en: {
    online: 'Online', today: 'TODAY', cash: 'CASH', order: 'orders', pound: 'EGP',
    noActive: 'No active order', pull: 'Pull to refresh', available: 'Available orders',
    active: 'Active Order', client: 'Client', phone: 'Phone', address: 'Address',
    details: 'Order details', total: 'Total', payment: 'Payment',
    call: 'Call', whatsapp: 'WhatsApp', map: 'Open in Maps',
    delivered: '✓ Delivered', take: 'Take', noOrders: 'No orders right now',
  },
  fr: {
    online: 'En ligne', today: "AUJOURD'HUI", cash: 'CASH', order: 'commandes', pound: 'EGP',
    noActive: 'Aucune commande active', pull: 'Tirer pour rafraîchir', available: 'Commandes disponibles',
    active: 'Commande active', client: 'Client', phone: 'Téléphone', address: 'Adresse',
    details: 'Détails', total: 'Total', payment: 'Paiement',
    call: 'Appeler', whatsapp: 'WhatsApp', map: 'Ouvrir Maps',
    delivered: '✓ Livré', take: 'Prendre', noOrders: 'Pas de commandes',
  }
};

export default function DriverPage() {
  const [profile, setProfile] = useState<any>(null);
  const [active, setActive] = useState<any>(null);
  const [available, setAvailable] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ count: 0, cash: 0 });
  const [lang, setLang] = useState<Lang>('ar');
  const t = LANGS[lang];

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem('driver_lang').then(v => {
        if (v) setLang(v as Lang);
      });
    }, [])
  );

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if(!user) return;
    const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
    setProfile(prof || { full_name: 'Abdelrahman El Sawy' });
    const driverId = prof?.id || user.id;

    // FIX: استخدمنا address_line بدل full_address عشان ده اللي عندك في الـ PRODUCTION
    const { data: mine, error: mineErr } = await supabase.from('orders').select(`
      *,
      customer:profiles!orders_user_id_fkey(full_name, phone),
      address:customer_addresses!orders_address_id_fkey(address_line, city, lat, lng, full_name, phone),
      items:order_items(quantity, products(name, price))
    `).eq('driver_id', driverId).in('status', ['ready','confirmed','out_for_delivery','accepted']).order('created_at',{ascending:false}).limit(1);

    if(mineErr) console.log('mine error', mineErr.message);

    const { data: avail, error: availErr } = await supabase.from('orders').select(`
      *,
      customer:profiles!orders_user_id_fkey(full_name, phone),
      address:customer_addresses!orders_address_id_fkey(address_line, city, lat, lng, full_name, phone)
    `).is('driver_id', null).eq('status','ready').order('created_at',{ascending:false}).limit(20);

    if(availErr) console.log('avail error', availErr.message);

    const today = new Date(); today.setHours(0,0,0,0);
    const { data: del } = await supabase.from('orders').select('total').eq('driver_id', driverId).eq('status','delivered').gte('created_at', today.toISOString());
    if(del) setStats({ count: del.length, cash: del.reduce((s:any,o:any)=>s+(o.total||0),0)});
    setActive(mine?.[0]||null); setAvailable(avail||[]); setLoading(false);
  };

  useEffect(()=>{ load(); const ch=supabase.channel('driver-orders').on('postgres_changes',{event:'*',schema:'public',table:'orders'},load).subscribe(); return ()=>{supabase.removeChannel(ch)} },[]);

  const take = async (id:string) => {
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from('orders').update({ driver_id: user?.id, status: 'out_for_delivery' }).eq('id', id);
    if(error) Alert.alert('Error', error.message);
    load();
  }

  const done = async () => { Alert.alert("تأكيد","تم توصيل الطلب؟",[{text:"لا"},{text:"نعم",onPress: async()=>{ await supabase.from('orders').update({ status: 'delivered' }).eq('id', active.id); load(); }}]) }

  if(loading) return <View style={{flex:1,justifyContent:'center',alignItems:'center',backgroundColor:'#FEF9F2'}}><ActivityIndicator color="#6F4C34" /></View>;

  // helper عشان نعرض العنوان سواء address_line او full_address
  const getAddrText = (addr:any) => addr?.address_line || addr?.full_address || 'بدون عنوان';

  return (
    <View style={{flex:1,backgroundColor:'#FEF9F2'}}>
      <View style={{backgroundColor:'#2D1E16',paddingTop:50,paddingBottom:18,paddingHorizontal:18,borderBottomLeftRadius:28,borderBottomRightRadius:28}}>
        <View style={{flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}>
          <View style={{flexDirection:'row',gap:12,alignItems:'center'}}>
            <View style={{width:46,height:46,backgroundColor:'#E8DCCF',borderRadius:23,justifyContent:'center',alignItems:'center'}}><Text style={{fontWeight:'900',color:'#2D1E16'}}>{profile?.full_name?.[0]?.toUpperCase()||'A'}</Text></View>
            <View><Text style={{color:'white',fontWeight:'900'}}>{profile?.full_name}</Text><View style={{flexDirection:'row',alignItems:'center',gap:6,marginTop:2}}><View style={{width:8,height:8,borderRadius:4,backgroundColor:'#22C55E'}}/><Text style={{color:'#22C55E',fontSize:12,fontWeight:'700'}}>{t.online}</Text></View></View>
          </View>
          <TouchableOpacity onPress={()=>router.push('/(driver)/profile')} style={{width:40,height:40,backgroundColor:'#3D2B20',borderRadius:20,justifyContent:'center',alignItems:'center',borderWidth:1,borderColor:'#4E3C30'}}><Text>👤</Text></TouchableOpacity>
        </View>
        <View style={{flexDirection:'row',gap:12,marginTop:18}}>
          <View style={{flex:1,backgroundColor:'#3D2B20',borderRadius:16,padding:14}}><Text style={{color:'#CBBBA9',fontSize:10}}>{t.today}</Text><Text style={{color:'white',fontSize:26,fontWeight:'900',marginTop:4}}>{stats.count}</Text><Text style={{color:'#CBBBA9',fontSize:11}}>{t.order}</Text></View>
          <View style={{flex:1,backgroundColor:'#3D2B20',borderRadius:16,padding:14}}><Text style={{color:'#CBBBA9',fontSize:10}}>{t.cash}</Text><Text style={{color:'white',fontSize:26,fontWeight:'900',marginTop:4}}>{stats.cash}</Text><Text style={{color:'#CBBBA9',fontSize:11}}>{t.pound}</Text></View>
        </View>
      </View>

      <ScrollView contentContainerStyle={{padding:14}} refreshControl={<RefreshControl refreshing={false} onRefresh={load}/>}>
        {active? (
          <View style={{backgroundColor:'white',borderRadius:20,borderWidth:1,borderColor:'#EADDCB',overflow:'hidden'}}>
            <View style={{padding:14,flexDirection:'row',justifyContent:'space-between',backgroundColor:'#FFF8F0'}}><Text style={{fontWeight:'900'}}>{t.active} #{active.id?.slice(0,6)}</Text></View>
            <View style={{height:140,backgroundColor:'#E5E7EB',justifyContent:'center',alignItems:'center'}}><Text style={{fontSize:36}}>🗺️</Text><Text style={{fontSize:11,marginTop:4,textAlign:'center',paddingHorizontal:10}}>{getAddrText(active.address)}</Text></View>
            <View style={{padding:14,gap:10}}>
              <View style={{flexDirection:'row',justifyContent:'space-between'}}><Text style={{color:'#8C7560',fontSize:12}}>{t.client}</Text><Text style={{fontWeight:'900',fontSize:12}}>{active.customer?.full_name || active.address?.full_name}</Text></View>
              <View style={{flexDirection:'row',justifyContent:'space-between'}}><Text style={{color:'#8C7560',fontSize:12}}>{t.phone}</Text><Text style={{fontSize:12}}>{active.customer?.phone || active.address?.phone}</Text></View>
              <View style={{flexDirection:'row',gap:8,marginTop:6}}>
                <TouchableOpacity onPress={()=>Linking.openURL(`tel:${active.customer?.phone || active.address?.phone}`)} style={{flex:1,backgroundColor:'#2D1E16',paddingVertical:11,borderRadius:10,alignItems:'center'}}><Text style={{color:'white',fontWeight:'800',fontSize:11}}>{t.call}</Text></TouchableOpacity>
                <TouchableOpacity onPress={()=>Linking.openURL(`https://wa.me/${active.customer?.phone || active.address?.phone}`)} style={{flex:1,backgroundColor:'#25D366',paddingVertical:11,borderRadius:10,alignItems:'center'}}><Text style={{color:'white',fontWeight:'800',fontSize:11}}>{t.whatsapp}</Text></TouchableOpacity>
                <TouchableOpacity onPress={()=>Linking.openURL(active.address?.lat? `https://www.google.com/maps/search/?api=1&query=${active.address.lat},${active.address.lng}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(getAddrText(active.address))}`)} style={{flex:1,borderWidth:1,borderColor:'#EADDCB',paddingVertical:11,borderRadius:10,alignItems:'center'}}><Text style={{fontWeight:'800',fontSize:11}}>{t.map}</Text></TouchableOpacity>
              </View>
              <TouchableOpacity onPress={done} style={{backgroundColor:'#1A8A3A',paddingVertical:14,borderRadius:12,alignItems:'center'}}><Text style={{color:'white',fontWeight:'900'}}>{t.delivered}</Text></TouchableOpacity>
            </View>
          </View>
        ) : (<View style={{backgroundColor:'white',borderRadius:20,borderWidth:1,borderColor:'#EADDCB',padding:28,alignItems:'center'}}><Text style={{fontSize:34}}>📦</Text><Text style={{fontWeight:'900',marginTop:8}}>{t.noActive}</Text><Text style={{color:'#8C7560',fontSize:12}}>{t.pull}</Text></View>)}

        <Text style={{fontWeight:'900',marginTop:20,marginBottom:10}}>{t.available} ({available.length})</Text>
        {available.map(o=>(<View key={o.id} style={{backgroundColor:'white',borderRadius:14,borderWidth:1,borderColor:'#EADDCB',padding:12,marginBottom:8,flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}><View style={{flex:1,paddingRight:10}}><Text style={{fontWeight:'900',fontSize:12}}># {o.id?.slice(0,6)} - {o.total} {t.pound}</Text><Text style={{color:'#8C7560',fontSize:11}}>{o.customer?.full_name || o.address?.full_name} - {getAddrText(o.address)}</Text></View><TouchableOpacity onPress={()=>take(o.id)} style={{backgroundColor:'#2D1E16',paddingHorizontal:16,paddingVertical:10,borderRadius:10}}><Text style={{color:'white',fontWeight:'900',fontSize:11}}>{t.take}</Text></TouchableOpacity></View>))}
      </ScrollView>
    </View>
  );
}