import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "../../../lib/supabase";
import { useCartStore } from "../../../store/cart.store";

type Product = { id: string; name: string; price: number; image_url: string | null; category_id: string | null; description?: string | null };
type Category = { id: string; name: string };

export default function CustomerMenu() {
  const { category, search } = useLocalSearchParams<{ category?: string; search?: string }>();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState((search as string) || "");
  const [activeCat, setActiveCat] = useState((category as string) || "all");
  const insets = useSafeAreaInsets();

  const scrollRef = useRef<ScrollView>(null);
  const catScrollRef = useRef<ScrollView>(null);
  const sectionY = useRef<Record<string, number>>({});
  const catPositions = useRef<Record<string, { x: number; width: number }>>({});
  const isManualScrolling = useRef(false);

  const fetchData = async () => {
    setLoading(true);
    const { data: cats } = await supabase.from("categories").select("id, name").eq("is_active", true).order("name");
    setCategories(cats || []);
    const { data: prods } = await supabase.from("products").select("id, name, price, image_url, category_id, description").eq("is_active", true).order("created_at", { ascending: false });
    setProducts((prods as any) || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const filteredProducts = useMemo(() => {
    if (!searchText.trim()) return products;
    return products.filter(p => p.name.toLowerCase().includes(searchText.toLowerCase()));
  }, [products, searchText]);

  const grouped = useMemo(() => {
    const g: Record<string, Product[]> = {};
    categories.forEach(cat => { g[cat.id] = filteredProducts.filter(p => p.category_id === cat.id); });
    return g;
  }, [filteredProducts, categories]);

  const catList = [{ id: "all", name: "All" },...categories];

  // هنا الحل - اول ما الـ active يتغير نلف الـ bar لفوق
  useEffect(() => {
    const pos = catPositions.current[activeCat];
    if (pos && catScrollRef.current) {
      catScrollRef.current.scrollTo({ x: Math.max(0, pos.x - 80), animated: true });
    }
  }, [activeCat]);

  const scrollToCat = (catId: string) => {
    setActiveCat(catId);
    isManualScrolling.current = true;
    if (catId === "all") {
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      setTimeout(() => isManualScrolling.current = false, 500);
      return;
    }
    const y = sectionY.current[catId];
    if (y!== undefined) {
      scrollRef.current?.scrollTo({ y: y, animated: true });
      setTimeout(() => isManualScrolling.current = false, 600);
    }
  };

  const onScroll = (e: any) => {
    if (isManualScrolling.current) return;
    const scrollY = e.nativeEvent.contentOffset.y + 200;
    let current = "all";
    let maxY = -1;
    for (const [catId, y] of Object.entries(sectionY.current)) {
      if (scrollY >= y && y > maxY) { maxY = y; current = catId; }
    }
    if (current!== activeCat) setActiveCat(current);
  };

  const handleAdd = (p: Product) => {
    const addItem = useCartStore.getState().addItem;
    addItem({ id: p.id, name: p.name, price: Number(p.price), image_url: p.image_url || "" });
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFBF5" }}>
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingTop: insets.top + 10, paddingBottom: 12 }}>
        <Pressable onPress={() => router.back()} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "#fff", justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: "#F0E6D9" }}>
          <Ionicons name="arrow-back" size={20} color="#2B2117" />
        </Pressable>
        <Text style={{ fontSize: 20, fontWeight: "900", color: "#2B2117", marginLeft: 14, flex: 1 }}>Our Pastries</Text>
      </View>

      <View style={{ marginHorizontal: 20, marginBottom: 12, flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 30, paddingHorizontal: 16, height: 48, borderWidth: 1, borderColor: "#F0E6D9" }}>
        <Ionicons name="search" size={18} color="#B8A89A" />
        <TextInput placeholder="Search croissant..." placeholderTextColor="#B8A89A" value={searchText} onChangeText={setSearchText} style={{ flex: 1, marginLeft: 10, fontSize: 14, color: "#2B2117" }} />
      </View>

      {/* Categories مع Auto Scroll */}
      <View style={{ backgroundColor: "#FFFBF5", paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: "#F0E6D9" }}>
        <ScrollView ref={catScrollRef} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}>
          {catList.map((cat) => {
            const isActive = activeCat === cat.id;
            return (
              <Pressable
                key={cat.id}
                onLayout={(e) => { catPositions.current[cat.id] = { x: e.nativeEvent.layout.x, width: e.nativeEvent.layout.width }; }}
                onPress={() => scrollToCat(cat.id)}
                style={{ paddingHorizontal: 18, height: 36, borderRadius: 18, backgroundColor: isActive? "#2B2117" : "#fff", borderWidth: 1, borderColor: isActive? "#2B2117" : "#F0E6D9", justifyContent: "center", alignItems: "center" }}
              >
                <Text style={{ fontSize: 13, fontWeight: "800", color: isActive? "#fff" : "#2B2117" }}>{cat.name}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {loading? <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}><ActivityIndicator size="large" color="#2B2117" /></View> : (
        <ScrollView ref={scrollRef} onScroll={onScroll} scrollEventThrottle={16} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
          {categories.map((cat) => {
            const items = grouped[cat.id] || [];
            if (items.length === 0) return null;
            return (
              <View key={cat.id} onLayout={(e) => { sectionY.current[cat.id] = e.nativeEvent.layout.y; }} style={{ paddingHorizontal: 20, marginTop: 22 }}>
                <Text style={{ fontSize: 17, fontWeight: "900", color: "#2B2117", marginBottom: 12 }}>{cat.name}</Text>
                <View style={{ gap: 12 }}>
                  {items.map((item) => (
                    <Pressable key={item.id} onPress={() => router.push(`/(customer)/product/${item.id}` as any)} style={{ flexDirection: "row", backgroundColor: "#fff", borderRadius: 20, padding: 12, borderWidth: 1, borderColor: "#F0E6D9", alignItems: "center" }}>
                      <View style={{ width: 88, height: 88, borderRadius: 16, backgroundColor: "#F7E8D5", overflow: "hidden" }}>{item.image_url && <Image source={{ uri: item.image_url }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />}</View>
                      <View style={{ flex: 1, marginLeft: 14 }}>
                        <Text style={{ fontSize: 14, fontWeight: "800", color: "#2B2117" }} numberOfLines={1}>{item.name}</Text>
                        <Text style={{ fontSize: 14, fontWeight: "900", color: "#2B2117", marginTop: 6 }}>{item.price} EGP</Text>
                      </View>
                      <Pressable onPress={(e) => { e.stopPropagation(); handleAdd(item); }} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: "#2B2117", justifyContent: "center", alignItems: "center" }}><Ionicons name="add" size={20} color="#fff" /></Pressable>
                    </Pressable>
                  ))}
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}