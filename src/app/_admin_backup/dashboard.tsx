import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  TrendingUp,
  ShoppingCart,
  Package,
  Clock,
  RotateCcw,
  Grid,
  ChevronRight,
} from "lucide-react-native";

import { useSupabaseQuery } from "../../../hooks/useSupabaseQuery";
import { getDashboardMetrics } from "../../../lib/adminQueries";
import AdminMoreTrigger from "../../../components/admin/AdminMoreTrigger";

// ===========================================
// Type Definitions
// ===========================================

type BranchComparisonItem = {
  branch_id: string;
  branch_name: string | null;
  order_count: number;
  percentage: number;
};

type DashboardMetrics = {
  dailyRevenue: number;
  weeklyRevenue: number;
  todayOrders: number;
  cancelledOrders: number;
  lowStockCount: number;
  refundRequests: number;
  branchComparison: BranchComparisonItem[];
};

// ===========================================
// Format Functions
// ===========================================

const formatNumber = (num: number): string => {
  return new Intl.NumberFormat("en-US").format(num);
};

// ===========================================
// Stat Card Component (2-col grid, fixed 120 height, clickable)
// ===========================================

type StatCardProps = {
  title: string;
  value: number;
  suffix?: string;
  icon: React.ReactNode;
  color?: string;
  loading?: boolean;
  onPress: () => void;
};

const StatCard = ({
  title,
  value,
  suffix = "",
  icon: Icon,
  color = "#FE8C00",
  loading,
  onPress,
}: StatCardProps) => (
  <TouchableOpacity
    style={styles.statCard}
    onPress={onPress}
    activeOpacity={0.7}
    hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
  >
    <View style={styles.statCardRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.statCardTitle}>{title}</Text>
        <Text style={styles.statCardValue} numberOfLines={1}>
          {loading ? "..." : `${formatNumber(value)}${suffix}`}
        </Text>
      </View>
      <View style={styles.iconAndChevron}>
        <View style={[styles.iconCircle, { backgroundColor: `${color}22` }]}>
          {Icon}
        </View>
        <ChevronRight size={18} color="#C09248" />
      </View>
    </View>
  </TouchableOpacity>
);

// ===========================================
// Skeleton Card
// ===========================================

const SkeletonCard = () => (
  <View style={styles.statCard}>
    <View style={styles.statCardRow}>
      <View style={{ flex: 1 }}>
        <View style={styles.skeletonLineShort} />
        <View style={[styles.skeletonLine, { width: "60%", marginTop: 8 }]} />
      </View>
      <View style={styles.skeletonIcon} />
    </View>
  </View>
);

// ===========================================
// Main Dashboard Component
// ===========================================

