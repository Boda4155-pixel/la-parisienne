import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';
import { CUSTOMER_COLORS } from '../../../lib/customerTheme';
import { supabase } from '../../../lib/supabase';

export default function MenuPage() {
  const C = CUSTOMER_COLORS;
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await supabase.from('products').select('*').order('category').order('name');
    setProducts(data || []);
    setLoading(false);
  };
  useEffect(() => {
    load();

    // Prevent stale-channel error in React Strict Mode: remove any existing
    // 'menu-live' channel before creating a fresh subscription.
    // removeChannel() is async (awaits WebSocket leave round-trip); we must
    // also synchronously splice the stale channel from the internal
    // `channels` array — otherwise channel() returns the leaving-state
    // channel and .subscribe() silently no-ops.
    const topic = 'menu-live';
    const realtimeTopic = `realtime:${topic}`;
    const stale = supabase.getChannels().filter((c) => c.topic === realtimeTopic);
    stale.forEach((c) => supabase.removeChannel(c));
    supabase.realtime.channels = supabase.realtime.channels.filter(
      (c) => c.topic !== realtimeTopic
    );

    const ch = supabase.channel(topic)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); }
  }, []);

  const toggle = async (p:any) => {
    const nv = !p.is_available;
    setProducts(s=>s.map(x=>x.id===p.id?{...x,is_available:nv}:x));
    await supabase.from('products').update({is_available:nv}).eq('id',p.id);
  };
  const stock = async (p:any,d:number) => {
    const ns = Math.max(0,(p.stock||0)+d);
    setProducts(s=>s.map(x=>x.id===p.id?{...x,stock:ns,is_available:ns===0?false:x.is_available}:x));
    await supabase.from('products').update({stock:ns, is_available: ns===0?false:p.is_available}).eq('id',p.id);
  };

  if(loading) return <View style={{flex:1,justifyContent:'center',alignItems:'center', backgroundColor: C.background}}><ActivityIndicator size="large" color={C.textPrimary}/></View>;

  return (
    <View style={{flex:1,backgroundColor: C.background}}>
      {/* Header بيج بني */}
      <View style={{backgroundColor: C.textPrimary, paddingTop:50, paddingBottom:18, paddingHorizontal:16, flexDirection:'row', justifyContent:'space-between', alignItems:'center', borderBottomLeftRadius:22, borderBottomRightRadius:22}}>
        <TouchableOpacity onPress={load} style={{backgroundColor:'rgba(255,255,255,0.15)', borderWidth:1, borderColor: C.accent, padding:8, borderRadius:20}}><Ionicons name="refresh" size={18} color={C.accent}/></TouchableOpacity>
        <Text style={{fontWeight:'900',fontSize:19, color: C.card, textAlign:'right'}}>LA PARISIENNE{'\n'}<Text style={{fontWeight:'700', fontSize:13, color: C.accent}}>قائمتي • {products.length} منتج</Text></Text>
      </View>

      <ScrollView contentContainerStyle={{padding:12,paddingBottom:120, gap:2}}>
        {products.map(p=>(
          <View key={p.id} style={{backgroundColor: C.card, borderRadius:16, padding:12, marginBottom:10, flexDirection:'row', alignItems:'center', borderWidth:1, borderColor: p.is_available ? C.border : '#eee', opacity: p.is_available ? 1 : 0.6, elevation:0}}>
            
            <View style={{gap:6, alignItems:'center'}}>
              <TouchableOpacity onPress={()=>stock(p,1)} style={{backgroundColor: C.textPrimary, width:32, height:32, borderRadius:8, justifyContent:'center', alignItems:'center'}}><Ionicons name="add" size={16} color={C.card}/></TouchableOpacity>
              <Text style={{fontSize:11, fontWeight:'900', color: C.textPrimary}}>{p.stock ?? 0}</Text>
              <TouchableOpacity onPress={()=>stock(p,-1)} style={{backgroundColor: C.card, borderWidth:1, borderColor: C.border, width:32, height:32, borderRadius:8, justifyContent:'center', alignItems:'center'}}><Ionicons name="remove" size={16} color={C.textPrimary}/></TouchableOpacity>
            </View>

            <View style={{flex:1,marginHorizontal:12,alignItems:'flex-end'}}>
              <Text style={{fontWeight:'900',fontSize:14, color: C.textPrimary}} numberOfLines={1}>{p.name}</Text>
              <View style={{flexDirection:'row', gap:6, marginTop:6, alignItems:'center'}}>
                 <View style={{backgroundColor: C.searchBg, borderWidth:1, borderColor: C.border, paddingHorizontal:8, paddingVertical:2, borderRadius:8}}><Text style={{fontSize:11, fontWeight:'800', color: C.textPrimary}}>{p.price} ج.م</Text></View>
                 <Text style={{fontSize:11,color: C.textMuted}}>{p.category || 'عام'}</Text>
              </View>
              <View style={{flexDirection:'row', alignItems:'center', gap:8, marginTop:8}}>
                <Text style={{fontSize:11, fontWeight:'700', color: p.is_available ? C.textPrimary : C.textMuted}}>{p.is_available ? 'متاح' : 'غير متاح'}</Text>
                <Switch value={!!p.is_available} onValueChange={()=>toggle(p)} trackColor={{true: C.accent, false: '#ddd'}} thumbColor={p.is_available ? C.textPrimary : '#fff'} style={{transform:[{scaleX:0.8},{scaleY:0.8}]}}/>
              </View>
            </View>

            <Image source={{uri: p.image_url || p.image || 'https://images.unsplash.com/photo-1555507036-ab1f4038808a'}} style={{width:64,height:64,borderRadius:12,backgroundColor: C.searchBg, borderWidth:1, borderColor: C.border}}/>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}