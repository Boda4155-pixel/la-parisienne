import { useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  Image,
  Alert,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
} from "react-native";
import { useTranslation } from "react-i18next";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCartStore } from "../../../store/cart.store";
import { supabase } from "../../../lib/supabase";
import { getCategories, getProducts, toggleProductActive } from "../../../lib/queries";
import { PlusCircle, Package, Search, RefreshCw, ArchiveRestore, MinusCircle } from "lucide-react-native";

const { width: SCREEN_W } = Dimensions.get("window");
const GOLD = "#C9973F";
const GOLD_LIGHT = "#FAF3E7";
const DARK = "#1A1512";
const MUTED = "#6B6359";
const TERTIARY = "#9C9488";
const BORDER = "#E8E4DC";
const SUCCESS = "#2F7D46";
const SUCCESS_BG = "#EBF5EE";
const CANVAS = "#F7F3EC";
const CARD_BG = "#FFFFFF";
const INPUT_BG = "#F3EEE5";
const WARNING = "#D9822B";

type Category = { name: string; id: string };
type Product = {
  id: string;
  name: string;
  price: number;
  image_url?: string | null;
  is_active?: boolean;
  stock_quantity?: number;
  category_id?: string | null;
};

export default function CashierNewProducts() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const insets = useSafeAreaInsets();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [filtered, setFiltered] = useState<Product[]>([]);
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const addItem = useCartStore((s) => s.addItem);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: cats } = await getCategories();
      const catList = (cats ?? []).map((c: any) => ({ name: c.name, id: c.id }));
      setCategories(catList);
      if (catList.length > 0 && !selectedCat) {
        setSelectedCat(catList[0].name);
      }
    } catch (e) {
      console.error("fetch categories error", e);
    }
    try {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, price, image_url, is_active, stock_quantity, category_id")
        .eq("is_active", true)
        .order("name");
      if (!error && data) {
        setProducts(data as Product[]);
        applyFilter(data as Product[]);
      }
    } catch (e) {
      console.error("fetch products error", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const applyFilter = (prods?: Product[]) => {
    const list = prods ?? products;
    let result = list;
    if (selectedCat) {
      result = result.filter((p) => p.name.toLowerCase().includes(selectedCat.toLowerCase()));
    }
    if (search.trim()) {
      const term = search.toLowerCase();
      result = result.filter((p) => p.name.toLowerCase().includes(term));
    }
    setFiltered(result);
  };

  useEffect(() => { applyFilter(); }, [search, selectedCat, products]);

  const addToCart = (p: Product) => addItem({ ...p, quantity: 1, customizations: [] } as any);

  const handleToggleActive = async (p: Product) => {
    const newActive = !p.is_active;
    setTogglingId(p.id);
    try {
      const result = await toggleProductActive(p.id, newActive);
      if (result.success) {
        setProducts((prev) => prev.map((x) => x.id === p.id ? { ...x, is_active: newActive } : x));
      } else {
        Alert.alert("Error", result.error?.message ?? "Failed to update product");
      }
    } catch (e: any) {
      Alert.alert("Error", e.message ?? "Failed to update product");
    } finally {
      setTogglingId(null);
    }
  };

  if (loading && products.length === 0 && categories.length === 0) {
    return (
      <SafeAreaView style={styles.loading}>
        <ActivityIndicator size="large" color={GOLD} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 8 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Produits</Text>
          <Pressable onPress={loadData} style={styles.refreshBtn}>
            <RefreshCw size={18} color={GOLD} />
          </Pressable>
        </View>

        {/* Search Bar */}
        <View style={styles.searchWrap}>
          <Search size={18} color={TERTIARY} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un produit..."
            placeholderTextColor={TERTIARY}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Category Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillsRow}>
          {categories.map((c) => {
            const active = selectedCat === c.name;
            return (
              <Pressable
                key={c.id}
                onPress={() => setSelectedCat(c.name)}
                style={active ? styles.pillActive : styles.pill}
              >
                <Text style={active ? styles.pillActiveText : styles.pillText}>{c.name}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Product Grid */}
        <View style={styles.grid}>
          {filtered.map((p) => {
            const lowStock = p.stock_quantity !== undefined && p.stock_quantity <= 10;
            const inactive = !p.is_active;
            return (
              <View key={p.id} style={[styles.productCard, inactive && styles.productCardInactive]}>
                <View style={styles.imgWrap}>
                  {p.image_url ? (
                    <Image source={{ uri: p.image_url }} style={styles.img} />
                  ) : (
                    <View style={styles.imgPlaceholder}>
                      <Package size={24} color={TERTIARY} />
                    </View>
                  )}
                  {inactive && (
                    <View style={styles.inactiveOverlay}>
                      <Text style={styles.inactiveText}>Inactif</Text>
                    </View>
                  )}
                  {lowStock && !inactive && (
                    <View style={styles.lowStockTag}>
                      <Text style={styles.lowStockText}>Stock Faible</Text>
                    </View>
                  )}
                </View>
                <View style={styles.productBody}>
                  <Text style={styles.productName} numberOfLines={1}>{p.name}</Text>
                  <Text style={styles.productPrice}>{p.price.toFixed(2)} EGP</Text>
                  <View style={styles.productFooter}>
                    <Pressable style={styles.addBtn} onPress={() => addToCart(p)} disabled={inactive}>
                      <PlusCircle size={18} color="#FFFFFF" />
                    </Pressable>
                    <Pressable style={styles.toggleBtn} onPress={() => handleToggleActive(p)} disabled={togglingId === p.id}>
                      {togglingId === p.id ? (
                        <ActivityIndicator size="small" color={TERTIARY} />
                      ) : (
                        <ArchiveRestore size={16} color={inactive ? SUCCESS : WARNING} />
                      )}
                    </Pressable>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

import { TextInput } from "react-native";

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CANVAS },
  loading: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: CANVAS },
  scroll: { paddingBottom: 24 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12 },
  title: { fontSize: 22, fontWeight: "700", color: DARK },
  refreshBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: CARD_BG, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: BORDER },
  searchWrap: { flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: 16, marginBottom: 10, backgroundColor: CARD_BG, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: BORDER },
  searchInput: { flex: 1, fontSize: 14, color: DARK },
  pillsRow: { flexDirection: "row", gap: 8, marginHorizontal: 16, marginBottom: 12 },
  pillActive: { backgroundColor: DARK, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6 },
  pill: { backgroundColor: CARD_BG, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6, borderWidth: 1, borderColor: BORDER },
  pillActiveText: { color: "#FFFFFF", fontSize: 12, fontWeight: "600" },
  pillText: { color: MUTED, fontSize: 12 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, paddingHorizontal: 12 },
  productCard: { width: (SCREEN_W - 36) / 2, backgroundColor: CARD_BG, borderRadius: 16, borderWidth: 1, borderColor: BORDER, overflow: "hidden", marginBottom: 12 },
  productCardInactive: { opacity: 0.5 },
  imgWrap: { aspectRatio: 1, backgroundColor: INPUT_BG, overflow: "hidden", position: "relative" },
  img: { width: "100%", height: "100%", resizeMode: "cover" },
  imgPlaceholder: { flex: 1, justifyContent: "center", alignItems: "center" },
  inactiveOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center" },
  inactiveText: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
  lowStockTag: { position: "absolute", top: 6, right: 6, backgroundColor: GOLD_LIGHT, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999 },
  lowStockText: { fontSize: 9, fontWeight: "700", color: WARNING },
  productBody: { padding: 10 },
  productName: { fontSize: 13, fontWeight: "700", color: DARK },
  productPrice: { fontSize: 14, fontWeight: "700", color: GOLD, marginTop: 2 },
  productFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 },
  addBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: DARK, justifyContent: "center", alignItems: "center" },
  toggleBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: INPUT_BG, justifyContent: "center", alignItems: "center" },
});
