import React, { useState, useCallback, useEffect, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  TextInput,
  Pressable,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  I18nManager,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { useTranslation } from "react-i18next";
import {
  Search,
  X,
  CheckCircle,
  Clock,
  ChefHat,
  Beer,
  XCircle,
} from "lucide-react-native";

import { useSupabaseQuery } from "../../../hooks/useSupabaseQuery";
import {
  getAdminOrders,
  updateOrderStatus,
  type AdminOrder,
  type OrderStatusFilter,
} from "../../../lib/adminQueries";
import AdminMoreTrigger from "../../../components/admin/AdminMoreTrigger";

// ===========================================
// Status Colors & Labels (Bilingual)
// ===========================================

const STATUS_CONFIG: Record<
  OrderStatusFilter,
  { label: { en: string; ar: string }; color: string }
> = {
  all: { label: { en: "All", ar: "الكل" }, color: "#878787" },
  pending: { label: { en: "Pending", ar: "قيد الانتظار" }, color: "#F59E0B" },
  accepted: { label: { en: "Accepted", ar: "مقبول" }, color: "#10B981" },
  preparing: { label: { en: "Preparing", ar: "جاري التحضير" }, color: "#3B82F6" },
  ready: { label: { en: "Ready", ar: "جاهز" }, color: "#10B981" },
  completed: { label: { en: "Completed", ar: "مكتمل" }, color: "#2F9B65" },
  cancelled: { label: { en: "Cancelled", ar: "ملغى" }, color: "#EF4444" },
};

// ===========================================
// Format Functions
// ===========================================

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "EGP",
  }).format(amount);
};

const formatDate = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    return date.toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return dateStr;
  }
};

// ===========================================
// Main Orders Screen Component
// ===========================================

