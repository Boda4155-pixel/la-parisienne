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

  if(loading) return <View style={{flex:1,justifyContent:'center',alignItems:'center'}}><ActivityIndicator size="large" color="#2D1E16"/></View>;

  return (
    <View style={{flex:1,backgroundColor:'#F2F0EB'}}>
      <View style={{backgroundColor:'white',paddingTop:50,padding:16,flexDirection:'row',justifyContent:'space-between',alignItems:'center'}}>
        <Text style={{fontWeight:'900',fontSize:20}}>قائمتي • {products.length}</Text>
        <TouchableOpacity onPress={load} style={{backgroundColor:'#F5F5F5',padding:8,borderRadius:20}}><Ionicons name="refresh" size={20}/></TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{padding:12,paddingBottom:120}}>
        {products.map(p=>(
          <View key={p.id} style={{backgroundColor:'white',borderRadius:16,padding:12,marginBottom:10,flexDirection:'row',alignItems:'center',shadowColor:'#000',shadowOpacity:0.05,shadowRadius:4,elevation:2}}>
            <Switch value={!!p.is_available} onValueChange={()=>toggle(p)} trackColor={{true:'#2E7D32'}} thumbColor="white" style={{transform:[{scaleX:0.9},{scaleY:0.9}]}}/>
            <View style={{flex:1,marginHorizontal:12,alignItems:'flex-end'}}>
              <Text style={{fontWeight:'800',fontSize:15}}>{p.name}</Text>
              <Text style={{fontSize:12,color:'#888',marginTop:2}}>{p.category || 'عام'} • {p.price} ج • Stock {p.stock}</Text>
            </View>
            <Image source={{uri: p.image_url || p.image || 'https://images.unsplash.com/photo-1555507036-ab1f4038808a'}} style={{width:64,height:64,borderRadius:12,backgroundColor:'#eee'}}/>
            <View style={{marginLeft:10,gap:6}}>
              <TouchableOpacity onPress={()=>stock(p,1)} style={{backgroundColor:'#E8F5E9',width:32,height:32,borderRadius:8,justifyContent:'center',alignItems:'center'}}><Ionicons name="add" size={16}/></TouchableOpacity>
              <TouchableOpacity onPress={()=>stock(p,-1)} style={{backgroundColor:'#FFEBEE',width:32,height:32,borderRadius:8,justifyContent:'center',alignItems:'center'}}><Ionicons name="remove" size={16}/></TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}