import React from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { router, useLocalSearchParams } from "expo-router";

import { useSupabaseQuery } from "../../../../hooks/useSupabaseQuery";
import {
  AdminProduct,
  getProductById,
  updateProduct,
} from "../../../../lib/adminQueries";
import { getCategories } from "../../../../lib/queries";
import AdminMoreTrigger from "../../../../components/admin/AdminMoreTrigger";

export default function EditProduct() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: product, loading, error, refetch } = useSupabaseQuery({
    fn: getProductById,
    params: id,
    skip: !id,
  });
  const { data: categories } = useSupabaseQuery({
    fn: getCategories,
    skip: false,
  });

  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [imageUrl, setImageUrl] = React.useState("");
  const [price, setPrice] = React.useState("");
  const [stockQuantity, setStockQuantity] = React.useState("");
  const [isActive, setIsActive] = React.useState(true);
  const [isFeatured, setIsFeatured] = React.useState(false);
  const [categoryId, setCategoryId] = React.useState("");
  const [categoryPickerOpen, setCategoryPickerOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (product) {
      setName(product.name);
      setDescription(product.description ?? "");
      setImageUrl(product.image_url ?? "");
      setPrice(String(product.price));
      setStockQuantity(String(product.stock_quantity));
      setIsActive(product.is_active);
      setIsFeatured(product.is_featured);
      setCategoryId(product.category_id ?? "");
    }
  }, [product]);

  const handleSave = async () => {
    if (!id || !name.trim()) {
      Alert.alert(t("admin.products.nameRequired"));
      return;
    }

    const priceNum = parseFloat(price);
    const stockNum = parseInt(stockQuantity, 10);

    if (isNaN(priceNum)) {
      Alert.alert(t("admin.products.priceRequired"));
      return;
    }

    if (isNaN(stockNum)) {
      Alert.alert(t("admin.products.stockRequired"));
      return;
    }

    setSubmitting(true);

    try {
      await updateProduct(id, {
        name: name.trim(),
        description: description.trim() || null,
        image_url: imageUrl.trim() || null,
        price: priceNum,
        stock_quantity: stockNum,
        is_active: isActive,
        is_featured: isFeatured,
        category_id: categoryId.trim() || null,
      });

      await refetch();
      router.back();
    } catch (saveError: any) {
      Alert.alert(t("common.somethingWentWrong"), saveError?.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <ChevronLeft size={24} color="#181C2E" />
        </Pressable>
        <Text style={styles.title}>{t("admin.products.edit")}</Text>
        <AdminMoreTrigger />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          {loading ? (
            <Text style={styles.loadingText}>{t("common.loading")}</Text>
          ) : error ? (
            <Text style={styles.errorText}>{t("common.errorLoading")}</Text>
          ) : (
            <>
              <Text style={styles.label}>{t("admin.products.name")}</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder={t("admin.products.namePlaceholder")}
                placeholderTextColor="#9CA3AF"
                editable={!submitting}
              />

              <Text style={[styles.label, { marginTop: 20 }]}>
                {t("admin.products.description")}
              </Text>
              <TextInput
                style={styles.input}
                value={description}
                onChangeText={setDescription}
                placeholder={t("admin.products.descriptionPlaceholder")}
                placeholderTextColor="#9CA3AF"
                editable={!submitting}
                multiline
              />

              <Text style={[styles.label, { marginTop: 20 }]}>
                {t("admin.products.category")}
              </Text>
              <View style={styles.pickerContainer}>
                <Pressable
                  style={[styles.pickerButton, categoryId && styles.pickerButtonActive]}
                  onPress={() => !submitting && setCategoryPickerOpen(!categoryPickerOpen)}
                >
                  <Text style={[styles.pickerButtonText, categoryId && styles.pickerButtonTextActive]}>
                    {categories?.find((c) => c.id === categoryId)?.name ?? t("admin.products.categoryPlaceholder")}
                  </Text>
                </Pressable>
                {categoryPickerOpen && (
                  <View style={styles.dropdown}>
                    {categories?.map((category) => (
                      <Pressable
                        key={category.id}
                        style={[
                          styles.dropdownItem,
                          category.id === categoryId && styles.dropdownItemActive,
                        ]}
                        onPress={() => {
                          setCategoryId(category.id);
                          setCategoryPickerOpen(false);
                        }}
                      >
                        <Text style={styles.dropdownItemText}>{category.name}</Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>

              <Text style={[styles.label, { marginTop: 20 }]}>
                {t("admin.products.price")}
              </Text>
              <TextInput
                style={styles.input}
                value={price}
                onChangeText={setPrice}
                placeholder={t("admin.products.pricePlaceholder")}
                placeholderTextColor="#9CA3AF"
                editable={!submitting}
                keyboardType="decimal-pad"
              />

              <Text style={[styles.label, { marginTop: 20 }]}>
                {t("admin.products.stock")}
              </Text>
              <TextInput
                style={styles.input}
                value={stockQuantity}
                onChangeText={setStockQuantity}
                placeholder={t("admin.products.stockPlaceholder")}
                placeholderTextColor="#9CA3AF"
                editable={!submitting}
                keyboardType="numeric"
              />

              <View style={styles.toggleRow}>
                <Text style={styles.toggleLabel}>{t("admin.products.active")}</Text>
                <Pressable
                  style={[styles.toggleSwitch, isActive && styles.toggleSwitchActive]}
                  onPress={() => !submitting && setIsActive((v) => !v)}
                >
                  <View style={[styles.toggleThumb, isActive && styles.toggleThumbActive]} />
                </Pressable>
              </View>

              <View style={styles.toggleRow}>
                <Text style={styles.toggleLabel}>{t("admin.products.featured")}</Text>
                <Pressable
                  style={[styles.toggleSwitch, isFeatured && styles.toggleSwitchActive]}
                  onPress={() => !submitting && setIsFeatured((v) => !v)}
                >
                  <View style={[styles.toggleThumb, isFeatured && styles.toggleThumbActive]} />
                </Pressable>
              </View>

              <Pressable
                style={[styles.saveButton, submitting && styles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={submitting}
              >
                <Text style={styles.saveButtonText}>
                  {submitting ? t("common.saving") : t("common.save")}
                </Text>
              </Pressable>
            </>
          )}
        </View>
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
  label: {
    fontSize: 14,
    fontFamily: "Quicksand-Medium",
    color: "#181C2E",
  },
  input: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginTop: 8,
    fontSize: 15,
    fontFamily: "Quicksand-Regular",
    color: "#181C2E",
  },
  pickerContainer: {
    marginTop: 8,
  },
  pickerButton: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pickerButtonActive: {
    borderWidth: 1,
    borderColor: "#FE8C00",
  },
  pickerButtonText: {
    fontSize: 15,
    fontFamily: "Quicksand-Regular",
    color: "#181C2E",
  },
  pickerButtonTextActive: {
    color: "#FE8C00",
  },
  dropdown: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  dropdownItemActive: {
    backgroundColor: "#FE8C0015",
  },
  dropdownItemText: {
    fontSize: 15,
    fontFamily: "Quicksand-Regular",
    color: "#181C2E",
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
  },
  toggleLabel: {
    fontSize: 14,
    fontFamily: "Quicksand-Medium",
    color: "#181C2E",
  },
  toggleSwitch: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#D1D5DB",
    padding: 3,
  },
  toggleSwitchActive: { backgroundColor: "#FE8C00" },
  toggleThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#FFFFFF",
  },
  toggleThumbActive: { transform: [{ translateX: 20 }] },
  saveButton: {
    marginTop: 28,
    backgroundColor: "#FE8C00",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 14,
    fontFamily: "Quicksand-Bold",
    color: "#FFFFFF",
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
});