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
  Modal,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import {
  Search,
  X,
  Plus,
  Package,
  Edit3,
  AlertTriangle,
  ShoppingCart,
} from "lucide-react-native";

import { useSupabaseQuery } from "../../../hooks/useSupabaseQuery";
import {
  getProducts,
  updateProductStock,
  toggleProductAvailability,
  type InventoryProduct,
  type CategoryFilter,
} from "../../../lib/adminQueries";
import AdminMoreTrigger from "../../../components/admin/AdminMoreTrigger";

// ===========================================
// Category Chips Data
// ===========================================

const CATEGORY_CHIPS: { key: CategoryFilter; label: { en: string; ar: string } }[] = [
  { key: "all", label: { en: "All", ar: "الكل" } },
  { key: "bakery", label: { en: "Bakery", ar: "معجنات" } },
  { key: "cookies", label: { en: "Cookies", ar: "كوكيز" } },
  { key: "sandwiches", label: { en: "Sandwiches", ar: "ساندويتش" } },
  { key: "drinks", label: { en: "Drinks", ar: "مشروبات" } },
];

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
// Main Inventory Screen Component
// ===========================================

export default function InventoryScreen() {
  const { t, i18n } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [restockModalVisible, setRestockModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<InventoryProduct | null>(null);
  const [restockQty, setRestockQty] = useState("");

  const isRTL = i18n.dir() === "rtl";

  const { data: products, loading, error, refetch } = useSupabaseQuery({
    fn: () => getProducts(searchQuery, categoryFilter, lowStockOnly),
  });

  // Re-fetch when filters change
  useEffect(() => {
    refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryFilter, lowStockOnly]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const filteredProducts = useMemo(() => products ?? [], [products]);

  // Handle restock
  const handleRestock = async () => {
    if (!selectedProduct) return;
    const qty = parseInt(restockQty, 10);
    if (isNaN(qty) || qty <= 0) {
      Alert.alert(
        isRTL ? "خطأ" : "Error",
        isRTL ? "يرجى إدخال كمية صالحة" : "Please enter a valid quantity"
      );
      return;
    }

    const newStock = selectedProduct.stock_quantity + qty;
    setUpdatingId(selectedProduct.id);
    const success = await updateProductStock(selectedProduct.id, newStock);
    if (success) {
      await refetch();
    }
    setUpdatingId(null);
    setRestockModalVisible(false);
    setRestockQty("");
    setSelectedProduct(null);
  };

  // Handle availability toggle
  const handleToggleAvailability = async (product: InventoryProduct) => {
    setUpdatingId(product.id);
    const success = await toggleProductAvailability(product.id, !product.is_active);
    if (success) {
      await refetch();
    }
    setUpdatingId(null);
  };

  // Check if product is low stock
  const isLowStock = (product: InventoryProduct): boolean => {
    return product.stock_quantity <= (product.reorder_point ?? 5);
  };

  // Render individual product card
  const renderProduct = ({ item }: { item: InventoryProduct }) => {
    const lowStock = isLowStock(item);
    const isUpdating = updatingId === item.id;
    const reorderPoint = item.reorder_point ?? 5;

    return (
      <View style={styles.productCard}>
        {/* Thumbnail */}
        <View style={styles.thumbnailContainer}>
          {item.image_url ? (
            <View style={styles.thumbnail} />
          ) : (
            <View style={[styles.thumbnail, styles.thumbnailPlaceholder]}>
              <Package size={32} color="#878787" />
            </View>
          )}
        </View>

        {/* Details */}
        <View style={styles.productDetails}>
          <View style={styles.productNameRow}>
            <Text style={styles.productName} numberOfLines={1}>
              {item.name}
            </Text>
            {lowStock && (
              <View style={styles.lowStockBadge}>
                <AlertTriangle size={12} color="#FFFFFF" />
                <Text style={styles.lowStockBadgeText}>
                  {isRTL ? "مكثف المخزون" : "Low Stock"}
                </Text>
              </View>
            )}
          </View>

          <Text style={styles.productPrice}>{formatCurrency(item.price)}</Text>

          <View style={styles.stockInfo}>
            <Text style={[styles.stockText, lowStock && styles.stockTextLow]}>
              {isRTL ? "متوفر:" : "Stock:"} {item.stock_quantity}
            </Text>
            <Text style={styles.reorderText}>
              {" "}
              {isRTL ? "الحد الأدنى:" : "Min:"} {reorderPoint}
            </Text>
          </View>

          {/* Restock Button */}
          <Pressable
            style={[styles.restockButton, lowStock && styles.restockButtonHighlight]}
            onPress={() => {
              setSelectedProduct(item);
              setRestockModalVisible(true);
              setRestockQty("");
            }}
            disabled={isUpdating}
          >
            {isUpdating ? (
              <ActivityIndicator size={14} color="#FFFFFF" />
            ) : (
              <Text style={styles.restockButtonText}>
                {isRTL ? "إعادة التخزين" : "Restock Now"}
              </Text>
            )}
          </Pressable>
        </View>

        {/* Edit Button */}
        <View style={styles.actionColumn}>
          <Pressable
            style={styles.editButton}
            onPress={() => handleToggleAvailability(item)}
          >
            <Edit3
              size={20}
              color={item.is_active ? "#10B981" : "#9CA3AF"}
            />
          </Pressable>
        </View>
      </View>
    );
  };

  // Skeleton Card
  const SkeletonCard = () => (
    <View style={styles.productCard}>
      <View style={styles.skeletonThumbnail} />
      <View style={styles.skeletonDetails}>
        <View style={styles.skeletonName} />
        <View style={styles.skeletonPrice} />
        <View style={styles.skeletonStock} />
        <View style={styles.skeletonButton} />
      </View>
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
              {isRTL ? "إدارة المخزون والمنتجات" : "Inventory Management"}
            </Text>
            <Text style={styles.subtitle}>
              {isRTL ? "تحكم في المخزون والمنتجات" : "Manage products and stock levels"}
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
              placeholder={isRTL ? "ابحث بالمنتج..." : "Search by product name or SKU..."}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#878787"
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery("")}>
                <X size={20} color="#878787" />
              </Pressable>
            )}
          </View>
        </View>

        {/* Top Action Row */}
        <View style={styles.actionRow}>
          <Pressable
            style={styles.primaryButton}
            onPress={() => Alert.alert("Add Product", "Coming soon")}
          >
            <Plus size={20} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>
              {isRTL ? "إضافة منتج جديد" : "+ Add New Product"}
            </Text>
          </Pressable>

          <Pressable
            style={styles.secondaryButton}
            onPress={() => Alert.alert("Restock All", "Coming soon")}
          >
            <ShoppingCart size={16} color="#181C2E" />
            <Text style={styles.secondaryButtonText}>
              {isRTL ? "قائمة الموردين" : "Supplier List"}
            </Text>
          </Pressable>
        </View>

        {/* Low Stock Toggle */}
        <View style={styles.lowStockToggleContainer}>
          <Pressable
            style={[
              styles.lowStockToggle,
              lowStockOnly && styles.lowStockToggleActive,
            ]}
            onPress={() => setLowStockOnly(!lowStockOnly)}
          >
            <View
              style={[
                styles.lowStockCheckbox,
                lowStockOnly && styles.lowStockCheckboxChecked,
              ]}
            >
              {lowStockOnly && <View style={styles.lowStockCheckboxInner} />}
            </View>
            <Text style={styles.lowStockToggleText}>
              {isRTL ? "أصناف أوشكت على النفاد" : "Low Stock Only"}
            </Text>
          </Pressable>
        </View>

        {/* Category Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
          contentContainerStyle={styles.filterContent}
        >
          {CATEGORY_CHIPS.map((chip) => (
            <Pressable
              key={chip.key}
              style={[
                styles.filterChip,
                categoryFilter === chip.key && styles.activeFilterChip,
              ]}
              onPress={() => setCategoryFilter(chip.key)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  categoryFilter === chip.key && styles.activeFilterChipText,
                ]}
              >
                {chip.label[isRTL ? "ar" : "en"]}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Product Count */}
        <Text style={styles.countText}>
          {filteredProducts.length} {isRTL ? "منتج" : "products"}
        </Text>

        {/* Products List */}
        {loading && !products ? (
          <View style={styles.skeletonGrid}>
            {[...Array(6)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </View>
        ) : filteredProducts.length === 0 ? (
          <View style={styles.emptyState}>
            <Package size={48} color="#D1D5DB" />
            <Text style={styles.emptyText}>
              {isRTL ? "لا توجد منتجات" : "No products found"}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredProducts}
            keyExtractor={(item) => item.id}
            renderItem={renderProduct}
            scrollEnabled={false}
            contentContainerStyle={styles.productsList}
          />
        )}
      </ScrollView>

      {/* Restock Modal */}
      <Modal
        visible={restockModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRestockModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setRestockModalVisible(false)}
        />
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>
            {isRTL ? "إعادة تخزين المنتج" : "Restock Product"}
          </Text>
          <Text style={styles.modalProductName}>
            {selectedProduct?.name ?? ""}
          </Text>
          <Text style={styles.modalLabel}>
            {isRTL ? "كمية الإضافة" : "Add Quantity"}
          </Text>
          <TextInput
            style={styles.modalInput}
            value={restockQty}
            onChangeText={setRestockQty}
            placeholder="0"
            placeholderTextColor="#878787"
            keyboardType="numeric"
          />
          <View style={styles.modalButtons}>
            <Pressable
              style={styles.modalCancelButton}
              onPress={() => {
                setRestockModalVisible(false);
                setRestockQty("");
                setSelectedProduct(null);
              }}
            >
              <Text style={styles.modalCancelText}>
                {isRTL ? "إلغاء" : "Cancel"}
              </Text>
            </Pressable>
            <Pressable
              style={styles.modalConfirmButton}
              onPress={handleRestock}
            >
              <Text style={styles.modalConfirmText}>
                {isRTL ? "تأكيد" : "Confirm"}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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

  // Top Action Row
  actionRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  primaryButton: {
    flex: 2,
    backgroundColor: "#C09248",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 14,
    fontFamily: "Quicksand-Bold",
    color: "#FFFFFF",
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  secondaryButtonText: {
    fontSize: 14,
    fontFamily: "Quicksand-Medium",
    color: "#181C2E",
  },

  // Low Stock Toggle
  lowStockToggleContainer: {
    marginBottom: 12,
  },
  lowStockToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  lowStockToggleActive: {
    // active state handled by checkbox fill
  },
  lowStockCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#878787",
    alignItems: "center",
    justifyContent: "center",
  },
  lowStockCheckboxChecked: {
    borderColor: "#C09248",
    backgroundColor: "#FFFFFF",
  },
  lowStockCheckboxInner: {
    width: 10,
    height: 10,
    borderRadius: 2,
    backgroundColor: "#C09248",
  },
  lowStockToggleText: {
    fontSize: 13,
    fontFamily: "Quicksand-Regular",
    color: "#181C2E",
  },

  // Category Filter Chips
  filterContainer: {
    marginBottom: 16,
  },
  filterContent: {
    gap: 8,
  },
  filterChip: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  activeFilterChip: {
    backgroundColor: "#C09248",
    borderColor: "#C09248",
  },
  filterChipText: {
    fontSize: 12,
    fontFamily: "Quicksand-Medium",
    color: "#878787",
  },
  activeFilterChipText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },

  // Count Text
  countText: {
    fontSize: 14,
    fontFamily: "Quicksand-Regular",
    color: "#878787",
    marginBottom: 16,
  },

  // Product Card
  productCard: {
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
  thumbnailContainer: {
    marginRight: 16,
  },
  thumbnail: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: "#E5E7EB",
  },
  thumbnailPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },

  // Product Details
  productDetails: {
    flex: 1,
  },
  productNameRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  productName: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Quicksand-Bold",
    color: "#181C2E",
    flex: 1,
  },

  // Low Stock Badge
  lowStockBadge: {
    backgroundColor: "#F59E0B",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  lowStockBadgeText: {
    fontSize: 10,
    fontFamily: "Quicksand-Bold",
    color: "#FFFFFF",
  },

  productPrice: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Quicksand-Bold",
    color: "#C09248",
    marginBottom: 8,
  },
  stockInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  stockText: {
    fontSize: 13,
    fontFamily: "Quicksand-Medium",
    color: "#6B7280",
  },
  stockTextLow: {
    color: "#EF4444",
    fontWeight: "700",
  },
  reorderText: {
    fontSize: 13,
    fontFamily: "Quicksand-Regular",
    color: "#878787",
  },

  // Restock Button
  restockButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  restockButtonHighlight: {
    backgroundColor: "#F59E0B",
    borderColor: "#F59E0B",
  },
  restockButtonText: {
    fontSize: 11,
    fontFamily: "Quicksand-Bold",
    color: "#181C2E",
  },

  // Action Column
  actionColumn: {
    marginLeft: 12,
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#F9FAFB",
    alignItems: "center",
    justifyContent: "center",
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
  skeletonGrid: {
    gap: 12,
  },
  skeletonThumbnail: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: "#E5E7EB",
    marginRight: 16,
  },
  skeletonDetails: {
    flex: 1,
  },
  skeletonName: {
    width: "60%",
    height: 16,
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
    marginBottom: 6,
  },
  skeletonPrice: {
    width: 70,
    height: 14,
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonStock: {
    width: "40%",
    height: 12,
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonButton: {
    width: 70,
    height: 16,
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
  },

  // Products List
  productsList: {
    gap: 12,
  },

  // Modal
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#00000040",
  },
  modalContent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    shadowColor: "#181C2E",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    fontFamily: "Quicksand-Bold",
    color: "#181C2E",
    marginBottom: 8,
  },
  modalProductName: {
    fontSize: 14,
    fontFamily: "Quicksand-Regular",
    color: "#878787",
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 14,
    fontFamily: "Quicksand-Medium",
    color: "#181C2E",
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    fontFamily: "Quicksand-Regular",
    color: "#181C2E",
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  modalCancelText: {
    fontSize: 14,
    fontFamily: "Quicksand-Bold",
    color: "#181C2E",
  },
  modalConfirmButton: {
    flex: 1,
    backgroundColor: "#C09248",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  modalConfirmText: {
    fontSize: 14,
    fontFamily: "Quicksand-Bold",
    color: "#FFFFFF",
  },
});
