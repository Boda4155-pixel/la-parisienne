import Ionicons from "@expo/vector-icons/Ionicons";
import * as Location from 'expo-location';
import { router } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Animated, Image, ImageBackground, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "../../../lib/supabase";
import { useCartStore } from "../../../store/cart.store";
import { useLocationStore } from "../../../store/location.store";

type Category = { id: string; name: string; image_url: string | null };
type Product = { id: string; name: string; price: number; image_url: string | null; category_id: string | null; description?: string | null };

const reverseGeocodeReal = async (lat: number, lng: number) => {
  const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
    headers: { 'Accept-Language': 'en', 'User-Agent': 'LaParisienne/1.0' }
  });
  const data = await res.json();
  const addr = data.address || {};
  const area = addr.suburb || addr.neighbourhood || addr.quarter || addr.village || addr.town || '';
  const city = addr.city || addr.town || addr.county || 'Cairo';
  const street = addr.road || addr.street || data.display_name?.split(',')[0] || '';
  const label = area? `${area} - ${street}` : street || city;
  return { label: label.slice(0,35), street, fullAddress: data.display_name, city, area, district: addr.district || '' };
};

export default function CustomerHome() {
  const insets = useSafeAreaInsets();
  const [categories, setCategories] = useState<Category[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [activeCat, setActiveCat] = useState("all");
  const getTotalItems = useCartStore((s) => s.getTotalItems);
  const addItem = useCartStore((s) => s.addItem);
  const cartCount = getTotalItems();
  const toastAnim = useRef(new Animated.Value(0)).current;
  const [showToast, setShowToast] = useState(false);
  const { selected, setSelected, isLocating, setIsLocating } = useLocationStore();

  // هنا السحر - أول ما يفتح يحدد مكانه الحقيقي
  useEffect(() => {
    (async () => {
      if (selected) { setIsLocating(false); return; }
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status!== 'granted') { setIsLocating(false); return; }
        setIsLocating(true);
        let loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const real = await reverseGeocodeReal(loc.coords.latitude, loc.coords.longitude);
        setSelected({
          label: real.label,
          street: real.street,
          fullAddress: real.fullAddress,
          lat: loc.coords.latitude,
          lng: loc.coords.longitude,
          city: real.city,
          area: real.area,
          district: real.district
        });
      } catch (e) { console.log(e); } finally { setIsLocating(false); }
    })();
  }, []);

  //... باقي الكود بتاعك زي ما هو
  const mainScrollRef = useRef<ScrollView>(null);
  const catScrollRef = useRef<ScrollView>(null);
  const sectionY = useRef<Record<string, number>>({});
  const catX = useRef<Record<string, number>>({});
  const isManual = useRef(false);

  const showAddedToast = () => {
    setShowToast(true);
    Animated.sequence([
      Animated.timing(toastAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(1200),
      Animated.timing(toastAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => setShowToast(false));
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: cats } = await supabase.from("categories").select("id, name, image_url").eq("is_active", true).order("name");
      setCategories(cats || []);
      const { data: allProds } = await supabase.from("products").select("id, name, price, image_url, category_id, description").eq("is_active", true).order("created_at", { ascending: false });
      setProducts(allProds || []);
      const { data: best } = await supabase.from("products").select("id, name, price, image_url, category_id, description").eq("is_active", true).eq("is_best_seller", true).limit(8);
      setBestSellers(best?.length? best : (allProds || []).slice(0, 8));
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() =>!searchText.trim()? products : products.filter(p => p.name.toLowerCase().includes(searchText.toLowerCase())), [products, searchText]);
  const grouped = useMemo(() => { const g: Record<string, Product[]> = {}; categories.forEach(c => { g[c.id] = filtered.filter(p => p.category_id === c.id); }); return g; }, [filtered, categories]);

  useEffect(() => { const x = catX.current[activeCat]; if (x!== undefined) catScrollRef.current?.scrollTo({ x: Math.max(0, x - 100), animated: true }); }, [activeCat]);
  const scrollToCat = (id: string) => { setActiveCat(id); isManual.current = true; if (id === "all") mainScrollRef.current?.scrollTo({ y: 0, animated: true }); else { const y = sectionY.current[id]; if (y!== undefined) mainScrollRef.current?.scrollTo({ y, animated: true }); } setTimeout(() => isManual.current = false, 700); };
  const onScroll = (e: any) => { if (isManual.current) return; const y = e.nativeEvent.contentOffset.y + 300; let current = "all"; let best = -1; Object.entries(sectionY.current).forEach(([id, pos]) => { if (y >= pos && pos > best) { best = pos; current = id; } }); if (current!== activeCat) setActiveCat(current); };
  const handleAdd = (p: Product) => { addItem({ id: p.id, name: p.name, price: Number(p.price), image_url: p.image_url || "" }); showAddedToast(); };

  if (loading) return <View style={{ flex: 1, backgroundColor: "#FFFBF5", justifyContent: "center", alignItems: "center" }}><ActivityIndicator size="large" color="#1A1207" /></View>;
  const heroImage = bestSellers[0]?.image_url? { uri: bestSellers[0].image_url } : require("../../../assets/images/croissant-real.png");

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFBF5" }}>
      <View style={{ backgroundColor: "#FF6B00", paddingTop: insets.top + 6, paddingBottom: 10, paddingHorizontal: 16 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Pressable onPress={() => router.push("/(customer)/delivery-location" as any)} style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
            <Ionicons name="location-sharp" size={20} color="#fff" />
            <View style={{ flex: 1, marginLeft: 6 }}>
              <Text style={{ color: "#fff", fontWeight: "900", fontSize: 12, opacity: 0.9 }}>Deliver to</Text>
              <View style={{ flexDirection:'row', alignItems:'center' }}>
                <Text style={{ color: "#fff", fontWeight: "900", fontSize: 14, flex: 1 }} numberOfLines={1}>
                  {isLocating? 'Detecting your location...' : (selected?.label || 'Select location')}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#fff" style={{ marginLeft: 4 }} />
              </View>
            </View>
          </Pressable>
          <Pressable onPress={() => router.push("/(customer)/cart" as any)} style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: "#fff", justifyContent: "center", alignItems: "center", marginLeft: 12 }}>
            <Ionicons name="bag" size={18} color="#FF6B00" />
            {cartCount > 0 && <View style={{ position: "absolute", top: -4, right: -4, backgroundColor: "#000", minWidth: 18, height: 18, borderRadius: 9, justifyContent: "center", alignItems: "center" }}><Text style={{ color: "#fff", fontSize: 10, fontWeight: "800" }}>{cartCount}</Text></View>}
          </Pressable>
        </View>
      </View>

      <View style={{ backgroundColor: "#FFFBF5", paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: "#F0E6D9", zIndex: 10, paddingTop: 10 }}>
        <ScrollView ref={catScrollRef} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}>
          {[{ id: "all", name: "All", image_url: null } as Category,...categories].map(cat => {
            const isActive = activeCat === cat.id;
            return (
              <Pressable key={cat.id} onLayout={e => catX.current[cat.id] = e.nativeEvent.layout.x} onPress={() => scrollToCat(cat.id)} style={{ backgroundColor: isActive? "#1A1207" : "#fff", paddingLeft: 6, paddingRight: 16, borderRadius: 30, borderWidth: 1, borderColor: isActive? "#1A1207" : "#F0E6D9", flexDirection: "row", gap: 8, alignItems: "center", height: 40 }}>
                <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: "#FFFBF5", overflow: "hidden" }}>{cat.image_url && <Image source={{ uri: cat.image_url }} style={{ width: "100%", height: "100%" }} />}</View>
                <Text style={{ fontSize: 13, fontWeight: "800", color: isActive? "#fff" : "#1A1207" }}>{cat.name}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView ref={mainScrollRef} onScroll={onScroll} scrollEventThrottle={16} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 110 }}>
        <View style={{ marginHorizontal: 20, marginTop: 16, marginBottom: 18, borderRadius: 26, overflow: "hidden", height: 170 }}>
          <ImageBackground source={heroImage} style={{ flex: 1 }} resizeMode="cover">
            <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.12)", padding: 20, justifyContent: "center" }}>
              <Text style={{ color: "#fff", fontSize: 28, fontWeight: "900" }}>French moment</Text>
              <Pressable onPress={() => router.push("/(customer)/menu" as any)} style={{ backgroundColor: "#fff", alignSelf: "flex-start", marginTop: 14, paddingHorizontal: 18, height: 38, borderRadius: 19, flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Text style={{ color: "#1A1207", fontWeight: "800", fontSize: 14 }}>Explore menu</Text>
                <Ionicons name="arrow-forward" size={16} color="#1A1207" />
              </Pressable>
            </View>
          </ImageBackground>
        </View>
        {categories.map(cat => {
          const items = grouped[cat.id] || [];
          if (items.length === 0) return null;
          return (
            <View key={cat.id} onLayout={e => sectionY.current[cat.id] = e.nativeEvent.layout.y} style={{ paddingHorizontal: 20, marginTop: 14 }}>
              <Text style={{ fontSize: 19, fontWeight: "900", color: "#1A1207", marginBottom: 14 }}>{cat.name}</Text>
              <View style={{ gap: 12 }}>
                {items.map((item) => (
                  <Pressable key={item.id} onPress={() => router.push(`/(customer)/product/${item.id}` as any)} style={{ flexDirection: "row", backgroundColor: "#fff", borderRadius: 20, padding: 12, borderWidth: 1, borderColor: "#F0E6D9", alignItems: "center" }}>
                    <View style={{ width: 88, height: 88, borderRadius: 16, backgroundColor: "#F7E8D5", overflow: "hidden" }}>
                      {item.image_url? <Image source={{ uri: item.image_url }} style={{ width: "100%", height: "100%" }} resizeMode="cover" /> : null}
                    </View>
                    <View style={{ flex: 1, marginLeft: 14 }}>
                      <Text style={{ fontSize: 14, fontWeight: "800", color: "#1A1207" }} numberOfLines={1}>{item.name}</Text>
                      <Text style={{ fontSize: 11, color: "#B8A89A", marginTop: 4 }} numberOfLines={1}>{item.description || "Freshly baked"}</Text>
                      <Text style={{ fontSize: 14, fontWeight: "900", color: "#1A1207", marginTop: 6 }}>{item.price} EGP</Text>
                    </View>
                    <Pressable onPress={(e) => { e.stopPropagation(); handleAdd(item); }} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "#1A1207", justifyContent: "center", alignItems: "center" }}>
                      <Ionicons name="add" size={20} color="#fff" />
                    </Pressable>
                  </Pressable>
                ))}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}