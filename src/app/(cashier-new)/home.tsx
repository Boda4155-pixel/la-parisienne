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
import { useAuthStore } from "../../../store/auth.store";
import { useCartStore } from "../../../store/cart.store";
import { supabase } from "../../../lib/supabase";
import { getTodayOrders } from "../../../lib/queries";
import { PlusCircle, ReceiptText, Grid, QrCode, Trash2, Banknote, TrendingUp, ShoppingBag, Plus, Receipt, Image as LucideImage } from "lucide-react-native";

const { width: SCREEN_W } = Dimensions.get("window");
const GOLD = "#C9973F";
const GOLD_LIGHT = "#FAF3E7";
const DARK = "#1A1512";
const MUTED = "#6B6359";
const TERTIARY = "#9C9488";
const BORDER = "#E8E4DC";
const SUCCESS = "#2F7D46";
const SUCCESS_BG = "#EBF5EE";
const WARNING = "#D9822B";
const WARNING_BG = "#FEF6ED";
const CANVAS = "#F7F3EC";
const CARD_BG = "#FFFFFF";
const INPUT_BG = "#F3EEE5";

type Product = {
  id: string;
  name: string;
  price: number;
  image_url?: string | null;
  is_active?: boolean;
  stock_quantity?: number;
  category_id?: string | null;
};

const CATEGORIES = ["Tous", "Viennoiserie", "Pâtisserie Fine", "Boulangerie"];

