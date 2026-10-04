import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, FlatList, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../../lib/supabase';

export default function CouponsPage(){
  const { t } = useTranslation();
  const [coupons, setCoupons] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  const [editing, setEditing] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [code, setCode] = useState('');
  const [value, setValue] = useState('');
  const [minOrder, setMinOrder] = useState('');
  const [expiry, setExpiry] = useState('');
  const [type, setType] = useState<'percent'|'fixed'>('percent');
  const [appType, setAppType] = useState<'all'|'category'|'product'>('all');
  const [appId, setAppId] = useState<string|null>(null);
  const [appName, setAppName] = useState('All');

  const load = async () => {
    const { data } = await supabase.from('coupons').select('*').order('created_at', {ascending:false});
    setCoupons(data||[]);
    const { data: prods } = await supabase.from('products').select('id,name');
    const { data: cats } = await supabase.from('categories').select('id,name');
    setProducts(prods||[]); setCategories(cats||[]);
  };
  useEffect(()=>{ load() },[]);

  const openNew = () => {
    setEditing(null); setCode(''); setValue(''); setMinOrder(''); setExpiry('');
    setType('percent'); setAppType('all'); setAppId(null); setAppName(t('common:all'));
    setShowModal(true);
  };
  const openEdit = (item:any) => {
    setEditing(item);
    setCode(item.code); setValue(String(item.discount_value)); setMinOrder(String(item.min_order_amount||''));
    setExpiry(item.expires_at||''); setType(item.discount_type); setAppType(item.applicable_type||'all'); setAppId(item.applicable_id||null);
    if(item.applicable_type==='product') setAppName(products.find(p=>p.id===item.applicable_id)?.name || 'product');
    else if(item.applicable_type==='category') setAppName(categories.find(c=>c.id===item.applicable_id)?.name || 'category');
    else setAppName(t('common:all'));
    setShowModal(true);
  };

  const save = async () => {
    if(!code ||!value) return Alert.alert(t('admincoupons.fillRequired'));
    let finalDate = expiry? (expiry.includes('-') && expiry.split('-')[0].length===2? (()=>{const [d,m,y]=expiry.split('-'); return `${y}-${m}-${d}`})() : expiry) : null;

    const payload:any = {
      code: code.toUpperCase().replace(/\s/g,'').trim(),
      discount_value: Number(value),
      discount_type: type,
      min_order_amount: Number(minOrder||0),
      expires_at: finalDate,
      applicable_type: appType,
      applicable_id: appType==='all'? null : appId,
    };
    let error;
    if(editing){
      const res = await supabase.from('coupons').update(payload).eq('id', editing.id);
      error = res.error;
    } else {
      const res = await supabase.from('coupons').insert(payload);
      error = res.error;
    }
    if(error) Alert.alert('Error', error.message);
    else { setShowModal(false); load(); }
  };

  const del = async (id:string) => {
    Alert.alert(t('common:delete')+'?',t('admin.coupons.deleteConfirm'),[{text:t('common:cancel'), style:'cancel'},{text:t('common:delete'), style:'destructive', onPress: async()=>{ await supabase.from('coupons').delete().eq('id',id); load(); }}]);
  };

  const renderCoupon = ({item}:any) => (
    <TouchableOpacity style={s.card} onPress={()=>openEdit(item)}>
      <TouchableOpacity onPress={()=>del(item.id)} style={s.trash}><Ionicons name="trash-outline" size={18} color="#EF4444"/></TouchableOpacity>
      <View style={{flex:1, alignItems:'flex-end'}}>
        <Text style={s.code}>{item.code} <Text style={{color:'#16A34A'}}>{item.discount_type==='percent'?`${item.discount_value}%`:`${item.discount_value}EGP`}</Text></Text>
        <Text style={s.desc} numberOfLines={1}>
          {item.applicable_type==='all'? t('common:all') : item.applicable_type==='product'? `${t('admin.coupons.product')}: ${products.find(p=>p.id===item.applicable_id)?.name||'...'}` : `Category: ${categories.find(c=>c.id===item.applicable_id)?.name||'...'}`} • {t('admin.coupons.min')} {item.min_order_amount} • {item.expires_at? `${t('admin.coupons.expires')} ${item.expires_at}`: t('admin.coupons.noExpiry')}
        </Text>
      </View>
      <View style={s.tag}><Ionicons name="pricetag" size={20} color="#16A34A"/></View>
    </TouchableOpacity>
  );

  return (
    <View style={s.bg}>
      <View style={s.header}>
        <TouchableOpacity onPress={()=>router.back()} style={s.back}><Ionicons name="chevron-forward" size={20} color="#111"/></TouchableOpacity>
        <View style={{alignItems:'flex-end'}}><Text style={s.h1}>{t('admin.coupons.title')}</Text><Text style={s.sub}>{t('admin.coupons.tapToEdit', { count: coupons.length })}</Text></View>
      </View>

      <TouchableOpacity style={s.newBtn} onPress={openNew}><Text style={s.newBtnTxt}>{t('admin.coupons.add')}</Text><Ionicons name="add" size={20} color="#FFFFFF"/></TouchableOpacity>

      <FlatList data={coupons} keyExtractor={i=>i.id} renderItem={renderCoupon} contentContainerStyle={{padding:16, gap:10, paddingBottom:100}} />

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={s.modalBg}>
          <View style={s.modal}>
            <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:16}}>
              <TouchableOpacity onPress={()=>setShowModal(false)} style={s.closeIcon}><Ionicons name="close" size={22} color="#111"/></TouchableOpacity>
              <Text style={s.modalTitle}>{editing? t('admin.coupons.edit'): t('admin.coupons.new')}</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={s.label}>{t('admin.coupons.code')}</Text>
              <TextInput placeholder="SAVE20" value={code} onChangeText={setCode} style={s.input} autoCapitalize="characters" placeholderTextColor="#999"/>

              <View style={{flexDirection:'row', gap:8}}>
                <View style={{flex:1}}><Text style={s.label}>{t('admin.coupons.discountValue')}</Text><TextInput placeholder="20" value={value} onChangeText={setValue} keyboardType="numeric" style={s.input} placeholderTextColor="#999"/></View>
                <View style={{flexDirection:'row', gap:6, alignItems:'flex-end', marginBottom:8}}>
                  <TouchableOpacity style={[s.typeBtn, type==='percent' && s.typeBtnActive]} onPress={()=>setType('percent')}><Text style={[s.typeTxt, type==='percent' && s.typeTxtActive]}>%</Text></TouchableOpacity>
                  <TouchableOpacity style={[s.typeBtn, type==='fixed' && s.typeBtnActive]} onPress={()=>setType('fixed')}><Text style={[s.typeTxt, type==='fixed' && s.typeTxtActive]}>EGP</Text></TouchableOpacity>
                </View>
              </View>

              <Text style={s.label}>{t('admin.coupons.minOrder')}</Text>
              <TextInput placeholder="200" value={minOrder} onChangeText={setMinOrder} keyboardType="numeric" style={s.input} placeholderTextColor="#999"/>

              <Text style={s.label}>{t('admin.coupons.expiresAt')}</Text>
              <TextInput placeholder="2026-12-31" value={expiry} onChangeText={setExpiry} style={s.input} placeholderTextColor="#999"/>

              <Text style={s.label}>{t('admin.coupons.applicableTo')}</Text>
              <View style={{flexDirection:'row', gap:6, marginBottom:10}}>
                <TouchableOpacity style={[s.typeBtn, {flex:1}, appType==='all'&& s.typeBtnActive]} onPress={()=>{setAppType('all'); setAppId(null); setAppName(t('common:all'))}}><Text style={[s.typeTxt, appType==='all'&& s.typeTxtActive]}>{t('common:all')}</Text></TouchableOpacity>
                <TouchableOpacity style={[s.typeBtn, {flex:1}, appType==='category'&& s.typeBtnActive]} onPress={()=>setAppType('category')}><Text style={[s.typeTxt, appType==='category'&& s.typeTxtActive]}>Category</Text></TouchableOpacity>
                <TouchableOpacity style={[s.typeBtn, {flex:1}, appType==='product'&& s.typeBtnActive]} onPress={()=>setAppType('product')}><Text style={[s.typeTxt, appType==='product'&& s.typeTxtActive]}>{t('admin.products.title')}</Text></TouchableOpacity>
              </View>

              {appType==='category' && (
                <View style={s.listBox}>
                  {categories.map(c=>(
                    <TouchableOpacity key={c.id} style={[s.listItem, appId===c.id && s.listItemActive]} onPress={()=>{setAppId(c.id); setAppName(c.name)}}>
                      <Text style={[s.listItemTxt, appId===c.id && s.listItemTxtActive]}>{c.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              {appType==='product' && (
                <View style={s.listBox}>
                  {products.map(p=>(
                    <TouchableOpacity key={p.id} style={[s.listItem, appId===p.id && s.listItemActive]} onPress={()=>{setAppId(p.id); setAppName(p.name)}}>
                      <Text style={[s.listItemTxt, appId===p.id && s.listItemTxtActive]}>{p.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              <Text style={s.selectedTxt}>{t('admin.coupons.selected')}: {appName}</Text>

              <TouchableOpacity style={s.saveBtn} onPress={save}><Text style={s.saveBtnTxt}>{editing? t('common:save'): t('admin.coupons.create')}</Text></TouchableOpacity>
              <View style={{height:40}}/>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  bg:{flex:1, backgroundColor:'#FFFFFF'},
  header:{flexDirection:'row', justifyContent:'space-between', padding:16, paddingTop:60, alignItems:'center'},
  h1:{color:'#111', fontSize:26, fontWeight:'800'},
  sub:{color:'#16A34A', fontSize:12, fontWeight:'700'},
  back:{width:36, height:36, borderRadius:18, backgroundColor:'#FFFFFF', justifyContent:'center', alignItems:'center', borderWidth:1, borderColor:'#E5E5E5'},

  newBtn:{backgroundColor:'#16A34A', marginHorizontal:16, height:46, borderRadius:12, flexDirection:'row', justifyContent:'center', alignItems:'center', gap:6},
  newBtnTxt:{fontWeight:'800', color:'#FFFFFF', fontSize:14},

  card:{backgroundColor:'#FFFFFF', borderRadius:14, padding:14, flexDirection:'row', alignItems:'center', gap:10, borderWidth:1, borderColor:'#E5E5E5'},
  tag:{width:38, height:38, borderRadius:10, backgroundColor:'#F0FDF4', justifyContent:'center', alignItems:'center', borderWidth:1, borderColor:'#BBF7D0'},
  code:{color:'#111', fontWeight:'800', fontSize:15},
  desc:{color:'#555', fontSize:11, marginTop:4, textAlign:'right', fontWeight:'500'},
  trash:{width:34, height:34, borderRadius:8, backgroundColor:'#FEF2F2', justifyContent:'center', alignItems:'center', borderWidth:1, borderColor:'#FECACA'},

  modalBg:{flex:1, backgroundColor:'rgba(0,0,0,0.35)', justifyContent:'flex-end'},
  modal:{backgroundColor:'#FFFFFF', borderTopLeftRadius:24, borderTopRightRadius:24, padding:20, maxHeight:'90%', borderWidth:1, borderColor:'#E5E5E5'},
  modalTitle:{color:'#111', fontWeight:'800', fontSize:19},
  closeIcon:{width:36, height:36, borderRadius:18, backgroundColor:'#F5F5F5', justifyContent:'center', alignItems:'center'},

  label:{color:'#111', fontSize:12, textAlign:'right', marginBottom:6, marginTop:12, fontWeight:'700'},
  input:{backgroundColor:'#F9F9F9', borderWidth:1, borderColor:'#E5E5E5', borderRadius:10, color:'#111', paddingHorizontal:14, height:48, marginBottom:4, fontSize:14, fontWeight:'600'},

  typeBtn:{height:44, borderRadius:10, backgroundColor:'#FFFFFF', justifyContent:'center', alignItems:'center', borderWidth:1.5, borderColor:'#E5E5E5', paddingHorizontal:16},
  typeBtnActive:{backgroundColor:'#16A34A', borderColor:'#16A34A'},
  typeTxt:{color:'#111', fontWeight:'700', fontSize:12},
  typeTxtActive:{color:'#FFFFFF'},

  saveBtn:{backgroundColor:'#16A34A', height:52, borderRadius:14, justifyContent:'center', alignItems:'center', marginTop:16},
  saveBtnTxt:{fontWeight:'800', color:'#FFFFFF', fontSize:15},

  listBox:{maxHeight:160, backgroundColor:'#FFFFFF', borderRadius:12, borderWidth:1, borderColor:'#E5E5E5', marginTop:4},
  listItem:{padding:14, borderBottomWidth:1, borderBottomColor:'#F5F5F5'},
  listItemActive:{backgroundColor:'#16A34A'},
  listItemTxt:{color:'#111', fontSize:14, fontWeight:'600'},
  listItemTxtActive:{color:'#FFFFFF'},
  selectedTxt:{color:'#16A34A', textAlign:'right', fontSize:12, marginTop:10, marginBottom:6, fontWeight:'700'}
});