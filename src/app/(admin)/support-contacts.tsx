import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../../lib/supabase';
import { ADMIN_COLORS } from "../../../lib/adminTheme";

type Contact = { id:string, type:'phone'|'whatsapp'|'both', label:string, number:string }

export default function SupportContacts(){
  const insets = useSafeAreaInsets();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);
  const [editing, setEditing] = useState<Contact|null>(null);
  const [number, setNumber] = useState('');
  const [label, setLabel] = useState('رقم الدعم');
  const [type, setType] = useState<'phone'|'whatsapp'|'both'>('both');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('support_contacts').select('*').order('created_at',{ascending:false});
    setContacts((data as any) || []);
    setLoading(false);
  };
  useEffect(()=>{ load() },[]);

  const openNew = () => { setEditing(null); setNumber(''); setLabel('رقم الدعم'); setType('both'); setShow(true); };
  const openEdit = (c:Contact) => { setEditing(c); setNumber(c.number); setLabel(c.label); setType(c.type || 'both'); setShow(true); };

  const save = async () => {
    if(number.trim().length < 10){ Alert.alert('اكتب رقم صحيح'); return; }
    setSaving(true);
    const payload = { number: number.trim(), label, type };
    if(editing){
      await supabase.from('support_contacts').update(payload).eq('id', editing.id);
    } else {
      await supabase.from('support_contacts').insert(payload);
    }
    setSaving(false); setShow(false); load();
  };

  const del = (c:Contact) => {
    Alert.alert('حذف الرقم؟', `هتحذف ${c.number} ؟`, [
      {text:'إلغاء', style:'cancel'},
      {text:'حذف', style:'destructive', onPress: async()=>{ await supabase.from('support_contacts').delete().eq('id', c.id); load(); }}
    ]);
  };

  const renderIcon = (t: string) => {
    if(t === 'phone') return <Ionicons name="call" size={22} color={ADMIN_COLORS.textPrimary} />;
    if(t === 'whatsapp') return <Ionicons name="logo-whatsapp" size={22} color={ADMIN_COLORS.textPrimary} />;
    return (
      <View style={{flexDirection:'row', gap:2}}>
        <Ionicons name="call" size={16} color={ADMIN_COLORS.textPrimary} />
        <Ionicons name="logo-whatsapp" size={16} color={ADMIN_COLORS.textPrimary} />
      </View>
    );
  };

  return (
    <View style={s.bg}>
      <View style={[s.header, {paddingTop: insets.top + 10}]}>
        <TouchableOpacity onPress={()=>router.back()} style={s.back}><Ionicons name="chevron-forward" size={20} color={ADMIN_COLORS.textPrimary}/></TouchableOpacity>
        <Text style={s.h1}>أرقام الدعم • {contacts.length}</Text>
        <TouchableOpacity onPress={openNew} style={s.addBtn}><Ionicons name="add" size={22} color={ADMIN_COLORS.primaryText}/></TouchableOpacity>
      </View>

      {loading ? <ActivityIndicator color={ADMIN_COLORS.textPrimary} style={{marginTop:40}}/> : (
        <FlatList data={contacts} keyExtractor={i=>i.id} contentContainerStyle={{padding:12, paddingBottom:100}}
          ListEmptyComponent={<View style={s.empty}><View style={s.emptyIcon}><Ionicons name="call-outline" size={36} color={ADMIN_COLORS.textPrimary}/></View><Text style={s.emptyTxt}>مفيش أرقام لسه</Text></View>}
          renderItem={({item})=>(
            <View style={s.card}>
              <View style={s.iconBox}>{renderIcon(item.type)}</View>
              <View style={{flex:1, alignItems:'flex-end', marginHorizontal:10}}>
                <View style={{flexDirection:'row', gap:6, alignItems:'center'}}>
                  <View style={s.badge}><Text style={s.badgeTxt}>{item.type === 'both' ? 'واتساب و اتصال' : item.type === 'whatsapp' ? 'واتساب' : 'اتصال'}</Text></View>
                  <Text style={s.label}>{item.label}</Text>
                </View>
                <Text style={s.num}>{item.number}</Text>
              </View>
              <TouchableOpacity onPress={()=>openEdit(item)} style={s.act}><Ionicons name="create-outline" size={18} color={ADMIN_COLORS.textPrimary}/></TouchableOpacity>
              <TouchableOpacity onPress={()=>del(item)} style={s.actDel}><Ionicons name="trash-outline" size={18} color={ADMIN_COLORS.danger}/></TouchableOpacity>
            </View>
          )}
        />
      )}

      <Modal visible={show} transparent animationType="slide">
        <View style={s.modalBg}><View style={[s.modal, {paddingBottom: insets.bottom + 16}]}>
          <View style={s.mHeader}>
            <TouchableOpacity onPress={()=>setShow(false)} style={s.closeBtn}><Ionicons name="close" size={20} color={ADMIN_COLORS.textPrimary}/></TouchableOpacity>
            <Text style={s.mTitle}>{editing ? 'تعديل الرقم' : 'إضافة رقم جديد'}</Text>
            <View style={{width:32}}/>
          </View>

          <Text style={s.l}>نوع الرقم</Text>
          <View style={s.typeRow}>
            <TouchableOpacity onPress={()=>setType('phone')} style={[s.typeChip, type==='phone' && s.typeActive]}>
              <Ionicons name="call" size={18} color={type==='phone'?ADMIN_COLORS.primaryText:ADMIN_COLORS.textPrimary}/><Text style={[s.typeTxt, type==='phone' && s.typeTxtActive]}>اتصال</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={()=>setType('whatsapp')} style={[s.typeChip, type==='whatsapp' && s.typeActive]}>
              <Ionicons name="logo-whatsapp" size={18} color={type==='whatsapp'?ADMIN_COLORS.primaryText:ADMIN_COLORS.textPrimary}/><Text style={[s.typeTxt, type==='whatsapp' && s.typeTxtActive]}>واتساب</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={()=>setType('both')} style={[s.typeChip, type==='both' && s.typeActive]}>
              <Ionicons name="chatbubbles" size={18} color={type==='both'?ADMIN_COLORS.primaryText:ADMIN_COLORS.textPrimary}/><Text style={[s.typeTxt, type==='both' && s.typeTxtActive]}>الاتنين</Text>
            </TouchableOpacity>
          </View>

          <Text style={s.l}>اسم الرقم</Text>
          <TextInput value={label} onChangeText={setLabel} placeholder="رقم الدعم" style={s.input} textAlign="right"/>
          
          <Text style={s.l}>الرقم</Text>
          <TextInput value={number} onChangeText={setNumber} placeholder="01xxxxxxxxx" style={s.input} keyboardType="phone-pad" textAlign="right"/>

          <TouchableOpacity onPress={save} style={s.save}>{saving ? <ActivityIndicator color={ADMIN_COLORS.primaryText}/> : <Text style={s.saveTxt}>حفظ ✅</Text>}</TouchableOpacity>
        </View></View>
      </Modal>
    </View>
  );
}
const s = StyleSheet.create({
  bg:{flex:1, backgroundColor:ADMIN_COLORS.background},
  header:{flexDirection:'row', justifyContent:'space-between', alignItems:'center', padding:12, borderBottomWidth:1, borderBottomColor:ADMIN_COLORS.border},
  h1:{color:ADMIN_COLORS.textPrimary, fontWeight:'800', fontSize:16}, back:{width:36, height:36, borderRadius:18, backgroundColor:ADMIN_COLORS.card, justifyContent:'center', alignItems:'center', borderWidth:1, borderColor:ADMIN_COLORS.border},
  addBtn:{width:36, height:36, borderRadius:18, backgroundColor:ADMIN_COLORS.primary, justifyContent:'center', alignItems:'center'},
  empty:{alignItems:'center', marginTop:80, gap:12}, emptyIcon:{width:64, height:64, borderRadius:32, backgroundColor:ADMIN_COLORS.cardSecondary, justifyContent:'center', alignItems:'center', borderWidth:1, borderColor:ADMIN_COLORS.borderLight}, emptyTxt:{color:ADMIN_COLORS.textPrimary, fontWeight:'800'},
  card:{flexDirection:'row', backgroundColor:ADMIN_COLORS.card, borderRadius:16, padding:12, marginBottom:10, borderWidth:1, borderColor:ADMIN_COLORS.border, alignItems:'center', gap:10},
  iconBox:{width:48, height:48, borderRadius:24, backgroundColor:ADMIN_COLORS.cardSecondary, justifyContent:'center', alignItems:'center', borderWidth:1, borderColor:ADMIN_COLORS.borderLight},
  label:{color:ADMIN_COLORS.textMuted, fontSize:11, fontWeight:'700'}, num:{color:ADMIN_COLORS.textPrimary, fontSize:15, fontWeight:'800', marginTop:4, textAlign:'right'},
  badge:{backgroundColor:ADMIN_COLORS.cardSecondary, paddingHorizontal:6, paddingVertical:2, borderRadius:6, borderWidth:1, borderColor:ADMIN_COLORS.borderLight}, badgeTxt:{color:ADMIN_COLORS.textPrimary, fontSize:9, fontWeight:'800'},
  act:{width:36, height:36, borderRadius:18, backgroundColor:ADMIN_COLORS.inputBg, justifyContent:'center', alignItems:'center', borderWidth:1, borderColor:ADMIN_COLORS.border},
  actDel:{width:36, height:36, borderRadius:18, backgroundColor:ADMIN_COLORS.dangerBg, justifyContent:'center', alignItems:'center', borderWidth:1, borderColor:ADMIN_COLORS.dangerBorder},
  modalBg:{flex:1, backgroundColor:'rgba(0,0,0,0.5)', justifyContent:'flex-end'}, modal:{backgroundColor:ADMIN_COLORS.card, borderTopLeftRadius:24, borderTopRightRadius:24, padding:16},
  mHeader:{flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:16}, mTitle:{color:ADMIN_COLORS.textPrimary, fontWeight:'800', fontSize:16},
  closeBtn:{width:32, height:32, borderRadius:16, backgroundColor:ADMIN_COLORS.inputBg, justifyContent:'center', alignItems:'center', borderWidth:1, borderColor:ADMIN_COLORS.border},
  l:{color:ADMIN_COLORS.textPrimary, fontSize:11, marginBottom:6, marginTop:12, fontWeight:'700', textAlign:'right'}, input:{backgroundColor:ADMIN_COLORS.inputBg, borderWidth:1, borderColor:ADMIN_COLORS.border, borderRadius:12, color:ADMIN_COLORS.textPrimary, paddingHorizontal:14, height:48, fontWeight:'600'},
  typeRow:{flexDirection:'row', gap:8},
  typeChip:{flex:1, height:48, borderRadius:12, borderWidth:1, borderColor:ADMIN_COLORS.borderLight, backgroundColor:ADMIN_COLORS.cardSecondary, flexDirection:'row', justifyContent:'center', alignItems:'center', gap:6},
  typeActive:{backgroundColor:ADMIN_COLORS.primary, borderColor:ADMIN_COLORS.primary},
  typeTxt:{color:ADMIN_COLORS.textPrimary, fontWeight:'800', fontSize:12}, typeTxtActive:{color:ADMIN_COLORS.primaryText},
  save:{backgroundColor:ADMIN_COLORS.primary, height:52, borderRadius:14, justifyContent:'center', alignItems:'center', marginTop:20}, saveTxt:{color:ADMIN_COLORS.primaryText, fontWeight:'800', fontSize:14}
});