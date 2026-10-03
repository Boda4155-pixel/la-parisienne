import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useNavigation, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Keyboard, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { supabase } from '../../../lib/supabase';

export default function StoreLocation(){
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const webRef = useRef<any>(null);
  const [coord, setCoord] = useState({lat: 30.0074, lng: 31.4913});
  const [address, setAddress] = useState('');
  const [search, setSearch] = useState('التجمع الخامس');
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(()=>{
    navigation.getParent()?.setOptions({ tabBarStyle: { display: 'none' } });
    const show = Keyboard.addListener('keyboardDidShow', (e)=> setKeyboardHeight(e.endCoordinates.height));
    const hide = Keyboard.addListener('keyboardDidHide', ()=> setKeyboardHeight(0));
    return ()=>{
      navigation.getParent()?.setOptions({ tabBarStyle: { display: 'flex' } });
      show.remove(); hide.remove();
    }
  },[]);

  const doSearch = () => {
    if(!search.trim()) return;
    setSearching(true); setResults([]);
    webRef.current?.postMessage(JSON.stringify({type:'search', q: search}));
  };

  const html = `
  <!DOCTYPE html><html><head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>html,body,#map{height:100%;margin:0;padding:0;background:#111}</style>
  </head><body><div id="map"></div>
  <script>
    var map = L.map('map',{zoomControl:false}).setView([30.0074, 31.4913], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19}).addTo(map);
    var curMarker = null;
    function setCur(lat,lng){
      if(curMarker) map.removeLayer(curMarker);
      curMarker = L.marker([lat,lng], {draggable:true}).addTo(map);
      curMarker.on('dragend', e=>{ var ll=e.target.getLatLng(); window.ReactNativeWebView.postMessage(JSON.stringify({lat:ll.lat,lng:ll.lng})); });
    }
    setCur(30.0074, 31.4913);
    map.on('click', e=>{ setCur(e.latlng.lat, e.latlng.lng); window.ReactNativeWebView.postMessage(JSON.stringify({lat:e.latlng.lat,lng:e.latlng.lng})); });
    function handleMsg(data){
      if(data.type==='search'){
        fetch('https://nominatim.openstreetmap.org/search?format=json&q='+encodeURIComponent(data.q)+'&countrycodes=eg&limit=5&accept-language=ar')
        .then(r=>r.json()).then(res=>{
            window.ReactNativeWebView.postMessage(JSON.stringify({type:'results', results:res}));
            if(res.length>0){ map.flyTo([res[0].lat, res[0].lon], 15); setCur(res[0].lat, res[0].lon); window.ReactNativeWebView.postMessage(JSON.stringify({lat:res[0].lat,lng:res[0].lon})); }
          }).catch(()=>{ window.ReactNativeWebView.postMessage(JSON.stringify({type:'results', results:[]})); });
      }
      if(data.type==='fly'){ map.flyTo([data.lat, data.lng], 16); setCur(data.lat, data.lng); }
    }
    document.addEventListener('message', e=>{ try{handleMsg(JSON.parse(e.data));}catch{} });
    window.addEventListener('message', e=>{ try{handleMsg(JSON.parse(e.data));}catch{} });
  </script></body></html>
  `;

  const selectResult = (r:any) => {
    const lat = parseFloat(r.lat), lng = parseFloat(r.lon);
    setCoord({lat,lng}); setAddress(r.display_name); setResults([]); setSearch(r.display_name.split(',')[0]);
    webRef.current?.postMessage(JSON.stringify({type:'fly', lat, lng}));
    Keyboard.dismiss();
  };

  const save = async () => {
    if(!address){ Alert.alert('اكتب العنوان'); return; }
    setSaving(true);
    const payload = { address, lat: coord.lat, lng: coord.lng };
    const {data:ex} = await supabase.from('store_settings').select('id').limit(1).single();
    if(ex) await supabase.from('store_settings').update(payload).eq('id', ex.id);
    else await supabase.from('store_settings').insert(payload);
    setSaving(false); Alert.alert('تم','تم حفظ موقع المتجر ✅'); router.back();
  };

  return (
    <KeyboardAvoidingView style={s.bg} behavior={Platform.OS==='ios'?'padding':'height'}>
      <View style={[s.header, {paddingTop: insets.top + 10}]}>
        <TouchableOpacity onPress={()=>router.back()} style={s.back}><Ionicons name="chevron-forward" size={20} color="#fff"/></TouchableOpacity>
        <Text style={s.h1}>تحديد موقع المتجر</Text>
        <TouchableOpacity onPress={async()=>{
          let {status}=await Location.requestForegroundPermissionsAsync();
          if(status!=='granted') return;
          let loc=await Location.getCurrentPositionAsync({});
          setCoord({lat:loc.coords.latitude, lng:loc.coords.longitude});
          webRef.current?.postMessage(JSON.stringify({type:'fly', lat:loc.coords.latitude, lng:loc.coords.longitude}));
        }} style={s.loc}><Ionicons name="locate" size={18} color="#000"/></TouchableOpacity>
      </View>

      <View style={s.searchWrap}>
        <TouchableOpacity onPress={doSearch} style={s.searchBtn}>{searching?<ActivityIndicator size="small" color="#000"/>:<Ionicons name="search" size={18} color="#000"/>}</TouchableOpacity>
        <TextInput value={search} onChangeText={setSearch} placeholder="ابحث: التجمع الخامس..." placeholderTextColor="#666" style={s.searchInput} onSubmitEditing={doSearch} returnKeyType="search"/>
      </View>

      {results.length>0 && (
        <View style={s.results}>
          {results.map((r,i)=>(
            <TouchableOpacity key={i} onPress={()=>selectResult(r)} style={s.resultItem}>
              <Ionicons name="location-outline" size={16} color="#E8C87A"/>
              <Text style={s.resultTxt} numberOfLines={1}>{r.display_name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <WebView ref={webRef} source={{html}} style={s.map}
        onMessage={(e)=>{
          try{
            const d=JSON.parse(e.nativeEvent.data);
            if(d.lat && d.lng) setCoord({lat:parseFloat(d.lat), lng:parseFloat(d.lon)});
            if(d.type==='results'){ setResults(d.results); setSearching(false); }
          }catch{}
        }}
      />

      {/* ده الجزء اللي كان غاطس - دلوقتي بيطلع فوق الكيبورد */}
      <View style={[s.bottom, {paddingBottom: keyboardHeight > 0? 12 : insets.bottom + 12, marginBottom: keyboardHeight}]}>
        <Text style={s.label}>عنوان المتجر</Text>
        <TextInput
          value={address}
          onChangeText={setAddress}
          placeholder="مثال: التجمع الخامس، شارع التسعين"
          placeholderTextColor="#555"
          style={s.input}
          onFocus={()=>{ /* اول ما تدوس عليه الكيبورد هيطلع والبوكس هيطلع فوقه */ }}
        />
        <Text style={s.coord}>📍 {coord.lat.toFixed(5)}, {coord.lng.toFixed(5)}</Text>
        <TouchableOpacity onPress={save} style={s.save}><Text style={{fontWeight:'bold', color:'#000'}}>{saving?'جاري الحفظ...':'تأكيد وحفظ الموقع ✅'}</Text></TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  bg:{flex:1, backgroundColor:'#0F0F0F'},
  header:{flexDirection:'row', justifyContent:'space-between', alignItems:'center', padding:12},
  h1:{color:'#fff', fontWeight:'bold', fontSize:16},
  back:{width:36, height:36, borderRadius:18, backgroundColor:'#1A1A1A', justifyContent:'center', alignItems:'center', borderWidth:1, borderColor:'#222'},
  loc:{width:36, height:36, borderRadius:18, backgroundColor:'#E8C87A', justifyContent:'center', alignItems:'center'},
  searchWrap:{flexDirection:'row', alignItems:'center', backgroundColor:'#161616', marginHorizontal:12, borderRadius:12, borderWidth:1, borderColor:'#222', paddingHorizontal:10, marginTop:6},
  searchInput:{flex:1, height:44, color:'#fff', textAlign:'right'},
  searchBtn:{width:32, height:32, borderRadius:16, backgroundColor:'#E8C87A', justifyContent:'center', alignItems:'center'},
  results:{backgroundColor:'#161616', marginHorizontal:12, borderRadius:12, borderWidth:1, borderColor:'#222', marginTop:4, zIndex:20},
  resultItem:{flexDirection:'row', alignItems:'center', gap:8, padding:12, borderBottomWidth:1, borderBottomColor:'#222'},
  resultTxt:{color:'#fff', flex:1, fontSize:12},
  map:{flex:1, backgroundColor:'#111', marginTop:8, marginHorizontal:12, borderRadius:16, overflow:'hidden'},
  bottom:{backgroundColor:'#1A1A1A', padding:12, borderTopLeftRadius:20, borderTopRightRadius:20, borderTopWidth:1, borderColor:'#222'},
  label:{color:'#888', fontSize:11, textAlign:'right', marginBottom:6},
  input:{backgroundColor:'#0F0F0F', borderWidth:1, borderColor:'#222', borderRadius:12, color:'#fff', paddingHorizontal:12, height:48, textAlign:'right'},
  coord:{color:'#666', fontSize:10, textAlign:'center', marginTop:6},
  save:{backgroundColor:'#E8C87A', height:50, borderRadius:12, justifyContent:'center', alignItems:'center', marginTop:10}
});