export default function OrdersScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ filter?: string }>();
  const filter = params?.filter ?? "all";
  const [activeStatus, setActiveStatus] = useState<OrderStatusFilter>(
    filter === "all" ? "all" : filter === "today" ? "pending" : "all"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const isRTL = I18nManager.isRTL;

  const { data: orders, loading, error, refetch } = useSupabaseQuery({
    fn: () => getAdminOrders(activeStatus, searchQuery),
  });

  // Re-fetch when filter or search changes
  useEffect(() => {
    refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStatus]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const filteredOrders = useMemo(() => orders ?? [], [orders]);

  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    const config = STATUS_CONFIG[status as OrderStatusFilter] || STATUS_CONFIG.pending;
    return (
      <View style={[styles.statusBadge, { backgroundColor: config.color }]}>
        <Text style={styles.statusText}>
          {config.label[isRTL ? "ar" : "en"]}
        </Text>
      </View>
    );
  };

  // Handle Accept
  const handleAccept = async (orderId: string) => {
    setUpdatingId(orderId);
    const success = await updateOrderStatus(orderId, "accepted");
    setUpdatingId(null);
    if (success) {
      await refetch();
      Alert.alert(t("common.success"), t("admin.orders.accepted"));
    } else {
      Alert.alert(t("common.error"), t("admin.orders.acceptFailed"));
    }
  };

  // Handle Reject
  const handleReject = async (orderId: string) => {
    setUpdatingId(orderId);
    const success = await updateOrderStatus(orderId, "cancelled");
    setUpdatingId(null);
    if (success) {
      await refetch();
      Alert.alert(t("common.success"), t("admin.orders.rejected"));
    } else {
      Alert.alert(t("common.error"), t("admin.orders.rejectFailed"));
    }
  };

  // Render individual order item
  const renderOrderItem = ({ item }: { item: AdminOrder }) => {
    const isPending = item.status === "pending";
    const isUpdating = updatingId === item.id;

    return (
      <View style={styles.orderCard}>
        {/* Top Row: Order ID & Status */}
        <View style={styles.orderHeader}>
          <Text style={styles.orderId}>#{item.id.slice(0, 8).toUpperCase()}</Text>
          <StatusBadge status={item.status} />
        </View>

        {/* Middle Row: Customer & Order Details */}
        <View style={styles.orderDetails}>
          <View style={styles.customerInfo}>
            <Text style={styles.customerName}>
              {item.customer_name ?? (isRTL ? "عميل" : "Customer")}
            </Text>
            <Text style={styles.orderMeta}>
              {isRTL ? "الفرع:" : "Branch:"}{" "}
              {item.branch_name ?? (isRTL ? "—" : "N/A")}
            </Text>
          </View>
          <Text style={styles.orderDate}>{formatDate(item.created_at)}</Text>
        </View>

        {/* Bottom Row: Total & Actions */}
        <View style={styles.orderFooter}>
          <Text style={styles.orderTotal}>{formatCurrency(item.total)}</Text>
          {isPending && (
            <View style={styles.actionButtons}>
              <Pressable
                style={[styles.actionButton, styles.acceptButton]}
                onPress={() => handleAccept(item.id)}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <ActivityIndicator size={12} color="#FFFFFF" />
                ) : (
                  <Text style={styles.acceptButtonText}>Accept</Text>
                )}
              </Pressable>
              <Pressable
                style={[styles.actionButton, styles.rejectButton]}
                onPress={() => handleReject(item.id)}
                disabled={isUpdating}
              >
                <Text style={styles.rejectButtonText}>Reject</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    );
  };

  // Skeleton Card for loading state
  const SkeletonCard = () => (
    <View style={styles.orderCard}>
      <View style={styles.skeletonHeader} />
      <View style={styles.skeletonDetails} />
      <View style={styles.skeletonFooter} />
    </View>
  );

  // Show skeleton on initial load only; errors fall back gracefully
  const showSkeleton = loading && !orders;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#C09248"]} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.title}>
              {isRTL ? "إدارة الطلبات" : "Global Orders"}
            </Text>
            <Text style={styles.subtitle}>
              {isRTL ? "تحكم في جميع الطلبات" : "Manage all orders"}
            </Text>
          </View>
          <AdminMoreTrigger />
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Search size={20} color="#878787" />
            <TextInput
              style={styles.searchInput}
              placeholder={isRTL ? "ابحث برقم الطلب..." : "Search by order ID..."}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#878787"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                activeOpacity={0.7}
                hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                onPress={() => setSearchQuery("")}
              >
                <X size={20} color="#878787" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Status Filter Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabsContainer}
          contentContainerStyle={styles.tabsContent}
        >
          {(Object.keys(STATUS_CONFIG) as OrderStatusFilter[]).map((status) => (
            <TouchableOpacity
              key={status}
              activeOpacity={0.7}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              style={[
                styles.tab,
                activeStatus === status && styles.activeTab,
              ]}
              onPress={() => setActiveStatus(status)}
            >
              <Text
                style={[
                  styles.tabText,
                  activeStatus === status && styles.activeTabText,
                ]}
              >
                {STATUS_CONFIG[status].label[isRTL ? "ar" : "en"]}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Orders Count */}
        <Text style={styles.countText}>
          {filteredOrders.length} {isRTL ? "طلب" : "orders"}
        </Text>

        {/* Orders List */}
        {showSkeleton ? (
          <View style={styles.skeletonContainer}>
            {[...Array(5)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </View>
        ) : filteredOrders.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              {isRTL ? "لا توجد طلبات" : "No orders found"}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredOrders}
            keyExtractor={(item) => item.id}
            renderItem={renderOrderItem}
            scrollEnabled={false}
            contentContainerStyle={styles.ordersList}
          />
        )}
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

  // Search Container
  searchContainer: {
    marginBottom: 16,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: "#181C2E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    fontFamily: "Quicksand-Regular",
    color: "#181C2E",
  },

  // Status Tabs
  tabsContainer: {
    marginBottom: 16,
  },
  tabsContent: {
    gap: 12,
  },
  tab: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    shadowColor: "#181C2E",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  activeTab: {
    backgroundColor: "#C09248",
  },
  tabText: {
    fontSize: 12,
    fontFamily: "Quicksand-Medium",
    color: "#878787",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  activeTabText: {
    color: "#FFFFFF",
  },

  // Count Text
  countText: {
    fontSize: 14,
    fontFamily: "Quicksand-Regular",
    color: "#878787",
    marginBottom: 16,
  },

  // Order Card
  orderCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#181C2E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  orderId: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Quicksand-Bold",
    color: "#181C2E",
  },

  // Status Badge
  statusBadge: {
    backgroundColor: "#10B981",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 11,
    fontFamily: "Quicksand-Bold",
    color: "#FFFFFF",
  },

  // Order Details
  orderDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Quicksand-Bold",
    color: "#181C2E",
    marginBottom: 4,
  },
  orderMeta: {
    fontSize: 12,
    fontFamily: "Quicksand-Regular",
    color: "#878787",
  },
  orderDate: {
    fontSize: 12,
    fontFamily: "Quicksand-Regular",
    color: "#878787",
    textAlign: "right",
  },

  // Order Footer
  orderFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderTotal: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "Quicksand-Bold",
    color: "#C09248",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 70,
    alignItems: "center",
  },
  acceptButton: {
    backgroundColor: "#10B981",
  },
  acceptButtonText: {
    fontSize: 12,
    fontFamily: "Quicksand-Bold",
    color: "#FFFFFF",
  },
  rejectButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#EF4444",
  },
  rejectButtonText: {
    fontSize: 12,
    fontFamily: "Quicksand-Bold",
    color: "#EF4444",
  },

  // Empty State
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
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
  skeletonContainer: {
    gap: 12,
  },
  skeletonHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  skeletonDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  skeletonFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  // Skeleton specific sizes
  skeletonOrderId: {
    width: 80,
    height: 16,
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
  },
  skeletonStatusBadge: {
    width: 60,
    height: 20,
    backgroundColor: "#E5E7EB",
    borderRadius: 10,
  },
  skeletonCustomerName: {
    width: 120,
    height: 20,
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
  },
  skeletonOrderMeta: {
    width: 80,
    height: 14,
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
  },
  skeletonOrderDate: {
    width: 70,
    height: 14,
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
  },
  skeletonTotal: {
    width: 80,
    height: 24,
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
  },

  // Orders List
  ordersList: {
    gap: 12,
  },
});