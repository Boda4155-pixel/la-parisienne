import React, { useState, useCallback, useEffect, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  Pressable,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import {
  Download,
  TrendingUp,
  Clock,
  Package,
  ChevronRight,
} from "lucide-react-native";

import { useSupabaseQuery } from "../../../hooks/useSupabaseQuery";
import {
  getSalesAnalytics,
  getTopSellingProducts,
  getPeakHoursData,
  type SalesAnalytics,
  type TopProductAnalytics,
  type PeakHourAnalytics,
  type TimeFrame,
} from "../../../lib/adminQueries";
import AdminMoreTrigger from "../../../components/admin/AdminMoreTrigger";

// ===========================================
// Format Functions
// ===========================================

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "EGP",
  }).format(amount);
};

// ===========================================
// Report Type Tabs
// ===========================================

type ReportType = "sales" | "products" | "staff";

const REPORT_TABS: { key: ReportType; label: { en: string; ar: string } }[] = [
  { key: "sales", label: { en: "Sales Reports", ar: "تقارير المبيعات" } },
  { key: "products", label: { en: "Product Performance", ar: "أداء المنتجات" } },
  { key: "staff", label: { en: "Staff Reports", ar: "تقارير الموظفين" } },
];

// ===========================================
// Main Analytics Screen Component
// ===========================================

