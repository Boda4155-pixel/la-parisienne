import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../../lib/supabase';

type FilterType = 'current' | 'accepted' | 'rejected';

// كومبوننت الشات جوة نفس الملف عشان متتلخبطش في الـ imports
function CashierChatBox({ orderId, onClose }: { orderId: string, onClose: () => void }) {
  const [msgs, setMsgs] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [convId, setConvId] = useState<string|null>(null);

  useEffect(() => {
    (async () => {
      let { data: conv } = await supabase.from('chat_conversations').select('*').eq('order_id', orderId).eq('type', 'cashier').single();
      if (!conv) {
        const { data: nc } = await supabase.from('chat_conversations').insert([{ order_id: orderId, type: 'cashier' }]).select().single();
        conv = nc;
      }
      if (!conv) return;
      setConvId(conv.id);
      const { data } = await supabase.from('chat_messages').select('*').eq('conversation_id', conv.id).order('created_at');
      setMsgs(data||[]);

      const ch = supabase.channel(`cashier-chat-${conv.id}`).on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `conversation_id=eq.${conv.id}` },
        (p) => setMsgs(m => [...m, p.new])
      ).subscribe();
      return () => { supabase.removeChannel(ch); };
    })();
  }, [orderId]);

  const send = async () => {
    if (!text.trim() ||!convId) return;
    await supabase.from('chat_messages').insert([{ conversation_id: convId, sender_role: 'cashier', message: text.trim() }]);
    setText('');
  };

  return (
    <View style={{ flex:1, backgroundColor:'#fff', borderTopLeftRadius:24, borderTopRightRadius:24, padding:16, maxHeight:'85%' }}>
      <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
        <Text style={{ fontWeight:'900', fontSize:16 }}>شات العميل - #{orderId.slice(0,4).toUpperCase()}</Text>
        <TouchableOpacity onPress={onClose} style={{ width:32, height:32, backgroundColor:'#f1f1f1', borderRadius:16, justifyContent:'center', alignItems:'center' }}>
          <Ionicons name="close" size={20} />
        </TouchableOpacity>
      </View>

      <FlatList data={msgs} keyExtractor={i=>i.id} style={{ flex:1 }} contentContainerStyle={{ paddingVertical:10, gap:8 }}
        renderItem={({item})=>(
          <View style={{ alignSelf: item.sender_role==='cashier'?'flex-end':'flex-start', backgroundColor: item.sender_role==='cashier'?'#8B5CF6':'#EDEDED', padding:12, borderRadius:16, maxWidth:'80%' }}>
            <Text style={{ color: item.sender_role==='cashier'?'#fff':'#000', fontWeight:'600' }}>{item.message}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={{ textAlign:'center', color:'#999', marginTop:40 }}>مفيش رسائل - العميل مستني ردك</Text>}
      />

      <View style={{ flexDirection:'row', gap:8, marginTop:12, paddingBottom:10 }}>
        <TextInput value={text} onChangeText={setText} placeholder="رد على العميل..." style={{ flex:1, backgroundColor:'#f5f5f5', padding:14, borderRadius:24, fontWeight:'600' }} onSubmitEditing={send}/>
        <TouchableOpacity onPress={send} style={{ width:48, height:48, borderRadius:24, backgroundColor:'#8B5CF6', justifyContent:'center', alignItems:'center' }}>
          <Ionicons name="send" size={20} color="#fff"/>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function OrdersDashboard() {
  const insets = useSafeAreaInsets();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('current');
  const [selectedChatOrder, setSelectedChatOrder] = useState<any>(null);

  const loadData = async () => {
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (data) setOrders(data);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      setOrders(prev => prev.map(o => o.id === id? {...o, status: newStatus } : o));
      const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', id);
      if (error) throw error;
      if(newStatus === 'preparing') setFilter('accepted');
    } catch (e: any) {
      Alert.alert('خطأ', e.message);
      loadData();
    }
  };

  const filteredOrders = orders.filter(o => {
    if (filter === 'current') return ['pending','new','preparing'].includes(o.status);
    if (filter === 'accepted') return ['ready','out_for_delivery','delivered'].includes(o.status);
    if (filter === 'rejected') return o.status === 'cancelled';
    return true;
  });

  const counts = {
    current: orders.filter(o=>['pending','new','preparing'].includes(o.status)).length,
    accepted: orders.filter(o=>['ready','out_for_delivery','delivered'].includes(o.status)).length,
    rejected: orders.filter(o=>o.status==='cancelled').length,
  };

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F3FF' }}><ActivityIndicator color="#7C4DFF" /></View>;

  return (
    <View style={{ flex: 1, backgroundColor: '#EDEDED' }}>
      <View style={{ backgroundColor: '#8B5CF6', paddingTop: insets.top + 12, paddingBottom: 14, paddingHorizontal: 16, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}>
        <Text style={{ color: 'white', fontWeight: '900', fontSize: 20, textAlign: 'right' }}>Abdelrahman El Sawy</Text>
        <Text style={{ color: '#E9D5FF', fontSize: 12, textAlign: 'right' }}>إدارة الطلبات</Text>

        <View style={{ flexDirection: 'row', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
          <TouchableOpacity onPress={()=>setFilter('rejected')} style={{ backgroundColor: filter==='rejected'? '#fff' : 'rgba(255,255,255,0.2)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, flexDirection: 'row', gap: 6, alignItems: 'center' }}>
            <Text style={{ color: filter==='rejected'? '#8B5CF6' : '#fff', fontWeight: '800', fontSize: 12 }}>المرفوض ({counts.rejected})</Text>
            <Ionicons name="close-circle" size={16} color={filter==='rejected'? '#8B5CF6' : '#fff'} />
          </TouchableOpacity>
          <TouchableOpacity onPress={()=>setFilter('accepted')} style={{ backgroundColor: filter==='accepted'? '#fff' : 'rgba(255,255,255,0.2)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, flexDirection: 'row', gap: 6, alignItems: 'center' }}>
            <Text style={{ color: filter==='accepted'? '#8B5CF6' : '#fff', fontWeight: '800', fontSize: 12 }}>المقبول ({counts.accepted})</Text>
            <Ionicons name="checkmark-circle" size={16} color={filter==='accepted'? '#8B5CF6' : '#fff'} />
          </TouchableOpacity>
          <TouchableOpacity onPress={()=>setFilter('current')} style={{ backgroundColor: filter==='current'? '#fff' : 'rgba(255,255,255,0.2)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, flexDirection: 'row', gap: 6, alignItems: 'center' }}>
            <Text style={{ color: filter==='current'? '#8B5CF6' : '#fff', fontWeight: '800', fontSize: 12 }}>الحالي ({counts.current})</Text>
            <Ionicons name="time" size={16} color={filter==='current'? '#8B5CF6' : '#fff'} />
          </TouchableOpacity>
        </View>
      </View>

      {filteredOrders.length === 0 && (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }}>
          <Ionicons name={filter==='current'? "receipt-outline" : filter==='accepted'? "checkmark-done-outline" : "close-circle-outline"} size={70} color="#CCC"/>
          <Text style={{ fontWeight: '900', fontSize: 16, marginTop: 12 }}>{filter==='current'? 'مفيش طلبات حالية' : filter==='accepted'? 'مفيش مقبول' : 'مفيش مرفوض'}</Text>
        </View>
      )}

      <ScrollView contentContainerStyle={{ padding: 10, gap: 12, paddingBottom: 110 }}>
        {filteredOrders.map(o => {
          const isPending = ['pending','new'].includes(o.status);
          return (
            <TouchableOpacity key={o.id} onPress={()=>setSelectedChatOrder(o)} activeOpacity={0.8} style={{ backgroundColor: 'white', borderRadius: 12, overflow: 'hidden', elevation: 2 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 12 }}>
                <Text style={{ fontWeight: '800' }}>#{o.id.slice(0,4).toUpperCase()} - {o.total || o.total_amount} ج</Text>
                <View style={{ flexDirection:'row', gap:6 }}>
                  <TouchableOpacity style={{ backgroundColor:'#EDE9FE', paddingHorizontal:8, paddingVertical:3, borderRadius:8 }} onPress={()=>setSelectedChatOrder(o)}>
                    <Ionicons name="chatbubble-ellipses" size={14} color="#8B5CF6"/>
                  </TouchableOpacity>
                  <Text style={{ fontSize: 11, backgroundColor: isPending? '#FEF9C3' : '#E0E7FF', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, fontWeight: '700' }}>{o.status}</Text>
                </View>
              </View>
              <View style={{ height: 70, backgroundColor: '#E8F0E8', marginHorizontal: 8, borderRadius: 8, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 12, color: '#666' }}>{o.delivery_address_text || o.street || 'العنوان'}</Text>
              </View>
              <View style={{ padding: 8, flexDirection: 'row', gap: 8 }}>
                {(filter === 'current') && (
                  <>
                    <TouchableOpacity onPress={() => updateStatus(o.id, 'preparing')} style={{ flex: 1, backgroundColor: '#0D7EFF', borderRadius: 8, paddingVertical: 13, alignItems: 'center' }}>
                      <Text style={{ color: '#fff', fontWeight: '900' }}>قبول ✅</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => updateStatus(o.id, 'cancelled')} style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: '#FFCDD2', borderRadius: 8, paddingHorizontal: 18, justifyContent: 'center' }}>
                      <Text style={{ color: '#E53935', fontWeight: '800' }}>رفض</Text>
                    </TouchableOpacity>
                  </>
                )}
                {filter === 'accepted' && <View style={{ flex: 1, backgroundColor: '#DCFCE7', padding: 10, borderRadius: 8, alignItems: 'center' }}><Text style={{ color: '#16A34A', fontWeight: '800' }}>مقبول ✅ - اضغط للشات</Text></View>}
                {filter === 'rejected' && <View style={{ flex: 1, backgroundColor: '#FEE2E2', padding: 10, borderRadius: 8, alignItems: 'center' }}><Text style={{ color: '#DC2626', fontWeight: '800' }}>مرفوض ❌</Text></View>}
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* مودال الشات */}
      <Modal visible={!!selectedChatOrder} transparent animationType="slide" onRequestClose={()=>setSelectedChatOrder(null)}>
        <View style={{ flex:1, backgroundColor:'rgba(0,0,0,0.4)', justifyContent:'flex-end' }}>
          {selectedChatOrder && <CashierChatBox orderId={selectedChatOrder.id} onClose={()=>setSelectedChatOrder(null)} />}
        </View>
      </Modal>
    </View>
  );
}