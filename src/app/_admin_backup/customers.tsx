import React from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Users, ChevronRight } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { router } from "expo-router";

import { useSupabaseQuery } from "../../../hooks/useSupabaseQuery";
import {
  AdminCustomer,
  getCustomers,
} from "../../../lib/adminQueries";
import { useAdminStore } from "../../../store/admin.store";
import AdminMoreTrigger from "../../../components/admin/AdminMoreTrigger";

export default function Customers() {
  const { t } = useTranslation();
  const { refreshTrigger } = useAdminStore();
  const { data: customers, loading, error, refetch } = useSupabaseQuery({
    fn: getCustomers,
    skip: false,
  });

  const handleRefresh = React.useCallback(() => {
    refetch();
  }, [refetch]);

  const Header = React.useCallback(() => (
    <>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{t("admin.customers.title")}</Text>
          <Text style={styles.subtitle}>{t("admin.customers.subtitle")}</Text>
        </View>
        <AdminMoreTrigger />
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.summaryIcon}>
          <Users size={24} color="#FE8C00" />
        </View>
        <View style={styles.summaryContent}>
          <Text style={styles.summaryLabel}>{t("admin.customers.total")}</Text>
          <Text style={styles.summaryValue}>{customers?.length ?? 0}</Text>
        </View>
      </View>
    </>
  ), [customers?.length, t]);

  const renderItem = ({ item }: { item: AdminCustomer }) => (
    <Pressable
      style={styles.row}
      onPress={() => router.push(`/(admin)/customers/${item.id}` as any)}
    >
      <View style={styles.rowContent}>
        <Text style={styles.customerName} numberOfLines={1}>
          {item.full_name ?? t("admin.customers.noName")}
        </Text>
        <View style={styles.rowMeta}>
          <Text style={styles.email}>{item.email ?? t("admin.customers.noEmail")}</Text>
          <Text style={styles.phone}>{item.phone ?? t("admin.customers.noPhone")}</Text>
        </View>
      </View>
      <View style={styles.actions}>
        <ChevronRight size={20} color="#9CA3AF" />
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={customers ?? []}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={Header}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{t("admin.customers.empty")}</Text>
          </View>
        )}
        contentContainerStyle={styles.scrollContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FDF8F3",
  },
  scrollContent: {
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
    fontFamily: "Quicksand-Bold",
    color: "#181C2E",
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Quicksand-Regular",
    color: "#878787",
    marginTop: 4,
  },
  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    shadowColor: "#181C2E",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 24,
  },
  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#FE8C0022",
    alignItems: "center",
    justifyContent: "center",
  },
  summaryContent: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    fontFamily: "Quicksand-Medium",
    color: "#878787",
    textTransform: "uppercase",
  },
  summaryValue: {
    fontSize: 24,
    fontFamily: "Quicksand-Bold",
    color: "#181C2E",
    marginTop: 2,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#181C2E",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  rowContent: {
    flex: 1,
    minWidth: 0,
    paddingRight: 12,
  },
  customerName: {
    fontSize: 15,
    fontFamily: "Quicksand-SemiBold",
    color: "#181C2E",
  },
  rowMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
    gap: 8,
  },
  email: {
    fontSize: 12,
    fontFamily: "Quicksand-Regular",
    color: "#878787",
  },
  phone: {
    fontSize: 12,
    fontFamily: "Quicksand-Regular",
    color: "#9CA3AF",
  },
  actions: {
    flexDirection: "row",
    gap: 6,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: "Quicksand-Regular",
    color: "#878787",
    textAlign: "center",
    paddingVertical: 24,
  },
  errorText: {
    fontSize: 14,
    fontFamily: "Quicksand-Regular",
    color: "#EF4444",
    textAlign: "center",
    paddingVertical: 24,
  },
  emptyContainer: {
    paddingVertical: 32,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Quicksand-Regular",
    color: "#9CA3AF",
    textAlign: "center",
  },
});