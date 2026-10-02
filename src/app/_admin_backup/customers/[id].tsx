import React from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { router, useLocalSearchParams } from "expo-router";

import { useSupabaseQuery } from "../../../../hooks/useSupabaseQuery";
import {
  getCustomerWithOrders,
} from "../../../../lib/adminQueries";
import AdminMoreTrigger from "../../../../components/admin/AdminMoreTrigger";

export default function CustomerDetail() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: customer, loading, error, refetch } = useSupabaseQuery({
    fn: getCustomerWithOrders,
    params: id,
    skip: !id,
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <ChevronLeft size={24} color="#181C2E" />
        </Pressable>
        <Text style={styles.title}>{t("admin.customers.profile")}</Text>
        <AdminMoreTrigger />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.card}>
            <Text style={styles.loadingText}>{t("common.loading")}</Text>
          </View>
        ) : error ? (
          <View style={styles.card}>
            <Text style={styles.errorText}>{t("common.errorLoading")}</Text>
          </View>
        ) : !customer ? (
          <View style={styles.card}>
            <Text style={styles.errorText}>{t("admin.customers.noCustomer")}</Text>
          </View>
        ) : (
          <>
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>{t("admin.customers.profile")}</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t("common.fullName")}</Text>
                <Text style={styles.infoValue}>{customer.full_name ?? t("admin.customers.noName")}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t("common.email")}</Text>
                <Text style={styles.infoValue}>{customer.email ?? t("admin.customers.noEmail")}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t("common.phone")}</Text>
                <Text style={styles.infoValue}>{customer.phone ?? t("admin.customers.noPhone")}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t("admin.customers.status")}</Text>
                <Text style={[styles.statusBadge, customer.is_active ? styles.statusActive : styles.statusInactive]}>
                  {customer.is_active ? t("admin.customers.active") : t("admin.customers.inactive")}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t("admin.customers.memberSince")}</Text>
                <Text style={styles.infoValue}>
                  {customer.created_at ? new Date(customer.created_at).toLocaleDateString() : "—"}
                </Text>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>{t("admin.customers.orderHistory")}</Text>
              {(customer.orders ?? []).length === 0 ? (
                <Text style={styles.emptyText}>{t("admin.customers.noOrders")}</Text>
              ) : (
                (customer.orders ?? []).map((order) => (
                  <View key={order.id} style={styles.orderRow}>
                    <View>
                      <Text style={styles.orderId}>#{order.id.slice(-6).toUpperCase()}</Text>
                      <Text style={styles.orderDate}>
                        {new Date(order.created_at).toLocaleDateString()}
                      </Text>
                    </View>
                    <View style={styles.orderRight}>
                      <Text style={styles.orderStatus}>{order.status}</Text>
                      <Text style={styles.orderTotal}>{order.total} {t("common.currency")}</Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FDF8F3",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  title: {
    flex: 1,
    textAlign: "center",
    fontSize: 20,
    fontFamily: "Quicksand-Bold",
    color: "#181C2E",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
    gap: 16,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#181C2E",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Quicksand-SemiBold",
    color: "#181C2E",
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  infoLabel: {
    fontSize: 13,
    fontFamily: "Quicksand-Medium",
    color: "#878787",
  },
  infoValue: {
    fontSize: 14,
    fontFamily: "Quicksand-Regular",
    color: "#181C2E",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontFamily: "Quicksand-Medium",
  },
  statusActive: {
    backgroundColor: "#10B98122",
    color: "#10B981",
  },
  statusInactive: {
    backgroundColor: "#EF444422",
    color: "#EF4444",
  },
  orderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  orderId: {
    fontSize: 14,
    fontFamily: "Quicksand-SemiBold",
    color: "#181C2E",
  },
  orderDate: {
    fontSize: 11,
    fontFamily: "Quicksand-Regular",
    color: "#9CA3AF",
    marginTop: 2,
  },
  orderRight: {
    alignItems: "flex-end",
  },
  orderStatus: {
    fontSize: 12,
    fontFamily: "Quicksand-Medium",
    color: "#FE8C00",
  },
  orderTotal: {
    fontSize: 14,
    fontFamily: "Quicksand-Bold",
    color: "#181C2E",
    marginTop: 2,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: "Quicksand-Regular",
    color: "#878787",
    textAlign: "center",
    paddingVertical: 32,
  },
  errorText: {
    fontSize: 14,
    fontFamily: "Quicksand-Regular",
    color: "#EF4444",
    textAlign: "center",
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Quicksand-Regular",
    color: "#9CA3AF",
    textAlign: "center",
    paddingVertical: 16,
  },
});