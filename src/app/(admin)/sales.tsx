import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../../lib/supabase';

export default function Sales() {
  const { t } = useTranslation();
  const [orders, setOrders] = useState<any[]>([]);
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [filter, setFilter] = useState<'all'|'today'|'week'|'month'|'custom'>('all');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [customDate, setCustomDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const load = async () => {
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if(data) {
      setAllOrders(data);
      applyFilter(data, filter, customDate);
    }
  };

  const applyFilter = (data:any[], f:string, cDate: Date) => {
    if(f === 'all') { setOrders(data); return; }
    if(f === 'custom') {
      const dayStr = cDate.toISOString().split('T')[0];
      setOrders(data.filter(o => o.created_at.startsWith(dayStr)));
      return;
    }
    if(f === 'today') {
      const latest = data[0]?.created_at?.split('T')[0];
      if(!latest) { setOrders([]); return; }
      setOrders(data.filter(o => o.created_at.startsWith(latest)));
      return;
    }
    if(f === 'week') {
      const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate()-7);
      const recent = data.filter(o => new Date(o.created_at) >= weekAgo);
      setOrders(recent.length? recent : data.slice(0,7));
      return;
    }
    if(f === 'month') {
      const monthAgo = new Date(); monthAgo.setMonth(monthAgo.getMonth()-1);
      const recent = data.filter(o => new Date(o.created_at) >= monthAgo);
      setOrders(recent.length? recent : data);
      return;
    }
  };

  useEffect(()=>{ load(); }, []);
  useEffect(()=>{ applyFilter(allOrders, filter, customDate); }, [filter, customDate]);

  const total = orders.reduce((s,o)=> s + Number(o.total||0), 0);
  const paid = orders.filter(o=> o.payment_status === 'paid' || o.status === 'delivered').reduce((s,o)=> s + Number(o.total||0), 0);
  const pendingPayment = total - paid;

  const getStatusColor = (status: string) => {
    if(status === 'delivered') return '#16A34A';
    if(status === 'cancelled') return '#EF4444';
    if(status === 'confirmed') return '#2563EB';
    return '#D97706';
  };

  return (
    <View style={s.bg}>
      <View style={s.header}>
        <TouchableOpacity onPress={()=> {}} style={s.gear}><Ionicons name="settings" size={22} color="#16A34A" /></TouchableOpacity>
        <Text style={s.h1}>{t('admin.sales.title')}</Text>
      </View>

      <View style={s.topRow}>
        <TouchableOpacity style={s.calendarBtn} onPress={()=> setShowCalendar(true)}>
          <Text style={s.calText}>{filter==='custom'? customDate.toLocaleDateString('en-GB') : t('admin.sales.pickDate')}</Text>
          <Ionicons name="calendar" size={18} color="#FFF" />
        </TouchableOpacity>
        <View style={s.tabs}>
          {(['month','week','today','all'] as const).map(f => (
            <TouchableOpacity key={f} onPress={()=>setFilter(f)} style={[s.tab, filter===f && s.tabActive]}>
              <Text style={[s.tabTxt, filter===f && s.tabTxtActive]}>{t(`admin.sales.filters.${f}`).toUpperCase()}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={s.summary}>
        <View style={s.sumHeader}>
          <Ionicons name="trending-up" size={16} color="#16A34A" />
          <Text style={s.sumLab}>{t('admin.sales.totalSales')} ({orders.length})</Text>
        </View>
        <Text style={s.sumVal}>EGP {total.toFixed(2)}</Text>
        <View style={s.sumRow}>
          <View style={s.sumChipGreen}><Text style={s.chipTxtGreen}>{t('admin.sales.paid')}: EGP {paid.toFixed(0)}</Text></View>
          <View style={s.sumChipYellow}><Text style={s.chipTxtYellow}>{t('admin.sales.pending')}: EGP {pendingPayment.toFixed(0)}</Text></View>
        </View>
      </View>

      <ScrollView contentContainerStyle={{paddingBottom: 120}} showsVerticalScrollIndicator={false}>
        {orders.map(o => (
          <TouchableOpacity key={o.id} style={s.orderCard} onPress={async ()=>{
            const {data: items} = await supabase.from('order_items').select('*, products(name)').eq('order_id', o.id);
            let profile = null;
            if(o.customer_id || o.user_id){
              const {data} = await supabase.from('profiles').select('*').eq('id', o.customer_id || o.user_id).single();
              profile = data;
            }
            setSelectedOrder({...o, order_items: items, profile});
          }} activeOpacity={0.7}>
            <View style={s.cardLeft}>
              <View style={[s.statusDot, {backgroundColor: getStatusColor(o.status)}]} />
              <View>
                <Text style={s.orderId}>#{o.id.slice(0,8)}</Text>
                <Text style={s.orderDate}>{new Date(o.created_at).toLocaleDateString('en-GB')} - {t(`admin.orders.status.${o.status}`)}</Text>
              </View>
            </View>
            <View style={s.cardRight}>
              <Text style={s.orderTotal}>EGP {Number(o.total).toFixed(0)}</Text>
              <Ionicons name="chevron-forward" size={14} color="#16A34A" />
            </View>
          </TouchableOpacity>
        ))}
        {orders.length===0 && <Text style={{color:'#888', textAlign:'center', marginTop:50, fontWeight:'600'}}>{t('admin.sales.noSales')}</Text>}
      </ScrollView>

      <Modal visible={showCalendar} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.calendarBox}>
            <Text style={s.calTitle}>{t('admin.sales.pickDateTitle')}</Text>
            <TouchableOpacity style={s.dateBtn} onPress={()=> setShowDatePicker(true)}>
              <Text style={s.dateBtnText}>{customDate.toDateString()}</Text>
              <Ionicons name="calendar-outline" size={20} color="#16A34A" />
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker value={customDate} mode="date" display="default" onChange={(e,d)=>{
                if(d){ setCustomDate(d); }
                setShowDatePicker(false);
              }} />
            )}
            <View style={s.modalActions}>
              <TouchableOpacity style={s.cancelBtn} onPress={()=> setShowCalendar(false)}><Text style={s.cancelTxt}>{t('common:cancel')}</Text></TouchableOpacity>
              <TouchableOpacity style={s.applyBtn} onPress={()=> { setFilter('custom'); setShowCalendar(false); }}><Text style={s.applyTxt}>{t('common:show')}</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={!!selectedOrder} transparent animationType="fade">
        <Pressable style={s.modalOverlay} onPress={()=> setSelectedOrder(null)}>
          <Pressable style={s.detailsBox} onPress={e=> e.stopPropagation()}>
            <View style={s.detailsHeader}>
              <Text style={s.detailsTitle}>{t('admin.orders.order')} #{selectedOrder?.id.slice(0,8)}</Text>
              <TouchableOpacity onPress={()=> setSelectedOrder(null)}><Ionicons name="close" size={24} color="#111" /></TouchableOpacity>
            </View>
            {selectedOrder && (
              <>
                <Text style={s.detailRow}><Text style={s.detailLabel}>{t('admin.orders.name')}: </Text>{selectedOrder.profile?.full_name || selectedOrder.customer_name || t('admin.orders.guest')}</Text>
                <Text style={s.detailRow}><Text style={s.detailLabel}>{t('admin.orders.phone')}: </Text>{selectedOrder.profile?.phone || selectedOrder.customer_phone || 'N/A'}</Text>
                <Text style={s.detailRow}><Text style={s.detailLabel}>{t('admin.orders.statusLabel')}: </Text><Text style={{color: getStatusColor(selectedOrder.status), fontWeight:'800'}}>{t(`admin.orders.status.${selectedOrder.status}`)}</Text></Text>
                <Text style={s.detailRow}><Text style={s.detailLabel}>{t('admin.sales.payment')}: </Text>{selectedOrder.payment_status} • {selectedOrder.payment_method || 'COD'}</Text>
                <Text style={s.detailRow}><Text style={s.detailLabel}>{t('admin.sales.date')}: </Text>{new Date(selectedOrder.created_at).toLocaleString()}</Text>
                <View style={s.divider} />
                <Text style={s.itemsTitle}>{t('admin.sales.items', { count: selectedOrder.order_items?.length || 0 })}</Text>
                {selectedOrder.order_items?.map((it:any, i:number)=>(
                  <View key={i} style={s.itemRow}><Text style={s.itemTxt}>{it.products?.name || 'Product'} x{it.quantity}</Text><Text style={s.itemPrice}>EGP {it.price}</Text></View>
                ))}
                <View style={s.divider} />
                <Text style={s.totalTxt}>{t('admin.orders.total')}: EGP {Number(selectedOrder.total).toFixed(2)}</Text>
                {selectedOrder.delivery_address && <Text style={s.addressTxt}>📍 {selectedOrder.delivery_address}</Text>}
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  bg:{flex:1, backgroundColor:'#FFFFFF', padding:16, paddingTop:50},
  header:{flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:12},
  gear:{width:42, height:42, borderRadius:21, backgroundColor:'#F0FDF4', justifyContent:'center', alignItems:'center', borderWidth:1, borderColor:'#BBF7D0'},
  h1:{color:'#111', fontSize:28, fontWeight:'800'},
  topRow:{flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:16},
  calendarBtn:{flexDirection:'row', alignItems:'center', backgroundColor:'#16A34A', paddingHorizontal:14, paddingVertical:9, borderRadius:22, gap:8},
  calText:{color:'#FFF', fontWeight:'800', fontSize:12},
  tabs:{flexDirection:'row', gap:6},
  tab:{paddingHorizontal:12, paddingVertical:8, borderRadius:20, backgroundColor:'#FFFFFF', borderWidth:1, borderColor:'#E5E5E5'},
  tabActive:{backgroundColor:'#16A34A', borderColor:'#16A34A'},
  tabTxt:{color:'#666', fontSize:10, fontWeight:'800'},
  tabTxtActive:{color:'#FFFFFF'},
  summary:{backgroundColor:'#FFFFFF', padding:20, borderRadius:22, marginBottom:16, borderWidth:1, borderColor:'#E5E5E5', alignItems:'flex-end'},
  sumHeader:{flexDirection:'row', gap:8, alignItems:'center', alignSelf:'flex-start'},
  sumLab:{color:'#888', fontSize:11, letterSpacing:0.5, fontWeight:'700'},
  sumVal:{color:'#111', fontSize:36, fontWeight:'800', marginTop:8, alignSelf:'center'},
  sumRow:{flexDirection:'row', gap:8, marginTop:14, alignSelf:'center'},
  sumChipGreen:{backgroundColor:'#F0FDF4', paddingHorizontal:12, paddingVertical:6, borderRadius:20, borderWidth:1, borderColor:'#BBF7D0'},
  sumChipYellow:{backgroundColor:'#FEF3C7', paddingHorizontal:12, paddingVertical:6, borderRadius:20, borderWidth:1, borderColor:'#FDE68A'},
  chipTxtGreen:{color:'#16A34A', fontSize:11, fontWeight:'800'},
  chipTxtYellow:{color:'#92400E', fontSize:11, fontWeight:'800'},
  orderCard:{flexDirection:'row', justifyContent:'space-between', alignItems:'center', padding:16, backgroundColor:'#FFFFFF', borderRadius:16, marginBottom:10, borderWidth:1, borderColor:'#E5E5E5'},
  cardLeft:{flexDirection:'row', alignItems:'center', gap:10},
  statusDot:{width:8, height:8, borderRadius:4},
  orderId:{color:'#111', fontWeight:'800', fontSize:14},
  orderDate:{color:'#888', fontSize:11, marginTop:2, fontWeight:'600'},
  cardRight:{alignItems:'center', flexDirection:'row', gap:6, justifyContent:'flex-end'},
  orderTotal:{color:'#16A34A', fontWeight:'800', fontSize:14},
  modalOverlay:{flex:1, backgroundColor:'rgba(0,0,0,0.4)', justifyContent:'center', padding:20},
  calendarBox:{backgroundColor:'#FFFFFF', borderRadius:20, padding:20, borderWidth:1, borderColor:'#E5E5E5'},
  calTitle:{color:'#111', fontWeight:'800', fontSize:16, marginBottom:16},
  dateBtn:{flexDirection:'row', justifyContent:'space-between', backgroundColor:'#F9F9F9', padding:16, borderRadius:12, borderWidth:1, borderColor:'#E5E5E5'},
  dateBtnText:{color:'#111', fontWeight:'700'},
  modalActions:{flexDirection:'row', gap:10, marginTop:20},
  cancelBtn:{flex:1, padding:14, backgroundColor:'#F5F5F5', borderRadius:12, alignItems:'center'},
  cancelTxt:{color:'#111', fontWeight:'700'},
  applyBtn:{flex:1, padding:14, backgroundColor:'#16A34A', borderRadius:12, alignItems:'center'},
  applyTxt:{color:'#FFFFFF', fontWeight:'800'},
  detailsBox:{backgroundColor:'#FFFFFF', borderRadius:20, padding:20, borderWidth:1, borderColor:'#E5E5E5'},
  detailsHeader:{flexDirection:'row', justifyContent:'space-between', marginBottom:16},
  detailsTitle:{color:'#111', fontSize:18, fontWeight:'800'},
  detailRow:{color:'#111', marginBottom:8, fontSize:13, fontWeight:'500'},
  detailLabel:{color:'#888', fontWeight:'600'},
  divider:{height:1, backgroundColor:'#F0F0F0', marginVertical:12},
  itemsTitle:{color:'#16A34A', fontWeight:'800', marginBottom:8},
  itemRow:{flexDirection:'row', justifyContent:'space-between', marginBottom:6},
  itemTxt:{color:'#555', fontSize:12, fontWeight:'600'},
  itemPrice:{color:'#111', fontSize:12, fontWeight:'700'},
  totalTxt:{color:'#111', fontWeight:'800', fontSize:18, marginTop:4, textAlign:'right'},
  addressTxt:{color:'#888', fontSize:11, marginTop:12, fontWeight:'600'}
});