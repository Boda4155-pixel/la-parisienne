import React from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Gift, Plus, Pencil, Trash2 } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { router } from "expo-router";

import { useSupabaseQuery } from "../../../hooks/useSupabaseQuery";
import {
  AdminCoupon,
  deleteCoupon,
  getAllCoupons,
} from "../../../lib/adminQueries";
import { useAdminStore } from "../../../store/admin.store";
import AdminMoreTrigger from "../../../components/admin/AdminMoreTrigger";

export default function Coupons() {
  const { t } = useTranslation();
  const { refreshTrigger } = useAdminStore();
  const { data: coupons, loading, error, refetch } = useSupabaseQuery({
    fn: getAllCoupons,
    skip: false,
  });

  const handleRefresh = React.useCallback(() => {
    refetch();
  }, [refetch]);

  const handleDelete = (id: string) => {
    Alert.alert(
      t("admin.coupons.deleteTitle"),
      t("admin.coupons.deleteConfirm"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: async () => {
            try {
              await deleteCoupon(id);
              handleRefresh();
            } catch (deleteError: any) {
              Alert.alert(t("common.somethingWentWrong"), deleteError?.message);
            }
          },
        },
      ],
    );
  };

  const renderItem = ({ item }: { item: AdminCoupon }) => (
    <Pressable
      style={styles.row}
      onPress={() => router.push(`/coupons/${item.id}` as any)}
    >
      <View style={styles.rowContent}>
        <View style={styles.codeRow}>
          <Text style={styles.couponCode} numberOfLines={1}>{item.code}</Text>
          <Text style={[styles.statusBadge, item.is_active ? styles.statusActive : styles.statusInactive]}>
            {item.is_active ? t("admin.coupons.active") : t("admin.coupons.inactive")}
          </Text>
        </View>
        <Text style={styles.couponName} numberOfLines={1}>
          {item.name ?? t("admin.coupons.noName")}
        </Text>
        <View style={styles.rowMeta}>
          <Text style={styles.discountValue}>
            {item.discount_type === "percentage"
              ? `${item.discount_value}%`
              : `${item.discount_value} ${t("common.currency")}`}
          </Text>
          <Text style={styles.usage}>
            {item.times_used} {t("admin.coupons.of")} {item.usage_limit ?? "—"}
          </Text>
        </View>
      </View>
      <View style={styles.actions}>
        <Pressable
          style={styles.iconButton}
          onPress={() => router.push(`/coupons/${item.id}` as any)}
        >
          <Pencil size={16} color="#FE8C00" />
        </Pressable>
        <Pressable
          style={styles.iconButton}
          onPress={() => handleDelete(item.id)}
        >
          <Trash2 size={16} color="#EF4444" />
        </Pressable>
      </View>
    </Pressable>
  );

  const Header = React.useCallback(() => (
    <>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{t("admin.coupons.title")}</Text>
          <Text style={styles.subtitle}>{t("admin.coupons.subtitle")}</Text>
        </View>
        <View style={styles.headerActions}>
          <AdminMoreTrigger />
          <Pressable style={styles.addButton} onPress={() => router.push("/coupons/new" as any)}>
            <Plus size={18} color="#FFFFFF" />
            <Text style={styles.addButtonText}>{t("admin.coupons.add")}</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.summaryIcon}>
          <Gift size={24} color="#FE8C00" />
        </View>
        <View style={styles.summaryContent}>
          <Text style={styles.summaryLabel}>{t("admin.coupons.total")}</Text>
          <Text style={styles.summaryValue}>{coupons?.length ?? 0}</Text>
        </View>
      </View>
    </>
  ), [coupons?.length, t]);

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={coupons ?? []}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={Header}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{t("admin.coupons.empty")}</Text>
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
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
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
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FE8C00",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  addButtonText: {
    fontSize: 14,
    fontFamily: "Quicksand-Bold",
    color: "#FFFFFF",
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
  codeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  couponCode: {
    fontSize: 15,
    fontFamily: "Quicksand-SemiBold",
    color: "#181C2E",
  },
  couponName: {
    fontSize: 12,
    fontFamily: "Quicksand-Regular",
    color: "#878787",
    marginTop: 3,
  },
  rowMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    gap: 8,
  },
  discountValue: {
    fontSize: 14,
    fontFamily: "Quicksand-Bold",
    color: "#FE8C00",
  },
  usage: {
    fontSize: 11,
    fontFamily: "Quicksand-Medium",
    color: "#9CA3AF",
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    fontSize: 11,
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
  actions: {
    flexDirection: "row",
    gap: 6,
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#FE8C0015",
    alignItems: "center",
    justifyContent: "center",
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