import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  TrendingUp,
  ShoppingCart,
  Package,
  RotateCcw,
  Grid,
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
// Stat Card Component
// ===========================================

type StatCardProps = {
  title: string;
  value: number;
  suffix?: string;
  prefix?: string;
  icon: React.ReactNode;
  color?: string;
  loading?: boolean;
  badge?: number;
  badgeColor?: string;
};

const StatCard = ({
  title,
  value,
  suffix = "",
  prefix = "",
  icon: Icon,
  color = "#FE8C00",
  loading,
  badge,
  badgeColor = "#F59E0B",
}: StatCardProps) => {
  return (
    <View style={styles.statCard}>
      <View style={styles.statCardHeader}>
        <View style={[styles.iconContainer, { backgroundColor: `${color}22` }]}>
          {Icon}
        </View>
        <Text style={styles.statCardTitle}>{title}</Text>
      </View>
      <View style={styles.statCardContent}>
        <Text style={styles.statCardValue} numberOfLines={1}>
          {loading ? "..." : `${prefix}${formatNumber(value)}${suffix}`}
        </Text>
        {badge !== undefined && badge > 0 && (
          <View style={[styles.badge, { backgroundColor: badgeColor }]}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

// ===========================================
// Branch Comparison Component
// ===========================================

type BranchBarProps = {
  name: string;
  percentage: number;
  active: boolean;
};

const BranchBar = ({ name, percentage, active }: BranchBarProps) => (
  <View style={styles.branchBar}>
    <Text style={styles.branchName}>{name}</Text>
    <View style={styles.branchProgressContainer}>
      <View style={[styles.branchProgressTrack, active && styles.branchProgressTrackActive]}>
        <View style={[styles.branchProgressFill, { width: `${percentage}%` }]} />
      </View>
      <Text style={styles.branchPercentage}>{percentage}%</Text>
    </View>
  </View>
);

// ===========================================
// Skeleton Component
// ===========================================

const SkeletonCard = () => (
  <View style={styles.statCard}>
    <View style={styles.statCardHeader}>
      <View style={styles.skeletonIcon} />
      <View style={styles.skeletonLine} />
    </View>
    <View style={styles.statCardContent}>
      <View style={styles.skeletonValue} />
      <View style={styles.skeletonBadge} />
    </View>
  </View>
);

// ===========================================
// Main Dashboard Component
// ===========================================

export default function Dashboard() {
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

  // Filter branches with orders
  const activeBranches = useMemo(
    () => branchComparison.filter((b) => b.percentage > 0),
    [branchComparison]
  );

  // Show skeleton if loading and no data yet; otherwise show dashboard (values default to 0 on fetch errors)
  const showSkeleton = loading && !metrics;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#FE8C00"]} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Dashboard</Text>
            <Text style={styles.date}>{formattedDate}</Text>
          </View>
          <AdminMoreTrigger />
        </View>

        {/* Summary Cards */}
        <View style={styles.cardsContainer}>
          {/* Daily Revenue */}
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
            />
          )}
          {/* Weekly Revenue */}
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
            />
          )}
          {/* Today's Orders */}
          {showSkeleton ? (
            <SkeletonCard />
          ) : (
            <StatCard
              title="Today's Orders"
              value={todayOrders}
              icon={<ShoppingCart size={24} color="#FE8C00" />}
              color="#FE8C00"
              loading={loading}
              badge={cancelledOrders > 0 ? cancelledOrders : undefined}
              badgeColor={cancelledOrders > 0 ? "#EF4444" : "#FE8C00"}
            />
          )}
          {/* Low Stock */}
          {showSkeleton ? (
            <SkeletonCard />
          ) : (
            <StatCard
              title="Low Stock"
              value={lowStockCount}
              icon={<Package size={24} color={lowStockCount > 0 ? "#EF4444" : "#2F9B65"} />}
              color={lowStockCount > 0 ? "#EF4444" : "#2F9B65"}
              loading={loading}
              badge={lowStockCount > 0 ? lowStockCount : undefined}
              badgeColor={lowStockCount > 0 ? "#FEF3C7" : "#DCFCE7"}
            />
          )}
        </View>

        {/* Alert Badges Row */}
        <View style={styles.alertsContainer}>
          {showSkeleton ? (
            <SkeletonAlert />
          ) : (
            <>
              {refundRequests > 0 && (
                <View style={styles.alertBadge}>
                  <RotateCcw size={18} color="#FFFFFF" />
                  <Text style={styles.alertText}>Refund Requests</Text>
                  <Text style={styles.alertCount}>{refundRequests}</Text>
                </View>
              )}
              {lowStockCount > 0 && refundRequests > 0 && (
                <View style={styles.alertDivider} />
              )}
            </>
          )}
        </View>

        {/* Branch Comparison */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Branch Performance</Text>
          {showSkeleton ? (
            <SkeletonBranchSection />
          ) : branchComparison.length > 0 ? (
            <View style={styles.branchSection}>
              {activeBranches.map((branch) => (
                <BranchBar
                  key={branch.branch_id}
                  name={branch.branch_name || `Branch ${branch.branch_id.slice(0, 4).toUpperCase()}`}
                  percentage={branch.percentage}
                  active={true}
                />
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Grid size={32} color="#D1D5DB" />
              <Text style={styles.emptyText}>No branch data available</Text>
            </View>
          )}
        </View>

        {/* Revenue Summary */}
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
              <Text style={styles.summaryValue} style={{ color: cancelledOrders > 0 ? "#EF4444" : "#6B7280" }}>
                {formatNumber(cancelledOrders)}
              </Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Completion Rate</Text>
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
// Skeleton Components for Alerts
// ===========================================

const SkeletonAlert = () => (
  <View style={styles.skeletonAlert}>
    <View style={styles.skeletonAlertIcon} />
    <View style={styles.skeletonAlertText} />
  </View>
);

const SkeletonBranchSection = () => (
  <View style={styles.branchSection}>
    {[...Array(3)].map((_, i) => (
      <View key={i} style={styles.skeletonBranchBar}>
        <View style={styles.skeletonBranchName} />
        <View style={styles.skeletonBranchProgress} />
      </View>
    ))}
  </View>
);

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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
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

  // Stat Cards
  cardsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    width: "100%",
    maxWidth: "48%",
    flex: 0,
    flexBasis: "48%",
    minWidth: 0,
    shadowColor: "#181C2E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  statCardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#FE8C0022",
    alignItems: "center",
    justifyContent: "center",
  },
  statCardTitle: {
    fontSize: 12,
    fontFamily: "Quicksand-Medium",
    color: "#878787",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statCardContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
  },
  statCardValue: {
    fontSize: 20,
    fontWeight: "600",
    fontFamily: "Quicksand-Bold",
    color: "#181C2E",
    minWidth: 80,
  },
  badge: {
    backgroundColor: "#FE8C00",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: "Quicksand-Bold",
    color: "#FFFFFF",
  },

  // Alerts
  alertsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    flexWrap: "wrap",
  },
  alertBadge: {
    backgroundColor: "#FEF3C7",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
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
  alertDivider: {
    width: 16,
  },

  // Branch Comparison
  section: {
    marginBottom: 24,
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
    borderRadius: 16,
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
  branchProgressTrackActive: {
    backgroundColor: "#E5E7EB",
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
    borderRadius: 16,
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
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#E5E7EB",
    overflow: "hidden",
  },
  skeletonLine: {
    flex: 1,
    height: 12,
    backgroundColor: "#E5E7EB",
    borderRadius: 6,
  },
  skeletonValue: {
    width: 60,
    height: 24,
    backgroundColor: "#E5E7EB",
    borderRadius: 6,
  },
  skeletonBadge: {
    width: 36,
    height: 18,
    backgroundColor: "#E5E7EB",
    borderRadius: 9,
  },
  skeletonAlert: {
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginRight: 16,
    marginBottom: 8,
  },
  skeletonAlertIcon: {
    width: 18,
    height: 18,
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
  },
  skeletonAlertText: {
    width: 120,
    height: 14,
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