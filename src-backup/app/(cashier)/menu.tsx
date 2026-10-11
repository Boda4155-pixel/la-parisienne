import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../../lib/supabase';

export default function MenuPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await supabase.from('products').select('*').order('category').order('name');
    setProducts(data || []);
    setLoading(false);
  };
  useEffect(() => { 
    load();
    const ch = supabase.channel('menu-live').on('postgres_changes',{event:'*',schema:'public',table:'products'},()=>load()).subscribe();
    return ()=>{ supabase.removeChannel(ch); }
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

  if(loading) return <View style={{flex:1,justifyContent:'center',alignItems:'center', backgroundColor:'#FAFAF8'}}><ActivityIndicator size="large" color="#C5A059"/></View>;

  return (
    <View style={{flex:1,backgroundColor:'#FAFAF8'}}>
      {/* Header اسود دهبي */}
      <View style={{backgroundColor:'#0A0A0A',paddingTop:50,paddingBottom:18,paddingHorizontal:16,flexDirection:'row',justifyContent:'space-between',alignItems:'center', borderBottomWidth:1.5, borderBottomColor:'#C5A059', borderBottomLeftRadius:22, borderBottomRightRadius:22}}>
        <TouchableOpacity onPress={load} style={{backgroundColor:'#1E1E1E',borderWidth:1,borderColor:'#C5A059',padding:8,borderRadius:20}}><Ionicons name="refresh" size={18} color="#C5A059"/></TouchableOpacity>
        <Text style={{fontWeight:'900',fontSize:19, color:'white', textAlign:'right'}}>LA PARISIENNE{'\n'}<Text style={{fontWeight:'700', fontSize:13, color:'#C5A059'}}>قائمتي • {products.length} منتج</Text></Text>
      </View>

      <ScrollView contentContainerStyle={{padding:12,paddingBottom:120, gap:2}}>
        {products.map(p=>(
          <View key={p.id} style={{backgroundColor:'white',borderRadius:16,padding:12,marginBottom:10,flexDirection:'row',alignItems:'center', borderWidth:1, borderColor: p.is_available ? '#E8DCC6' : '#eee', opacity: p.is_available ? 1 : 0.6, elevation:1}}>
            
            <View style={{gap:6, alignItems:'center'}}>
              <TouchableOpacity onPress={()=>stock(p,1)} style={{backgroundColor:'#0A0A0A',borderWidth:1,borderColor:'#C5A059',width:32,height:32,borderRadius:8,justifyContent:'center',alignItems:'center'}}><Ionicons name="add" size={16} color="#C5A059"/></TouchableOpacity>
              <Text style={{fontSize:11, fontWeight:'900', color:'#0A0A0A'}}>{p.stock ?? 0}</Text>
              <TouchableOpacity onPress={()=>stock(p,-1)} style={{backgroundColor:'white',borderWidth:1,borderColor:'#0A0A0A',width:32,height:32,borderRadius:8,justifyContent:'center',alignItems:'center'}}><Ionicons name="remove" size={16} color="#0A0A0A"/></TouchableOpacity>
            </View>

            <View style={{flex:1,marginHorizontal:12,alignItems:'flex-end'}}>
              <Text style={{fontWeight:'900',fontSize:14, color:'#0A0A0A'}} numberOfLines={1}>{p.name}</Text>
              <View style={{flexDirection:'row', gap:6, marginTop:6, alignItems:'center'}}>
                 <View style={{backgroundColor:'#FBF6EC', borderWidth:1, borderColor:'#E8DCC6', paddingHorizontal:8, paddingVertical:2, borderRadius:8}}><Text style={{fontSize:11, fontWeight:'800', color:'#C5A059'}}>{p.price} ج.م</Text></View>
                 <Text style={{fontSize:11,color:'#8A8A8A'}}>{p.category || 'عام'}</Text>
              </View>
              <View style={{flexDirection:'row', alignItems:'center', gap:8, marginTop:8}}>
                <Text style={{fontSize:11, fontWeight:'700', color: p.is_available ? '#0A0A0A' : '#999'}}>{p.is_available ? 'متاح' : 'غير متاح'}</Text>
                <Switch value={!!p.is_available} onValueChange={()=>toggle(p)} trackColor={{true:'#C5A059', false:'#ddd'}} thumbColor={p.is_available ? '#0A0A0A' : '#fff'} style={{transform:[{scaleX:0.8},{scaleY:0.8}]}}/>
              </View>
            </View>

            <Image source={{uri: p.image_url || p.image || 'https://images.unsplash.com/photo-1555507036-ab1f4038808a'}} style={{width:64,height:64,borderRadius:12,backgroundColor:'#eee', borderWidth:1, borderColor:'#E8DCC6'}}/>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}