import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  I18nManager,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import {
  TrendingUp,
  Calendar,
  ArrowLeft,
  DollarSign,
} from "lucide-react-native";

import { useSupabaseQuery } from "../../../hooks/useSupabaseQuery";
import { getSalesByDate } from "../../../lib/adminQueries";
import AdminMoreTrigger from "../../../components/admin/AdminMoreTrigger";

// ===========================================
// Revenue Screen Component
// ===========================================

export default function RevenueScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams as { type?: string };
  const type = params?.type;
  const isWeekly = type === "weekly";
  const isRTL = I18nManager.isRTL;

  const { data: salesData, loading, refetch } = useSupabaseQuery({
    fn: getSalesByDate,
  });

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const totalRevenue = salesData?.reduce((sum, item) => sum + item.revenue, 0) ?? 0;
  const avgDaily = salesData && salesData.length > 0 ? totalRevenue / salesData.length : 0;

  const renderSalesItem = ({ item }: { item: { date: string; revenue: number } }) => (
    <View style={styles.salesItem}>
      <View style={styles.salesItemLeft}>
        <Calendar size={18} color="#878787" />
        <Text style={styles.salesItemDate}>{item.date}</Text>
      </View>
      <Text style={styles.salesItemRevenue}>
        {new Intl.NumberFormat("en-US", { style: "currency", currency: "EGP" }).format(item.revenue)}
      </Text>
    </View>
  );

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
          <TouchableOpacity onPress={() => {}} style={styles.backButton}>
            <ArrowLeft size={24} color="#181C2E" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>
              {isWeekly ? "Weekly Revenue" : "Daily Revenue"}
            </Text>
            <Text style={styles.subtitle}>
              {isWeekly ? "Last 7 days" : "Last 30 days"}
            </Text>
          </View>
          <AdminMoreTrigger />
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <DollarSign size={24} color="#FE8C00" />
            <Text style={styles.summaryCardValue}>
              {new Intl.NumberFormat("en-US", { style: "currency", currency: "EGP" }).format(totalRevenue)}
            </Text>
            <Text style={styles.summaryCardLabel}>Total Revenue</Text>
          </View>
          <View style={styles.summaryCard}>
            <TrendingUp size={24} color="#FE8C00" />
            <Text style={styles.summaryCardValue}>
              {new Intl.NumberFormat("en-US", { style: "currency", currency: "EGP" }).format(avgDaily)}
            </Text>
            <Text style={styles.summaryCardLabel}>Daily Average</Text>
          </View>
        </View>

        {/* Sales List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Daily Breakdown</Text>
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading sales data...</Text>
            </View>
          ) : salesData && salesData.length > 0 ? (
            <FlatList
              data={salesData}
              renderItem={renderSalesItem}
              keyExtractor={(item) => item.date}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
            />
          ) : (
            <View style={styles.emptyState}>
              <TrendingUp size={32} color="#D1D5DB" />
              <Text style={styles.emptyText}>No sales data available</Text>
            </View>
          )}
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
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    fontFamily: "Quicksand-Bold",
    color: "#181C2E",
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Quicksand-Regular",
    color: "#878787",
    marginTop: 2,
  },

  // Summary
  summaryRow: {
    flexDirection: "row",
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    shadowColor: "#181C2E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  summaryCardValue: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "Quicksand-Bold",
    color: "#181C2E",
    marginTop: 8,
  },
  summaryCardLabel: {
    fontSize: 11,
    fontFamily: "Quicksand-Medium",
    color: "#878787",
    marginTop: 4,
    textTransform: "uppercase",
  },

  // FlatList container
  listContent: {
    paddingBottom: 20,
  },

  // Section
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

  // Sales Item
  salesItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: "#181C2E",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  salesItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  salesItemDate: {
    fontSize: 14,
    fontFamily: "Quicksand-Medium",
    color: "#181C2E",
  },
  salesItemRevenue: {
    fontSize: 16,
    fontWeight: "700",
    fontFamily: "Quicksand-Bold",
    color: "#FE8C00",
  },

  // Loading / Empty
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: "Quicksand-Regular",
    color: "#878787",
  },
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
});
