import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Modal, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../../lib/supabase';
import { FunctionsHttpError, FunctionsFetchError } from '@supabase/supabase-js';
import { ADMIN_COLORS } from "../../../lib/adminTheme";

const ROLES = ['admin', 'cashier', 'driver'];

export default function StaffManagement(){
  const { t } = useTranslation();
  const [staff, setStaff] = useState<any[]>([]);
  const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [role, setRole] = useState('cashier'); const [showAdd, setShowAdd] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = async () => {
    const { data } = await supabase.from('staff_members').select('*').order('created_at',{ascending:false});
    setStaff(data||[]);
  };
  useEffect(()=>{load()},[]);

  const addStaff = async () => {
    if(!name.trim() ||!email.trim() ||!password.trim()) return Alert.alert(t('admin.staff.fillRequired'));
    const { data: authData, error: authError } = await supabase.auth.signUp({ email: email.trim().toLowerCase(), password, options:{data:{full_name:name}} });
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
      {text: t('common:no'), style: 'cancel'},
      {text: t('common:yes'), style: 'destructive', onPress: async () => {
        if (deletingId) return;
        setDeletingId(item.id);
        try {
          const { data, error } = await supabase.functions.invoke('delete-user', {
            body: JSON.stringify({ user_id: item.id }),
          });

          if (error) {
            // FunctionsHttpError — inspect HTTP status from error.context.status
            if (error instanceof FunctionsHttpError) {
              const httpStatus = error.context?.status ?? error.context?.response?.status;
              if (httpStatus === 403) {
                Alert.alert(t('common:error'), t('admin.staff.deleteAuthError') || 'You are not authorized to perform this action.');
              } else {
                Alert.alert(t('common:error'), error.message || t('common:somethingWentWrong'));
              }
              return;
            }
            // FunctionsFetchError — network-level failure
            if (error instanceof FunctionsFetchError) {
              Alert.alert(t('common:error'), t('common:somethingWentWrong'));
              return;
            }
            // Generic FunctionsError or other
            Alert.alert(t('common:error'), error.message || t('common:somethingWentWrong'));
            return;
          }

          // Success (2xx) — check for partial-failure warning
          const res = data as any;
          if (res?.success && res?.warning) {
            Alert.alert(
              t('admin.staff.deleted') || 'Deleted',
              res.warning + ' ' + (t('admin.staff.deleteWarningFollowUp') || 'The staff member was removed from authentication. Please clean up the staff record manually in the admin panel.'),
            );
          } else {
            Alert.alert(t('admin.staff.deleted') || 'Deleted');
          }
          load();
        } catch (e: any) {
          Alert.alert(t('common:error'), e.message || t('common:somethingWentWrong'));
        } finally {
          setDeletingId(null);
        }
      }}
    ]);
  };

  return (
    <View style={s.bg}>
      <View style={s.header}>
        <TouchableOpacity onPress={()=>router.back()} style={s.back}><Ionicons name="chevron-forward" size={20} color={ADMIN_COLORS.textPrimary}/></TouchableOpacity>
        <Text style={s.h1}>{t('admin.staff.title')}</Text>
        <TouchableOpacity onPress={()=>setShowAdd(!showAdd)} style={s.addBtn}><Ionicons name={showAdd?'close':'add'} size={20} color={ADMIN_COLORS.primaryText}/></TouchableOpacity>
      </View>

      {showAdd && (
        <View style={s.addCard}>
          <Text style={s.label}>{t('admin.staff.staffName')}</Text><TextInput value={name} onChangeText={setName} style={s.input} placeholder="Ahmed" placeholderTextColor={ADMIN_COLORS.textSecondary}/>
          <Text style={s.label}>{t('admin.staff.email')}</Text><TextInput value={email} onChangeText={setEmail} style={s.input} placeholder="ahmed@email.com" autoCapitalize="none" placeholderTextColor={ADMIN_COLORS.textSecondary}/>
          <Text style={s.label}>{t('admin.staff.password')}</Text><TextInput value={password} onChangeText={setPassword} style={s.input} placeholder="••••••••" secureTextEntry placeholderTextColor={ADMIN_COLORS.textSecondary}/>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:8, marginTop:8}}>
            {ROLES.map(r=> (<TouchableOpacity key={r} onPress={()=>setRole(r)} style={[s.roleChip, role===r && s.roleActive]}><Text style={[s.roleTxt, role===r && s.roleTxtActive]}>{t(`admin.staff.roles.${r}`)}</Text></TouchableOpacity>))}
          </ScrollView>
          <TouchableOpacity style={s.saveBig} onPress={addStaff}><Text style={s.saveBigTxt}>{t('admin.staff.add')}</Text></TouchableOpacity>
        </View>
      )}

      <ScrollView contentContainerStyle={{padding:16, gap:10, paddingBottom:100}} style={{backgroundColor:ADMIN_COLORS.backgroundSecondary}}>
        {staff.length===0 && <Text style={{color:ADMIN_COLORS.textMuted, textAlign:'center', marginTop:30, fontWeight:'600'}}>{t('admin.staff.noStaff')}</Text>}
        {staff.map(item=>(
          <View key={item.id} style={[s.card,!item.is_active && {opacity:0.6}]}>
            <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center'}}>
              <View style={{flexDirection:'row', gap:10}}>
                <TouchableOpacity
                  onPress={()=>deleteFully(item)}
                  style={[s.iconSmall, deletingId === item.id && { opacity: 0.5 }]}
                  disabled={deletingId === item.id}
                >
                  <Ionicons name="trash" size={16} color={ADMIN_COLORS.danger}/>
                </TouchableOpacity>
                <TouchableOpacity onPress={()=>setEditItem(item)} style={s.iconSmall}><Ionicons name="create" size={16} color={ADMIN_COLORS.textPrimary}/></TouchableOpacity>
              </View>
              <View style={{alignItems:'flex-end', flex:1, marginHorizontal:12}}><Text style={s.name}>{item.name}</Text><Text style={s.email}>{item.email} • {t(`admin.staff.roles.${item.role}`)}</Text></View>
              <View style={s.avatar}><Text style={{fontWeight:'800', color:ADMIN_COLORS.primaryText}}>{item.name?.[0]?.toUpperCase() || '?'}</Text></View>
            </View>
            <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginTop:12, borderTopWidth:1, borderTopColor:ADMIN_COLORS.border, paddingTop:10}}>
              <Switch value={!!item.is_active} onValueChange={()=>toggleActive(item)} trackColor={{true:ADMIN_COLORS.primary, false:ADMIN_COLORS.border}} thumbColor={ADMIN_COLORS.textPrimary}/>
              <Text style={{color: item.is_active? ADMIN_COLORS.textPrimary : ADMIN_COLORS.textMuted, fontSize:12, fontWeight:'700'}}>{item.is_active? t('admin.staff.active') : t('admin.staff.inactive')}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {editItem && (
        <Modal visible={true} transparent animationType="slide">
          <View style={{flex:1, backgroundColor:'rgba(0,0,0,0.35)', justifyContent:'center', padding:20}}>
            <View style={s.addCard}>
              <Text style={s.h1}>{t('admin.staff.editStaff')}</Text>
              <Text style={s.label}>{t('admin.staff.name')}</Text>
              <TextInput value={editItem.name || ''} onChangeText={(tt)=>setEditItem((p:any)=>({...p, name:tt}))} style={s.input}/>
              <Text style={s.label}>{t('admin.staff.email')}</Text>
              <TextInput value={editItem.email || ''} onChangeText={(tt)=>setEditItem((p:any)=>({...p, email:tt}))} style={s.input} autoCapitalize="none"/>
              <Text style={s.label}>{t('admin.staff.role')}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:8, marginTop:8}}>
                {ROLES.map(r=> (<TouchableOpacity key={r} onPress={()=>setEditItem((p:any)=>({...p, role:r}))} style={[s.roleChip, editItem.role===r && s.roleActive]}><Text style={[s.roleTxt, editItem.role===r && s.roleTxtActive]}>{t(`admin.staff.roles.${r}`)}</Text></TouchableOpacity>))}
              </ScrollView>
              <View style={{flexDirection:'row', gap:10, marginTop:16}}>
<TouchableOpacity style={[s.saveBig,{flex:1, backgroundColor:ADMIN_COLORS.card, borderWidth:1, borderColor:ADMIN_COLORS.border}]} onPress={()=>setEditItem(null)}><Text style={{color:ADMIN_COLORS.textPrimary, fontWeight:'700'}}>{t('common:cancel')}</Text></TouchableOpacity>
                <TouchableOpacity style={[s.saveBig,{flex:1}]} onPress={updateStaff}><Text style={s.saveBigTxt}>{t('common:save')}</Text></TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}
