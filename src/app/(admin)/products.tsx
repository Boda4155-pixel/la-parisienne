import React from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Grid, Plus, Pencil, Trash2 } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { router } from "expo-router";

import { useSupabaseQuery } from "../../../hooks/useSupabaseQuery";
import {
  AdminProduct,
  deleteProduct,
  getAllProducts,
} from "../../../lib/adminQueries";
import { getCategories } from "../../../lib/queries";
import { useAdminStore } from "../../../store/admin.store";
import AdminMoreTrigger from "../../../components/admin/AdminMoreTrigger";

export default function Products() {
  const { t } = useTranslation();
  const { refreshTrigger } = useAdminStore();
  const { data: products, loading, error, refetch } = useSupabaseQuery({
    fn: getAllProducts,
    skip: false,
  });
  const { data: categories } = useSupabaseQuery({
    fn: getCategories,
    skip: false,
  });

  const handleRefresh = React.useCallback(() => {
    refetch();
  }, [refetch]);

  const categoryMap = React.useMemo(
    () => new Map(categories?.map((c) => [c.id, c.name]) ?? []),
    [categories]
  );

  const handleDelete = (id: string) => {
    Alert.alert(
      t("admin.products.deleteTitle"),
      t("admin.products.deleteConfirm"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: async () => {
            try {
              await deleteProduct(id);
              handleRefresh();
            } catch (deleteError: any) {
              Alert.alert(t("common.somethingWentWrong"), deleteError?.message);
            }
          },
        },
      ],
    );
  };

  const renderItem = ({ item }: { item: AdminProduct }) => (
    <Pressable
      style={styles.row}
      onPress={() => router.push(`/(admin)/products/${item.id}` as any)}
    >
      <View style={styles.rowContent}>
        <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.productDescription} numberOfLines={2}>
          {item.description ?? t("admin.products.noDescription")}
        </Text>
        <View style={styles.rowMeta}>
          <Text style={styles.categoryName}>
            {item.category_id ? (categoryMap.get(item.category_id) ?? t("admin.products.noCategory")) : t("admin.products.noCategory")}
          </Text>
          <Text style={styles.price}>
            {item.price} {t("common.currency")}
          </Text>
          <Text style={styles.stock}>
            Stock: {item.stock_quantity}
          </Text>
        </View>
      </View>
      <View style={styles.actions}>
        <Pressable
          style={styles.iconButton}
          onPress={() => router.push(`/(admin)/products/${item.id}` as any)}
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
          <Text style={styles.title}>{t("admin.products.title")}</Text>
          <Text style={styles.subtitle}>{t("admin.products.subtitle")}</Text>
        </View>
        <View style={styles.headerActions}>
          <AdminMoreTrigger />
          <Pressable style={styles.addButton} onPress={() => router.push("/(admin)/products/new" as any)}>
            <Plus size={18} color="#FFFFFF" />
            <Text style={styles.addButtonText}>{t("admin.products.add")}</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.summaryIcon}>
          <Grid size={24} color="#FE8C00" />
        </View>
        <View style={styles.summaryContent}>
          <Text style={styles.summaryLabel}>{t("admin.products.total")}</Text>
          <Text style={styles.summaryValue}>{products?.length ?? 0}</Text>
        </View>
      </View>
    </>
  ), [products?.length, t]);

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={products ?? []}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={Header}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{t("admin.products.empty")}</Text>
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
  productName: {
    fontSize: 15,
    fontFamily: "Quicksand-SemiBold",
    color: "#181C2E",
  },
  productDescription: {
    fontSize: 12,
    fontFamily: "Quicksand-Regular",
    color: "#878787",
    marginTop: 4,
  },
  rowMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    gap: 8,
  },
  categoryName: {
    fontSize: 11,
    fontFamily: "Quicksand-Medium",
    color: "#9CA3AF",
  },
  price: {
    fontSize: 14,
    fontFamily: "Quicksand-Medium",
    color: "#FE8C00",
  },
  stock: {
    fontSize: 11,
    fontFamily: "Quicksand-Medium",
    color: "#6B7280",
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
