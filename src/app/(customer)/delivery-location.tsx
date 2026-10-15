import Ionicons from "@expo/vector-icons/Ionicons";
import * as Location from 'expo-location';
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Keyboard, Pressable, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { CUSTOMER_COLORS } from "../../../lib/customerTheme";
import { supabase } from "../../../lib/supabase";
import { useLocationStore } from "../../../store/location.store";

const searchPlaces = async (q: string) => {
  if (!q.trim() || q.length < 2) return [];
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&countrycodes=eg&limit=6&addressdetails=1&accept-language=en,ar`;
    const res = await fetch(url, { headers: { 'User-Agent': 'LaParisienne/1.0' } });
    return await res.json();
  } catch { return []; }
};

const reverseGeocode = async (lat: number, lng: number) => {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, { headers: { 'User-Agent': 'LaParisienne/1.0' } });
    const data = await res.json();
    const addr = data.address || {};
    const area = addr.suburb || addr.neighbourhood || addr.city_district || addr.village || '';
    const city = addr.city || addr.town || addr.county || 'Cairo';
    const street = addr.road || addr.street || '';
    const label = area ? `${area}${street ? ' - ' + street : ''}` : (street || city);
    return { label: label.slice(0, 50), street, full: data.display_name, city, area, lat, lng };
  } catch { return { label: `${lat.toFixed(4)}, ${lng.toFixed(4)}`, street: '', full: '', city: 'Cairo', area: '', lat, lng }; }
};

export default function DeliveryLocation() {
  const insets = useSafeAreaInsets();
  const C = CUSTOMER_COLORS;
  const { selected, setSelected } = useLocationStore();
  const [view, setView] = useState<'list' | 'map' | 'search'>('list');
  const [addresses, setAddresses] = useState<any[]>([]);
  const [coord, setCoord] = useState({ lat: selected?.lat || 30.0596, lng: selected?.lng || 31.3428 });
  const [label, setLabel] = useState(selected?.label || "Nasr City - Hay 8");
  const [fullAddr, setFullAddr] = useState(selected?.fullAddress || "");
  const [loadingLoc, setLoadingLoc] = useState(false);
  const [currentLoc, setCurrentLoc] = useState<{ lat: number, lng: number } | null>(null);
  const [isFar, setIsFar] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("customer_addresses").select("*").order("is_default", { ascending: false });
      setAddresses(data || []);
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          let loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          setCurrentLoc({ lat: loc.coords.latitude, lng: loc.coords.longitude });
          if (!selected) {
            const rev = await reverseGeocode(loc.coords.latitude, loc.coords.longitude);
            setCoord({ lat: loc.coords.latitude, lng: loc.coords.longitude });
            setLabel(rev.label);
            setFullAddr(rev.full);
          }
        }
      } catch {}
    })();
  }, []);

  const calcDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; const p1 = lat1 * Math.PI / 180; const p2 = lat2 * Math.PI / 180;
    const dLat = (lat2 - lat1) * Math.PI / 180; const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  useEffect(() => {
    if (currentLoc) {
      const dist = calcDistance(currentLoc.lat, currentLoc.lng, coord.lat, coord.lng);
      setIsFar(dist > 2000);
    }
  }, [coord, currentLoc]);

  useEffect(() => {
    const t = setTimeout(async () => {
      if (view !== 'search') return;
      if (query.length < 2) { setResults([]); return; }
      setSearching(true);
      const res = await searchPlaces(query);
      setResults(res);
      setSearching(false);
    }, 400);
    return () => clearTimeout(t);
  }, [query, view]);

  const useCurrentLocation = async () => {
    setLoadingLoc(true);
    let loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    const rev = await reverseGeocode(loc.coords.latitude, loc.coords.longitude);
    setCoord({ lat: loc.coords.latitude, lng: loc.coords.longitude });
    setLabel(rev.label); setFullAddr(rev.full);
    setCurrentLoc({ lat: loc.coords.latitude, lng: loc.coords.longitude });
    setView('map');
    setLoadingLoc(false);
  };

  const onSelectSearch = async (item: any) => {
    Keyboard.dismiss();
    const lat = parseFloat(item.lat); const lon = parseFloat(item.lon);
    setCoord({ lat, lng: lon });
    setLabel(item.display_name.split(',').slice(0, 2).join(','));
    setFullAddr(item.display_name);
    setView('map');
  };

  const mapHtml = `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1"/><link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/><script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script><style>html,body,#map{height:100%;margin:0;padding:0;background:#FDFBF7}.leaflet-control-attribution{display:none}</style></head><body><div id="map"></div><script>var map=L.map('map',{zoomControl:false, attributionControl:false}).setView([${coord.lat},${coord.lng}],17);L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19}).addTo(map);map.on('moveend',function(){var c=map.getCenter();window.ReactNativeWebView.postMessage(JSON.stringify({lat:c.lat,lng:c.lng,final:true}));});</script></body></html>`;

  const confirm = () => {
    const payload = { label, street: label, fullAddress: fullAddr, lat: coord.lat, lng: coord.lng, city: 'Cairo', area: label };
    setSelected(payload as any);
    setTimeout(() => router.back(), 150);
  };

  if (view === 'search') {
    return (
      <View style={{ flex: 1, backgroundColor: C.card, paddingTop: insets.top }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 10, paddingBottom: 10 }}>
          <Pressable onPress={() => setView('map')} style={{ width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' }}><Ionicons name="close" size={22} color={C.textPrimary} /></Pressable>
          <View style={{ flex: 1, backgroundColor: C.searchBg, borderRadius: 24, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, height: 44, borderWidth:1, borderColor: C.border }}>
            <Ionicons name="search" size={18} color={C.textMuted} />
            <TextInput value={query} onChangeText={setQuery} autoFocus placeholder="Search for area or street name" style={{ flex: 1, marginLeft: 8, fontSize: 14, color: C.textPrimary }} placeholderTextColor={C.textMuted} />
            {query.length > 0 && <Pressable onPress={() => setQuery("")}><Ionicons name="close-circle" size={18} color={C.textMuted} /></Pressable>}
          </View>
        </View>
        <FlatList
          data={results}
          keyExtractor={(i, idx) => `${i.place_id}-${idx}`}
          contentContainerStyle={{ paddingTop: 8 }}
          ListEmptyComponent={searching ? <View style={{ padding: 20 }}><ActivityIndicator color={C.textPrimary} /></View> : <View />}
          renderItem={({ item }) => (
            <Pressable onPress={() => onSelectSearch(item)} style={{ paddingHorizontal: 20, paddingVertical: 14, flexDirection: 'row', gap: 12, borderBottomWidth: 1, borderBottomColor: C.searchBg }}>
              <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: C.searchBg, justifyContent: 'center', alignItems: 'center' }}><Ionicons name="location-outline" size={16} color={C.textPrimary} /></View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '700', fontSize: 13, color: C.textPrimary }} numberOfLines={1}>{item.display_name.split(',')[0]}</Text>
                <Text style={{ color: C.textMuted, fontSize: 11, marginTop: 2 }} numberOfLines={1}>{item.display_name}</Text>
              </View>
            </Pressable>
          )}
        />
      </View>
    );
  }

  if (view === 'map') {
    return (
      <View style={{ flex: 1, backgroundColor: C.background }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: insets.top + 8, paddingBottom: 12, backgroundColor: C.card }}>
          <Pressable onPress={() => setView('list')} style={{ width: 36, height: 36, justifyContent: 'center' }}><Ionicons name="close" size={24} color={C.textPrimary} /></Pressable>
          <Text style={{ fontWeight: '800', fontSize: 15, color: C.textPrimary }}>Delivery Address</Text>
          <Pressable onPress={() => setView('search')} style={{ width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: C.border, justifyContent: 'center', alignItems: 'center' }}><Ionicons name="search" size={18} color={C.textPrimary} /></Pressable>
        </View>

        <View style={{ flex: 1 }}>
          <WebView source={{ html: mapHtml }} style={{ flex: 1 }} onMessage={async (e) => { const d = JSON.parse(e.nativeEvent.data); if (d.final) { setCoord({ lat: d.lat, lng: d.lng }); const rev = await reverseGeocode(d.lat, d.lng); setLabel(rev.label); setFullAddr(rev.full); } }} />
          <View style={{ position: 'absolute', left: '50%', top: '50%', marginLeft: -22, marginTop: -54, alignItems: 'center', pointerEvents: 'none' }}>
            <View style={{ backgroundColor: C.textPrimary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginBottom: 8 }}>
              <Text style={{ color: C.card, fontSize: 11, fontWeight: '600' }}>Your order will be delivered here</Text>
            </View>
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: C.textPrimary, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: C.card }}>
              <Ionicons name="location-sharp" size={22} color={C.card} />
            </View>
          </View>
          <Pressable onPress={useCurrentLocation} style={{ position: 'absolute', right: 16, bottom: 180, width: 44, height: 44, borderRadius: 22, backgroundColor: C.card, justifyContent: 'center', alignItems: 'center', elevation: 4, borderWidth:1, borderColor: C.border }}>
            <Ionicons name="locate" size={20} color={C.textPrimary} />
          </Pressable>
        </View>

        <View style={{ backgroundColor: C.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, paddingBottom: insets.bottom + 16, borderTopWidth:1, borderTopColor: C.border }}>
          {isFar && (
            <View style={{ backgroundColor: C.searchBg, borderRadius: 12, padding: 10, flexDirection: 'row', gap: 8, marginBottom: 12, borderWidth:1, borderColor: C.border }}>
              <Ionicons name="warning-outline" size={18} color={C.textSecondary} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, color: C.textPrimary, fontWeight: '600' }}>{label}</Text>
                <Text style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>The selected pin is a bit far from your current location. Are you sure this is correct?</Text>
              </View>
            </View>
          )}
          {!isFar && <Text style={{ fontSize: 12, color: C.textPrimary, fontWeight: '700', marginBottom: 12 }} numberOfLines={1}>{fullAddr || label}</Text>}
          <Pressable onPress={confirm} style={{ height: 50, borderRadius: 25, backgroundColor: C.textPrimary, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: C.card, fontWeight: '900', fontSize: 15 }}>{isFar ? 'Yes deliver here' : 'Confirm pin location'}</Text>
          </Pressable>
          {isFar && <Pressable onPress={useCurrentLocation} style={{ marginTop: 10, alignSelf: 'center' }}><Text style={{ fontSize: 12, color: C.textPrimary, fontWeight: '700' }}>Reset to my location</Text></Pressable>}
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.card, paddingTop: insets.top }}>
      <View style={{ paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Pressable onPress={() => router.back()} style={{ width: 32, height: 32, justifyContent: 'center', alignItems: 'center' }}><Ionicons name="close" size={24} color={C.textPrimary} /></Pressable>
        <Text style={{ fontSize: 18, fontWeight: '900', color: C.textPrimary }}>Choose delivery location</Text>
      </View>
      <Text style={{ fontWeight: '800', fontSize: 14, paddingHorizontal: 16, marginTop: 12, marginBottom: 8, color: C.textPrimary }}>Saved addresses</Text>
      <FlatList
        data={addresses}
        keyExtractor={i => i.id}
        renderItem={({ item }) => (
          <Pressable onPress={() => { 
            const payload = { label: item.area || item.city, street: item.address_line, fullAddress: item.address_line, lat: item.latitude, lng: item.longitude, city: item.city, area: item.area };
            setSelected(payload as any); 
            setTimeout(() => router.back(), 150);
          }}
            style={{ flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 12 }}>
            <Ionicons name="location-outline" size={20} color={C.textPrimary} style={{ marginTop: 2 }} />
            <View style={{ flex: 1, borderBottomWidth: 1, borderBottomColor: C.searchBg, paddingBottom: 12 }}>
              <Text style={{ fontWeight: '700', fontSize: 12, color: C.textPrimary }}>{item.label || 'Home'}</Text>
              <Text style={{ fontSize: 11, color: C.textMuted, marginTop: 3 }} numberOfLines={2}>{item.address_line}, {item.area} - {item.city}</Text>
            </View>
          </Pressable>
        )}
      />
      <View style={{ padding: 16, gap: 10, borderTopWidth: 1, borderTopColor: C.searchBg }}>
        <Pressable onPress={() => setView('map')} style={{ height: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: C.searchBg, justifyContent: 'center', alignItems: 'center' }}><Ionicons name="location" size={18} color={C.textPrimary} /></View>
            <View><Text style={{ fontWeight: '700', fontSize: 13, color: C.textPrimary }}>Deliver to a different location</Text><Text style={{ color: C.textMuted, fontSize: 11, marginTop: 1 }}>Choose location on map</Text></View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={C.textMuted} />
        </Pressable>
        <Pressable onPress={useCurrentLocation} style={{ height: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: C.searchBg, justifyContent: 'center', alignItems: 'center' }}><Ionicons name="navigate" size={18} color={C.textPrimary} /></View>
            <View><Text style={{ fontWeight: '700', fontSize: 13, color: C.textPrimary }}>Deliver to current location</Text><Text style={{ color: C.textMuted, fontSize: 11, marginTop: 1 }}>{loadingLoc ? 'Detecting Location...' : (currentLoc ? `${label}` : 'Detecting Location')}</Text></View>
          </View>
          {loadingLoc && <ActivityIndicator size="small" color={C.textPrimary} />}
        </Pressable>
      </View>
    </View>
  );
}