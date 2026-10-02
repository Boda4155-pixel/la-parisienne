import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../../lib/supabase';

export default function CategoriesPage(){
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
      Alert.alert('ماينفعش تمسح', `الـ Category ده فيه ${prodCount} منتجات. امسح المنتجات الأول أو انقلها.`);
      return;
    }
    Alert.alert('حذف Category', `متأكد عايز تمسح "${item.name}" ؟`, [
      {text:'إلغاء', style:'cancel'},
      {text:'حذف', style:'destructive', onPress: async ()=>{
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
          <Ionicons name="add" size={20} color="#000"/><Text style={s.newTxt}>New</Text>
        </TouchableOpacity>
        <View style={{alignItems:'flex-end'}}>
          <Text style={s.h1}>Catégories</Text>
          <Text style={s.sub}>{cats.length} catégories</Text>
        </View>
      </View>

      {showAdd && (
        <View style={s.addBox}>
          <TextInput placeholder="اسم الـ Category" placeholderTextColor="#666" value={newName} onChangeText={setNewName} style={s.input}/>
          <TouchableOpacity style={s.addBtn} onPress={onAdd}><Text style={s.addBtnTxt}>إضافة</Text></TouchableOpacity>
        </View>
      )}

      <FlatList
        data={cats}
        keyExtractor={i=>i.id}
        contentContainerStyle={{padding:16, paddingBottom:120, gap:12}}
        renderItem={({item})=>(
          <TouchableOpacity style={s.card} onPress={()=>router.push(`/(admin)/products?cat=${item.id}` as any)}>
            <Ionicons name="chevron-forward" size={20} color="#555" />
            <View style={{flex:1, alignItems:'flex-end'}}>
              <Text style={s.name}>{item.name}</Text>
              <Text style={s.count}>{counts[item.id]||0} products • دوس لعرض المنتجات</Text>
            </View>
            <View style={s.iconBox}><Ionicons name="folder" size={24} color="#E8C87A"/></View>
            <TouchableOpacity onPress={()=>onDelete(item)} style={s.trash}>
              <Ionicons name="trash-outline" size={18} color="#ff5c5c"/>
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}
const s = StyleSheet.create({
  bg:{flex:1, backgroundColor:'#0F0F0F'},
  header:{flexDirection:'row', justifyContent:'space-between', alignItems:'center', padding:16, paddingTop:60},
  h1:{color:'#fff', fontSize:30, fontWeight:'bold'}, sub:{color:'#E8C87A', fontSize:13, marginTop:2},
  newBtn:{backgroundColor:'#E8C87A', flexDirection:'row', paddingHorizontal:16, height:40, borderRadius:20, alignItems:'center', gap:4}, newTxt:{color:'#000', fontWeight:'bold'},
  addBox:{flexDirection:'row', gap:8, paddingHorizontal:16, marginBottom:8}, input:{flex:1, backgroundColor:'#161616', borderWidth:1, borderColor:'#222', borderRadius:12, color:'#fff', paddingHorizontal:12, height:44}, addBtn:{backgroundColor:'#E8C87A', paddingHorizontal:20, borderRadius:12, justifyContent:'center'}, addBtnTxt:{color:'#000', fontWeight:'bold'},
  card:{backgroundColor:'#161616', borderRadius:16, padding:14, flexDirection:'row', alignItems:'center', gap:10, borderWidth:1, borderColor:'#222'},
  iconBox:{width:44, height:44, borderRadius:10, backgroundColor:'#1E1E1E', justifyContent:'center', alignItems:'center', borderWidth:1, borderColor:'#2A2A2A'},
  name:{color:'#fff', fontWeight:'bold', fontSize:16}, count:{color:'#888', fontSize:11, marginTop:2},
  trash:{width:36, height:36, borderRadius:10, backgroundColor:'#1A1A1A', justifyContent:'center', alignItems:'center', borderWidth:1, borderColor:'#2A1A1A'}
});