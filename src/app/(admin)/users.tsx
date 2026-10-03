import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Modal, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../../lib/supabase';

const ROLES = ['admin','manager','cashier','delivery','staff'];

export default function StaffManagement(){
  const { t } = useTranslation();
  const [staff, setStaff] = useState<any[]>([]);
  const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [role, setRole] = useState('staff'); const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);

  const load = async () => {
    const { data } = await supabase.from('staff_members').select('*').order('created_at',{ascending:false});
    setStaff(data||[]);
  };
  useEffect(()=>{load()},[]);

  const addStaff = async () => {
    if(!name.trim() ||!email.trim() ||!password.trim()) return Alert.alert(t('admin.staff.fillRequired'));
    const { data: authData, error: authError } = await supabase.auth.signUp({ email: email.trim().toLowerCase(), password, options:{data:{full_name:name, role}} });
    if(authError) return Alert.alert(authError.message);
    if(!authData?.user) return Alert.alert(t('admin.staff.createFailed'));
    const { error } = await supabase.from('staff_members').insert({ id: authData.user.id, name: name.trim(), email: email.trim().toLowerCase(), role, is_active:true });
    if(error) return Alert.alert(error.message);
    Alert.alert(t('admin.staff.added')); setName(''); setEmail(''); setPassword(''); setShowAdd(false); load();
  };

  const updateStaff = async () => {
    if(!editItem) return;
    const { error } = await supabase.from('staff_members').update({ name: editItem.name, email: editItem.email.toLowerCase(), role: editItem.role }).eq('id', editItem.id);
    if(error) Alert.alert(error.message); else { setEditItem(null); load(); Alert.alert(t('admin.staff.updated')); }
  };

  const toggleActive = async (item:any) => {
    await supabase.from('staff_members').update({is_active:!item.is_active}).eq('id', item.id); load();
  };

  const deleteFully = async (item:any) => {
    Alert.alert(t('admin.staff.deleteTitle'), t('admin.staff.deleteDesc', { name: item.name }), [
      {text:t('common:no'), style:'cancel'},
      {text:t('common:yes'), style:'destructive', onPress: async ()=>{
        const { error } = await supabase.rpc('delete_staff_user', { target_id: item.id });
        if(error){
          await supabase.from('staff_members').delete().eq('id', item.id);
        }
        Alert.alert(t('admin.staff.deleted'));
        load();
      }}
    ]);
  };

  return (
    <View style={s.bg}>
      <View style={s.header}>
        <TouchableOpacity onPress={()=>router.back()} style={s.back}><Ionicons name="chevron-forward" size={20} color="#fff"/></TouchableOpacity>
        <Text style={s.h1}>{t('admin.staff.title')}</Text>
        <TouchableOpacity onPress={()=>setShowAdd(!showAdd)} style={s.addBtn}><Ionicons name={showAdd?'close':'add'} size={20} color="#000"/></TouchableOpacity>
      </View>

      {showAdd && (
        <View style={s.addCard}>
          <Text style={s.label}>{t('admin.staff.staffName')}</Text><TextInput value={name} onChangeText={setName} style={s.input} placeholder="Ahmed" placeholderTextColor="#555"/>
          <Text style={s.label}>{t('admin.staff.email')}</Text><TextInput value={email} onChangeText={setEmail} style={s.input} placeholder="ahmed@email.com" autoCapitalize="none" placeholderTextColor="#555"/>
          <Text style={s.label}>{t('admin.staff.password')}</Text><TextInput value={password} onChangeText={setPassword} style={s.input} placeholder="••••••••" secureTextEntry placeholderTextColor="#555"/>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:8, marginTop:6}}>
            {ROLES.map(r=> (<TouchableOpacity key={r} onPress={()=>setRole(r)} style={[s.roleChip, role===r && s.roleActive]}><Text style={s.roleTxt}>{t(`admin.staff.roles.${r}`)}</Text></TouchableOpacity>))}
          </ScrollView>
          <TouchableOpacity style={s.saveBig} onPress={addStaff}><Text style={{fontWeight:'bold'}}>{t('admin.staff.add')}</Text></TouchableOpacity>
        </View>
      )}

      <ScrollView contentContainerStyle={{padding:16, gap:10, paddingBottom:100}}>
        {staff.length===0 && <Text style={{color:'#666', textAlign:'center', marginTop:30}}>{t('admin.staff.noStaff')}</Text>}
        {staff.map(item=>(
          <View key={item.id} style={[s.card,!item.is_active && {opacity:0.5}]}>
            <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center'}}>
              <View style={{flexDirection:'row', gap:12}}>
                <TouchableOpacity onPress={()=>deleteFully(item)}><Ionicons name="trash" size={18} color="#ff5555"/></TouchableOpacity>
                <TouchableOpacity onPress={()=>setEditItem(item)}><Ionicons name="create" size={18} color="#E8C87A"/></TouchableOpacity>
              </View>
              <View style={{alignItems:'flex-end', flex:1, marginHorizontal:12}}><Text style={s.name}>{item.name}</Text><Text style={s.email}>{item.email} • {t(`admin.staff.roles.${item.role}`)}</Text></View>
              <View style={s.avatar}><Text style={{fontWeight:'bold'}}>{item.name?.[0]?.toUpperCase() || '?'}</Text></View>
            </View>
            <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginTop:12, borderTopWidth:1, borderTopColor:'#222', paddingTop:10}}>
              <Switch value={!!item.is_active} onValueChange={()=>toggleActive(item)} trackColor={{true:'#E8C87A', false:'#333'}}/>
              <Text style={{color: item.is_active? '#4ade80' : '#888', fontSize:12}}>{item.is_active? t('admin.staff.active') : t('admin.staff.inactive')}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {editItem && (
        <Modal visible={true} transparent animationType="slide">
          <View style={{flex:1, backgroundColor:'rgba(0,0,0,0.8)', justifyContent:'center', padding:20}}>
            <View style={s.addCard}>
              <Text style={s.h1}>{t('admin.staff.editStaff')}</Text>
              <Text style={s.label}>{t('admin.staff.name')}</Text>
              <TextInput value={editItem.name || ''} onChangeText={(tt)=>setEditItem((p:any)=>({...p, name:tt}))} style={s.input}/>
              <Text style={s.label}>{t('admin.staff.email')}</Text>
              <TextInput value={editItem.email || ''} onChangeText={(tt)=>setEditItem((p:any)=>({...p, email:tt}))} style={s.input} autoCapitalize="none"/>
              <Text style={s.label}>{t('admin.staff.role')}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:8, marginTop:6}}>
                {ROLES.map(r=> (<TouchableOpacity key={r} onPress={()=>setEditItem((p:any)=>({...p, role:r}))} style={[s.roleChip, editItem.role===r && s.roleActive]}><Text style={s.roleTxt}>{t(`admin.staff.roles.${r}`)}</Text></TouchableOpacity>))}
              </ScrollView>
              <View style={{flexDirection:'row', gap:10, marginTop:16}}>
                <TouchableOpacity style={[s.saveBig,{flex:1, backgroundColor:'#222'}]} onPress={()=>setEditItem(null)}><Text style={{color:'#fff'}}>{t('common:cancel')}</Text></TouchableOpacity>
                <TouchableOpacity style={[s.saveBig,{flex:1}]} onPress={updateStaff}><Text style={{fontWeight:'bold'}}>{t('common:save')}</Text></TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}
