import { useEffect, useState } from "react";
import {
  View,
  Text,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Dimensions,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getTodayOrders, getPendingOrders } from "../../../lib/queries";
import { TrendingUp, TrendingDown, ShoppingBag, Clock3 } from "lucide-react-native";

const GOLD = "#C9973F";
const DARK = "#1A1512";
const MUTED = "#6B6359";
const TERTIARY = "#9C9488";
const BORDER = "#E8E4DC";
const SUCCESS = "#2F7D46";
const WARNING = "#D9822B";
const CANVAS = "#F7F3EC";
const CARD_BG = "#FFFFFF";

type Order = { id: string; status: string; total: number; created_at: string };

const { width: SCREEN_W } = Dimensions.get("window");

export default function CashierNewRapports() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [stats, setStats] = useState({ totalSales: 0, totalOrders: 0, avgTicket: 0, pendingCount: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [todayRes, pendingRes] = await Promise.all([
          getTodayOrders(),
          getPendingOrders(),
        ]);
        const today = (todayRes.data ?? []) as Order[];
        const pending = (pendingRes.data ?? []) as Order[];
        const totalSales = today.reduce((s, o) => s + (o.total ?? 0), 0);
        const avgTicket = today.length > 0 ? totalSales / today.length : 0;
        setStats({ totalSales, totalOrders: today.length, avgTicket, pendingCount: pending.length });
      } catch (e) {
        console.error("fetch reports error", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.loading}>
        <Text style={{ color: MUTED }}>{t("common.loading", "Loading...")}</Text>
      </SafeAreaView>
    );
  }

  const bars = [42, 68, 55, 82, 90, 74, 60];
  const maxBar = Math.max(...bars, 1);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 8 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>{t("cashier.orders_title", "Rapports")}</Text>

        {/* KPI Cards */}
        <View style={styles.kpiRow}>
          <View style={styles.kpiCard}>
            <TrendingUp size={16} color={SUCCESS} />
            <Text style={styles.kpiVal}>${stats.totalSales.toFixed(0)}</Text>
            <Text style={styles.kpiLabel}>Ventes du Jour</Text>
          </View>
          <View style={styles.kpiCard}>
            <ShoppingBag size={16} color={GOLD} />
            <Text style={styles.kpiVal}>{stats.totalOrders}</Text>
            <Text style={styles.kpiLabel}>Commandes</Text>
          </View>
          <View style={styles.kpiCard}>
            <Clock3 size={16} color={TERTIARY} />
            <Text style={styles.kpiVal}>{stats.avgTicket.toFixed(0)}</Text>
            <Text style={styles.kpiLabel}>Panier Moyen</Text>
          </View>
        </View>

        {/* Pending Orders Alert */}
        {stats.pendingCount > 0 && (
          <View style={styles.alertBox}>
            <Text style={styles.alertText}>{stats.pendingCount} ordre(s) en attente</Text>
          </View>
        )}

        {/* Simple Bar Chart */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Ventes des 7 derniers jours</Text>
          <View style={styles.chartBars}>
            {bars.map((val, idx) => {
              const h = (val / maxBar) * 120;
              return (
                <View key={idx} style={styles.barCol}>
                  <View style={[styles.bar, { height: h }]} />
                  <Text style={styles.barLabel}>J{idx + 1}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Sales Breakdown */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Résumé de la journée</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Commandes aujourd'hui</Text>
            <Text style={styles.rowVal}>{stats.totalOrders}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Ventes totales</Text>
            <Text style={styles.rowVal}>${stats.totalSales.toFixed(0)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Panier moyen</Text>
            <Text style={styles.rowVal}>${stats.avgTicket.toFixed(0)}</Text>
          </View>
          <View style={[styles.row, { borderBottomWidth: 0 }]}>
            <Text style={styles.rowLabel}>En attente</Text>
            <Text style={[styles.rowVal, { color: WARNING }]}>{stats.pendingCount}</Text>
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
  title: { fontSize: 22, fontWeight: "700", color: DARK, marginHorizontal: 16, marginTop: 12, marginBottom: 16 },
  kpiRow: { flexDirection: "row", gap: 8, marginHorizontal: 16, marginBottom: 12 },
  kpiCard: { flex: 1, backgroundColor: CARD_BG, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: BORDER, gap: 4 },
  kpiVal: { fontSize: 18, fontWeight: "800", color: DARK },
  kpiLabel: { fontSize: 10, color: MUTED, fontWeight: "600" },
  alertBox: { marginHorizontal: 16, paddingVertical: 10, paddingHorizontal: 12, backgroundColor: "#FEF6ED", borderRadius: 12, borderWidth: 1, borderColor: `${WARNING}33` },
  alertText: { fontSize: 13, fontWeight: "600", color: WARNING },
  chartCard: { marginHorizontal: 16, backgroundColor: CARD_BG, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: BORDER, marginBottom: 12 },
  chartTitle: { fontSize: 14, fontWeight: "600", color: DARK, marginBottom: 12 },
  chartBars: { flexDirection: "row", alignItems: "flex-end", gap: 6, height: 130 },
  barCol: { flex: 1, alignItems: "center", gap: 4 },
  bar: { width: "100%", backgroundColor: GOLD, borderRadius: 4 },
  barLabel: { fontSize: 9, color: MUTED },
  card: { marginHorizontal: 16, backgroundColor: CARD_BG, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: BORDER },
  cardTitle: { fontSize: 14, fontWeight: "600", color: DARK, marginBottom: 10 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6, borderBottomWidth: 1, borderColor: BORDER },
  rowLabel: { fontSize: 13, color: MUTED },
  rowVal: { fontSize: 13, fontWeight: "600", color: DARK },
});