export default function CashierNewHome() {
  const { t } = useTranslation();
  const [stats, setStats] = useState({ totalOrders: 0, completed: 0, pending: 0, cancelled: 0, totalSales: 0 });
  const [products, setProducts] = useState<Product[]>([]);
  const [filtered, setFiltered] = useState<Product[]>([]);
  const [cat, setCat] = useState("Tous");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const cartItems = useCartStore((s) => s.items);
  const cartTotal = useCartStore((s) => s.getTotalPrice());
  const addItem = useCartStore((s) => s.addItem);
  const decreaseQty = useCartStore((s) => s.decreaseQty);
  const increaseQty = useCartStore((s) => s.increaseQty);
  const clearCart = useCartStore((s) => s.clearCart);

  const fetchAll = async () => {
    try {
      const { data: orders, error } = await getTodayOrders();
      if (!error && orders) {
        const totalSales = orders.reduce((s: number, o: any) => s + (o.total ?? 0), 0);
        setStats({
          totalOrders: orders.length,
          completed: orders.filter((o: any) => o.status === "completed").length,
          pending: orders.filter((o: any) => o.status === "pending").length,
          cancelled: orders.filter((o: any) => o.status === "cancelled").length,
          totalSales: Math.round(totalSales * 100) / 100,
        });
      }
    } catch (e) {
      console.error("fetch stats error", e);
    }
    try {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, price, image_url, is_active, stock_quantity, category_id")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(20);
      if (!error && data) {
        setProducts(data as Product[]);
        setFiltered(data as Product[]);
      }
    } catch (e) {
      console.error("fetch products error", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  useEffect(() => {
    let list = products;
    if (cat !== "Tous") {
      list = list.filter((p) => p.name.toLowerCase().includes(cat.toLowerCase()));
    }
    if (search.trim()) {
      list = list.filter((p) => p.name.toLowerCase().includes(search.trim().toLowerCase()));
    }
    setFiltered(list);
  }, [cat, search, products]);

  const addToCart = (p: Product) => addItem({ ...p, quantity: 1, customizations: [] } as any);

  if (loading) {
    return (
      <SafeAreaView style={styles.loading}>
        <ActivityIndicator size="large" color={GOLD} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Shift & Status Ribbon */}
        <View style={styles.ribbon}>
          <View style={styles.ribbonLeft}>
            <View style={styles.dotGreen} />
            <Text style={styles.ribbonText}>
              {t("cashier.comptoir", "Comptoir Principal")} • {t("cashier.shiftMatin", "Shift Matin")}
            </Text>
          </View>
          <View style={styles.onlineBadge}>
            <View style={styles.dotGreenSmall} />
            <Text style={styles.onlineText}>{t("cashier.online", "En Ligne")}</Text>
          </View>
        </View>

        {/* Quick Actions Grid */}
        <View style={styles.quickGrid}>
          <Pressable style={styles.quickBtn} onPress={() => router.push("/(cashier-new)/cart" as any)}>
            <View style={styles.quickIconWrap}>
              <PlusCircle size={22} color={GOLD} />
            </View>
            <Text style={styles.quickLabel}>{t("cashier.newOrder", "New Order")}</Text>
            <Text style={styles.quickSub}>New Order</Text>
          </Pressable>
          <Pressable style={styles.quickBtn} onPress={() => router.push("/(cashier-new)/orders" as any)}>
            <View style={styles.quickIconWrap}>
              <ReceiptText size={22} color={GOLD} />
            </View>
            <Text style={styles.quickLabel}>{t("cashier.activeTickets", "Active Tickets")}</Text>
            <Text style={styles.quickSub}>Active Tickets</Text>
            <View style={styles.counterPill}>
              <Text style={styles.counterText}>{stats.pending}</Text>
            </View>
          </Pressable>
          <Pressable style={styles.quickBtn} onPress={() => router.push("/(cashier-new)/products" as any)}>
            <View style={styles.quickIconWrap}>
              <Grid size={22} color={GOLD} />
            </View>
            <Text style={styles.quickLabel}>Catalogue</Text>
            <Text style={styles.quickSub}>Bakery Menu</Text>
          </Pressable>
          <Pressable style={styles.quickBtn} onPress={() => Alert.alert(t("cashier.scan", "Scanner"), "Ouvrir le scanner")}>
            <View style={styles.quickIconWrap}>
              <QrCode size={22} color={GOLD} />
            </View>
            <Text style={styles.quickLabel}>Scanner</Text>
            <Text style={styles.quickSub}>Quick Scan</Text>
          </Pressable>
        </View>

        {/* Popular Products Showcase */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Viennoiseries & Pâtisseries</Text>
              <Text style={styles.sectionSub}>Produits du jour • Faits maison ce matin</Text>
            </View>
            <View style={styles.topPillsBadge}>
              <Text style={styles.topPillsText}>TOP VENTES</Text>
            </View>
          </View>

          {/* Category Pills */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillsRow}>
            {CATEGORIES.map((c) => {
              const active = cat === c;
              return (
                <Pressable
                  key={c}
                  onPress={() => setCat(c)}
                  style={active ? styles.pillActive : styles.pill}
                >
                  <Text style={active ? styles.pillActiveText : styles.pillText}>{c}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Product Grid 2-col */}
          <View style={styles.grid}>
            {filtered.map((p) => {
              const low = p.stock_quantity !== undefined && p.stock_quantity <= 10;
              return (
                <View key={p.id} style={styles.productCard}>
                  <View style={styles.imgWrap}>
                    {p.image_url ? (
                      <Image source={{ uri: p.image_url }} style={styles.img} />
                    ) : (
                      <View style={styles.imgPlaceholder}>
                        <LucideImage size={24} color={TERTIARY} />
                      </View>
                    )}
                    {low ? (
                      <View style={styles.lowStockTag}>
                        <Text style={styles.lowStockText}>Stock Faible ({p.stock_quantity})</Text>
                      </View>
                    ) : (
                      <View style={styles.stockTag}>
                        <Text style={styles.stockText}>{p.stock_quantity ?? "—"} en stock</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.productBody}>
                    <Text style={styles.productName} numberOfLines={1}>{p.name}</Text>
                    <Text style={styles.productSub}>Faits maison</Text>
                    <View style={styles.productFooter}>
                      <Text style={styles.price}>{p.price.toFixed(2)} EGP</Text>
                      <Pressable style={styles.addBtn} onPress={() => addToCart(p)}>
                        <Plus size={16} color="#FFFFFF" />
                      </Pressable>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Active Cart / Ticket Panel */}
        <View style={styles.cartPanel}>
          <View style={styles.cartHeader}>
            <View style={styles.cartHeaderLeft}>
              <View style={styles.receiptCircle}>
                <Receipt size={18} color="#FFFFFF" />
              </View>
              <View>
                <Text style={styles.cartTitle}>Ticket #1042</Text>
                <View style={styles.enCoursBadge}>
                  <Text style={styles.enCoursText}>EN COURS</Text>
                </View>
              </View>
            </View>
            <View style={styles.cartHeaderRight}>
              <View style={styles.counterPillLight}>
                <ShoppingBag size={14} color={DARK} />
                <Text style={styles.counterTextLight}>{cartItems.length}</Text>
              </View>
            </View>
          </View>

          {cartItems.length === 0 ? (
            <Text style={styles.cartEmpty}>{t("cashier.cartEmpty", "Cart is empty")}</Text>
          ) : (
            <>
              {cartItems.map((item: any, idx: number) => (
                <View key={idx} style={styles.lineItem}>
                  <View style={styles.lineItemInfo}>
                    <Text style={styles.lineName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.lineUnit}>
                      {item.price.toFixed(2)} EGP × {item.quantity}
                    </Text>
                  </View>
                  <View style={styles.stepper}>
                    <Pressable style={styles.stepperBtn} onPress={() => decreaseQty(item.id, [])}>
                      <Text style={styles.stepperTxt}>−</Text>
                    </Pressable>
                    <Text style={styles.stepperQty}>{item.quantity}</Text>
                    <Pressable style={styles.stepperBtn} onPress={() => increaseQty(item.id, [])}>
                      <Text style={styles.stepperTxt}>+</Text>
                    </Pressable>
                  </View>
                  <Text style={styles.lineTotal}>
                    {(item.price * item.quantity).toFixed(2)} EGP
                  </Text>
                </View>
              ))}
            </>
          )}

          {/* Calculations */}
          <View style={styles.calcBox}>
            <View style={styles.calcRow}>
              <Text style={styles.calcLabel}>Subtotal</Text>
              <Text style={styles.calcVal}>{stats.totalSales.toFixed(2)} EGP</Text>
            </View>
            <View style={styles.calcRow}>
              <Text style={styles.calcLabel}>Remise Club Fidélité (10%)</Text>
              <Text style={[styles.calcVal, { color: SUCCESS }]}>-{(stats.totalSales * 0.1).toFixed(2)} EGP</Text>
            </View>
            <View style={styles.calcRow}>
              <Text style={styles.calcLabel}>TVA Collectée (20%)</Text>
              <Text style={[styles.calcVal, { color: TERTIARY }]}>{(stats.totalSales * 0.2).toFixed(2)} EGP</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.calcRowTotal}>
              <View>
                <Text style={styles.grandLabel}>Total Net à Payer</Text>
                <Text style={styles.grandSub}>Payment Due • TTC</Text>
              </View>
              <Text style={styles.grandVal}>
                {(stats.totalSales * 1.1).toFixed(2)} EGP
              </Text>
            </View>
          </View>

          {/* Cart Action Buttons */}
          <View style={styles.cartActions}>
            <Pressable style={styles.btnSecondary} onPress={clearCart}>
              <Trash2 size={16} color={DARK} />
              <Text style={styles.btnSecText}>Vider Cart</Text>
            </Pressable>
            <Pressable style={styles.btnPrimary} onPress={() => router.push("/(cashier-new)/checkout" as any)}>
              <Banknote size={16} color="#FFFFFF" />
              <Text style={styles.btnPrimText}>
                Régler la Commande {(stats.totalSales * 1.1).toFixed(2)} EGP →
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Recent Orders & Daily KPIs */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Dernières Commandes</Text>
            <Pressable onPress={() => router.push("/(cashier-new)/orders" as any)}>
              <Text style={styles.viewAll}>Voir l'historique</Text>
            </Pressable>
          </View>

          {[
            { id: "1", num: "#LP-1041", time: "14:22", items: "3x Baguette, 2x Éclair", price: "28.50 EGP", status: "Prête", statusBg: WARNING_BG, statusFg: WARNING },
            { id: "2", num: "#LP-1040", time: "14:15", items: "1x Tartelette, 1x Café", price: "9.80 EGP", status: "Payée", statusBg: SUCCESS_BG, statusFg: SUCCESS },
            { id: "3", num: "#LP-1039", time: "14:02", items: "Coffret Cadeau Macarons (3x)", price: "42.00 EGP", status: "Livrée", statusBg: INPUT_BG, statusFg: MUTED },
          ].map((o) => (
            <View key={o.id} style={styles.orderRow}>
              <View style={styles.orderIcon}>
                <Receipt size={18} color={TERTIARY} />
              </View>
              <View style={styles.orderInfo}>
                <Text style={styles.orderNum}>{o.num} • {o.time}</Text>
                <Text style={styles.orderItems}>{o.items}</Text>
              </View>
              <Text style={styles.orderPrice}>{o.price}</Text>
              <View style={[styles.statusBadge, { backgroundColor: o.statusBg }]}>
                <Text style={[styles.statusText, { color: o.statusFg }]}>{o.status}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Bottom KPI Metric Cards */}
        <View style={styles.kpiGrid}>
          <View style={styles.kpiCard}>
            <TrendingUp size={16} color={SUCCESS} />
            <Text style={styles.kpiLabel}>Ventes du Jour</Text>
            <Text style={styles.kpiVal}>{stats.totalSales.toFixed(0)} EGP</Text>
            <Text style={styles.kpiSub}>+14% vs hier</Text>
          </View>
          <View style={styles.kpiCard}>
            <Receipt size={16} color={TERTIARY} />
            <Text style={styles.kpiLabel}>Commandes</Text>
            <Text style={styles.kpiVal}>{stats.totalOrders}</Text>
            <Text style={styles.kpiSub}>Objectif: 95</Text>
          </View>
          <View style={styles.kpiCard}>
            <ShoppingBag size={16} color={TERTIARY} />
            <Text style={styles.kpiLabel}>Panier Moyen</Text>
            <Text style={styles.kpiVal}>{stats.totalOrders > 0 ? (stats.totalSales / stats.totalOrders).toFixed(2) : "0"} EGP</Text>
            <Text style={[styles.kpiSub, { color: SUCCESS }]}>+2.10 EGP</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CANVAS },
  loading: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: CANVAS },
  scroll: { paddingBottom: 24 },
  ribbon: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    backgroundColor: "#FDF9F2", borderBottomWidth: 1, borderColor: BORDER,
    paddingHorizontal: 16, paddingVertical: 8,
  },
  ribbonLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  dotGreen: { width: 6, height: 6, borderRadius: 3, backgroundColor: SUCCESS },
  dotGreenSmall: { width: 6, height: 6, borderRadius: 3, backgroundColor: SUCCESS },
  ribbonText: { fontSize: 12, fontWeight: "600", color: DARK },
  onlineBadge: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: SUCCESS_BG, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, borderWidth: 1, borderColor: `${SUCCESS}33` },
  onlineText: { fontSize: 11, fontWeight: "600", color: SUCCESS },
  quickGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginHorizontal: 16, marginTop: 12, marginBottom: 16 },
  quickBtn: {
    width: (SCREEN_W - 48) / 2, height: 60, backgroundColor: DARK, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 10, justifyContent: "center", gap: 4,
    borderWidth: 1, borderColor: "#2F2722",
  },
  quickIconWrap: { width: 28, height: 28, justifyContent: "center", alignItems: "center" },
  quickLabel: { color: "#FFFFFF", fontSize: 13, fontWeight: "600" },
  quickSub: { fontSize: 10, color: TERTIARY },
  counterPill: { position: "absolute", top: 6, right: 6, backgroundColor: GOLD, borderRadius: 999, paddingHorizontal: 6, paddingVertical: 1 },
  counterText: { color: DARK, fontSize: 11, fontWeight: "700" },
  section: { paddingHorizontal: 16, marginTop: 8 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 },
  sectionTitle: { fontSize: 19, fontWeight: "700", color: DARK },
  sectionSub: { fontSize: 12, color: MUTED, marginTop: 2 },
  topPillsBadge: { backgroundColor: GOLD_LIGHT, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, borderWidth: 1, borderColor: `${GOLD}33` },
  topPillsText: { fontSize: 11, fontWeight: "700", color: "#B37F2C", letterSpacing: 1 },
  pillsRow: { flexDirection: "row", gap: 8, marginBottom: 12, marginTop: 4 },
  pillActive: { backgroundColor: DARK, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6 },
  pill: { backgroundColor: CARD_BG, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6, borderWidth: 1, borderColor: BORDER },
  pillActiveText: { color: "#FFFFFF", fontSize: 12, fontWeight: "600" },
  pillText: { color: MUTED, fontSize: 12 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, paddingBottom: 8 },
  productCard: { width: (SCREEN_W - 48) / 2, backgroundColor: CARD_BG, borderRadius: 16, borderWidth: 1, borderColor: BORDER, overflow: "hidden", shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  imgWrap: { aspectRatio: 1, backgroundColor: INPUT_BG, overflow: "hidden" },
  img: { width: "100%", height: "100%", resizeMode: "cover" },
  imgPlaceholder: { flex: 1, justifyContent: "center", alignItems: "center" },
  stockTag: { position: "absolute", top: 8, left: 8, backgroundColor: "rgba(255,255,255,0.9)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  lowStockTag: { position: "absolute", top: 8, left: 8, backgroundColor: GOLD_LIGHT, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, borderWidth: 1, borderColor: `${WARNING}33` },
  stockText: { fontSize: 10, fontWeight: "600", color: DARK },
  lowStockText: { fontSize: 10, fontWeight: "700", color: WARNING },
  productBody: { padding: 10 },
  productName: { fontSize: 14, fontWeight: "700", color: DARK },
  productSub: { fontSize: 11, color: MUTED, marginTop: 2 },
  productFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8 },
  price: { fontSize: 15, fontWeight: "700", color: "#B37F2C" },
  addBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: DARK, justifyContent: "center", alignItems: "center" },
  cartPanel: { marginHorizontal: 16, marginTop: 20, backgroundColor: CARD_BG, borderRadius: 16, borderWidth: 1, borderColor: BORDER, padding: 16, shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 6, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  cartHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  cartHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  receiptCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: DARK, justifyContent: "center", alignItems: "center" },
  cartTitle: { fontSize: 14, fontWeight: "700", color: DARK },
  enCoursBadge: { backgroundColor: GOLD_LIGHT, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999, marginTop: 4, alignSelf: "flex-start" },
  enCoursText: { fontSize: 10, fontWeight: "700", color: WARNING },
  cartHeaderRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  counterPillLight: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: INPUT_BG, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  counterTextLight: { fontSize: 12, fontWeight: "600", color: DARK },
  cartEmpty: { fontSize: 13, color: MUTED, textAlign: "center", paddingVertical: 12 },
  lineItem: { flexDirection: "row", alignItems: "center", paddingVertical: 8, borderBottomWidth: 1, borderColor: BORDER, gap: 8 },
  lineItemInfo: { flex: 1, gap: 2 },
  lineName: { fontSize: 13, fontWeight: "600", color: DARK },
  lineUnit: { fontSize: 11, color: MUTED },
  stepper: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: CANVAS, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 999, borderWidth: 1, borderColor: BORDER },
  stepperBtn: { width: 26, height: 26, justifyContent: "center", alignItems: "center" },
  stepperTxt: { fontSize: 14, fontWeight: "700", color: DARK },
  stepperQty: { fontSize: 13, fontWeight: "700", color: DARK, minWidth: 18, textAlign: "center" },
  lineTotal: { fontSize: 13, fontWeight: "700", color: DARK },
  calcBox: { backgroundColor: "#FDF9F2", padding: 12, borderRadius: 12, marginTop: 10 },
  calcRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  calcLabel: { fontSize: 12, color: MUTED },
  calcVal: { fontSize: 12, fontWeight: "600", color: DARK },
  divider: { height: 1, backgroundColor: BORDER, borderStyle: "dashed", marginVertical: 6 },
  calcRowTotal: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  grandLabel: { fontSize: 15, fontWeight: "700", color: DARK },
  grandSub: { fontSize: 11, color: MUTED, marginTop: 2 },
  grandVal: { fontSize: 20, fontWeight: "800", color: DARK },
  cartActions: { flexDirection: "row", gap: 10, marginTop: 12 },
  btnSecondary: { flex: 1, backgroundColor: INPUT_BG, paddingVertical: 12, borderRadius: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  btnSecText: { fontSize: 12, fontWeight: "600", color: DARK },
  btnPrimary: { flex: 2, backgroundColor: DARK, paddingVertical: 12, borderRadius: 12, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  btnPrimText: { fontSize: 12, fontWeight: "700", color: "#FFFFFF" },
  sectionHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  orderRow: { flexDirection: "row", alignItems: "center", backgroundColor: CARD_BG, borderRadius: 12, padding: 10, marginBottom: 8, gap: 8, borderWidth: 1, borderColor: BORDER },
  orderIcon: { width: 34, height: 34, borderRadius: 8, backgroundColor: INPUT_BG, justifyContent: "center", alignItems: "center" },
  orderInfo: { flex: 1, gap: 2 },
  orderNum: { fontSize: 13, fontWeight: "700", color: DARK },
  orderItems: { fontSize: 11, color: MUTED },
  orderPrice: { fontSize: 13, fontWeight: "700", color: DARK },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  statusText: { fontSize: 10, fontWeight: "600" },
  viewAll: { fontSize: 12, color: "#B37F2C", textDecorationLine: "underline" },
  kpiGrid: { flexDirection: "row", gap: 8, marginHorizontal: 16, marginTop: 16, marginBottom: 24 },
  kpiCard: { flex: 1, backgroundColor: CARD_BG, borderRadius: 12, padding: 10, borderWidth: 1, borderColor: BORDER, gap: 4 },
  kpiLabel: { fontSize: 10, color: MUTED, fontWeight: "600" },
  kpiVal: { fontSize: 16, fontWeight: "800", color: DARK },
  kpiSub: { fontSize: 10, color: SUCCESS, fontWeight: "600" },
});