export default function Dashboard() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const { data: metrics, loading, refetch } = useSupabaseQuery({
    fn: getDashboardMetrics,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const today = new Date();
  const formattedDate = today.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const dailyRevenue = metrics?.dailyRevenue ?? 0;
  const weeklyRevenue = metrics?.weeklyRevenue ?? 0;
  const todayOrders = metrics?.todayOrders ?? 0;
  const cancelledOrders = metrics?.cancelledOrders ?? 0;
  const lowStockCount = metrics?.lowStockCount ?? 0;
  const refundRequests = metrics?.refundRequests ?? 0;
  const branchComparison = metrics?.branchComparison ?? [];

  const showSkeleton = loading && !metrics;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#FE8C00"]} />
        }
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Dashboard</Text>
            <Text style={styles.date}>{formattedDate}</Text>
          </View>
          <AdminMoreTrigger />
        </View>

        {/* 2-Column Grid — Row 1 */}
        <View style={styles.gridRow}>
          {showSkeleton ? (
            <SkeletonCard />
          ) : (
            <StatCard
              title="Daily Revenue"
              value={dailyRevenue}
              suffix=" EGP"
              icon={<TrendingUp size={24} color="#FE8C00" />}
              color="#FE8C00"
              loading={loading}
              onPress={() => router.push("/(admin)/revenue?type=daily")}
            />
          )}
          {showSkeleton ? (
            <SkeletonCard />
          ) : (
            <StatCard
              title="Weekly Revenue"
              value={weeklyRevenue}
              suffix=" EGP"
              icon={<TrendingUp size={24} color="#FE8C00" />}
              color="#FE8C00"
              loading={loading}
              onPress={() => router.push("/(admin)/revenue?type=weekly")}
            />
          )}
        </View>

        {/* 2-Column Grid — Row 2 */}
        <View style={styles.gridRow}>
          {showSkeleton ? (
            <SkeletonCard />
          ) : (
            <StatCard
              title="Today's Orders"
              value={todayOrders}
              icon={<ShoppingCart size={24} color="#FE8C00" />}
              color="#FE8C00"
              loading={loading}
              onPress={() => router.push("/(admin)/orders?filter=today")}
            />
          )}
          {showSkeleton ? (
            <SkeletonCard />
          ) : (
            <StatCard
              title="Low Stock"
              value={lowStockCount}
              icon={<Package size={24} color={lowStockCount > 0 ? "#EF4444" : "#2F9B65"} />}
              color={lowStockCount > 0 ? "#EF4444" : "#2F9B65"}
              loading={loading}
              onPress={() => router.push("/(admin)/inventory?filter=low_stock")}
            />
          )}
        </View>

        {/* Alerts Row */}
        <View style={styles.alertsContainer}>
          {refundRequests > 0 && (
            <View style={styles.alertBadge}>
              <RotateCcw size={18} color="#FFFFFF" />
              <Text style={styles.alertText}>Refund Requests</Text>
              <Text style={styles.alertCount}>{refundRequests}</Text>
            </View>
          )}
          {lowStockCount > 0 && (
            <View style={[styles.alertBadge, { backgroundColor: lowStockCount > 0 ? "#FEF3C7" : "#DCFCE7", borderColor: lowStockCount > 0 ? "#FDE68A" : "#BBF7D0" }]}>
              <Package size={18} color={lowStockCount > 0 ? "#92400E" : "#166534"} />
              <Text style={[styles.alertText, { color: lowStockCount > 0 ? "#92400E" : "#166534" }]}>Low Stock</Text>
              <Text style={[styles.alertCount, { color: lowStockCount > 0 ? "#92400E" : "#166534" }]}>{lowStockCount}</Text>
            </View>
          )}
        </View>

        {/* Branch Comparison */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Branch Performance</Text>
          {showSkeleton ? (
            <View style={styles.branchSection}>
              {[...Array(3)].map((_, i) => (
                <View key={i} style={styles.skeletonBranchBar}>
                  <View style={styles.skeletonBranchName} />
                  <View style={styles.skeletonBranchProgress} />
                </View>
              ))}
            </View>
          ) : branchComparison.length > 0 ? (
            <View style={styles.branchSection}>
              {branchComparison.map((branch) => (
                <View key={branch.branch_id} style={styles.branchBar}>
                  <Text style={styles.branchName} numberOfLines={1}>
                    {branch.branch_name || `Branch ${branch.branch_id.slice(0, 4).toUpperCase()}`}
                  </Text>
                  <View style={styles.branchProgressContainer}>
                    <View style={styles.branchProgressTrack}>
                      <View style={[styles.branchProgressFill, { width: `${branch.percentage}%` }]} />
                    </View>
                    <Text style={styles.branchPercentage}>{branch.percentage}%</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Grid size={32} color="#D1D5DB" />
              <Text style={styles.emptyText}>No branch data available</Text>
            </View>
          )}
        </View>

        {/* Week Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>This Week Overview</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Orders</Text>
              <Text style={styles.summaryValue}>{formatNumber(todayOrders)}</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Cancelled</Text>
              <Text style={[styles.summaryValue, { color: cancelledOrders > 0 ? "#EF4444" : "#6B7280" }]}>
                {formatNumber(cancelledOrders)}
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Completion</Text>
              <Text style={styles.summaryValue}>
                {todayOrders > 0 ? Math.round(((todayOrders - cancelledOrders) / todayOrders) * 100) : 100}%
              </Text>
            </View>
          </View>
        </View>
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
    padding: 16,
    paddingBottom: 24,
    gap: 12,
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    fontFamily: "Quicksand-Bold",
    color: "#181C2E",
  },
  date: {
    fontSize: 14,
    fontFamily: "Quicksand-Regular",
    color: "#878787",
    marginTop: 4,
  },

  // Grid Rows
  gridRow: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 16,
    flex: 1,
    height: 120,
    shadowColor: "#181C2E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  statCardRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconAndChevron: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  statCardTitle: {
    fontSize: 11,
    fontFamily: "Quicksand-Medium",
    color: "#878787",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statCardValue: {
    fontSize: 22,
    fontWeight: "700",
    fontFamily: "Quicksand-Bold",
    color: "#181C2E",
    marginTop: 4,
  },

  // Alerts
  alertsContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  alertBadge: {
    backgroundColor: "#FEF3C7",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  alertText: {
    fontSize: 14,
    fontFamily: "Quicksand-Medium",
    color: "#92400E",
  },
  alertCount: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Quicksand-Bold",
    color: "#92400E",
  },

  // Branch Comparison
  section: {
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    fontFamily: "Quicksand-Bold",
    color: "#181C2E",
    marginBottom: 16,
  },
  branchSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#181C2E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  branchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  branchName: {
    fontSize: 14,
    fontFamily: "Quicksand-Medium",
    color: "#181C2E",
    width: 100,
  },
  branchProgressContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  branchProgressTrack: {
    flex: 1,
    height: 8,
    backgroundColor: "#F3F4F6",
    borderRadius: 4,
    overflow: "hidden",
  },
  branchProgressFill: {
    height: "100%",
    backgroundColor: "#FE8C00",
    borderRadius: 4,
  },
  branchPercentage: {
    fontSize: 12,
    fontFamily: "Quicksand-Bold",
    color: "#181C2E",
    minWidth: 40,
    textAlign: "right",
  },

  // Summary Card
  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#181C2E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  summaryItem: {
    alignItems: "center",
    flex: 1,
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#F3F4F6",
  },
  summaryLabel: {
    fontSize: 12,
    fontFamily: "Quicksand-Regular",
    color: "#878787",
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: "600",
    fontFamily: "Quicksand-Bold",
    color: "#181C2E",
  },

  // Empty State
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Quicksand-Regular",
    color: "#9CA3AF",
    marginTop: 12,
  },

  // Skeleton
  skeletonIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#E5E7EB",
    overflow: "hidden",
  },
  skeletonLine: {
    height: 12,
    backgroundColor: "#E5E7EB",
    borderRadius: 6,
  },
  skeletonLineShort: {
    height: 10,
    width: 80,
    backgroundColor: "#E5E7EB",
    borderRadius: 6,
  },
  skeletonBranchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
  },
  skeletonBranchName: {
    width: 100,
    height: 14,
    backgroundColor: "#E5E7EB",
    borderRadius: 6,
  },
  skeletonBranchProgress: {
    flex: 1,
    height: 8,
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
  },
});