const s = StyleSheet.create({
  bg:{flex:1, backgroundColor:'#0F0F0F'}, header:{flexDirection:'row', justifyContent:'space-between', alignItems:'center', padding:16, paddingTop:50},
  h1:{color:'#fff', fontWeight:'bold', fontSize:18}, back:{width:36, height:36, borderRadius:18, backgroundColor:'#1A1A1A', justifyContent:'center', alignItems:'center', borderWidth:1, borderColor:'#222'},
  addBtn:{width:36, height:36, borderRadius:18, backgroundColor:'#E8C87A', justifyContent:'center', alignItems:'center'},
  addCard:{backgroundColor:'#161616', margin:16, borderRadius:16, padding:16, borderWidth:1, borderColor:'#222', gap:8},
  label:{color:'#888', fontSize:11, textAlign:'right', marginTop:4}, input:{backgroundColor:'#0F0F0F', borderWidth:1, borderColor:'#222', borderRadius:10, color:'#fff', height:44, paddingHorizontal:12, textAlign:'right'},
  roleChip:{paddingHorizontal:14, height:32, borderRadius:16, backgroundColor:'#1E1E1E', justifyContent:'center', borderWidth:1, borderColor:'#222'}, roleActive:{backgroundColor:'#E8C87A', borderColor:'#E8C87A'}, roleTxt:{color:'#888', fontSize:12},
  saveBig:{backgroundColor:'#E8C87A', height:46, borderRadius:12, justifyContent:'center', alignItems:'center', marginTop:12},
  card:{backgroundColor:'#161616', borderRadius:16, padding:14, borderWidth:1, borderColor:'#222'},
  avatar:{width:36, height:36, borderRadius:18, backgroundColor:'#E8C87A', justifyContent:'center', alignItems:'center'}, name:{color:'#fff', fontWeight:'bold', fontSize:13}, email:{color:'#888', fontSize:10, marginTop:2}
});