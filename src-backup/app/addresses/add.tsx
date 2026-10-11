import * as Location from "expo-location";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { I18nManager } from "react-native";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { supabase } from "../../../lib/supabase";
import { useAuthStore } from "../../../store/auth.store";

export default function AddAddress() {
  const { t } = useTranslation();
  const isRTL = I18nManager.isRTL;
  const user = useAuthStore((s: any) => s.user);
  const webRef = useRef<any>(null);
  const [coords, setCoords] = useState({ latitude: 30.0444, longitude: 31.2357 });
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [area, setArea] = useState("");
  const [street, setStreet] = useState("");
  const [building, setBuilding] = useState("");
  const [floor, setFloor] = useState("");
  const [apartment, setApartment] = useState("");
  const [notes, setNotes] = useState("");
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      try {
        const last = await Location.getLastKnownPositionAsync();
        if (last) setCoords({ latitude: last.coords.latitude, longitude: last.coords.longitude });
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const c = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
        setCoords(c);
        webRef.current?.injectJavaScript(`map.setView([${c.latitude}, ${c.longitude}], 16); marker.setLatLng([${c.latitude}, ${c.longitude}]); true;`);
        reverse(c.latitude, c.longitude);
      } catch (e) {}
    })();
  }, []);

  const reverse = async (lat: number, lon: number) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&accept-language=ar`, { headers: { "User-Agent": "la-parisienne-app" } });
      const data = await res.json();
      const addr = data.address || {};
      if (addr.city || addr.town || addr.suburb) setArea(addr.city || addr.town || addr.suburb || "");
      if (addr.road) setStreet(addr.road);
      if (addr.house_number) setBuilding(addr.house_number);
    } catch (e) {}
  };

  const doSearch = async (q: string) => {
    setSearch(q);
    if (q.trim().length < 2) { setResults([]); return; }
    setSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&countrycodes=eg&limit=5&accept-language=ar`, { headers: { "User-Agent": "la-parisienne-app" } });
      const data = await res.json();
      setResults(data);
    } catch (e) {}
    setSearching(false);
  };

  const selectPlace = (item: any) => {
    const lat = parseFloat(item.lat); const lon = parseFloat(item.lon);
    setCoords({ latitude: lat, longitude: lon });
    setResults([]); setSearch(""); Keyboard.dismiss();
    reverse(lat, lon);
    webRef.current?.injectJavaScript(`map.setView([${lat}, ${lon}], 17); marker.setLatLng([${lat}, ${lon}]); true;`);
  };

  const html = `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1"><link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/><script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script><style>html,body,#map{height:100%;margin:0;padding:0}.leaflet-control-attribution{display:none}</style></head><body><div id="map"></div><script>var map=L.map('map',{zoomControl:false,attributionControl:false}).setView([${coords.latitude},${coords.longitude}],15);L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19}).addTo(map);var marker=L.marker([${coords.latitude},${coords.longitude}],{draggable:true}).addTo(map);marker.on('dragend',function(e){window.ReactNativeWebView.postMessage(JSON.stringify(e.target.getLatLng()));});map.on('click',function(e){marker.setLatLng(e.latlng);window.ReactNativeWebView.postMessage(JSON.stringify(e.latlng));});</script></body></html>`;

  const save = async () => {
    if (!fullName || !phone || !area) return Alert.alert(t("common.error"), t("addresses.missingInfo"));
    setSaving(true);
    const { data: ex } = await supabase.from("addresses").select("id").eq("user_id", user.id).limit(1);
    const { error } = await supabase.from("addresses").insert({
      user_id: user.id, full_name: fullName, phone, area, street, building, floor, apartment, notes,
      address_line: `${area}, ${street}, ${building}`,
      latitude: coords.latitude, longitude: coords.longitude,
      label: "Home", is_default: !ex || ex.length === 0
    });
    setSaving(false);
    if (error) Alert.alert(t("common.error"), error.message);
    else router.replace("/addresses" as any);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 20, paddingBottom: 40, flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          automaticallyAdjustKeyboardInsets={true}
        >
          <View className="z-20">
            <View className="h-12 bg-gray-100 rounded-2xl px-4 flex-row items-center border border-gray-200">
              <Text>🔍</Text>
              <TextInput
                value={search}
                onChangeText={doSearch}
                placeholder={t("addresses.searchPlaceholder")}
                className="flex-1 mr-2 text-right"
                style={{ textAlign: isRTL ? "right" : "left" }}
              />
              {searching && <ActivityIndicator size="small" />}
            </View>
            {results.length > 0 && (
              <View className="bg-white border border-gray-200 rounded-2xl mt-2 max-h-56 overflow-hidden">
                {results.map((item) => (
                  <Pressable
                    key={item.place_id.toString()}
                    onPress={() => selectPlace(item)}
                    className="p-3 border-b border-gray-100"
                  >
                    <Text className="text-sm" style={{ textAlign: isRTL ? "right" : "left" }}>{item.display_name}</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          <View className="h-[320px] rounded-[24px] overflow-hidden border border-gray-200 mt-3 bg-gray-100">
            <WebView
              ref={webRef}
              originWhitelist={["*"]}
              source={{ html }}
              cacheEnabled
              scrollEnabled={false}
              onMessage={(e) => {
                try {
                  const { lat, lng } = JSON.parse(e.nativeEvent.data);
                  setCoords({ latitude: lat, longitude: lng });
                  reverse(lat, lng);
                } catch (e) {}
              }}
            />
          </View>

          <View className="mt-4 gap-3">
            <TextInput
              value={fullName}
              onChangeText={setFullName}
              placeholder={t("profile.fullName")}
              className="h-14 bg-white border border-gray-300 rounded-2xl px-4 text-right"
              style={{ textAlign: isRTL ? "right" : "left" }}
            />
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder={t("profile.phone")}
              className="h-14 bg-white border border-gray-300 rounded-2xl px-4 text-right"
              keyboardType="phone-pad"
              style={{ textAlign: isRTL ? "right" : "left" }}
            />
            <TextInput
              value={area}
              onChangeText={setArea}
              placeholder={t("addresses.area")}
              className="h-14 bg-white border border-gray-300 rounded-2xl px-4 text-right"
              style={{ textAlign: isRTL ? "right" : "left" }}
            />
            <View className="flex-row gap-3">
              <TextInput
                value={building}
                onChangeText={setBuilding}
                placeholder={t("addresses.buildingNumber")}
                className="flex-1 h-14 bg-white border border-gray-300 rounded-2xl px-4 text-right"
                style={{ textAlign: isRTL ? "right" : "left" }}
              />
              <TextInput
                value={street}
                onChangeText={setStreet}
                placeholder={t("addresses.street")}
                className="flex-[2] h-14 bg-white border border-gray-300 rounded-2xl px-4 text-right"
                style={{ textAlign: isRTL ? "right" : "left" }}
              />
            </View>
            <View className="flex-row gap-3">
              <TextInput
                value={apartment}
                onChangeText={setApartment}
                placeholder={t("addresses.apartment")}
                className="flex-1 h-14 bg-white border border-gray-300 rounded-2xl px-4 text-right"
                style={{ textAlign: isRTL ? "right" : "left" }}
              />
              <TextInput
                value={floor}
                onChangeText={setFloor}
                placeholder={t("addresses.floor")}
                className="flex-1 h-14 bg-white border border-gray-300 rounded-2xl px-4 text-right"
                style={{ textAlign: isRTL ? "right" : "left" }}
              />
            </View>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder={t("addresses.notes")}
              className="h-14 bg-white border border-gray-300 rounded-2xl px-4 text-right"
              style={{ textAlign: isRTL ? "right" : "left" }}
            />
          </View>

          <Pressable
            onPress={save}
            className="h-14 bg-black rounded-full items-center justify-center mt-8"
            style={{ alignSelf: isRTL ? "flex-start" : "center" }}
          >
            {saving ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold text-base">{t("addresses.save")}</Text>}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}