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
    if(status === 'delivered') return '#4CAF50';
    if(status === 'cancelled') return '#F44336';
    if(status === 'confirmed') return '#2196F3';
    return '#FFC107';
  };

  return (
    <View style={s.bg}>
      <View style={s.header}>
        <TouchableOpacity onPress={()=> {}} style={s.gear}><Ionicons name="settings" size={22} color="#888" /></TouchableOpacity>
        <Text style={s.h1}>{t('admin.sales.title')}</Text>
      </View>

      <View style={s.topRow}>
        <TouchableOpacity style={s.calendarBtn} onPress={()=> setShowCalendar(true)}>
          <Text style={s.calText}>{filter==='custom'? customDate.toLocaleDateString('en-GB') : t('admin.sales.pickDate')}</Text>
          <Ionicons name="calendar" size={18} color="#000" />
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
          <Ionicons name="trending-up" size={16} color="#E8C87A" />
          <Text style={s.sumLab}>{t('admin.sales.totalSales')} ({orders.length})</Text>
        </View>
        <Text style={s.sumVal}>EGP {total.toFixed(2)}</Text>
        <View style={s.sumRow}>
          <View style={s.sumChipGreen}><Text style={s.chipTxt}>{t('admin.sales.paid')}: EGP {paid.toFixed(0)}</Text></View>
          <View style={s.sumChipYellow}><Text style={[s.chipTxt,{color:'#000'}]}>{t('admin.sales.pending')}: EGP {pendingPayment.toFixed(0)}</Text></View>
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
              <Ionicons name="chevron-forward" size={14} color="#666" />
            </View>
          </TouchableOpacity>
        ))}
        {orders.length===0 && <Text style={{color:'#666', textAlign:'center', marginTop:50}}>{t('admin.sales.noSales')}</Text>}
      </ScrollView>

      <Modal visible={showCalendar} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.calendarBox}>
            <Text style={s.calTitle}>{t('admin.sales.pickDateTitle')}</Text>
            <TouchableOpacity style={s.dateBtn} onPress={()=> setShowDatePicker(true)}>
              <Text style={s.dateBtnText}>{customDate.toDateString()}</Text>
              <Ionicons name="calendar-outline" size={20} color="#E8C87A" />
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
              <TouchableOpacity onPress={()=> setSelectedOrder(null)}><Ionicons name="close" size={24} color="#fff" /></TouchableOpacity>
            </View>
            {selectedOrder && (
              <>
                <Text style={s.detailRow}><Text style={s.detailLabel}>{t('admin.orders.name')}: </Text>{selectedOrder.profile?.full_name || selectedOrder.customer_name || t('admin.orders.guest')}</Text>
                <Text style={s.detailRow}><Text style={s.detailLabel}>{t('admin.orders.phone')}: </Text>{selectedOrder.profile?.phone || selectedOrder.customer_phone || 'N/A'}</Text>
                <Text style={s.detailRow}><Text style={s.detailLabel}>{t('admin.orders.statusLabel')}: </Text><Text style={{color: getStatusColor(selectedOrder.status), fontWeight:'bold'}}>{t(`admin.orders.status.${selectedOrder.status}`)}</Text></Text>
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
  bg:{flex:1, backgroundColor:'#0F0F0F', padding:16, paddingTop:50},
  header:{flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:12},
  gear:{width:42, height:42, borderRadius:21, backgroundColor:'#1E1E1E', justifyContent:'center', alignItems:'center', borderWidth:1, borderColor:'#2A2A2A'},
  h1:{color:'#fff', fontSize:28, fontWeight:'bold'},
  topRow:{flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:16},
  calendarBtn:{flexDirection:'row', alignItems:'center', backgroundColor:'#E8C87A', paddingHorizontal:14, paddingVertical:9, borderRadius:22, gap:8},
  calText:{color:'#000', fontWeight:'bold', fontSize:12},
  tabs:{flexDirection:'row', gap:6},
  tab:{paddingHorizontal:12, paddingVertical:8, borderRadius:20, backgroundColor:'#1E1E1E', borderWidth:1, borderColor:'#2A2A2A'},
  tabActive:{backgroundColor:'#E8C87A', borderColor:'#E8C87A'},
  tabTxt:{color:'#666', fontSize:10, fontWeight:'bold'}, tabTxtActive:{color:'#000'},
  summary:{backgroundColor:'#1A1A1A', padding:20, borderRadius:22, marginBottom:16, borderWidth:1, borderColor:'#222', alignItems:'flex-end'},
  sumHeader:{flexDirection:'row', gap:8, alignItems:'center', alignSelf:'flex-start'}, sumLab:{color:'#888', fontSize:11, letterSpacing:1}, sumVal:{color:'#E8C87A', fontSize:36, fontWeight:'bold', marginTop:8, alignSelf:'center'}, sumRow:{flexDirection:'row', gap:8, marginTop:14, alignSelf:'center'}, sumChipGreen:{backgroundColor:'#12321A', paddingHorizontal:12, paddingVertical:6, borderRadius:20, borderWidth:1, borderColor:'#4CAF5040'}, sumChipYellow:{backgroundColor:'#332A14', paddingHorizontal:12, paddingVertical:6, borderRadius:20, borderWidth:1, borderColor:'#FFC10740'}, chipTxt:{color:'#4CAF50', fontSize:11, fontWeight:'bold'},
  orderCard:{flexDirection:'row', justifyContent:'space-between', alignItems:'center', padding:16, backgroundColor:'#161616', borderRadius:16, marginBottom:10, borderWidth:1, borderColor:'#222'},
  cardLeft:{flexDirection:'row', alignItems:'center', gap:10}, statusDot:{width:8, height:8, borderRadius:4}, orderId:{color:'#fff', fontWeight:'bold', fontSize:14}, orderDate:{color:'#666', fontSize:11, marginTop:2}, cardRight:{alignItems:'center', flexDirection:'row', gap:6, justifyContent:'flex-end'}, orderTotal:{color:'#E8C87A', fontWeight:'bold', fontSize:14},
  modalOverlay:{flex:1, backgroundColor:'rgba(0,0,0,0.85)', justifyContent:'center', padding:20},
  calendarBox:{backgroundColor:'#1E1E1E', borderRadius:20, padding:20, borderWidth:1, borderColor:'#2A2A2A'},
  calTitle:{color:'#fff', fontWeight:'bold', fontSize:16, marginBottom:16}, dateBtn:{flexDirection:'row', justifyContent:'space-between', backgroundColor:'#121212', padding:16, borderRadius:12, borderWidth:1, borderColor:'#333'}, dateBtnText:{color:'#fff'}, modalActions:{flexDirection:'row', gap:10, marginTop:20}, cancelBtn:{flex:1, padding:14, backgroundColor:'#2A2A2A', borderRadius:12, alignItems:'center'}, cancelTxt:{color:'#fff'}, applyBtn:{flex:1, padding:14, backgroundColor:'#E8C87A', borderRadius:12, alignItems:'center'}, applyTxt:{color:'#000', fontWeight:'bold'},
  detailsBox:{backgroundColor:'#1E1E1E', borderRadius:20, padding:20, borderWidth:1, borderColor:'#2A2A2A'}, detailsHeader:{flexDirection:'row', justifyContent:'space-between', marginBottom:16}, detailsTitle:{color:'#fff', fontSize:18, fontWeight:'bold'}, detailRow:{color:'#ccc', marginBottom:8, fontSize:13}, detailLabel:{color:'#888'}, divider:{height:1, backgroundColor:'#2A2A2A', marginVertical:12}, itemsTitle:{color:'#E8C87A', fontWeight:'bold', marginBottom:8}, itemRow:{flexDirection:'row', justifyContent:'space-between', marginBottom:6}, itemTxt:{color:'#aaa', fontSize:12}, itemPrice:{color:'#aaa', fontSize:12}, totalTxt:{color:'#E8C87A', fontWeight:'bold', fontSize:18, marginTop:4, textAlign:'right'}, addressTxt:{color:'#666', fontSize:11, marginTop:12}
});