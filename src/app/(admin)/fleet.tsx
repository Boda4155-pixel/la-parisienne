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
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import {
  MapPin,
  Truck,
  Clock,
  Navigation,
  User,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  Map,
  Route,
} from "lucide-react-native";

import { useSupabaseQuery } from "../../../hooks/useSupabaseQuery";
import {
  getDeliveryDrivers,
  getFleetOrders,
  assignDriverToOrder,
  type Driver,
  type FleetOrder,
} from "../../../lib/adminQueries";
import AdminMoreTrigger from "../../../components/admin/AdminMoreTrigger";

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "EGP",
  }).format(amount);
};

const STATUS_CONFIG = {
  active: { label: { en: "Active", ar: "نشط" }, color: "#10B981" },
  idle: { label: { en: "Idle", ar: "غير نشط" }, color: "#9CA3AF" },
  delayed: { label: { en: "Delayed", ar: "متأخر" }, color: "#EF4444" },
  preparing: { label: { en: "Preparing", ar: "جاري التحضير" }, color: "#F59E0B" },
  out_for_delivery: { label: { en: "Out for Delivery", ar: "قيد التوصيل" }, color: "#3B82F6" },
};

export default function FleetScreen() {
  const { t, i18n } = useTranslation();
  const [refreshing, setRefreshing] = useState(false);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [selectedDriverForOrder, setSelectedDriverForOrder] = useState<string | null>(null);
  const [showDriverDropdown, setShowDriverDropdown] = useState<string | null>(null);

  const isRTL = i18n.dir() === "rtl";

  const {
    data: drivers,
    loading: driversLoading,
    error: driversError,
    refetch: refetchDrivers,
  } = useSupabaseQuery({ fn: () => getDeliveryDrivers() });

  const {
    data: orders,
    loading: ordersLoading,
    error: ordersError,
    refetch: refetchOrders,
  } = useSupabaseQuery({ fn: () => getFleetOrders() });

  // Re-fetch periodically for live updates
  useEffect(() => {
    const interval = setInterval(() => {
      refetchDrivers();
      refetchOrders();
    }, 30000);
    return () => clearInterval(interval);
  }, [refetchDrivers, refetchOrders]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchDrivers(), refetchOrders()]);
    setRefreshing(false);
  }, [refetchDrivers, refetchOrders]);

  const allLoading = driversLoading || ordersLoading;
  const showSkeleton = allLoading && !drivers && !orders;

  const filteredDrivers = useMemo(() => drivers ?? [], [drivers]);
  const filteredOrders = useMemo(() => orders ?? [], [orders]);

  // Stats
  const activeDrivers = filteredDrivers.filter((d) => d.status === "active").length;
  const onTheWay = filteredOrders.filter((o) => o.status === "out_for_delivery").length;
  const delayedCount = filteredDrivers.filter((d) => d.status === "delayed").length;

  // Handle driver assignment
  const handleAssignDriver = async (orderId: string, driverId: string) => {
    setAssigningId(orderId);
    const success = await assignDriverToOrder(orderId, driverId);
    if (success) {
      await Promise.all([refetchDrivers(), refetchOrders()]);
    }
    setAssigningId(null);
    setShowDriverDropdown(null);
  };

  // Render status badge
  const StatusBadge = ({ status, style }: { status: string; style?: any }) => {
    const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.idle;
    return (
      <View style={[styles.statusBadge, { backgroundColor: config.color }, style]}>
        <Text style={styles.statusBadgeText}>
          {config.label[isRTL ? "ar" : "en"]}
        </Text>
      </View>
    );
  };

  // Render status dot for legend
  const StatusDot = ({ status, label }: { status: keyof typeof STATUS_CONFIG; label: string }) => {
    const config = STATUS_CONFIG[status];
    return (
      <View style={styles.legendItem}>
        <View style={[styles.legendDot, { backgroundColor: config.color }]} />
        <Text style={styles.legendText}>{label}</Text>
      </View>
    );
  };

  // Driver Card
  const renderDriver = ({ item }: { item: Driver }) => {
    const config = STATUS_CONFIG[item.status];
    const isAssigning = assigningId === item.id;

    return (
      <View style={styles.driverCard}>
        {/* Avatar & Status */}
        <View style={styles.driverAvatarContainer}>
          <View style={styles.driverAvatar}>
            <User size={24} color="#FFFFFF" />
          </View>
          <View style={[styles.statusDot, { backgroundColor: config.color }]} />
        </View>

        {/* Info */}
        <View style={styles.driverInfo}>
          <Text style={styles.driverName}>{item.full_name ?? (isRTL ? "سائق" : "Driver")}</Text>
          <View style={styles.driverMeta}>
            <Text style={styles.driverMetaText}>
              <User size={12} color="#878787" />
              ID: {item.id.slice(0, 8).toUpperCase()}
            </Text>
            <Text style={styles.driverMetaText}>
              <MapPin size={12} color="#878787" />
              {item.current_location_text ?? (isRTL ? "غير معروف" : "Unknown")}
            </Text>
          </View>
        </View>

        {/* Stats & Actions */}
        <View style={styles.driverActions}>
          <View style={styles.driverStat}>
            <Text style={styles.driverStatLabel}>
              {isRTL ? "طلبات" : "Orders"}
            </Text>
            <Text style={styles.driverStatValue}>{item.assigned_orders_count ?? 0}</Text>
          </View>
          <View style={styles.driverStat}>
            <Text style={styles.driverStatLabel}>
              {isRTL ? "الحالة" : "Status"}
            </Text>
            <StatusBadge status={item.status} style={styles.miniBadge} />
          </View>
        </View>
      </View>
    );
  };

  // Order Card with driver assignment
  const renderOrder = ({ item }: { item: FleetOrder }) => {
    const isAssigning = assigningId === item.id;
    const dropdownOpen = showDriverDropdown === item.id;

    return (
      <View style={styles.orderCard}>
        {/* Top Row: Order ID & Status */}
        <View style={styles.orderCardHeader}>
          <Text style={styles.orderCardId}>#{item.id.slice(0, 8).toUpperCase()}</Text>
          <StatusBadge status={item.status} />
        </View>

        {/* Customer Address */}
        <View style={styles.orderCardAddress}>
          <MapPin size={14} color="#878787" />
          <Text style={styles.orderCardAddressText} numberOfLines={2}>
            {item.customer_address ?? (isRTL ? "عنوان غير متاح" : "Address unavailable")}
          </Text>
        </View>

        {/* Total & Assign Driver */}
        <View style={styles.orderCardFooter}>
          <Text style={styles.orderCardTotal}>{formatCurrency(item.total ?? 0)}</Text>
          <View style={styles.assignDriverContainer}>
            {dropdownOpen ? (
              <View style={styles.dropdown}>
                {filteredDrivers
                  .filter((d) => d.status === "active" || d.status === "idle")
                  .map((driver) => (
                    <Pressable
                      key={driver.id}
                      style={styles.dropdownItem}
                      onPress={() => handleAssignDriver(item.id, driver.id)}
                      disabled={isAssigning}
                    >
                      <Text style={styles.dropdownItemText}>
                        {driver.full_name ?? (isRTL ? "سائق" : "Driver")} ({driver.id.slice(0, 6).toUpperCase()})
                      </Text>
                    </Pressable>
                  ))}
                {filteredDrivers.length === 0 && (
                  <Text style={styles.dropdownEmpty}>
                    {isRTL ? "لا يوجد سائقين متاحين" : "No available drivers"}
                  </Text>
                )}
              </View>
            ) : (
              <Pressable
                style={styles.assignButton}
                onPress={() => setShowDriverDropdown(item.id)}
                disabled={isAssigning}
              >
                {isAssigning ? (
                  <ActivityIndicator size={12} color="#FFFFFF" />
                ) : (
                  <Text style={styles.assignButtonText}>
                    {isRTL ? "تعيين سائق" : "Assign Driver"}
                  </Text>
                )}
              </Pressable>
            )}
          </View>
        </View>
      </View>
    );
  };

  // Skeleton
  const SkeletonCard = () => (
    <View style={styles.card}>
      <View style={styles.skeletonLine} />
      <View style={styles.skeletonLine} />
      <View style={styles.skeletonLine} />
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
              {isRTL ? "تتبع أسطول التوصيل" : "Fleet Tracking & Dispatch"}
            </Text>
            <Text style={styles.subtitle}>
              {isRTL ? "إدارة السائقين والطلبات" : "Manage drivers & orders"}
            </Text>
          </View>
          <AdminMoreTrigger />
        </View>

        {/* Quick Stats Bar */}
        <View style={styles.statsBar}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{activeDrivers}</Text>
            <Text style={styles.statLabel}>{isRTL ? "سائقين نشطين" : "Active Drivers"}</Text>
          </View>
          <View style={[styles.statItem, styles.statDivider]} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{onTheWay}</Text>
            <Text style={styles.statLabel}>{isRTL ? "قيد التوصيل" : "On the Way"}</Text>
          </View>
          <View style={[styles.statItem, styles.statDivider]} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{delayedCount}</Text>
            <Text style={styles.statLabel}>{isRTL ? "متأخر" : "Delayed"}</Text>
          </View>
        </View>

        {/* Map Overview Placeholder */}
        <View style={styles.mapCard}>
          <View style={styles.mapHeader}>
            <Text style={styles.mapTitle}>
              {isRTL ? "نظرة عامة على الخريطة" : "Map Overview"}
            </Text>
            <Pressable style={styles.mapAction}>
              <Map size={16} color="#C09248" />
              <Text style={styles.mapActionText}>
                {isRTL ? "عرض كامل" : "Full View"}
              </Text>
            </Pressable>
          </View>
          <View style={styles.mapPlaceholder}>
            <Map size={48} color="#D1D5DB" />
            <Text style={styles.mapPlaceholderText}>
              {isRTL ? "معاينة مواقع السائقين" : "Driver locations preview"}
            </Text>
            {filteredDrivers.length > 0 && filteredDrivers.slice(0, 3).map((driver, index) => (
              <View key={driver.id} style={styles.mapPin}>
                <View style={[styles.mapPinDot, { backgroundColor: STATUS_CONFIG[driver.status].color }]} />
                <Text style={styles.mapPinLabel}>
                  {driver.full_name?.split(" ")[0] ?? (isRTL ? `سائق ${index + 1}` : `Driver ${index + 1}`)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Status Legend */}
        <View style={styles.legendBar}>
          <StatusDot status="active" label={STATUS_CONFIG.active.label[isRTL ? "ar" : "en"]} />
          <StatusDot status="idle" label={STATUS_CONFIG.idle.label[isRTL ? "ar" : "en"]} />
          <StatusDot status="delayed" label={STATUS_CONFIG.delayed.label[isRTL ? "ar" : "en"]} />
        </View>

        {/* Active Drivers Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {isRTL ? "السائقين النشطين" : "Active Drivers"}
            </Text>
            <Text style={styles.sectionCount}>
              {filteredDrivers.length} {isRTL ? "سائق" : "drivers"}
            </Text>
          </View>

          {showSkeleton ? (
            <View style={styles.skeletonList}>
              {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
            </View>
          ) : filteredDrivers.length === 0 ? (
            <View style={styles.emptyState}>
              <Truck size={32} color="#D1D5DB" />
              <Text style={styles.emptyText}>
                {isRTL ? "لا يوجد سائقين" : "No drivers found"}
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredDrivers}
              keyExtractor={(item) => item.id}
              renderItem={renderDriver}
              scrollEnabled={false}
              contentContainerStyle={styles.flatListContent}
            />
          )}
        </View>

        {/* Delivery Orders Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {isRTL ? "طلبات التوصيل" : "Delivery Orders"}
            </Text>
            <Text style={styles.sectionCount}>
              {filteredOrders.length} {isRTL ? "طلب" : "orders"}
            </Text>
          </View>

          {showSkeleton ? (
            <View style={styles.skeletonList}>
              {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
            </View>
          ) : filteredOrders.length === 0 ? (
            <View style={styles.emptyState}>
              <MapPin size={32} color="#D1D5DB" />
              <Text style={styles.emptyText}>
                {isRTL ? "لا توجد طلبات توصيل" : "No delivery orders"}
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredOrders}
              keyExtractor={(item) => item.id}
              renderItem={renderOrder}
              scrollEnabled={false}
              contentContainerStyle={styles.flatListContent}
            />
          )}
        </View>

        {/* Optimize Routes Button */}
        <Pressable style={styles.optimizeButton} onPress={() => {}}>
          <Route size={18} color="#FFFFFF" />
          <Text style={styles.optimizeButtonText}>
            {isRTL ? "تحسين مسارات التوصيل" : "Optimize Delivery Routes"}
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

  // Stats Bar
  statsBar: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    flexDirection: "row",
    justifyContent: "space-around",
    shadowColor: "#181C2E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statDivider: {
    borderRightWidth: 1,
    borderRightColor: "#F3F4F6",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    fontFamily: "Quicksand-Bold",
    color: "#181C2E",
  },
  statLabel: {
    fontSize: 12,
    fontFamily: "Quicksand-Regular",
    color: "#878787",
    marginTop: 4,
  },

  // Map Card
  mapCard: {
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
  mapHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  mapTitle: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Quicksand-Bold",
    color: "#181C2E",
  },
  mapAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  mapActionText: {
    fontSize: 12,
    fontFamily: "Quicksand-Medium",
    color: "#C09248",
  },
  mapPlaceholder: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    position: "relative",
    minHeight: 160,
  },
  mapPlaceholderText: {
    fontSize: 14,
    fontFamily: "Quicksand-Regular",
    color: "#9CA3AF",
    marginTop: 8,
    marginBottom: 16,
  },
  mapPin: {
    position: "absolute",
    alignItems: "center",
  },
  mapPinDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  mapPinLabel: {
    fontSize: 9,
    fontFamily: "Quicksand-Medium",
    color: "#181C2E",
    marginTop: 2,
  },

  // Legend Bar
  legendBar: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
    marginBottom: 20,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    shadowColor: "#181C2E",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 11,
    fontFamily: "Quicksand-Medium",
    color: "#6B7280",
  },

  // Section
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Quicksand-Bold",
    color: "#181C2E",
  },
  sectionCount: {
    fontSize: 12,
    fontFamily: "Quicksand-Regular",
    color: "#878787",
  },

  // Driver Card
  driverCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#181C2E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  driverAvatarContainer: {
    position: "relative",
    marginRight: 16,
  },
  driverAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#C09248",
    alignItems: "center",
    justifyContent: "center",
  },
  statusDot: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Quicksand-Bold",
    color: "#181C2E",
    marginBottom: 4,
  },
  driverMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  driverMetaText: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    fontSize: 11,
    fontFamily: "Quicksand-Regular",
    color: "#878787",
  },
  driverActions: {
    flexDirection: "row",
    gap: 20,
  },
  driverStat: {
    alignItems: "flex-end",
  },
  driverStatLabel: {
    fontSize: 10,
    fontFamily: "Quicksand-Regular",
    color: "#878787",
    marginBottom: 2,
  },
  driverStatValue: {
    fontSize: 14,
    fontWeight: "700",
    fontFamily: "Quicksand-Bold",
    color: "#181C2E",
  },
  miniBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
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
  orderCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  orderCardId: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Quicksand-Bold",
    color: "#181C2E",
  },
  orderCardAddress: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  orderCardAddressText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Quicksand-Regular",
    color: "#6B7280",
    lineHeight: 18,
  },
  orderCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderCardTotal: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "Quicksand-Bold",
    color: "#C09248",
  },
  assignDriverContainer: {
    width: 130,
  },
  assignButton: {
    backgroundColor: "#C09248",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  assignButtonText: {
    fontSize: 11,
    fontFamily: "Quicksand-Bold",
    color: "#FFFFFF",
  },

  // Dropdown
  dropdown: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    position: "absolute",
    bottom: 50,
    right: 0,
    left: 0,
    zIndex: 10,
    shadowColor: "#181C2E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  dropdownItemText: {
    fontSize: 13,
    fontFamily: "Quicksand-Regular",
    color: "#181C2E",
  },
  dropdownEmpty: {
    padding: 12,
    textAlign: "center",
    fontSize: 12,
    fontFamily: "Quicksand-Regular",
    color: "#9CA3AF",
  },

  // Skeleton
  card: {
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
  skeletonLine: {
    height: 14,
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonList: {
    gap: 12,
  },
  flatListContent: {
    gap: 12,
  },

  // Empty State
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: "Quicksand-Regular",
    color: "#9CA3AF",
  },

  // Optimize Button
  optimizeButton: {
    backgroundColor: "#C09248",
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  optimizeButtonText: {
    fontSize: 14,
    fontFamily: "Quicksand-Bold",
    color: "#FFFFFF",
  },

  // Status Badge
  statusBadge: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusBadgeText: {
    fontSize: 10,
    fontFamily: "Quicksand-Bold",
    color: "#FFFFFF",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});