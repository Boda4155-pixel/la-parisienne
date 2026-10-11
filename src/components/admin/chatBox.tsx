import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { FlatList, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../../lib/supabase';

export default function ChatBox({ orderId, role, type='cashier' }: {
  orderId: string,
  role: 'customer'|'cashier'|'delivery'|'admin',
  type?: 'cashier'|'delivery'
}) {
  const [convId, setConvId] = useState<string|null>(null);
  const [msgs, setMsgs] = useState<any[]>([]);
  const [text, setText] = useState('');
  const ref = useRef<FlatList>(null);

  useEffect(() => {
    (async () => {
      let { data: conv } = await supabase.from('chat_conversations').select('*').eq('order_id', orderId).eq('type', type).single();
      if (!conv) {
        const { data: nc } = await supabase.from('chat_conversations').insert([{ order_id: orderId, type }]).select().single();
        conv = nc;
      }
      if (!conv) return;
      setConvId(conv.id);
      const { data } = await supabase.from('chat_messages').select('*').eq('conversation_id', conv.id).order('created_at');
      setMsgs(data||[]);
    })();
  }, [orderId, type]);

  useEffect(() => {
    if (!convId) return;
    const ch = supabase.channel(`chat-${convId}`).on('postgres_changes',{event:'INSERT',schema:'public',table:'chat_messages',filter:`conversation_id=eq.${convId}`}, p=> {
      setMsgs(m=>[...m, p.new]);
      setTimeout(()=>ref.current?.scrollToEnd(),100);
    }).subscribe();
    return ()=>{ supabase.removeChannel(ch); };
  }, [convId]);

  const send = async () => {
    if (!text.trim()||!convId) return;
    await supabase.from('chat_messages').insert([{
      conversation_id: convId,
      sender_role: role==='customer'?'customer': role==='delivery'?'delivery':'cashier',
      message: text.trim()
    }]);
    setText('');
  };

  return (
    <View style={{ backgroundColor:'#1a1a1a', borderRadius:12, padding:10, height:320 }}>
      <View style={{ flexDirection:'row', alignItems:'center', gap:6, marginBottom:8 }}>
        <Ionicons name={type==='delivery'?'bicycle':'receipt'} size={16} color="#c9b896"/>
        <Text style={{ color:'#c9b896', fontWeight:'700', fontSize:12 }}>{type==='delivery'?'شات الدليفري':'شات الكاشير'}</Text>
      </View>
      <FlatList ref={ref} data={msgs} keyExtractor={i=>i.id} renderItem={({item})=>(
        <View style={{ alignSelf: 'flex-start', backgroundColor: item.sender_role===role?'#c9b896':'#2a2a2a', padding:10, borderRadius:12, marginVertical:4, maxWidth:'80%',...(item.sender_role===role?{alignSelf:'flex-end'}:{}) }}>
          <Text style={{ color: item.sender_role===role?'#000':'#fff' }}>{item.message}</Text>
        </View>
      )} ListEmptyComponent={<Text style={{color:'#666',textAlign:'center',marginTop:30}}>مفيش رسائل لسه</Text>}/>
      <View style={{ flexDirection:'row', gap:8, marginTop:10 }}>
        <TextInput value={text} onChangeText={setText} placeholder={type==='delivery'?'فينك؟':'اكتب رسالة...'} placeholderTextColor="#888" style={{ flex:1, backgroundColor:'#222', color:'#fff', padding:12, borderRadius:20 }} onSubmitEditing={send}/>
        <TouchableOpacity onPress={send} style={{ width:44, height:44, borderRadius:22, backgroundColor:'#c9b896', justifyContent:'center', alignItems:'center' }}><Ionicons name="send" size={18} color="#000"/></TouchableOpacity>
      </View>
    </View>
  );
}