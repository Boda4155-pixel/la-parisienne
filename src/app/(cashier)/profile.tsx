import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Modal, Platform, ScrollView, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { CUSTOMER_COLORS } from '../../../lib/customerTheme';
import { supabase } from '../../../lib/supabase';

const STORE_ID = 'la-parisienne-1';

const translations: any = {
  ar: { title: 'مطعمي - La Parisienne', orders: 'الطلبات', rating: 'التقييم', years: 'سنوات', name: 'اسم المطعم', address: 'العنوان', phone: 'الهاتف', cuisine: 'أنواع المطبخ', desc: 'الوصف', gps: 'GPS', cover: 'صورة واجهة المطعم', change: 'تغيير', auto: 'القبول التلقائي', min: 'الحد الأدنى', delivery: 'رسوم التوصيل', free: 'توصيل مجاني', hours: 'ساعات العمل', lang: 'اللغة', logout: 'تسجيل خروج', save: 'حفظ', confirm: 'تأكيد الموقع', pound: 'جنيه', edit: 'تعديل' },
  en: { title: 'My Store - LIVE', orders: 'Orders', rating: 'Rating', years: 'Years', name: 'Store Name', address: 'Address', phone: 'Phone', cuisine: 'Cuisine', desc: 'Description', gps: 'GPS', cover: 'Cover Photo', change: 'Change', auto: 'Auto Accept', min: 'Min Order', delivery: 'Delivery Fee', free: 'Free Delivery', hours: 'Work Hours', lang: 'Language', logout: 'Logout', save: 'Save', confirm: 'Confirm', pound: 'EGP', edit: 'Edit' },
  fr: { title: 'Mon Magasin - LIVE', orders: 'Commandes', rating: 'Note', years: 'Ans', name: 'Nom', address: 'Adresse', phone: 'Téléphone', cuisine: 'Types', desc: 'Description', gps: 'GPS', cover: 'Photo', change: 'Changer', auto: 'Accept auto', min: 'Min', delivery: 'Frais', free: 'Livraison gratuite', hours: 'Heures', lang: 'Langue', logout: 'Déconnexion', save: 'Enregistrer', confirm: 'Confirmer', pound: 'EGP', edit: 'Modifier' }
};

