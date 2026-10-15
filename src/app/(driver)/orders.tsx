import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, Pressable, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../../lib/supabase';
const BLACK='#000000';

function DeliveryChatBox({ orderId, onClose }: { orderId: string, onClose: () => void }) {
  const [msgs, setMsgs] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [convId, setConvId] = useState<string|null>(null);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      let { data: conv } = await supabase.from('chat_conversations').select('*').eq('order_id', orderId).eq('type', 'delivery').single();
      if (!conv) {
        const { data: nc } = await supabase.from('chat_conversations').insert([{ order_id: orderId, type: 'delivery' }]).select().single();
        conv = nc;
      }
      if (!conv || !isMounted) return;
      setConvId(conv.id);
      const { data } = await supabase.from('chat_messages').select('*').eq('conversation_id', conv.id).order('created_at');
      if (isMounted) setMsgs(data||[]);

      // Remove any stale channel for this conversation. Under React Strict
      // Mode the effect may re-run while a previous channel's removeChannel
      // (async, awaited WebSocket leave) hasn't removed it from the internal
      // `channels` array — channel() would then return the leaving-state
      // channel and .subscribe() would silently no-op. Synchronously splice
      // stale channels from the array (mirrors RealtimeClient._remove) and
      // fire-and-forget removeChannel for WS cleanup.
      const chatTopic = `delivery-chat-${conv.id}`;
      const realtimeChatTopic = `realtime:${chatTopic}`;
      const staleChat = supabase.getChannels().filter((c) => c.topic === realtimeChatTopic);
      staleChat.forEach((c) => supabase.removeChannel(c));
      supabase.realtime.channels = supabase.realtime.channels.filter(
        (c) => c.topic !== realtimeChatTopic
      );

      const ch = supabase.channel(chatTopic).on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `conversation_id=eq.${conv.id}` },
        (p) => setMsgs(m => [...m, p.new])
      ).subscribe();
      channelRef.current = ch;
    })();

    // Cleanup must come from the useEffect callback, not the async IIFE,
    // so React actually runs it on unmount.
    return () => {
      isMounted = false;
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, [orderId]);

  const send = async () => {
    if (!text.trim() ||!convId) return;
    await supabase.from('chat_messages').insert([{ conversation_id: convId, sender_role: 'delivery', message: text.trim() }]);
    setText('');
  };

  return (
    <View style={{ flex:1, backgroundColor:'#fff', borderTopLeftRadius:24, borderTopRightRadius:24, padding:16, maxHeight:'85%' }}>
      <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
        <Text style={{ fontWeight:'900', fontSize:16 }}>شات العميل - #{orderId.slice(0,6)}</Text>
        <TouchableOpacity onPress={onClose} style={{ width:32, height:32, backgroundColor:'#f1f1f1', borderRadius:16, justifyContent:'center', alignItems:'center' }}>
          <Ionicons name="close" size={20} />
        </TouchableOpacity>
      </View>

      <FlatList data={msgs} keyExtractor={i=>i.id} style={{ flex:1 }} contentContainerStyle={{ paddingVertical:10, gap:8 }}
        renderItem={({item})=>(
          <View style={{ alignSelf: item.sender_role==='delivery'?'flex-end':'flex-start', backgroundColor: item.sender_role==='delivery'?BLACK:'#EDEDED', padding:12, borderRadius:16, maxWidth:'80%' }}>
            <Text style={{ color: item.sender_role==='delivery'?'#fff':'#000', fontWeight:'600' }}>{item.message}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={{ textAlign:'center', color:'#999', marginTop:40 }}>قول للعميل انك في الطريق 🚚</Text>}
      />

      <View style={{ flexDirection:'row', gap:8, marginTop:12, paddingBottom:10 }}>
        <TextInput value={text} onChangeText={setText} placeholder="مثلا: انا قدام البيت..." style={{ flex:1, backgroundColor:'#f5f5f5', padding:14, borderRadius:24, fontWeight:'600' }} onSubmitEditing={send}/>
        <TouchableOpacity onPress={send} style={{ width:48, height:48, borderRadius:24, backgroundColor:BLACK, justifyContent:'center', alignItems:'center' }}>
          <Ionicons name="send" size={20} color="#fff"/>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function Orders(){
  const [tab,setTab]=useState<'pending'|'active'|'done'>('pending');
  const [orders,setOrders]=useState<any[]>([]);
  const [loading,setLoading]=useState(true);
  const [selectedChat, setSelectedChat]=useState<string|null>(null);

  const load = async () => {
    setLoading(true);
    const {data:{user}}=await supabase.auth.getUser();
    let q=supabase.from('orders').select('*').order('created_at',{ascending:false});
    if(tab==='pending') q=q.eq('status','pending').is('driver_id',null);
    if(tab==='active') q=q.eq('driver_id',user?.id).in('status',['out_for_delivery','preparing','ready']);
    if(tab==='done') q=q.eq('driver_id',user?.id).eq('status','delivered');
    const {data}=await q; setOrders(data||[]); setLoading(false);
  };

  useEffect(()=>{ load(); },[tab]);

  const acceptOrder = async (orderId: string) => {
    const {data:{user}} = await supabase.auth.getUser();
    // Ownership check: only unassigned orders (driver_id IS NULL) can be claimed.
    // This prevents race conditions where multiple drivers claim the same order.
    const { error } = await supabase.from('orders').update({ driver_id: user?.id, status: 'out_for_delivery' }).eq('id', orderId).eq('driver_id', null);
    if (error) Alert.alert('خطأ', error.message);
    else { Alert.alert('تم', 'استلمت الطلب - تقدر تكلم العميل دلوقتي'); load(); setTab('active'); }
  };

  const markDelivered = async (orderId: string) => {
    const {data:{user}} = await supabase.auth.getUser();
    // Ownership + status check: only the assigned driver can mark delivery,
    // and only from 'out_for_delivery' status.
    const { error } = await supabase.from('orders').update({ status: 'delivered' }).eq('id', orderId).eq('driver_id', user?.id).eq('status', 'out_for_delivery');
    if (!error) load();
  };

  return(
    <View style={s.c}>
      <Text style={s.title}>تاريخ الطلبات</Text>
      <View style={s.tabs}>
        <Pressable onPress={()=>setTab('pending')} style={[s.tab,tab==='pending'&&s.tabActive]}><Text style={tab==='pending'?s.tabTActive:s.tabT}>الكل</Text></Pressable>
        <Pressable onPress={()=>setTab('active')} style={[s.tab,tab==='active'&&s.tabActive]}><Text style={tab==='active'?s.tabTActive:s.tabT}>نشط</Text></Pressable>
        <Pressable onPress={()=>setTab('done')} style={[s.tab,tab==='done'&&s.tabActive]}><Text style={tab==='done'?s.tabTActive:s.tabT}>مكتمل</Text></Pressable>
      </View>
      {loading?<ActivityIndicator color={BLACK} style={{marginTop:30}}/>:
      <FlatList data={orders} keyExtractor={i=>i.id} contentContainerStyle={{padding:16, paddingBottom:100}} renderItem={({item})=>(
        <View style={s.card}>
          <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center' }}>
            <Text style={s.id}>طلب #{item.id.slice(0,6)} - {item.status}</Text>
            <TouchableOpacity onPress={()=>setSelectedChat(item.id)} style={{ backgroundColor:'#f1f1f1', padding:8, borderRadius:20 }}>
              <Ionicons name="chatbubble-ellipses" size={18} color={BLACK}/>
            </TouchableOpacity>
          </View>
          <Text style={s.price}>{item.total||0} EGP</Text>
          <Text style={{ fontSize:11, color:'#888', marginTop:4 }}>{item.delivery_address_text || item.street || ''}</Text>

          <View style={{ flexDirection:'row', gap:8, marginTop:12 }}>
            {tab==='pending' && (
              <TouchableOpacity onPress={()=>acceptOrder(item.id)} style={{ flex:1, backgroundColor:BLACK, padding:12, borderRadius:10, alignItems:'center' }}>
                <Text style={{ color:'#fff', fontWeight:'900' }}>استلام الطلب ✅</Text>
              </TouchableOpacity>
            )}
            {tab==='active' && (
              <>
                <TouchableOpacity onPress={()=>setSelectedChat(item.id)} style={{ flex:1, backgroundColor:'#fff', borderWidth:1, borderColor:BLACK, padding:12, borderRadius:10, alignItems:'center', flexDirection:'row', justifyContent:'center', gap:6 }}>
                  <Ionicons name="chatbubble" size={16} color={BLACK}/><Text style={{ fontWeight:'800' }}>كلم العميل</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={()=>markDelivered(item.id)} style={{ flex:1, backgroundColor:BLACK, padding:12, borderRadius:10, alignItems:'center' }}>
                  <Text style={{ color:'#fff', fontWeight:'900' }}>تم التوصيل</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      )}/>}

      <Modal visible={!!selectedChat} transparent animationType="slide" onRequestClose={()=>setSelectedChat(null)}>
        <View style={{ flex:1, backgroundColor:'rgba(0,0,0,0.4)', justifyContent:'flex-end' }}>
          {selectedChat && <DeliveryChatBox orderId={selectedChat} onClose={()=>setSelectedChat(null)} />}
        </View>
      </Modal>
    </View>
  );
}
const s=StyleSheet.create({
  c:{flex:1,backgroundColor:'#F8F8F8',paddingTop:60}, title:{fontWeight:'900',fontSize:18,paddingHorizontal:16},
  tabs:{flexDirection:'row',backgroundColor:'#eee',margin:16,borderRadius:12,padding:4}, tab:{flex:1,padding:8,alignItems:'center',borderRadius:8}, tabActive:{backgroundColor:BLACK}, tabT:{fontSize:12,fontWeight:'700'}, tabTActive:{fontSize:12,fontWeight:'700',color:'#fff'},
  card:{backgroundColor:'#fff',padding:14,borderRadius:12,marginBottom:10,borderWidth:1,borderColor:'#eee'}, id:{fontWeight:'700',fontSize:13}, price:{marginTop:4,fontWeight:'900'},
});