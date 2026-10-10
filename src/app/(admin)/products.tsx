import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../../lib/supabase';
import { ADMIN_COLORS } from "../../../lib/adminTheme";

export default function ProductsPage() {
  const { t } = useTranslation();
  const { catId, catName } = useLocalSearchParams();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCat, setSelectedCat] = useState<string>((catId as string) || 'all');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [edit, setEdit] = useState<any>(null);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    const { data: cats } = await supabase.from('categories').select('*').order('name');
    const { data: prods } = await supabase.from('products').select('*').order('created_at', {ascending:false});
    setCategories(cats||[]);
    setProducts(prods||[]);
  };
  useEffect(()=>{ load(); }, []);
  useEffect(()=>{ if(catId) setSelectedCat(catId as string); }, [catId]);

  const filtered = products.filter(p=> {
    const matchCat = selectedCat === 'all' || p.category_id === selectedCat;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.5 });
    if(!res.canceled){ setEdit({...edit, image_url: res.assets[0].uri, _isLocal: true}); }
  };

  const saveProduct = async () => {
    if(!edit.name ||!edit.price) return Alert.alert(t('admin.products.nameRequired'));
    if(!edit.category_id) return Alert.alert(t('admin.products.categoryPlaceholder'));
    setUploading(true);
    try{
      let finalImageUrl = edit.image_url;
      if(edit._isLocal && finalImageUrl?.startsWith('file://')){
        const base64 = await FileSystem.readAsStringAsync(finalImageUrl, { encoding: FileSystem.EncodingType.Base64 });
        finalImageUrl = `data:image/jpeg;base64,${base64}`;
      }
      const catNameObj = categories.find(c=>c.id===edit.category_id)?.name || '';
      const payload = { name: edit.name, price: Number(edit.price), category: catNameObj, category_id: edit.category_id, image_url: finalImageUrl };
      if(edit.id){
        const { error } = await supabase.from('products').update(payload).eq('id', edit.id);
        if(error) throw error;
      } else {
        const { error } = await supabase.from('products').insert(payload);
        if(error) throw error;
      }
      setModal(false); setEdit(null); load();
    } catch(e:any){ Alert.alert('Error', e.message); }
    setUploading(false);
  };

  return (
    <View style={s.bg}>
      <View style={s.head}>
        <View>
          {catName? (
            <TouchableOpacity onPress={()=>router.back()} style={{flexDirection:'row', alignItems:'center', marginBottom:6}}>
              <Ionicons name="arrow-back" size={18} color={ADMIN_COLORS.textPrimary}/><Text style={{color:ADMIN_COLORS.textPrimary, marginLeft:4, fontWeight:'700'}}>{t('admin.nav.categories')}</Text>
            </TouchableOpacity>
          ) : <Text style={s.backHint}>{t('admin.nav.dashboard')}</Text>}
          <Text style={s.h1}>{catName? catName as string : t('admin.products.title')}</Text>
          <Text style={s.sub}>{filtered.length} {t('admin.categories.total')}</Text>
        </View>
        <View style={{flexDirection:'row', gap:8}}>
          <TouchableOpacity style={s.catBtn} onPress={()=>router.push('/(admin)/categories')}>
            <Text style={s.addTxt}>{t('admin.nav.categories').slice(0,4)}</Text><Ionicons name="grid" size={16} color={ADMIN_COLORS.textPrimary}/>
          </TouchableOpacity>
          <TouchableOpacity style={s.addCircle} onPress={()=>{ setEdit({name:'', price:'', category_id: selectedCat!=='all'? selectedCat : categories[0]?.id, image_url:''}); setModal(true); }}>
            <Ionicons name="add" size={22} color={ADMIN_COLORS.primaryText}/>
          </TouchableOpacity>
        </View>
      </View>

      <View style={s.filterRow}>
        <TouchableOpacity onPress={()=>setSelectedCat('all')} style={[s.catChip, selectedCat==='all' && s.catChipActive]}>
          <Text style={[s.catChipTxt, selectedCat==='all' && s.catChipTxtActive]}>{t('common.all') || 'ALL'}</Text>
        </TouchableOpacity>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:8}}>
          {categories.map(c=>(
            <TouchableOpacity key={c.id} onPress={()=>setSelectedCat(c.id)} style={[s.catChip, selectedCat===c.id && s.catChipActive]}>
              <Text style={[s.catChipTxt, selectedCat===c.id && s.catChipTxtActive]}>{c.name.toUpperCase()}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={s.searchBox}>
        <Ionicons name="search" size={18} color={ADMIN_COLORS.textPrimary} />
        <TextInput placeholder={t('common.search') || "Search..."} placeholderTextColor={ADMIN_COLORS.textSecondary} style={s.searchInput} value={search} onChangeText={setSearch}/>
      </View>

      <ScrollView contentContainerStyle={{paddingBottom:120}} showsVerticalScrollIndicator={false}>
        <View style={s.grid}>
          {filtered.map(p=>(
            <View key={p.id} style={s.card}>
              <Image source={{uri: p.image_url}} style={s.img}/>
              <Text style={s.name} numberOfLines={1}>{p.name}</Text>
              <Text style={s.price}>{t('common.currency')} {Number(p.price).toFixed(0)}</Text>
              <View style={s.cardActions}>
                <TouchableOpacity style={s.iconBtn} onPress={()=>{ setEdit(p); setModal(true); }}><Ionicons name="pencil" size={16} color={ADMIN_COLORS.textPrimary}/></TouchableOpacity>
                <TouchableOpacity style={[s.iconBtn, s.iconBtnDel]} onPress={async()=>{ await supabase.from('products').delete().eq('id', p.id); load(); }}><Ionicons name="trash" size={16} color={ADMIN_COLORS.danger}/></TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <Modal visible={modal} transparent animationType="slide">
        <View style={s.overlay}>
          <View style={s.modal}>
            <View style={s.modalHead}><Text style={s.modalTitle}>{edit?.id? t('admin.products.edit') : t('admin.products.new')}</Text><TouchableOpacity onPress={()=>setModal(false)} style={s.closeBtn}><Ionicons name="close" size={20} color={ADMIN_COLORS.textPrimary}/></TouchableOpacity></View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <TouchableOpacity style={s.imgPicker} onPress={pickImage}>
                {edit?.image_url? <Image source={{uri: edit.image_url}} style={s.bigImg}/> : <View style={s.imgPlaceholder}><Ionicons name="camera" size={30} color={ADMIN_COLORS.textPrimary}/><Text style={s.imgTxt}>{t('admin.products.image')}</Text></View>}
              </TouchableOpacity>
              <Text style={s.label}>{t('admin.products.name')} (EN)</Text>
              <TextInput style={s.input} value={edit?.name} onChangeText={t=>setEdit({...edit, name:t})} placeholder={t('admin.products.namePlaceholder')} placeholderTextColor={ADMIN_COLORS.textSecondary}/>
              <Text style={s.label}>{t('admin.products.price')}</Text>
              <TextInput style={s.input} value={String(edit?.price||'')} onChangeText={t=>setEdit({...edit, price:t})} keyboardType="numeric" placeholder="150" placeholderTextColor={ADMIN_COLORS.textSecondary}/>
              <Text style={s.label}>{t('admin.products.category')}</Text>
              <View style={s.catSelector}>
                {categories.map(c=>(
                  <TouchableOpacity key={c.id} onPress={()=>setEdit({...edit, category_id: c.id})} style={[s.catOption, edit?.category_id===c.id && s.catOptionActive]}>
                    <Text style={[s.catOptionTxt, edit?.category_id===c.id && s.catOptionTxtActive]}>{c.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity style={s.saveBtn} onPress={saveProduct} disabled={uploading}>
                {uploading? <ActivityIndicator color={ADMIN_COLORS.textPrimary}/> : <Text style={s.saveTxt}>{edit?.id? t('common.save') : t('common.save')}</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
const s = StyleSheet.create({
  bg:{flex:1, backgroundColor:ADMIN_COLORS.background, padding:16, paddingTop:50},
  head:{flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:14},
  backHint:{color:ADMIN_COLORS.textMuted, fontSize:12, textAlign:'right', fontWeight:'600'}, h1:{color:ADMIN_COLORS.textPrimary, fontSize:32, fontWeight:'800', textAlign:'right'}, sub:{color:ADMIN_COLORS.textPrimary, fontSize:12, marginTop:4, textAlign:'right', fontWeight:'700', backgroundColor:ADMIN_COLORS.cardSecondary, paddingHorizontal:8, paddingVertical:3, borderRadius:8, alignSelf:'flex-end', borderWidth:1, borderColor:ADMIN_COLORS.border},
  catBtn:{flexDirection:'row', backgroundColor:ADMIN_COLORS.card, paddingHorizontal:14, height:38, borderRadius:20, alignItems:'center', gap:6}, addCircle:{width:38, height:38, backgroundColor:ADMIN_COLORS.primary, borderRadius:19, justifyContent:'center', alignItems:'center'}, addTxt:{color:ADMIN_COLORS.textPrimary, fontWeight:'bold', fontSize:13},
  filterRow:{flexDirection:'row', alignItems:'center', gap:8, marginBottom:12},
  catChip:{paddingHorizontal:16, height:36, borderRadius:18, backgroundColor:ADMIN_COLORS.card, borderWidth:1, borderColor:ADMIN_COLORS.border, justifyContent:'center', alignItems:'center'}, catChipActive:{backgroundColor:ADMIN_COLORS.primary, borderColor:ADMIN_COLORS.primary}, catChipTxt:{color:ADMIN_COLORS.textSecondary, fontSize:12, fontWeight:'bold'}, catChipTxtActive:{color:ADMIN_COLORS.primaryText},
  searchBox:{flexDirection:'row', alignItems:'center', backgroundColor:ADMIN_COLORS.card, borderRadius:12, paddingHorizontal:14, height:48, borderWidth:1, borderColor:ADMIN_COLORS.border, gap:10, marginBottom:14}, searchInput:{color:ADMIN_COLORS.textPrimary, flex:1, textAlign:'left', fontWeight:'600'},
  grid:{flexDirection:'row', flexWrap:'wrap', gap:12},
  card:{backgroundColor:ADMIN_COLORS.card, width:'47.5%', borderRadius:16, padding:10, borderWidth:1, borderColor:ADMIN_COLORS.border}, img:{width:'100%', height:120, borderRadius:12, backgroundColor:ADMIN_COLORS.cardSecondary}, name:{color:ADMIN_COLORS.textPrimary, fontWeight:'800', marginTop:8, fontSize:12, textAlign:'center'}, price:{color:ADMIN_COLORS.textPrimary, fontWeight:'800', marginTop:2, fontSize:13, textAlign:'center'}, cardActions:{flexDirection:'row', gap:8, marginTop:10}, iconBtn:{flex:1, height:36, backgroundColor:ADMIN_COLORS.cardSecondary, borderRadius:10, justifyContent:'center', alignItems:'center', borderWidth:1, borderColor:ADMIN_COLORS.border}, iconBtnDel:{backgroundColor:ADMIN_COLORS.dangerBg, borderColor:ADMIN_COLORS.dangerBorder},
  overlay:{flex:1, backgroundColor:'rgba(0,0,0,0.4)', justifyContent:'flex-end'}, modal:{backgroundColor:ADMIN_COLORS.card, borderTopLeftRadius:24, borderTopRightRadius:24, padding:20, maxHeight:'90%', paddingBottom:40},
  modalHead:{flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:16}, modalTitle:{color:ADMIN_COLORS.textPrimary, fontSize:18, fontWeight:'800'}, closeBtn:{width:34, height:34, borderRadius:17, backgroundColor:ADMIN_COLORS.cardSecondary, justifyContent:'center', alignItems:'center', borderWidth:1, borderColor:ADMIN_COLORS.border},
  imgPicker:{height:150, backgroundColor:ADMIN_COLORS.cardSecondary, borderRadius:16, overflow:'hidden', justifyContent:'center', alignItems:'center', borderWidth:1, borderColor:ADMIN_COLORS.border, marginBottom:14}, bigImg:{width:'100%', height:'100%'}, imgPlaceholder:{alignItems:'center'}, imgTxt:{color:ADMIN_COLORS.textPrimary, marginTop:6, fontWeight:'700'},
  label:{color:ADMIN_COLORS.textSecondary, fontSize:11, marginBottom:6, marginTop:10, fontWeight:'700'}, input:{backgroundColor:ADMIN_COLORS.cardSecondary, borderWidth:1, borderColor:ADMIN_COLORS.border, borderRadius:12, paddingHorizontal:14, height:46, color:ADMIN_COLORS.textPrimary, fontWeight:'600'},
  catSelector:{flexDirection:'row', flexWrap:'wrap', gap:8, marginTop:6}, catOption:{paddingHorizontal:12, height:32, borderRadius:16, backgroundColor:ADMIN_COLORS.card, borderWidth:1, borderColor:ADMIN_COLORS.border, justifyContent:'center'}, catOptionActive:{backgroundColor:ADMIN_COLORS.primary, borderColor:ADMIN_COLORS.primary}, catOptionTxt:{color:ADMIN_COLORS.textSecondary, fontSize:12, fontWeight:'600'}, catOptionTxtActive:{color:ADMIN_COLORS.primaryText, fontWeight:'bold'},
  saveBtn:{backgroundColor:ADMIN_COLORS.primary, height:48, borderRadius:14, justifyContent:'center', alignItems:'center', marginTop:20}, saveTxt:{color:ADMIN_COLORS.primaryText, fontWeight:'bold', fontSize:15}
});