export default function Profile() {
  const C = CUSTOMER_COLORS;
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState('ar');
  const t = (k: string) => translations[lang]?.[k] || k;
  const [ordersCount, setOrdersCount] = useState(0);
  const [store, setStore] = useState<any>(null);
  const [mapVisible, setMapVisible] = useState(false);
  const [marker, setMarker] = useState({ latitude: 30.0590, longitude: 31.3605 });
  const [modal, setModal] = useState(false);
  const [field, setField] = useState('');
  const [temp, setTemp] = useState('');
  const [label, setLabel] = useState('');

  useEffect(() => { init(); }, []);
  const init = async () => {
    const savedLang = await AsyncStorage.getItem('app_lang');
    if (savedLang) setLang(savedLang);
    const { data } = await supabase.from('stores').select('*').eq('id', STORE_ID).single();
    if (data) {
      setStore(data);
      if (data.language) setLang(data.language);
      setMarker({ latitude: data.latitude || 30.0590, longitude: data.longitude || 31.3605 });
    } else {
      setStore({ name: 'La Parisienne', address: '21 شارع الحد اسماعيل وهبي، مدينة نصر', phone: '01515054121', cuisine: 'صحي، حلويات', description: 'Pâtisserie française artisanale', min_order: 200, delivery_fee: 28, work_hours: '09:00 - 23:00', auto_accept: false, free_delivery: false, latitude: 30.0590, longitude: 31.3605, rating: 4.6, years_in_business: 3, language: 'ar' });
    }
    const { count } = await supabase.from('orders').select('*', { count: 'exact', head: true });
    if (count!= null) setOrdersCount(count);
    setLoading(false);
  };
  const update = async (k: string, v: any) => {
    const { error } = await supabase.from('stores').update({ [k]: v }).eq('id', STORE_ID);
    if (error) console.error('update error:', error.message);
    setStore((p: any) => ({...p, [k]: v }));
  };
  const changeLanguage = async (newLang: string) => {
    setLang(newLang);
    await AsyncStorage.setItem('app_lang', newLang);
    await update('language', newLang);
  };
  const pick = async (k: 'logo_url' | 'cover_url') => {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
    if (!r.canceled) {
      const res = await fetch(r.assets[0].uri);
      const blob = await res.blob();
      const name = `${STORE_ID}/${k}-${Date.now()}.jpg`;
      await supabase.storage.from('store-images').upload(name, blob, { upsert: true, contentType: 'image/jpeg' });
      const { data } = supabase.storage.from('store-images').getPublicUrl(name);
      await update(k, data.publicUrl);
    }
  };
  const openEdit = (k: string, v: any, lbl: string) => { setField(k); setTemp(String(v?? '')); setLabel(lbl); setModal(true); };
  const save = async () => {
    let val: any = temp;
    if (field === 'rating') val = parseFloat(temp) || 4.6;
    if (['years_in_business', 'min_order', 'delivery_fee'].includes(field)) val = parseInt(temp) || 0;
    await update(field, val); setModal(false);
  };
  const handleLogout = () => {
    Alert.alert(t('logout'), 'هل أنت متأكد؟', [
      { text: 'إلغاء', style: 'cancel' },
      { text: t('logout'), style: 'destructive', onPress: async () => { try { await supabase.auth.signOut(); await AsyncStorage.clear(); } catch (e) {} try { router.replace('/'); } catch (e) { router.dismissAll(); } } }
    ]);
  };
  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.background }}><ActivityIndicator color={C.textPrimary}/></View>;

  return (
    <View style={{ flex: 1, backgroundColor: C.background }}>
      <View style={{ backgroundColor: C.textPrimary, paddingTop: 50, paddingBottom: 14, alignItems: 'center', borderBottomLeftRadius:20, borderBottomRightRadius:20 }}>
        <Text style={{ fontWeight: '900', fontSize: 14, color: C.accent, letterSpacing:2 }}>LA PARISIENNE</Text>
        <Text style={{ fontWeight: '800', fontSize: 16, color: C.card, marginTop:4 }}>{t('title')}</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 180 }}>
        <View style={{ backgroundColor: C.card, alignItems: 'center', padding: 20, borderBottomWidth:1, borderColor: C.border }}>
          <TouchableOpacity onPress={() => pick('logo_url')} style={{ width: 90, height: 90, borderRadius: 45, backgroundColor: '#fff', borderWidth: 2, borderColor: C.accent, justifyContent: 'center', alignItems: 'center' }}>
            {store?.logo_url? <Image source={{ uri: store.logo_url }} style={{ width: 86, height: 86, borderRadius: 43 }} /> : <Text style={{ fontSize: 40 }}>🥐</Text>}
          </TouchableOpacity>
          <Text style={{ marginTop: 12, fontSize: 20, fontWeight: '900', color: C.textPrimary }}>{store?.name}</Text>
          <Text style={{ color: C.textSecondary, fontSize: 13, fontWeight:'700' }}>{store?.cuisine}</Text>
          <View style={{ flexDirection: 'row', width: '100%', marginTop: 18, justifyContent: 'space-around' }}>
            <View style={{ alignItems: 'center', flex: 1 }}><Text style={{ fontWeight: '900', fontSize: 16, color: C.textPrimary }}>{ordersCount}</Text><Text style={{ color: C.textMuted, fontSize: 11 }}>{t('orders')}</Text></View>
            <View style={{ width: 1, backgroundColor: C.border }} />
            <TouchableOpacity onPress={() => openEdit('rating', store?.rating, t('rating'))} style={{ alignItems: 'center', flex: 1 }}><Text style={{ fontWeight: '900', fontSize: 16, color: C.textPrimary }}>{store?.rating} ⭐</Text><Text style={{ color: C.textSecondary, fontSize: 11 }}>{t('rating')} ✏️</Text></TouchableOpacity>
            <View style={{ width: 1, backgroundColor: C.border }} />
            <TouchableOpacity onPress={() => openEdit('years_in_business', store?.years_in_business, t('years'))} style={{ alignItems: 'center', flex: 1 }}><Text style={{ fontWeight: '900', fontSize: 16, color: C.textPrimary }}>{store?.years_in_business}</Text><Text style={{ color: C.textSecondary, fontSize: 11 }}>{t('years')} ✏️</Text></TouchableOpacity>
          </View>
        </View>

        <View style={{ backgroundColor: C.card, marginTop: 8, borderTopWidth:1, borderBottomWidth:1, borderColor: C.border }}>
          <Item label={t('name')} value={store?.name} onPress={() => openEdit('name', store?.name, t('name'))} />
          <Item label={t('address')} value={store?.address} onPress={() => openEdit('address', store?.address, t('address'))} />
          <Item label={t('phone')} value={store?.phone} onPress={() => openEdit('phone', store?.phone, t('phone'))} />
          <Item label={t('cuisine')} value={store?.cuisine} onPress={() => openEdit('cuisine', store?.cuisine, t('cuisine'))} />
          <Item label={t('desc')} value={store?.description} onPress={() => openEdit('description', store?.description, t('desc'))} />
        </View>

        <View style={{ padding: 12 }}>
          <TouchableOpacity onPress={() => setMapVisible(true)} style={{ backgroundColor: C.textPrimary, borderRadius: 14, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Ionicons name="chevron-back" size={18} color={C.accent} />
            <Text style={{ color: C.card, fontWeight: '800', fontSize: 12 }}>{t('gps')}: {store?.latitude?.toFixed(4)}, {store?.longitude?.toFixed(4)}</Text>
            <View style={{ backgroundColor: C.accent, borderRadius: 8, padding: 7 }}><Ionicons name="map" size={18} color={C.textPrimary} /></View>
          </TouchableOpacity>
        </View>

        <View style={{ backgroundColor: C.card, padding: 14, borderTopWidth:1, borderBottomWidth:1, borderColor: C.border }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}><Text style={{ fontWeight: '800', color: C.textPrimary }}>{t('cover')}</Text><TouchableOpacity onPress={() => pick('cover_url')} style={{ backgroundColor: C.textPrimary, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 }}><Text style={{ color: C.card, fontSize: 11, fontWeight:'800' }}>{t('change')}</Text></TouchableOpacity></View>
          <Image source={{ uri: store?.cover_url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4' }} style={{ width: '100%', height: 180, borderRadius: 14, marginTop: 12, borderWidth:1, borderColor: C.border }} />
        </View>

        <View style={{ backgroundColor: C.card, marginTop: 12, borderTopWidth:1, borderBottomWidth:1, borderColor: C.border }}>
          <View style={{ padding: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderColor: C.searchBg }}>
            <Switch value={!!store?.auto_accept} onValueChange={(v) => update('auto_accept', v)} trackColor={{ true: C.accent, false: '#ddd' }} thumbColor={C.textPrimary} />
            <Text style={{ fontWeight: '700', color: C.textPrimary }}>{t('auto')}</Text>
          </View>
          <Item label={t('min')} value={`${store?.min_order} ${t('pound')}`} onPress={() => openEdit('min_order', store?.min_order, t('min'))} />
          <Item label={t('delivery')} value={`${store?.delivery_fee} ${t('pound')}`} onPress={() => openEdit('delivery_fee', store?.delivery_fee, t('delivery'))} />
          <View style={{ padding: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderColor: C.searchBg }}>
            <Switch value={!!store?.free_delivery} onValueChange={(v) => update('free_delivery', v)} trackColor={{ true: C.accent, false: '#ddd' }} thumbColor={C.textPrimary}/>
            <Text style={{ fontWeight: '700', color: C.textPrimary }}>{t('free')}</Text>
          </View>
          <Item label={t('hours')} value={store?.work_hours} onPress={() => openEdit('work_hours', store?.work_hours, t('hours'))} />
        </View>

        <View style={{ backgroundColor: C.card, marginTop: 12, padding: 14, borderTopWidth:1, borderBottomWidth:1, borderColor: C.border }}>
          <Text style={{ fontWeight: '800', textAlign: 'right', marginBottom: 10, color: C.textPrimary }}>{t('lang')}</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {[{ id: 'ar', label: 'العربية 🇪🇬' }, { id: 'en', label: 'English 🇬🇧' }, { id: 'fr', label: 'Français 🇫🇷' }].map(l => (
              <TouchableOpacity key={l.id} onPress={() => changeLanguage(l.id)} style={{ flex: 1, padding: 12, borderRadius: 10, borderWidth: 1.5, borderColor: lang === l.id? C.textPrimary : C.border, backgroundColor: lang === l.id? C.textPrimary : C.card, alignItems: 'center' }}>
                <Text style={{ color: lang === l.id? C.card : C.textPrimary, fontWeight: '900', fontSize: 12 }}>{l.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ padding: 20 }}>
          <TouchableOpacity onPress={handleLogout} style={{ backgroundColor: C.textPrimary, padding: 16, borderRadius: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
            <Ionicons name="log-out-outline" size={20} color={C.accent} />
            <Text style={{ color: C.accent, fontWeight: '900', fontSize: 15 }}>{t('logout')}</Text>
          </TouchableOpacity>
          <Text style={{ textAlign: 'center', color: C.textMuted, fontSize: 11, marginTop: 12 }}>LA PARISIENNE • {C.background} Edition</Text>
        </View>
      </ScrollView>

      <Modal visible={modal} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios'? 'padding' : 'height'} style={{ flex: 1 }}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
            <View style={{ backgroundColor: C.card, padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 40, borderTopWidth:2, borderColor: C.accent }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 }}>
                <TouchableOpacity onPress={() => setModal(false)}><Text style={{ color: C.textMuted }}>إلغاء</Text></TouchableOpacity>
                <Text style={{ fontWeight: '900', color: C.textPrimary }}>{label}</Text>
              </View>
              <TextInput value={temp} onChangeText={setTemp} keyboardType={['rating', 'years_in_business', 'min_order', 'delivery_fee'].includes(field)? 'numeric' : 'default'} style={{ borderWidth: 1.5, borderColor: C.border, borderRadius: 10, padding: 14, textAlign: lang === 'ar'? 'right' : 'left', fontSize: 16, color: C.textPrimary }} autoFocus placeholder={label} />
              <TouchableOpacity onPress={save} style={{ backgroundColor: C.textPrimary, padding: 16, borderRadius: 10, alignItems: 'center', marginTop: 12 }}>
                <Text style={{ color: C.card, fontWeight: '900', fontSize: 16 }}>{t('save')} ✨</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={mapVisible} animationType="slide">
        <View style={{ flex: 1 }}>
          <MapView style={{ flex: 1 }} initialRegion={{...marker, latitudeDelta: 0.01, longitudeDelta: 0.01 }} onPress={e => setMarker(e.nativeEvent.coordinate)}>
            <Marker draggable coordinate={marker} onDragEnd={e => setMarker(e.nativeEvent.coordinate)} />
          </MapView>
          <TouchableOpacity onPress={async () => { await update('latitude', marker.latitude); await update('longitude', marker.longitude); setMapVisible(false); }} style={{ backgroundColor: C.textPrimary, padding: 18, alignItems: 'center' }}>
            <Text style={{ color: C.card, fontWeight: '900' }}>{t('confirm')} ✨</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

function Item({ label, value, onPress }: any) {
  const C = CUSTOMER_COLORS;
  return (
    <TouchableOpacity onPress={onPress} style={{ padding: 14, borderBottomWidth: 1, borderColor: C.searchBg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: C.searchBg, borderWidth:1, borderColor: C.border, justifyContent: 'center', alignItems: 'center' }}>
        <Ionicons name="pencil" size={12} color={C.textPrimary} />
      </View>
      <View style={{ flex: 1, alignItems: 'flex-end', marginRight: 10 }}>
        <Text style={{ fontSize: 11, color: C.textMuted }}>{label}</Text>
        <Text style={{ fontWeight: '700', textAlign: 'right', marginTop: 2, color: C.textPrimary }} numberOfLines={2}>{value}</Text>
      </View>
    </TouchableOpacity>
  );
}