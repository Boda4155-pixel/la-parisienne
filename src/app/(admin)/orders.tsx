import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Linking, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../../lib/supabase';

export default function OrdersPage() {
  const { t } = useTranslation();
  const [orders, setOrders] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [status, setStatus] = useState<'all'|'pending'|'confirmed'|'delivered'|'cancelled'>('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any>(null);

  const load = async () => {
    const { data } = await supabase.from('orders').select('*').order('created_at', {ascending:false});
    const clean = (data||[]).filter(o=> o && o.id);
    setOrders(clean);
    setFiltered(clean);
  };

  useEffect(()=>{ load(); }, []);
  useEffect(()=>{
    let f = [...orders];
    if(status!== 'all') f = f.filter(o=> o?.status === status);
    if(search) f = f.filter(o=> (o?.id||'').includes(search));
    setFiltered(f);
  }, [status, search, orders]);

  const openOrder = async (o:any) => {
    setSelected({...o, items:[], profile:null, _displayName:'Loading...', _displayPhone:'...', _displayAddr: o.delivery_address || '...' });
    const {data: items} = await supabase.from('order_items').select('*, products(name)').eq('order_id', o.id);
    const possibleId = o.user_id || o.customer_id || o.profile_id || o.customerId;
    let profile = null;
    if(possibleId){
      const { data: profData } = await supabase.from('profiles').select('*').eq('id', possibleId).single();
      profile = profData;
    }
    setSelected({
      ...o,
      items: items||[],
      profile,
      _displayName: profile?.full_name || profile?.name || profile?.email || o.customer_name || t('admin.orders.guest'),
      _displayPhone: profile?.phone || profile?.phone_number || profile?.mobile || o.customer_phone || t('admin.orders.noPhone'),
      _displayAddr: o.delivery_address || o.address || profile?.address || t('admin.orders.noAddress')
    });
  };

  const updateStatus = async (id:string, newStatus:string) => {
    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', id);
    if(error) Alert.alert('Error', error.message);
    else { setSelected(null); load(); }
  };

  const handleCall = () => {
    const phone = selected?._displayPhone;
    if(!phone || phone === t('admin.orders.noPhone') || phone === '...' || phone.includes('No')){
      Alert.alert(t('admin.orders.noNumberTitle'), t('admin.orders.noNumberDesc'));
      return;
    }
    Linking.openURL(`tel:${phone}`);
  };

  const getColor = (s:string) => s==='delivered'?'#16A34A': s==='cancelled'?'#EF4444': s==='confirmed'?'#2563EB':'#D97706';

  return (
    <View style={s.bg}>
      <Text style={s.h1}>{t('admin.orders.title')}</Text>
      <Text style={s.sub}>{t('admin.orders.count', { count: filtered.length })}</Text>

      <View style={s.searchBox}>
        <Ionicons name="search" size={18} color="#666" />
        <TextInput placeholder={t('common:search')} placeholderTextColor="#666" style={s.searchInput} value={search} onChangeText={setSearch} />
      </View>

      <View style={{height: 42, marginBottom: 12}}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:8, paddingRight:20}}>
          {(['all','pending','confirmed','delivered','cancelled'] as const).map(st=>(
            <TouchableOpacity key={st} onPress={()=>setStatus(st)} style={[s.filterChip, status===st && s.filterChipActive]}>
              <Text style={[s.filterTxt, status===st && s.filterTxtActive]}>{t(`admin.orders.status.${st}`)}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={{paddingBottom:130}} showsVerticalScrollIndicator={false}>
        {filtered.map(o=>(
          <TouchableOpacity key={o?.id} style={s.card} onPress={()=>openOrder(o)}>
            <View style={s.cardTop}>
              <Text style={s.id}>#{o?.id?.slice(0,8)}</Text>
              <Text style={s.total}>EGP {Number(o?.total||0).toFixed(0)}</Text>
            </View>
            <Text style={[s.badge, {backgroundColor: getColor(o?.status)+'15', color: getColor(o?.status), borderColor: getColor(o?.status)+'30'}]}>{t(`admin.orders.status.${o?.status}`)}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Modal visible={!!selected} transparent animationType="slide" onRequestClose={()=>setSelected(null)}>
        <View style={s.overlay}>
          <View style={s.modal}>
            <View style={s.modalHead}>
              <Text style={s.modalTitle}>{t('admin.orders.order')} #{selected?.id?.slice(0,8)}</Text>
              <TouchableOpacity onPress={()=>setSelected(null)} style={s.closeBtn}><Ionicons name="close" size={22} color="#111"/></TouchableOpacity>
            </View>

            {selected && (
              <>
                <View style={s.infoBox}>
                  <Text style={s.row}><Text style={s.label}>{t('admin.orders.name')}: </Text><Text style={s.val}>{selected._displayName}</Text></Text>
                  <Text style={s.row}><Text style={s.label}>{t('admin.orders.phone')}: </Text><Text style={[s.val, {color: selected._displayPhone===t('admin.orders.noPhone') ? '#EF4444' : '#111'}]}>{selected._displayPhone}</Text></Text>
                  <Text style={s.row}><Text style={s.label}>{t('admin.orders.address')}: </Text><Text style={s.val}>{selected._displayAddr}</Text></Text>
                  <Text style={s.row}><Text style={s.label}>{t('admin.orders.total')}: </Text><Text style={s.val}>EGP {Number(selected.total||0).toFixed(2)}</Text></Text>
                </View>

                <Text style={s.itemsHead}>{t('admin.orders.items', { count: selected.items?.length })}</Text>
                {selected.items?.map((it:any,i:number)=>(
                  <View key={i} style={s.itemRow}><Text style={s.itemName}>{it.products?.name || 'Product'} x{it.quantity}</Text><Text style={s.itemPrice}>EGP {it.price}</Text></View>
                ))}

                <View style={s.actions}>
                  <TouchableOpacity style={[s.actBtn, {backgroundColor:'#FEF3C7'}]} onPress={()=>updateStatus(selected.id,'pending')}><Text style={s.actTxtPending}>{t('admin.orders.status.pending')}</Text></TouchableOpacity>
                  <TouchableOpacity style={[s.actBtn, {backgroundColor:'#DBEAFE'}]} onPress={()=>updateStatus(selected.id,'confirmed')}><Text style={s.actTxtConfirmed}>{t('admin.orders.status.confirmed')}</Text></TouchableOpacity>
                  <TouchableOpacity style={[s.actBtn, {backgroundColor:'#16A34A'}]} onPress={()=>updateStatus(selected.id,'delivered')}><Text style={s.actTxtWhite}>{t('admin.orders.deliver')}</Text></TouchableOpacity>
                </View>
                <View style={s.actions}>
                  <TouchableOpacity style={[s.actBtn, {backgroundColor:'#F0FDF4', flexDirection:'row', gap:6, justifyContent:'center', borderWidth:1, borderColor:'#BBF7D0'}]} onPress={handleCall}>
                    <Ionicons name="call" size={16} color="#16A34A"/><Text style={s.actTxtGreen}>{t('admin.orders.call')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[s.actBtn, {backgroundColor:'#EF4444'}]} onPress={()=>updateStatus(selected.id,'cancelled')}><Text style={s.actTxtWhite}>{t('admin.orders.cancel')}</Text></TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}
const s = StyleSheet.create({
  bg:{flex:1, backgroundColor:'#FFFFFF', padding:16, paddingTop:50},
  h1:{color:'#111', fontSize:28, fontWeight:'800'}, 
  sub:{color:'#16A34A', fontSize:12, marginTop:4, marginBottom:10, fontWeight:'700'},
  searchBox:{flexDirection:'row', alignItems:'center', backgroundColor:'#FFFFFF', borderRadius:12, paddingHorizontal:14, height: 46, borderWidth:1, borderColor:'#E5E5E5', gap:10, marginBottom:12},
  searchInput:{color:'#111', flex:1, fontWeight:'600'},
  filterChip:{paddingHorizontal:18, height: 34, justifyContent:'center', borderRadius:20, backgroundColor:'#FFFFFF', borderWidth:1, borderColor:'#E5E5E5'},
  filterChipActive:{backgroundColor:'#16A34A', borderColor:'#16A34A'},
  filterTxt:{color:'#555', fontSize:12, fontWeight:'700'}, 
  filterTxtActive:{color:'#FFFFFF'},
  card:{backgroundColor:'#FFFFFF', padding:14, borderRadius:16, marginBottom:10, borderWidth:1, borderColor:'#E5E5E5'},
  cardTop:{flexDirection:'row', justifyContent:'space-between'}, 
  id:{color:'#111', fontWeight:'800'}, 
  total:{color:'#16A34A', fontWeight:'800'}, 
  badge:{fontSize:10, fontWeight:'800', marginTop:6, paddingHorizontal:8, paddingVertical:3, borderRadius:10, alignSelf:'flex-start', textTransform:'uppercase', overflow:'hidden', borderWidth:1},
  overlay:{flex:1, backgroundColor:'rgba(0,0,0,0.4)', justifyContent:'flex-end'}, 
  modal:{backgroundColor:'#FFFFFF', borderTopLeftRadius:24, borderTopRightRadius:24, padding:20, paddingBottom:40, borderWidth:1, borderColor:'#E5E5E5', borderBottomWidth:0},
  modalHead:{flexDirection:'row', justifyContent:'space-between', marginBottom:16}, 
  modalTitle:{color:'#111', fontSize:18, fontWeight:'800'}, 
  closeBtn:{width:34, height:34, backgroundColor:'#F5F5F5', borderRadius:17, justifyContent:'center', alignItems:'center'},
  infoBox:{backgroundColor:'#F0FDF4', padding:12, borderRadius:12, borderWidth:1, borderColor:'#BBF7D0', marginBottom:12},
  row:{color:'#333', marginBottom:8, fontSize:13}, 
  label:{color:'#888', fontWeight:'600'}, 
  val:{color:'#111', fontWeight:'700'},
  itemsHead:{color:'#16A34A', fontWeight:'800', marginBottom:8}, 
  itemRow:{flexDirection:'row', justifyContent:'space-between', marginBottom:6}, 
  itemName:{color:'#555', fontSize:12, fontWeight:'600'}, 
  itemPrice:{color:'#111', fontSize:12, fontWeight:'700'},
  actions:{flexDirection:'row', gap:8, marginTop:12}, 
  actBtn:{flex:1, height: 48, borderRadius:12, alignItems:'center', justifyContent:'center'}, 
  actTxtPending:{color:'#92400E', fontWeight:'800'}, 
  actTxtConfirmed:{color:'#1E40AF', fontWeight:'800'}, 
  actTxtGreen:{color:'#16A34A', fontWeight:'800'}, 
  actTxtWhite:{color:'#FFFFFF', fontWeight:'800'},
});