import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../../lib/supabase';
import { ADMIN_COLORS } from "../../../lib/adminTheme";

export default function CategoriesPage(){
  const { t } = useTranslation();
  const [cats, setCats] = useState<any[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});

  const load = async () => {
    const { data: categories } = await supabase.from('categories').select('*').order('name');
    setCats(categories||[]);
    const { data: products } = await supabase.from('products').select('category_id');
    const c: Record<string, number> = {};
    (products||[]).forEach((p:any)=>{ c[p.category_id]=(c[p.category_id]||0)+1 });
    setCounts(c);
  };
  useEffect(()=>{ load() },[]);

  const onDelete = (item:any) => {
    const prodCount = counts[item.id] || 0;
    if(prodCount > 0){
      Alert.alert(t('admin.categories.deleteBlockedTitle'), t('admin.categories.deleteBlockedMsg', { count: prodCount }));
      return;
    }
    Alert.alert(t('admin.categories.deleteTitle'), t('admin.categories.deleteConfirm', { name: item.name }), [
      {text: t('common:cancel'), style:'cancel'},
      {text: t('common:delete'), style:'destructive', onPress: async ()=>{
        const { error } = await supabase.from('categories').delete().eq('id', item.id);
        if(error) Alert.alert('Error', error.message);
        else load();
      }}
    ]);
  };

  const [newName, setNewName] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  const onAdd = async () => {
    if(!newName.trim()) return;
    const { error } = await supabase.from('categories').insert({ name: newName.trim() });
    if(error) Alert.alert('Error', error.message);
    else { setNewName(''); setShowAdd(false); load(); }
  };

  return (
    <View style={s.bg}>
      <View style={s.header}>
        <TouchableOpacity style={s.newBtn} onPress={()=>setShowAdd(!showAdd)}>
<Ionicons name="add" size={20} color={ADMIN_COLORS.primaryText}/><Text style={s.newTxt}>{t('admin.categories.add')}</Text>
        </TouchableOpacity>
        <View style={{alignItems:'flex-end'}}>
          <Text style={s.h1}>{t('admin.categories.title')}</Text>
          <Text style={s.sub}>{t('admin.categories.totalWithCount', { count: cats.length })}</Text>
        </View>
      </View>

      {showAdd && (
        <View style={s.addBox}>
<TextInput placeholder={t('admin.categories.namePlaceholder')} placeholderTextColor={ADMIN_COLORS.textSecondary} value={newName} onChangeText={setNewName} style={s.input}/>
          <TouchableOpacity style={s.addBtn} onPress={onAdd}><Text style={s.addBtnTxt}>{t('common:add')}</Text></TouchableOpacity>
        </View>
      )}

      <FlatList
        data={cats}
        keyExtractor={i=>i.id}
        contentContainerStyle={{padding:16, paddingBottom:120, gap:12}}
        renderItem={({item})=>(
          <TouchableOpacity style={s.card} onPress={()=>router.push(`/(admin)/products?cat=${item.id}` as any)}>
<Ionicons name="chevron-forward" size={20} color={ADMIN_COLORS.textSecondary} />
            <View style={{flex:1, alignItems:'flex-end'}}>
              <Text style={s.name}>{item.name}</Text>
              <Text style={s.count}>{t('admin.categories.countRow', { count: counts[item.id]||0 })}</Text>
            </View>
            <View style={s.iconBox}><Ionicons name="folder" size={24} color={ADMIN_COLORS.textPrimary}/></View>
            <TouchableOpacity onPress={()=>onDelete(item)} style={s.trash}>
              <Ionicons name="trash-outline" size={18} color={ADMIN_COLORS.danger}/>
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
const s = StyleSheet.create({
  bg:{flex:1, backgroundColor:ADMIN_COLORS.background},
  header:{flexDirection:'row', justifyContent:'space-between', alignItems:'center', padding:16, paddingTop:60},
  h1:{color:ADMIN_COLORS.textPrimary, fontSize:30, fontWeight:'bold'},
  sub:{color:ADMIN_COLORS.textSecondary, fontSize:13, marginTop:2, fontWeight:'700', backgroundColor:ADMIN_COLORS.card, paddingHorizontal:8, paddingVertical:3, borderRadius:8, borderWidth:1, borderColor:ADMIN_COLORS.borderLight},
  newBtn:{backgroundColor:ADMIN_COLORS.primary, flexDirection:'row', paddingHorizontal:16, height:40, borderRadius:20, alignItems:'center', gap:4},
  newTxt:{color:ADMIN_COLORS.primaryText, fontWeight:'bold'},
  addBox:{flexDirection:'row', gap:8, paddingHorizontal:16, marginBottom:8},
  input:{flex:1, backgroundColor:ADMIN_COLORS.inputBg, borderWidth:1, borderColor:ADMIN_COLORS.inputBorder, borderRadius:12, color:ADMIN_COLORS.inputText, paddingHorizontal:12, height:44},
  addBtn:{backgroundColor:ADMIN_COLORS.primary, paddingHorizontal:20, borderRadius:12, justifyContent:'center'},
  addBtnTxt:{color:ADMIN_COLORS.primaryText, fontWeight:'bold'},
  card:{backgroundColor:ADMIN_COLORS.card, borderRadius:16, padding:14, flexDirection:'row', alignItems:'center', gap:10, borderWidth:1, borderColor:ADMIN_COLORS.border},
  iconBox:{width:44, height:44, borderRadius:10, backgroundColor:ADMIN_COLORS.cardSecondary, justifyContent:'center', alignItems:'center', borderWidth:1, borderColor:ADMIN_COLORS.border},
  name:{color:ADMIN_COLORS.textPrimary, fontWeight:'bold', fontSize:16},
  count:{color:ADMIN_COLORS.textMuted, fontSize:11, marginTop:2},
  trash:{width:36, height:36, borderRadius:10, backgroundColor:ADMIN_COLORS.dangerBg, justifyContent:'center', alignItems:'center', borderWidth:1, borderColor:ADMIN_COLORS.dangerBorder}
});