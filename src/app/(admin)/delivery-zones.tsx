import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, FlatList, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { supabase } from '../../../lib/supabase';

export default function DeliveryZonesMap(){
  const { t } = useTranslation();
  const [zones, setZones] = useState<any[]>([]);
  const [show, setShow] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [name, setName] = useState('');
  const [fee, setFee] = useState('');
  const [radius, setRadius] = useState('2');
  const [coord, setCoord] = useState({lat: 29.987, lng: 31.307});
  const [search, setSearch] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const webRef = useRef<any>(null);

  const load = async () => {
    const { data, error } = await supabase.from('delivery_zones').select('*').order('created_at',{ascending:false});
    if(error) console.log('LOAD ERROR', error);
    setZones(data||[]);
  };
  useEffect(()=>{ load() },[]);

  useEffect(()=>{
    webRef.current?.postMessage(JSON.stringify({type:'zones', zones, current: coord, radius}));
  },[zones, coord, radius]);

  const doSearch = () => {
    if(!search.trim()) return;
    setSearching(true); setResults([]);
    webRef.current?.postMessage(JSON.stringify({type:'search', q: search}));
  };

  const selectResult = (r:any) => {
    const lat = parseFloat(r.lat); const lng = parseFloat(r.lon);
    setCoord({lat,lng});
    if(!name) setName(r.display_name.split(',')[0]);
    webRef.current?.postMessage(JSON.stringify({type:'fly', lat, lng}));
    setResults([]);
  };

  const openNew = () => { setEditing(null); setName(''); setFee(''); setRadius('2'); setShow(true); };
  const openEdit = (z:any) => {
    setEditing(z); setName(z.name); setFee(String(z.fee)); setRadius(String(z.radius_km||2));
    setCoord({lat: Number(z.lat), lng: Number(z.lng)});
    setShow(true);
    webRef.current?.postMessage(JSON.stringify({type:'fly', lat: Number(z.lat), lng: Number(z.lng)}));
  };

  const save = async () => {
    if(!name ||!fee) return Alert.alert(t('admin.zones.fillRequired'));
    const payload = { name, fee: Number(fee), radius_km: Number(radius), lat: coord.lat, lng: coord.lng };
    let res;
    if(editing) res = await supabase.from('delivery_zones').update(payload).eq('id', editing.id);
    else res = await supabase.from('delivery_zones').insert(payload);

    if(res.error){
      Alert.alert(t('admin.zones.saveError'), res.error.message);
      console.log(res.error);
      return;
    }
    Alert.alert(t('admin.zones.saved'));
    setShow(false);
    await load();
  };
  const del = async () => { if(!editing) return; await supabase.from('delivery_zones').delete().eq('id', editing.id); setShow(false); load(); };

  const html = `
  <!DOCTYPE html><html><head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>html,body,#map{height:100%;margin:0;padding:0;background:#111}</style>
  </head><body><div id="map"></div>
  <script>
    var map = L.map('map').setView([29.987, 31.307], 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19}).addTo(map);
    var markers=[]; var currentMarker=null; var currentCircle=null;
    function clearMarkers(){ markers.forEach(m=>{map.removeLayer(m.marker); if(m.circle) map.removeLayer(m.circle);}); markers=[]; }
    function renderZones(data){
      if(data.type==='fly'){ map.flyTo([data.lat, data.lng], 16); return; }
      if(data.type==='search'){
        fetch('https://nominatim.openstreetmap.org/search?format=json&q='+encodeURIComponent(data.q)+'&countrycodes=eg&limit=5&accept-language=ar')
      .then(r=>r.json()).then(res=>{
            window.ReactNativeWebView.postMessage(JSON.stringify({type:'results', results: res}));
            if(res.length>0){ map.flyTo([res[0].lat, res[0].lon], 15); }
          }).catch(()=>{
            window.ReactNativeWebView.postMessage(JSON.stringify({type:'results', results: []}));
          });
        return;
      }
      if(data.type!=='zones') return;
      clearMarkers();
      (data.zones||[]).forEach(z=>{
        if(!z.lat ||!z.lng) return;
        var m = L.marker([z.lat, z.lng]).addTo(map).bindPopup('<b>'+z.name+'</b><br>'+z.fee+' EGP');
        var c = null;
        if(z.radius_km){ c = L.circle([z.lat, z.lng], {radius: Number(z.radius_km)*1000, color:'#E8C87A', fillColor:'#E8C87A', fillOpacity:0.2}).addTo(map); }
        markers.push({marker:m,circle:c});
      });
      var cur = data.current;
      if(cur){
        if(currentMarker) map.removeLayer(currentMarker);
        if(currentCircle) map.removeLayer(currentCircle);
        currentMarker = L.marker([cur.lat, cur.lng], {draggable:true}).addTo(map);
        currentMarker.on('dragend', function(e){ var ll=e.target.getLatLng(); window.ReactNativeWebView.postMessage(JSON.stringify({lat:ll.lat,lng:ll.lng})); });
        currentCircle = L.circle([cur.lat, cur.lng], {radius: Number(data.radius||2)*1000, color:'#E8C87A', fillColor:'#E8C87A', fillOpacity:0.35}).addTo(map);
      }
    }
    map.on('click', function(e){ window.ReactNativeWebView.postMessage(JSON.stringify({lat:e.latlng.lat,lng:e.latlng.lng})); });
    document.addEventListener('message', function(e){ try{renderZones(JSON.parse(e.data));}catch{} });
    window.addEventListener('message', function(e){ try{renderZones(JSON.parse(e.data));}catch{} });
    setTimeout(()=>{ window.ReactNativeWebView.postMessage(JSON.stringify({ready:true})); },500);
  </script></body></html>
  `;

  return (
    <View style={s.bg}>
      <View style={s.header}>
        <TouchableOpacity onPress={()=>router.back()} style={s.back}><Ionicons name="chevron-forward" size={20} color="#fff"/></TouchableOpacity>
        <Text style={s.h1}>{t('admin.zones.mapTitle')} - {t('admin.zones.zoneCount', { count: zones.length })}</Text>
        <TouchableOpacity onPress={openNew} style={s.add}><Ionicons name="add" size={22} color="#000"/></TouchableOpacity>
      </View>

      <View style={s.searchWrap}>
        <TouchableOpacity onPress={doSearch} style={s.searchBtn}>{searching?<ActivityIndicator size="small" color="#000"/>:<Ionicons name="search" size={18} color="#000"/>}</TouchableOpacity>
        <TextInput value={search} onChangeText={setSearch} placeholder={t('admin.zones.searchPlaceholder')} placeholderTextColor="#666" style={s.searchInput} onSubmitEditing={doSearch} returnKeyType="search"/>
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

      {zones.length>0 && (
        <View style={s.savedList}>
          <FlatList data={zones} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{gap:8, padding:10}}
            renderItem={({item})=>(
              <TouchableOpacity style={s.chipActive} onPress={()=>openEdit(item)}>
                <Ionicons name="location" size={12} color="#000"/>
                <Text style={s.chipNameDark}>{item.name}</Text>
                <Text style={s.chipFeeDark}>{item.fee} EGP</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      <WebView ref={webRef} source={{html}} style={s.map}
        onMessage={(e)=>{
          try{
            const d=JSON.parse(e.nativeEvent.data);
            if(d.lat&&d.lng) setCoord({lat:d.lat,lng:d.lng});
            if(d.type==='results'){ setResults(d.results); setSearching(false); }
            if(d.ready) webRef.current?.postMessage(JSON.stringify({type:'zones', zones, current:coord, radius}));
          }catch{}
        }}
      />

      <View style={s.bottomHint}>
        <Text style={s.hint}>📍 {coord.lat.toFixed(4)}, {coord.lng.toFixed(4)} • {t('admin.zones.tapHint')}</Text>
      </View>

      <Modal visible={show} transparent animationType="slide">
        <View style={s.modalBg}><View style={s.modal}>
          <View style={{flexDirection:'row', justifyContent:'space-between', marginBottom:10}}>
            <TouchableOpacity onPress={()=>setShow(false)}><Ionicons name="close" size={24} color="#fff"/></TouchableOpacity>
            <Text style={{color:'#fff', fontWeight:'bold'}}>{editing? t('admin.zones.edit'): t('admin.zones.newZone')}</Text>
            {editing? <TouchableOpacity onPress={del}><Ionicons name="trash" size={20} color="#ff5555"/></TouchableOpacity> : <View style={{width:20}}/>}
          </View>
          <Text style={s.coord}>📍 {coord.lat.toFixed(5)}, {coord.lng.toFixed(5)}</Text>
          <Text style={s.label}>{t('admin.zones.zoneName')}</Text>
          <TextInput value={name} onChangeText={setName} placeholder={t('admin.zones.zoneNamePlaceholder')} style={s.input} placeholderTextColor="#666"/>
          <View style={{flexDirection:'row', gap:8}}>
            <View style={{flex:1}}><Text style={s.label}>{t('admin.zones.deliveryFee')}</Text><TextInput value={fee} onChangeText={setFee} keyboardType="numeric" placeholder="30" style={s.input} placeholderTextColor="#666"/></View>
            <View style={{flex:1}}><Text style={s.label}>{t('admin.zones.radius')}</Text><TextInput value={radius} onChangeText={setRadius} keyboardType="numeric" placeholder="2" style={s.input} placeholderTextColor="#666"/></View>
          </View>
          <TouchableOpacity style={s.save} onPress={save}><Text style={{fontWeight:'bold'}}>{t('admin.zones.saveZone')}</Text></TouchableOpacity>
        </View></View>
      </Modal>
    </View>
  );
}
const s = StyleSheet.create({
  bg:{flex:1, backgroundColor:'#0F0F0F'},
  header:{flexDirection:'row', justifyContent:'space-between', alignItems:'center', padding:16, paddingTop:50, backgroundColor:'#0F0F0F'},
  h1:{color:'#fff', fontWeight:'bold', fontSize:16}, back:{width:36, height:36, borderRadius:18, backgroundColor:'#1A1A1A', justifyContent:'center', alignItems:'center', borderWidth:1, borderColor:'#222'},
  add:{width:36, height:36, borderRadius:18, backgroundColor:'#E8C87A', justifyContent:'center', alignItems:'center'},
  searchWrap:{flexDirection:'row', alignItems:'center', backgroundColor:'#161616', marginHorizontal:12, marginTop:8, borderRadius:12, borderWidth:1, borderColor:'#222', paddingHorizontal:10},
  searchInput:{flex:1, height:44, color:'#fff', textAlign:'right'}, searchBtn:{width:32, height:32, borderRadius:16, backgroundColor:'#E8C87A', justifyContent:'center', alignItems:'center'},
  results:{backgroundColor:'#161616', marginHorizontal:12, borderRadius:12, borderWidth:1, borderColor:'#222', marginTop:4, zIndex:20},
  resultItem:{flexDirection:'row', alignItems:'center', gap:8, padding:12, borderBottomWidth:1, borderBottomColor:'#222'}, resultTxt:{color:'#fff', flex:1, fontSize:12},
  savedList:{backgroundColor:'#E8C87A', paddingVertical:2},
  chipActive:{flexDirection:'row', backgroundColor:'#000', borderRadius:20, paddingHorizontal:12, paddingVertical:6, alignItems:'center', gap:4}, chipNameDark:{color:'#E8C87A', fontSize:12, fontWeight:'bold'}, chipFeeDark:{color:'#fff', fontSize:10},
  map:{flex:1, backgroundColor:'#111'},
  bottomHint:{backgroundColor:'#0F0F0F', padding:8},
  hint:{color:'#888', fontSize:11, textAlign:'center'},
  modalBg:{flex:1, backgroundColor:'rgba(0,0,0,0.6)', justifyContent:'flex-end'}, modal:{backgroundColor:'#161616', borderTopLeftRadius:24, borderTopRightRadius:24, padding:16, borderWidth:1, borderColor:'#222'},
  label:{color:'#888', fontSize:10, textAlign:'right', marginBottom:4, marginTop:8}, coord:{color:'#E8C87A', fontSize:11, textAlign:'center', marginBottom:6},
  input:{backgroundColor:'#0F0F0F', borderWidth:1, borderColor:'#222', borderRadius:10, color:'#fff', paddingHorizontal:12, height:44, marginBottom:8},
  save:{backgroundColor:'#E8C87A', height:50, borderRadius:12, justifyContent:'center', alignItems:'center', marginTop:10}
});