import { Entypo, Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Image, Modal, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import { ADMIN_COLORS } from "../../../lib/adminTheme";
import { supabase } from '../../../lib/supabase';
import { FunctionsHttpError, FunctionsFetchError } from '@supabase/supabase-js';

/**
 * Invoke the admin-api Edge Function with error classification.
 * All product mutations (create/update/delete/reorder/toggle) are routed
 * through the admin-api, which enforces admin-only authorization, field
 * whitelisting, and UUID validation server-side.
 */
async function invokeAdminApi(body: object): Promise<any> {
  const { data, error } = await supabase.functions.invoke('admin-api', {
    body: JSON.stringify(body),
  });
  if (error) {
    if (error instanceof FunctionsHttpError) {
      const httpStatus = error.context?.status ?? error.context?.response?.status;
      throw new Error(`Server error: ${httpStatus}`);
    }
    if (error instanceof FunctionsFetchError) {
      throw new Error('Network error. Please check your connection.');
    }
    throw error;
  }
  return data;
}

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
    const { data: prods } = await supabase.from('products').select('*').order('sort_order', { ascending: true, nullsFirst: false }).order('created_at', { ascending:false });
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

  const toggleAvailability = async (item: any) => {
    const current = item.is_available ?? item.is_active ?? true;
    const newVal = !current;
    setProducts(prev => prev.map(p => p.id === item.id ? { ...p, is_available: newVal, is_active: newVal } : p));
    try {
      // SECURITY: Server-side read-then-toggle prevents client from setting an arbitrary value.
      await invokeAdminApi({ action: 'toggle-product-availability', payload: { id: item.id } });
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleDragEnd = async ({ data }: { data: any[] }) => {
    let newProducts: any[];
    if (selectedCat === 'all' &&!search) {
      newProducts = data;
    } else {
      const filteredIds = new Set(data.map((d:any)=>d.id));
      let dataIndex = 0;
      newProducts = products.map(p => {
        if (filteredIds.has(p.id)) {
          return data[dataIndex++];
        }
        return p;
      });
    }
    setProducts(newProducts);
    try {
      // SECURITY: Route reordering through admin-api so each update is validated
      // (UUID checks, field whitelist, admin authorization) server-side.
      await invokeAdminApi({
        action: 'reorder-products',
        payload: { items: newProducts.map((p: any, i: number) => ({ id: p.id, sort_order: i })) },
      });
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

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
      const payload: any = {
        name: edit.name,
        price: Number(edit.price),
        category: catNameObj,
        category_id: edit.category_id,
        image_url: finalImageUrl,
        sort_order: edit.sort_order?? products.length,
        is_available: edit.is_available?? true,
        stock_quantity: Number(edit.stock_quantity?? 10),
      };
      if (edit.id) {
        // SECURITY: Route through admin-api — server validates UUID, field
        // whitelist, and admin authorization before touching the DB.
        payload.id = edit.id;
        await invokeAdminApi({ action: 'update-product', payload });
      } else {
        // SECURITY: create-product action enforces field whitelist server-side.
        await invokeAdminApi({ action: 'create-product', payload });
      }
      setModal(false); setEdit(null); load();
    } catch(e:any){ Alert.alert('Error', e.message); }
    setUploading(false);
  };

  const deleteProduct = async (item: any) => {
    try {
      // SECURITY: Route through admin-api — server validates UUID and admin auth.
      await invokeAdminApi({ action: 'delete-product', payload: { id: item.id } });
      load();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const renderItem = ({ item, drag, isActive }: RenderItemParams<any>) => {
    const isAvailable = item.is_available?? item.is_active?? true;
    return (
      <TouchableOpacity
        onPress={()=>{ setEdit(item); setModal(true); }}
        onLongPress={drag}
        activeOpacity={0.9}
        style={[s.row, isActive && s.rowActive]}
      >
        <Switch
          value={!!isAvailable}
          onValueChange={()=>toggleAvailability(item)}
          trackColor={{ false: "#E5E7EB", true: ADMIN_COLORS.primary }}
          thumbColor="#fff"
          style={{ transform: [{ scaleX: 0.75 }, { scaleY: 0.75 }] }}
        />
        <TouchableOpacity onLongPress={drag} style={s.dragBtn}>
          <Entypo name="dots-three-vertical" size={14} color={ADMIN_COLORS.textMuted} />
        </TouchableOpacity>
        <Image source={{uri: item.image_url || 'https://via.placeholder.com/100'}} style={s.rowImg}/>
        <View style={{flex:1, marginLeft:10}}>
          <Text style={s.rowName} numberOfLines={1}>{item.name}</Text>
          <Text style={s.rowDesc} numberOfLines={1}>{item.category || categories.find(c=>c.id===item.category_id)?.name || ''}</Text>
        </View>
        <Text style={[s.rowPrice,!isAvailable && { color: ADMIN_COLORS.danger }]}>{t('common.currency')} {Number(item.price).toFixed(0)}</Text>
        <View style={s.rowActions}>
          <TouchableOpacity style={s.iconBtn} onPress={()=>{ setEdit(item); setModal(true); }}><Ionicons name="pencil" size={14} color={ADMIN_COLORS.textPrimary}/></TouchableOpacity>
          <TouchableOpacity style={[s.iconBtn, s.iconBtnDel]} onPress={() => deleteProduct(item)}><Ionicons name="trash" size={14} color={ADMIN_COLORS.danger}/></TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
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
          <TouchableOpacity style={s.addCircle} onPress={()=>{ setEdit({name:'', price:'', stock_quantity: 10, category_id: selectedCat!=='all'? selectedCat : categories[0]?.id, image_url:'', is_available: true}); setModal(true); }}>
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

      <View style={s.tableHeader}>
        <Text style={s.thSmall}>ON/OFF</Text>
        <Text style={[s.th, {marginLeft:50, flex:1}]}>Name</Text>
        <Text style={[s.th, {width:70, textAlign:'right'}]}>Price</Text>
        <Text style={{width:70}}></Text>
      </View>

      <View style={{flex:1}}>
        <DraggableFlatList
          data={filtered}
          keyExtractor={(item)=>item.id}
          onDragEnd={handleDragEnd}
          renderItem={renderItem}
          contentContainerStyle={{paddingBottom:120}}
        />
      </View>

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

              <Text style={s.label}>Stock Quantity</Text>
              <TextInput style={s.input} value={String(edit?.stock_quantity?? 10)} onChangeText={v=>setEdit({...edit, stock_quantity: Number(v) || 0})} keyboardType="numeric" placeholder="10" placeholderTextColor={ADMIN_COLORS.textSecondary}/>

              <View style={s.availRow}>
                <Text style={s.label}>{t('admin.products.available') || 'Available'}</Text>
                <Switch value={!!(edit?.is_available?? edit?.is_active?? true)} onValueChange={(v)=>setEdit({...edit, is_available: v, is_active: v})} trackColor={{ false: "#E5E7EB", true: ADMIN_COLORS.primary }} />
              </View>
              <Text style={s.label}>{t('admin.products.category')}</Text>
              <View style={s.catSelector}>
                {categories.map(c=>(
                  <TouchableOpacity key={c.id} onPress={()=>setEdit({...edit, category_id: c.id})} style={[s.catOption, edit?.category_id===c.id && s.catOptionActive]}>
                    <Text style={[s.catOptionTxt, edit?.category_id===c.id && s.catOptionTxtActive]}>{c.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity style={s.saveBtn} onPress={saveProduct} disabled={uploading}>
                {uploading? <ActivityIndicator color={ADMIN_COLORS.primaryText}/> : <Text style={s.saveTxt}>{edit?.id? t('common.save') : t('common.save')}</Text>}
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
  searchBox:{flexDirection:'row', alignItems:'center', backgroundColor:ADMIN_COLORS.card, borderRadius:12, paddingHorizontal:14, height:48, borderWidth:1, borderColor:ADMIN_COLORS.border, gap:10, marginBottom:10}, searchInput:{color:ADMIN_COLORS.textPrimary, flex:1, textAlign:'left', fontWeight:'600'},
  tableHeader:{flexDirection:'row', alignItems:'center', paddingHorizontal:8, paddingVertical:8, backgroundColor:ADMIN_COLORS.cardSecondary, borderRadius:8, marginBottom:6},
  thSmall:{color:ADMIN_COLORS.textMuted, fontSize:10, fontWeight:'800', width:50},
  th:{color:ADMIN_COLORS.textMuted, fontSize:10, fontWeight:'800'},
  row:{flexDirection:'row', alignItems:'center', backgroundColor:ADMIN_COLORS.card, padding:10, borderRadius:12, marginBottom:8, borderWidth:1, borderColor:ADMIN_COLORS.border},
  rowActive:{backgroundColor: ADMIN_COLORS.cardSecondary, borderColor: ADMIN_COLORS.primary, elevation:4},
  dragBtn:{padding:8, marginHorizontal:2},
  rowImg:{width:42, height:42, borderRadius:8, backgroundColor:ADMIN_COLORS.cardSecondary},
  rowName:{color:ADMIN_COLORS.textPrimary, fontWeight:'800', fontSize:13},
  rowDesc:{color:ADMIN_COLORS.textSecondary, fontSize:11, marginTop:1},
  rowPrice:{color:ADMIN_COLORS.primary, fontWeight:'800', fontSize:12, width:70, textAlign:'right'},
  rowActions:{flexDirection:'row', gap:6, marginLeft:8},
  iconBtn:{width:32, height:32, backgroundColor:ADMIN_COLORS.cardSecondary, borderRadius:8, justifyContent:'center', alignItems:'center', borderWidth:1, borderColor:ADMIN_COLORS.border},
  iconBtnDel:{backgroundColor:ADMIN_COLORS.dangerBg, borderColor:ADMIN_COLORS.dangerBorder},
  overlay:{flex:1, backgroundColor:'rgba(0,0,0,0.4)', justifyContent:'flex-end'}, modal:{backgroundColor:ADMIN_COLORS.card, borderTopLeftRadius:24, borderTopRightRadius:24, padding:20, maxHeight:'90%', paddingBottom:40},
  modalHead:{flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:16}, modalTitle:{color:ADMIN_COLORS.textPrimary, fontSize:18, fontWeight:'800'}, closeBtn:{width:34, height:34, borderRadius:17, backgroundColor:ADMIN_COLORS.cardSecondary, justifyContent:'center', alignItems:'center', borderWidth:1, borderColor:ADMIN_COLORS.border},
  imgPicker:{height:150, backgroundColor:ADMIN_COLORS.cardSecondary, borderRadius:16, overflow:'hidden', justifyContent:'center', alignItems:'center', borderWidth:1, borderColor:ADMIN_COLORS.border, marginBottom:14}, bigImg:{width:'100%', height:'100%'}, imgPlaceholder:{alignItems:'center'}, imgTxt:{color:ADMIN_COLORS.textPrimary, marginTop:6, fontWeight:'700'},
  label:{color:ADMIN_COLORS.textSecondary, fontSize:11, marginBottom:6, marginTop:10, fontWeight:'700'}, input:{backgroundColor:ADMIN_COLORS.cardSecondary, borderWidth:1, borderColor:ADMIN_COLORS.border, borderRadius:12, paddingHorizontal:14, height:46, color:ADMIN_COLORS.textPrimary, fontWeight:'600'},
  availRow:{flexDirection:'row', justifyContent:'space-between', alignItems:'center', backgroundColor:ADMIN_COLORS.cardSecondary, padding:12, borderRadius:12, marginTop:12, borderWidth:1, borderColor:ADMIN_COLORS.border},
  catSelector:{flexDirection:'row', flexWrap:'wrap', gap:8, marginTop:6}, catOption:{paddingHorizontal:12, height:32, borderRadius:16, backgroundColor:ADMIN_COLORS.card, borderWidth:1, borderColor:ADMIN_COLORS.border, justifyContent:'center'}, catOptionActive:{backgroundColor:ADMIN_COLORS.primary, borderColor:ADMIN_COLORS.primary}, catOptionTxt:{color:ADMIN_COLORS.textSecondary, fontSize:12, fontWeight:'600'}, catOptionTxtActive:{color:ADMIN_COLORS.primaryText, fontWeight:'bold'},
  saveBtn:{backgroundColor:ADMIN_COLORS.primary, height:48, borderRadius:14, justifyContent:'center', alignItems:'center', marginTop:20}, saveTxt:{color:ADMIN_COLORS.primaryText, fontWeight:'bold', fontSize:15}
});