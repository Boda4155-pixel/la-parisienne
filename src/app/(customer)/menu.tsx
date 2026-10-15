import Ionicons from "@expo/vector-icons/Ionicons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Animated, Image, Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CUSTOMER_COLORS } from "../../../lib/customerTheme";
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
  const C = CUSTOMER_COLORS;

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [qty, setQty] = useState(1);

  // Toast
  const toastAnim = useRef(new Animated.Value(0)).current;
  const [showToast, setShowToast] = useState(false);
  const showAddedToast = () => {
    setShowToast(true);
    Animated.sequence([
      Animated.timing(toastAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(1300),
      Animated.timing(toastAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => setShowToast(false));
  };

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

  useEffect(() => {
    const pos = catPositions.current[activeCat];
    if (pos && catScrollRef.current) catScrollRef.current.scrollTo({ x: Math.max(0, pos.x - 80), animated: true });
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

  const openSheet = (p: Product) => { setSelectedProduct(p); setQty(1); setSheetVisible(true); };

  const handleAddQuick = (p: Product) => {
    const addItem = useCartStore.getState().addItem;
    addItem({ id: p.id, name: p.name, price: Number(p.price), image_url: p.image_url || "" });
    showAddedToast();
  };

  const handleAddFromSheet = () => {
    if (!selectedProduct) return;
    const addItem = useCartStore.getState().addItem;
    for (let i = 0; i < qty; i++) addItem({ id: selectedProduct.id, name: selectedProduct.name, price: Number(selectedProduct.price), image_url: selectedProduct.image_url || "" });
    setSheetVisible(false);
    showAddedToast();
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.background }}>
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingTop: insets.top + 10, paddingBottom: 12 }}>
        <Pressable onPress={() => router.back()} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: C.card, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: C.border }}>
          <Ionicons name="arrow-back" size={20} color={C.text} />
        </Pressable>
        <Text style={{ fontSize: 20, fontWeight: "900", color: C.text, marginLeft: 14, flex: 1 }}>Our Pastries</Text>
      </View>

      <View style={{ marginHorizontal: 20, marginBottom: 12, flexDirection: "row", alignItems: "center", backgroundColor: C.card, borderRadius: 30, paddingHorizontal: 16, height: 48, borderWidth: 1, borderColor: C.border }}>
        <Ionicons name="search" size={18} color={C.textMuted} />
        <TextInput placeholder="Search croissant..." placeholderTextColor={C.textMuted} value={searchText} onChangeText={setSearchText} style={{ flex: 1, marginLeft: 10, fontSize: 14, color: C.text }} />
      </View>

      <View style={{ backgroundColor: C.background, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: C.border }}>
        <ScrollView ref={catScrollRef} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}>
          {catList.map((cat) => {
            const isActive = activeCat === cat.id;
            return (
              <Pressable key={cat.id} onLayout={(e) => { catPositions.current[cat.id] = { x: e.nativeEvent.layout.x, width: e.nativeEvent.layout.width }; }} onPress={() => scrollToCat(cat.id)} style={{ paddingHorizontal: 18, height: 36, borderRadius: 18, backgroundColor: isActive? C.primary : C.card, borderWidth: 1, borderColor: isActive? C.primary : C.border, justifyContent: "center", alignItems: "center" }}>
                <Text style={{ fontSize: 13, fontWeight: "800", color: isActive? C.primaryText : C.text }}>{cat.name}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {loading? <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}><ActivityIndicator size="large" color={C.primary} /></View> : (
        <ScrollView ref={scrollRef} onScroll={onScroll} scrollEventThrottle={16} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
          {categories.map((cat) => {
            const items = grouped[cat.id] || [];
            if (items.length === 0) return null;
            return (
              <View key={cat.id} onLayout={(e) => { sectionY.current[cat.id] = e.nativeEvent.layout.y; }} style={{ paddingHorizontal: 20, marginTop: 22 }}>
                <Text style={{ fontSize: 17, fontWeight: "900", color: C.text, marginBottom: 12 }}>{cat.name}</Text>
                <View style={{ gap: 12 }}>
                  {items.map((item) => (
                    <Pressable key={item.id} onPress={() => openSheet(item)} style={{ flexDirection: "row", backgroundColor: C.card, borderRadius: 20, padding: 12, borderWidth: 1, borderColor: C.border, alignItems: "center" }}>
                      <View style={{ width: 88, height: 88, borderRadius: 16, backgroundColor: C.iconBg, overflow: "hidden" }}>{item.image_url && <Image source={{ uri: item.image_url }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />}</View>
                      <View style={{ flex: 1, marginLeft: 14 }}>
                        <Text style={{ fontSize: 14, fontWeight: "800", color: C.text }} numberOfLines={1}>{item.name}</Text>
                        <Text style={{ fontSize: 14, fontWeight: "900", color: C.text, marginTop: 6 }}>{item.price} EGP</Text>
                      </View>
                      <Pressable onPress={(e) => { e.stopPropagation(); handleAddQuick(item); }} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: C.primary, justifyContent: "center", alignItems: "center" }}><Ionicons name="add" size={20} color={C.primaryText} /></Pressable>
                    </Pressable>
                  ))}
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* TOAST - ADDED TO CART */}
      {showToast && (
        <Animated.View style={{ position: 'absolute', bottom: 95, alignSelf: 'center', backgroundColor: '#111', paddingHorizontal: 18, paddingVertical: 10, borderRadius: 30, flexDirection: 'row', alignItems: 'center', gap: 8, opacity: toastAnim, transform: [{ translateY: toastAnim.interpolate({ inputRange: [0,1], outputRange: [15,0] }) }] }}>
          <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#22c55e', justifyContent: 'center', alignItems: 'center' }}>
            <Ionicons name="checkmark" size={12} color="white" />
          </View>
          <Text style={{ color: 'white', fontWeight: '800', fontSize: 13 }}>Added to cart</Text>
        </Animated.View>
      )}

      <Modal visible={sheetVisible} transparent animationType="slide" statusBarTranslucent onRequestClose={() => setSheetVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}>
          <Pressable style={{ flex: 1 }} onPress={() => setSheetVisible(false)} />
          <View style={{ backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '88%', overflow: 'hidden' }}>
            <Pressable onPress={() => setSheetVisible(false)} style={{ position: 'absolute', top: 12, right: 12, zIndex: 10, width: 34, height: 34, borderRadius: 17, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#eee' }}>
              <Ionicons name="close" size={20} color="#111" />
            </Pressable>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 12 }}>
              <View style={{ width: '100%', height: 300, backgroundColor: '#f5f5f5' }}>
                {selectedProduct?.image_url && <Image source={{ uri: selectedProduct.image_url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />}
              </View>
              <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
                <Text style={{ fontSize: 20, fontWeight: '900', color: '#111' }}>{selectedProduct?.name}</Text>
                <Text style={{ fontSize: 13, color: '#666', marginTop: 8, lineHeight: 20 }}>{selectedProduct?.description || 'Freshly baked with love'}</Text>
              </View>
            </ScrollView>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 24, borderTopWidth: 1, borderColor: '#f0f0f0' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#e5e5e5', borderRadius: 28, height: 48, paddingHorizontal: 4 }}>
                <Pressable onPress={() => setQty(qty + 1)} style={{ width: 40, height: 40, justifyContent: 'center', alignItems: 'center' }}><Ionicons name="add" size={22} color="#111" /></Pressable>
                <Text style={{ fontSize: 16, fontWeight: '900', minWidth: 28, textAlign: 'center' }}>{qty}</Text>
                <Pressable onPress={() => setQty(Math.max(1, qty - 1))} style={{ width: 40, height: 40, justifyContent: 'center', alignItems: 'center' }}><Ionicons name="remove" size={22} color={qty === 1? '#ccc' : '#111'} /></Pressable>
              </View>
              <Pressable onPress={handleAddFromSheet} style={{ flex: 1, height: 48, borderRadius: 28, backgroundColor: C.primary, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18 }}>
                <Text style={{ color: C.primaryText, fontWeight: '800', fontSize: 14 }}>Add to cart</Text>
                <Text style={{ color: C.primaryText, fontWeight: '800', fontSize: 14 }}>{(Number(selectedProduct?.price || 0) * qty).toFixed(2)} EGP</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}