const s = StyleSheet.create({
  bg:{flex:1, backgroundColor:ADMIN_COLORS.background}, header:{flexDirection:'row', justifyContent:'space-between', alignItems:'center', padding:16, paddingTop:50, borderBottomWidth:1, borderBottomColor:ADMIN_COLORS.border, backgroundColor:ADMIN_COLORS.background},
  h1:{color:ADMIN_COLORS.textPrimary, fontWeight:'800', fontSize:18}, back:{width:36, height:36, borderRadius:18, backgroundColor:ADMIN_COLORS.card, justifyContent:'center', alignItems:'center', borderWidth:1, borderColor:ADMIN_COLORS.border},
  addBtn:{width:36, height:36, borderRadius:18, backgroundColor:ADMIN_COLORS.primary, justifyContent:'center', alignItems:'center'},
  addCard:{backgroundColor:ADMIN_COLORS.card, margin:16, borderRadius:16, padding:16, borderWidth:1, borderColor:ADMIN_COLORS.border, gap:8},
  label:{color:ADMIN_COLORS.textSecondary, fontSize:11, textAlign:'right', marginTop:4, fontWeight:'700'}, input:{backgroundColor:ADMIN_COLORS.inputBg, borderWidth:1, borderColor:ADMIN_COLORS.inputBorder, borderRadius:10, color:ADMIN_COLORS.inputText, height:44, paddingHorizontal:12, textAlign:'right', fontWeight:'600'},
  roleChip:{paddingHorizontal:14, height:32, borderRadius:16, backgroundColor:ADMIN_COLORS.card, justifyContent:'center', borderWidth:1, borderColor:ADMIN_COLORS.border}, roleActive:{backgroundColor:ADMIN_COLORS.primary, borderColor:ADMIN_COLORS.primary}, roleTxt:{color:ADMIN_COLORS.textSecondary, fontSize:12, fontWeight:'600'}, roleTxtActive:{color:ADMIN_COLORS.primaryText},
  saveBig:{backgroundColor:ADMIN_COLORS.primary, height:46, borderRadius:12, justifyContent:'center', alignItems:'center', marginTop:12}, saveBigTxt:{color:ADMIN_COLORS.primaryText, fontWeight:'800'},
  card:{backgroundColor:ADMIN_COLORS.card, borderRadius:16, padding:14, borderWidth:1, borderColor:ADMIN_COLORS.border},
  avatar:{width:36, height:36, borderRadius:18, backgroundColor:ADMIN_COLORS.primary, justifyContent:'center', alignItems:'center'},
  iconSmall:{width:32, height:32, borderRadius:16, backgroundColor:ADMIN_COLORS.cardSecondary, justifyContent:'center', alignItems:'center', borderWidth:1, borderColor:ADMIN_COLORS.border},
  name:{color:ADMIN_COLORS.textPrimary, fontWeight:'800', fontSize:13}, email:{color:ADMIN_COLORS.textSecondary, fontSize:10, marginTop:2, fontWeight:'500'}
});