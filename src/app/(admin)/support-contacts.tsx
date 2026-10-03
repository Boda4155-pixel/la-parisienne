import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../../lib/supabase';

type Contact = { id:string, type:'phone'|'whatsapp', label:string, number:string, is_active:boolean }

export default function SupportContacts(){
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const isRTL = i18n.language === 'ar';
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);
  const [editing, setEditing] = useState<Contact|null>(null);
  const [type, setType] = useState<'phone'|'whatsapp'>('phone');
  const [label, setLabel] = useState('');
  const [number, setNumber] = useState('');

  const load = async () => {
    setLoading(true);
    const {data} = await supabase.from('support_contacts').select('*').order('created_at',{ascending:false});
    setContacts((data as any) || []); setLoading(false);
  };
  useEffect(()=>{ load() },[]);

  const openNew = (t2:'phone'|'whatsapp') => { setEditing(null); setType(t2); setLabel(''); setNumber(''); setShow(true); };
  const openEdit = (c:Contact) => { setEditing(c); setType(c.type); setLabel(c.label); setNumber(c.number); setShow(true); };

  const save = async () => {
    if(!number.trim()){ Alert.alert('Error / خطأ', 'Number required'); return; }
    const payload = { type, label: label || (type==='phone' ? 'Support' : 'WhatsApp'), number, is_active:true };
    const res = editing ? await supabase.from('support_contacts').update(payload).eq('id', editing.id) : await supabase.from('support_contacts').insert(payload);
    if(res.error){ Alert.alert('Error', res.error.message); return; }
    setShow(false); load();
  };

  const del = (c:Contact) => {
    Alert.alert(
      t('admin:settings.supportContacts.deleteTitle', 'حذف الرقم'),
      t('admin:settings.supportContacts.deleteConfirm', 'متأكد عايز تمسح الرقم ده؟'),
      [
        {text: t('common:cancel','إلغاء')},
        {text: t('common:delete','حذف'), style:'destructive', onPress: async()=>{ await supabase.from('support_contacts').delete().eq('id', c.id); load(); }}
      ]
    );
  };

  return (
    <View style={s.bg}>
      <View style={[s.header, {paddingTop: insets.top + 10}]}>
        <TouchableOpacity onPress={()=>router.back()} style={s.back}><Ionicons name="chevron-forward" size={20} color="#fff"/></TouchableOpacity>
        <Text style={s.h1}>{t('admin:settings.supportContacts.title','أرقام الدعم')} • {contacts.length}</Text>
        <View style={{width:36}}/>
      </View>

      {loading ? <ActivityIndicator color="#E8C87A" style={{marginTop:40}}/> : (
        <FlatList data={contacts} keyExtractor={i=>i.id} contentContainerStyle={{padding:12, paddingBottom:100}}
          ListEmptyComponent={<View style={s.empty}><Ionicons name="call-outline" size={48} color="#333"/><Text style={s.emptyTxt}>{t('admin:settings.supportContacts.empty','مفيش أرقام لسه')}</Text></View>}
          renderItem={({item})=>(
            <View style={s.card}>
              <View style={[s.iconBox, {backgroundColor: item.type==='whatsapp' ? '#25D36620' : '#E8C87A20'}]}>
                <Ionicons name={item.type==='whatsapp'?'logo-whatsapp':'call'} size={22} color={item.type==='whatsapp'?'#25D366':'#E8C87A'}/>
              </View>
              <View style={{flex:1}}>
                <Text style={[s.label, {textAlign: isRTL ? 'right' : 'left'}]}>{item.label}</Text>
                <Text style={[s.num, {textAlign: 'left'}]}>{item.number}</Text>
              </View>
              <TouchableOpacity onPress={()=>openEdit(item)} style={s.act}><Ionicons name="create-outline" size={18} color="#fff"/></TouchableOpacity>
              <TouchableOpacity onPress={()=>del(item)} style={[s.act,{backgroundColor:'#ff444422'}]}><Ionicons name="trash-outline" size={18} color="#ff5555"/></TouchableOpacity>
            </View>
          )}
        />
      )}

      <View style={[s.fabWrap, {bottom: insets.bottom + 16}]}>
        <TouchableOpacity onPress={()=>openNew('whatsapp')} style={[s.fab, {backgroundColor:'#1A1A1A', borderWidth:1, borderColor:'#25D366'}]}><Ionicons name="logo-whatsapp" size={20} color="#25D366"/><Text style={[s.fabTxt,{color:'#25D366'}]}>WhatsApp</Text></TouchableOpacity>
        <TouchableOpacity onPress={()=>openNew('phone')} style={s.fab}><Ionicons name="add" size={20} color="#000"/><Text style={s.fabTxt}>{t('admin:settings.supportContacts.add','رقم جديد')}</Text></TouchableOpacity>
      </View>

      <Modal visible={show} transparent animationType="slide">
        <View style={s.modalBg}><View style={[s.modal, {paddingBottom: insets.bottom + 16}]}>
          <View style={s.mHeader}>
            <TouchableOpacity onPress={()=>setShow(false)}><Ionicons name="close" size={24} color="#fff"/></TouchableOpacity>
            <Text style={s.mTitle}>{editing ? t('admin:settings.supportContacts.edit','تعديل') : t('admin:settings.supportContacts.add','إضافة رقم')}</Text>
            <View style={{width:24}}/>
          </View>
          <Text style={[s.l, {textAlign: isRTL ? 'right':'left'}]}>{t('admin:settings.supportContacts.label','اسم الرقم')}</Text>
          <TextInput value={label} onChangeText={setLabel} placeholder="Support" placeholderTextColor="#555" style={[s.input, {textAlign: isRTL ? 'right':'left'}]}/>
          <Text style={[s.l, {textAlign: isRTL ? 'right':'left'}]}>{t('admin:settings.supportContacts.phone','رقم التليفون')}</Text>
          <TextInput value={number} onChangeText={setNumber} placeholder="01000000000" placeholderTextColor="#555" style={s.input} keyboardType="phone-pad"/>
          <TouchableOpacity onPress={save} style={s.save}><Text style={s.saveTxt}>{t('common:save','حفظ')}</Text></TouchableOpacity>
        </View></View>
      </Modal>
    </View>
  );
}
const s = StyleSheet.create({
  bg:{flex:1, backgroundColor:'#0F0F0F'},
  header:{flexDirection:'row', justifyContent:'space-between', alignItems:'center', padding:12},
  h1:{color:'#fff', fontWeight:'bold', fontSize:16}, back:{width:36, height:36, borderRadius:18, backgroundColor:'#1A1A1A', justifyContent:'center', alignItems:'center', borderWidth:1, borderColor:'#222'},
  empty:{alignItems:'center', marginTop:80, gap:12}, emptyTxt:{color:'#555', textAlign:'center', lineHeight:20},
  card:{flexDirection:'row', backgroundColor:'#1A1A1A', borderRadius:16, padding:12, marginBottom:10, borderWidth:1, borderColor:'#222', alignItems:'center', gap:10},
  iconBox:{width:44, height:44, borderRadius:22, justifyContent:'center', alignItems:'center'},
  label:{color:'#888', fontSize:11}, num:{color:'#fff', fontSize:15, fontWeight:'bold', marginTop:2},
  act:{width:32, height:32, borderRadius:16, backgroundColor:'#222', justifyContent:'center', alignItems:'center'},
  fabWrap:{position:'absolute', left:12, right:12, flexDirection:'row', gap:10},
  fab:{flex:1, backgroundColor:'#E8C87A', height:52, borderRadius:16, flexDirection:'row', justifyContent:'center', alignItems:'center', gap:6}, fabTxt:{color:'#000', fontWeight:'bold'},
  modalBg:{flex:1, backgroundColor:'rgba(0,0,0,0.7)', justifyContent:'flex-end'}, modal:{backgroundColor:'#161616', borderTopLeftRadius:24, borderTopRightRadius:24, padding:16, borderWidth:1, borderColor:'#222'},
  mHeader:{flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:16}, mTitle:{color:'#fff', fontWeight:'bold', fontSize:16},
  l:{color:'#888', fontSize:11, marginBottom:6, marginTop:10}, input:{backgroundColor:'#0F0F0F', borderWidth:1, borderColor:'#222', borderRadius:12, color:'#fff', paddingHorizontal:14, height:48},
  save:{backgroundColor:'#E8C87A', height:52, borderRadius:14, justifyContent:'center', alignItems:'center', marginTop:20}, saveTxt:{color:'#000', fontWeight:'bold'}
});