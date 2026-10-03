import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { Check, Plus, Search, ShoppingBag } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Animated, Dimensions, FlatList, Image, Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../../lib/supabase";
import { useCartStore } from "../../../store/cart.store";

const { width } = Dimensions.get("window");
const COLORS = { bg: "#FFFCF7", dark: "#1A1A1A", gold: "#C5A46A", beige: "#F5EFE6", gray: "#9CA3AF", white: "#FFFFFF" };

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [selectedCat, setSelectedCat] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [addedId, setAddedId] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  
  const addItem = useCartStore((s: any) => s.addItem);
  const getTotalItems = useCartStore((s: any) => s.getTotalItems);
  const totalItems = getTotalItems();
  const toastAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => { fetchData(); }, []);
  useEffect(() => {
    let result = products;
    if (selectedCat !== "all") result = result.filter(p => p.category_id?.toString() === selectedCat.toString());
    if (search.trim() !== "") result = result.filter(p => p.name?.toLowerCase().includes(search.toLowerCase()));
    setFilteredProducts(result);
  }, [selectedCat, search, products]);

  const fetchData = async () => {
    setLoading(true);
    const { data: cats } = await supabase.from("categories").select("id, name").order("name");
    const { data: prods } = await supabase.from("products").select("id, name, price, image_url, category_id").order("created_at", { ascending: false });
    if (cats) setCategories([{ id: "all", name: "All" }, ...cats]);
    if (prods) { setProducts(prods); setFilteredProducts(prods); }
    setLoading(false);
  };

  const handleAddToCart = async (item: any) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    
    addItem({ 
      id: item.id.toString(), 
      name: item.name, 
      price: Number(item.price),
      image_url: item.image_url,
      customizations: [],
    } as any);

    setAddedId(item.id.toString());
    setTimeout(() => setAddedId(null), 1500);

    setShowToast(true);
    Animated.sequence([
      Animated.timing(toastAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.delay(1500),
      Animated.timing(toastAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => setShowToast(false));
  };

  if (loading) return <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color={COLORS.gold} /></SafeAreaView>;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10 }}>
        <View>
          <Pressable onPress={() => router.navigate('/cart' as any)} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.beige, justifyContent: 'center', alignItems: 'center' }}>
            <ShoppingBag size={20} color={COLORS.dark} />
          </Pressable>
          {totalItems > 0 && (
            <View style={{ position: 'absolute', top: -4, right: -4, backgroundColor: COLORS.gold, minWidth: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 5, borderWidth: 2, borderColor: COLORS.bg }}>
              <Text style={{ color: 'white', fontSize: 11, fontWeight: '800' }}>{totalItems}</Text>
            </View>
          )}
        </View>
        <Text style={{ fontSize: 26, fontWeight: '800', color: COLORS.dark }}>Shop</Text>
      </View>

      <View style={{ marginHorizontal: 20, marginTop: 16, flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 16, paddingHorizontal: 16, height: 50, borderWidth: 1, borderColor: COLORS.beige }}>
        <Search size={18} color={COLORS.gray} />
        <TextInput placeholder="Search Croissant, Cookies..." placeholderTextColor={COLORS.gray} value={search} onChangeText={setSearch} style={{ flex: 1, marginLeft: 10, fontSize: 14, color: COLORS.dark }} />
      </View>

      <View style={{ marginTop: 14 }}>
        <FlatList horizontal data={categories} keyExtractor={(item) => item.id.toString()} showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
          renderItem={({ item }) => {
            const isActive = selectedCat.toString() === item.id.toString();
            return (
              <Pressable onPress={() => setSelectedCat(item.id)} style={{ backgroundColor: isActive ? COLORS.dark : COLORS.white, borderColor: isActive ? COLORS.dark : COLORS.beige, borderWidth: 1, paddingHorizontal: 18, height: 36, borderRadius: 18, justifyContent: 'center' }}>
                <Text style={{ color: isActive ? 'white' : COLORS.dark, fontWeight: '600', fontSize: 13 }}>{item.name}</Text>
              </Pressable>
            );
          }}
        />
      </View>

      <FlatList data={filteredProducts} numColumns={2} keyExtractor={(item) => item.id.toString()} contentContainerStyle={{ padding: 20, gap: 12, paddingBottom: 120 }} columnWrapperStyle={{ gap: 12 }}
        renderItem={({ item }) => {
          const isAdded = addedId === item.id.toString();
          return (
            <Pressable onPress={() => handleAddToCart(item)} style={{ width: (width - 52) / 2, backgroundColor: COLORS.white, borderRadius: 20, padding: 10, borderWidth: 1, borderColor: isAdded ? COLORS.gold : COLORS.beige }}>
              <View>
                <Image source={{ uri: item.image_url }} style={{ width: '100%', height: 120, borderRadius: 14, backgroundColor: COLORS.beige }} resizeMode="cover" />
                <View style={{ position: 'absolute', bottom: -8, right: -2, width: 32, height: 32, borderRadius: 16, backgroundColor: isAdded ? COLORS.gold : COLORS.dark, justifyContent: 'center', alignItems: 'center' }}>
                  {isAdded ? <Check size={18} color="white" /> : <Plus size={16} color="white" />}
                </View>
              </View>
              <Text numberOfLines={1} style={{ marginTop: 14, fontSize: 14, fontWeight: '700', color: COLORS.dark }}>{item.name}</Text>
              <Text style={{ marginTop: 4, fontSize: 13, fontWeight: '700', color: COLORS.gold }}>{item.price} EGP</Text>
            </Pressable>
          );
        }}
      />

      {showToast && (
        <Animated.View style={{ position: 'absolute', bottom: 110, alignSelf: 'center', backgroundColor: COLORS.dark, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 25, flexDirection: 'row', alignItems: 'center', gap: 8, opacity: toastAnim, transform: [{ translateY: toastAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
          <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: COLORS.gold, justifyContent: 'center', alignItems: 'center' }}><Check size={14} color="white" /></View>
          <Text style={{ color: 'white', fontWeight: '700', fontSize: 14 }}>تمت الإضافة للسلة</Text>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}