export default function AnalyticsScreen() {
  const { t, i18n } = useTranslation();
  const [timeFrame, setTimeFrame] = useState<TimeFrame>("week");
  const [reportType, setReportType] = useState<ReportType>("sales");
  const [refreshing, setRefreshing] = useState(false);
  const [updating, setUpdating] = useState(false);

  const isRTL = i18n.dir() === "rtl";

  // Sales analytics
  const {
    data: salesData,
    loading: salesLoading,
    refetch: refetchSales,
  } = useSupabaseQuery({
    fn: () => getSalesAnalytics(timeFrame),
  });

  // Top selling products
  const {
    data: topProducts,
    loading: topProductsLoading,
    refetch: refetchTopProducts,
  } = useSupabaseQuery({
    fn: () => getTopSellingProducts(5),
  });

  // Peak hours
  const {
    data: peakHours,
    loading: peakHoursLoading,
    refetch: refetchPeakHours,
  } = useSupabaseQuery({
    fn: () => getPeakHoursData(),
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchSales(), refetchTopProducts(), refetchPeakHours()]);
    setRefreshing(false);
  }, [refetchSales, refetchTopProducts, refetchPeakHours]);

  // Current data based on report type
  const currentSales = salesData;
  const currentTopProducts = topProducts;
  const currentPeakHours = peakHours;

  // Skeleton state
  const allLoading = salesLoading || topProductsLoading || peakHoursLoading;
  const showSkeleton = allLoading && !salesData && !topProducts && !peakHours;

  // Handle Export CSV (best-effort)
  const handleExport = async () => {
    setUpdating(true);
    // In production, generate actual CSV/PDF file here
    await new Promise((resolve) => setTimeout(resolve, 800));
    setUpdating(false);
  };

  // Render bar chart for peak hours
  const renderPeakHourBar = ({ item }: { item: PeakHourAnalytics }) => {
    const maxOrders = currentPeakHours?.length
      ? Math.max(...currentPeakHours.map((h) => h.orderCount), 1)
      : 1;
    const barWidth = (item.orderCount / maxOrders) * 100;

    return (
      <View style={styles.peakHourRow}>
        <Text style={styles.peakHourLabel}>{item.hourLabel}</Text>
        <View style={styles.peakHourBarContainer}>
          <View style={[styles.peakHourBar, { width: `${barWidth}%` }]} />
        </View>
        <Text style={styles.peakHourCount}>{item.orderCount}</Text>
      </View>
    );
  };

  // Render top product item
  const renderTopProduct = ({ item }: { item: TopProductAnalytics }) => (
    <View style={styles.topProductRow}>
      <View style={styles.topProductInfo}>
        <Text style={styles.topProductName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.topProductCategory}>{item.category ?? ""}</Text>
      </View>
      <View style={styles.topProductStats}>
        <Text style={styles.topProductRevenue}>{formatCurrency(item.revenue)}</Text>
        <Text style={styles.topProductQty}>{item.quantitySold} sold</Text>
      </View>
    </View>
  );

  // Skeleton card
  const SkeletonCard = () => (
    <View style={styles.reportCard}>
      <View style={styles.skeletonTitle} />
      <View style={styles.skeletonContent} />
      <View style={styles.skeletonContent} />
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#C09248"]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.title}>
              {isRTL ? "التقارير والتحليلات المتقدمة" : "Advanced Analytics"}
            </Text>
            <Text style={styles.subtitle}>
              {isRTL ? "تحليل المبيعات والأداء" : "Sales & performance analytics"}
            </Text>
          </View>
          <AdminMoreTrigger />
        </View>

        {/* Time Frame Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.timeFrameContainer}
          contentContainerStyle={styles.timeFrameContent}
        >
          {([{ key: "day", label: { en: "Day", ar: "يوم" } }, { key: "week", label: { en: "Week", ar: "أسبوع" } }, { key: "month", label: { en: "Month", ar: "شهر" } }] as { key: TimeFrame; label: { en: string; ar: string } }[]).map((tf) => (
            <Pressable
              key={tf.key}
              style={[styles.timeFrameChip, timeFrame === tf.key && styles.activeTimeFrameChip]}
              onPress={() => setTimeFrame(tf.key)}
            >
              <Text style={[styles.timeFrameText, timeFrame === tf.key && styles.activeTimeFrameText]}>
                {tf.label[isRTL ? "ar" : "en"]}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Report Type Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.reportTabsContainer}
          contentContainerStyle={styles.reportTabsContent}
        >
          {REPORT_TABS.map((tab) => (
            <Pressable
              key={tab.key}
              style={[styles.reportTab, reportType === tab.key && styles.activeReportTab]}
              onPress={() => setReportType(tab.key)}
            >
              <Text style={[styles.reportTabText, reportType === tab.key && styles.activeReportTabText]}>
                {tab.label[isRTL ? "ar" : "en"]}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Sales Overview Card */}
        {!showSkeleton && currentSales && (
          <View style={styles.overviewCard}>
            <View style={styles.overviewRow}>
              <View style={styles.overviewItem}>
                <Text style={styles.overviewLabel}>
                  {isRTL ? "المبيعات" : "Revenue"}
                </Text>
                <Text style={styles.overviewValue}>
                  {formatCurrency(currentSales.totalRevenue)}
                </Text>
              </View>
              <View style={styles.overviewItem}>
                <Text style={styles.overviewLabel}>
                  {isRTL ? "الطلبات" : "Orders"}
                </Text>
                <Text style={styles.overviewValue}>
                  {currentSales.totalOrders}
                </Text>
              </View>
              <View style={styles.overviewItem}>
                <Text style={styles.overviewLabel}>
                  {isRTL ? "متوسط الطلب" : "Avg Order"}
                </Text>
                <Text style={styles.overviewValue}>
                  {formatCurrency(currentSales.averageOrderValue)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Sales Trend Section */}
        {reportType === "sales" && !showSkeleton && currentSales && (
          <View style={styles.reportCard}>
            <Text style={styles.reportTitle}>
              {isRTL ? "اتجاه المبيعات" : "Sales Trend"}
            </Text>
            {currentSales.revenueByPeriod.length === 0 ? (
              <Text style={styles.emptyText}>
                {isRTL ? "لا توجد بيانات" : "No data available"}
              </Text>
            ) : (
              currentSales.revenueByPeriod.map((period) => (
                <View key={period.period} style={styles.trendRow}>
                  <Text style={styles.trendPeriod}>{period.period}</Text>
                  <View style={styles.trendBarContainer}>
                    <View
                      style={[
                        styles.trendBar,
                        {
                          width: `${Math.max(
                            (period.revenue /
                              Math.max(
                                ...currentSales.revenueByPeriod.map((p) => p.revenue),
                                1
                              )) *
                            100,
                            2
                          )}%`,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.trendRevenue}>{formatCurrency(period.revenue)}</Text>
                </View>
              ))
            )}
          </View>
        )}

        {/* Top Selling Products Section */}
        {reportType === "products" && !showSkeleton && currentTopProducts && (
          <View style={styles.reportCard}>
            <Text style={styles.reportTitle}>
              {isRTL ? "أفضل المنتجات مبيعاً" : "Top Selling Products"}
            </Text>
            {currentTopProducts.length === 0 ? (
              <Text style={styles.emptyText}>
                {isRTL ? "لا توجد بيانات" : "No data available"}
              </Text>
            ) : (
              currentTopProducts.map((product) => (
                <View key={product.id} style={styles.topProductRow}>
                  <View style={styles.topProductInfo}>
                    <Text style={styles.topProductName} numberOfLines={1}>
                      {product.name}
                    </Text>
                    <Text style={styles.topProductCategory}>{product.category ?? ""}</Text>
                  </View>
                  <View style={styles.topProductStats}>
                    <Text style={styles.topProductRevenue}>{formatCurrency(product.revenue)}</Text>
                    <Text style={styles.topProductQty}>{product.quantitySold} sold</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* Peak Hours Section */}
        {reportType === "staff" && !showSkeleton && currentPeakHours && (
          <View style={styles.reportCard}>
            <Text style={styles.reportTitle}>
              {isRTL ? "أوقات الذروة" : "Peak Hours"}
            </Text>
            {currentPeakHours.length === 0 ? (
              <Text style={styles.emptyText}>
                {isRTL ? "لا توجد بيانات" : "No data available"}
              </Text>
            ) : (
              currentPeakHours.map((hour) => {
                const maxOrders = Math.max(...currentPeakHours.map((h) => h.orderCount), 1);
                const barWidth = (hour.orderCount / maxOrders) * 100;
                return (
                  <View key={hour.hour} style={styles.peakHourRow}>
                    <Text style={styles.peakHourLabel}>{hour.hourLabel}</Text>
                    <View style={styles.peakHourBarContainer}>
                      <View style={[styles.peakHourBar, { width: `${barWidth}%` }]} />
                    </View>
                    <Text style={styles.peakHourCount}>{hour.orderCount}</Text>
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* Export Button */}
        <Pressable
          style={styles.exportButton}
          onPress={handleExport}
          disabled={updating}
        >
          {updating ? (
            <ActivityIndicator size={16} color="#FFFFFF" />
          ) : (
            <Download size={18} color="#FFFFFF" />
          )}
          <Text style={styles.exportButtonText}>
            {updating
              ? isRTL ? "جارٍ التصدير..." : "Exporting..."
              : isRTL
              ? "تصدير CSV / PDF"
              : "Export Data (CSV / PDF)"}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

// ===========================================
// Styles
// ===========================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FDF8F3",
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  headerTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    fontFamily: "Quicksand-Bold",
    color: "#181C2E",
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Quicksand-Regular",
    color: "#878787",
    marginTop: 4,
  },

  // Time Frame Tabs
  timeFrameContainer: {
    marginBottom: 12,
  },
  timeFrameContent: {
    gap: 8,
  },
  timeFrameChip: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginRight: 8,
  },
  activeTimeFrameChip: {
    backgroundColor: "#C09248",
    borderColor: "#C09248",
  },
  timeFrameText: {
    fontSize: 12,
    fontFamily: "Quicksand-Medium",
    color: "#878787",
  },
  activeTimeFrameText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },

  // Report Type Tabs
  reportTabsContainer: {
    marginBottom: 16,
  },
  reportTabsContent: {
    gap: 8,
  },
  reportTab: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginRight: 8,
  },
  activeReportTab: {
    backgroundColor: "#C09248",
    borderColor: "#C09248",
  },
  reportTabText: {
    fontSize: 12,
    fontFamily: "Quicksand-Medium",
    color: "#878787",
  },
  activeReportTabText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },

  // Overview Card
  overviewCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#181C2E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  overviewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  overviewItem: {
    alignItems: "center",
    flex: 1,
  },
  overviewLabel: {
    fontSize: 12,
    fontFamily: "Quicksand-Regular",
    color: "#878787",
    marginBottom: 4,
  },
  overviewValue: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "Quicksand-Bold",
    color: "#181C2E",
  },

  // Report Card
  reportCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#181C2E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Quicksand-Bold",
    color: "#181C2E",
    marginBottom: 16,
  },

  // Trend Row
  trendRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  trendPeriod: {
    width: 70,
    fontSize: 12,
    fontFamily: "Quicksand-Regular",
    color: "#878787",
  },
  trendBarContainer: {
    flex: 1,
    marginHorizontal: 12,
  },
  trendBar: {
    height: 12,
    backgroundColor: "#C09248",
    borderRadius: 6,
  },
  trendRevenue: {
    fontSize: 12,
    fontFamily: "Quicksand-Bold",
    color: "#181C2E",
    width: 80,
    textAlign: "right",
  },

  // Top Product Row
  topProductRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  topProductInfo: {
    flex: 1,
  },
  topProductName: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Quicksand-Bold",
    color: "#181C2E",
  },
  topProductCategory: {
    fontSize: 11,
    fontFamily: "Quicksand-Regular",
    color: "#878787",
  },
  topProductStats: {
    alignItems: "flex-end",
  },
  topProductRevenue: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "Quicksand-Bold",
    color: "#C09248",
  },
  topProductQty: {
    fontSize: 11,
    fontFamily: "Quicksand-Regular",
    color: "#6B7280",
  },

  // Peak Hour Row
  peakHourRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  peakHourLabel: {
    width: 45,
    fontSize: 12,
    fontFamily: "Quicksand-Medium",
    color: "#878787",
  },
  peakHourBarContainer: {
    flex: 1,
    marginHorizontal: 8,
  },
  peakHourBar: {
    height: 8,
    backgroundColor: "#3B82F6",
    borderRadius: 4,
  },
  peakHourCount: {
    fontSize: 12,
    fontFamily: "Quicksand-Bold",
    color: "#181C2E",
    width: 30,
    textAlign: "right",
  },

  // Export Button
  exportButton: {
    backgroundColor: "#C09248",
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  exportButtonText: {
    fontSize: 14,
    fontFamily: "Quicksand-Bold",
    color: "#FFFFFF",
  },

  // Empty State
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: "Quicksand-Regular",
    color: "#9CA3AF",
  },

  // Error State
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    fontFamily: "Quicksand-Regular",
    color: "#181C2E",
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: "#C09248",
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  retryButtonText: {
    fontSize: 14,
    fontFamily: "Quicksand-Bold",
    color: "#FFFFFF",
  },

  // Skeleton
  skeletonCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  skeletonTitle: {
    width: "50%",
    height: 18,
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
    marginBottom: 12,
  },
  skeletonContent: {
    width: "80%",
    height: 14,
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
    marginBottom: 8,
  },

  // Skeleton Grid
  skeletonGrid: {
    gap: 12,
  },
  skeletonThumbnail: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: "#E5E7EB",
  },
});
