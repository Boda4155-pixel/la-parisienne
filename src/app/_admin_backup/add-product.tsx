import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  I18nManager,
  Image,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { createProduct } from "../../../lib/adminQueries";
import {
  ArrowLeft,
  Plus,
  Camera,
  Save,
  X,
  Check,
  ChevronDown,
} from "lucide-react-native";

import AdminMoreTrigger from "../../../components/admin/AdminMoreTrigger";

// ===========================================
// Category Options
// ===========================================

export default function AddProductScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const isRTL = I18nManager.isRTL;

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Bakery");
  const [description, setDescription] = useState("");
  const [supplier, setSupplier] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categories, setCategories] = useState<string[]>([
    "Bakery",
    "Pastry",
    "Drinks",
    "Raw Material",
    "Packaging",
  ]);

  const handleImagePick = async () => {
    try {
      const ImagePicker = await import('expo-image-picker');
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('صلاحية الصور', 'محتاج تسمح بالوصول للصور');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      if (!result.canceled && result.assets?.[0]?.uri) {
        setImageUri(result.assets[0].uri);
      }
    } catch (e: any) {
      console.error('ImagePick error', e);
      Alert.alert(
        isRTL ? "خطأ" : "Error",
        isRTL ? "فشل اختيار الصورة" : "Failed to pick image"
      );
    }
  };

  const handleCategorySelect = (catName: string) => {
    setSelectedCategory(catName);
    setShowCategoryModal(false);
  };

  const handleAddCategory = () => {
    Alert.prompt(
      isRTL ? "فئة جديدة" : "New Category",
      isRTL ? "أدخل اسم الفئة" : "Enter category name",
      (newName) => {
        if (newName && newName.trim()) {
          const trimmed = newName.trim();
          if (trimmed && !categories.includes(trimmed)) {
            setCategories((prev) => [...prev, trimmed]);
            if (selectedCategory === "Bakery") setSelectedCategory(trimmed);
          }
        }
      }
    );
  };

  const handleEditCategory = (oldName: string) => {
    Alert.prompt(
      isRTL ? "تعديل فئة" : "Edit Category",
      isRTL ? "اسم جديد" : "New name",
      (newName) => {
        if (newName && newName.trim()) {
          const trimmed = newName.trim();
          setCategories(categories.map((c) => (c === oldName ? trimmed : c)));
          if (selectedCategory === oldName) setSelectedCategory(trimmed);
        }
      },
      "plain-text",
      oldName
    );
  };

  const handleDeleteCategory = (name: string) => {
    if (categories.length <= 1) {
      Alert.alert(isRTL ? "لا يمكن مسح كل الفئات" : "Cannot remove all categories");
      return;
    }
    Alert.alert(
      isRTL ? "مسح فئة" : "Remove Category",
      isRTL ? `هل تريد مسح ${name}؟` : `Are you sure you want to remove ${name}?`,
      [
        { text: isRTL ? "إلغاء" : "Cancel", style: "cancel" },
        {
          text: isRTL ? "مسح" : "Remove",
          style: "destructive",
          onPress: () => {
            setCategories(categories.filter((c) => c !== name));
            if (selectedCategory === name) setSelectedCategory(categories[0] || "Bakery");
          },
        },
      ]
    );
  };

  const handleSave = useCallback(async () => {
    if (!name.trim()) {
      Alert.alert(isRTL ? "خطأ" : "Error", isRTL ? "يرجى إدخال اسم المنتج" : "Please enter product name");
      return;
    }
    if (!price || parseFloat(price) <= 0) {
      Alert.alert(isRTL ? "خطأ" : "Error", isRTL ? "يرجى إدخال سعر صحيح" : "Please enter a valid price");
      return;
    }
    if (!stock || parseInt(stock, 10) < 0) {
      Alert.alert(isRTL ? "خطأ" : "Error", isRTL ? "يرجى إدخال كمية صحيحة" : "Please enter a valid quantity");
      return;
    }

    setSaving(true);

    try {
      // Map selectedCategory to category_id format (lowercase, matching CATEGORY_MAP)
      const categoryMap: Record<string, string> = {
        "Bakery": "bakery",
        "Pastry": "cookies",
        "Drinks": "drinks",
        "Raw Material": "other",
        "Packaging": "other",
      };
      const categoryId = categoryMap[selectedCategory] || selectedCategory.toLowerCase();

      const payload = {
        category_id: categoryId,
        name: name.trim(),
        description: description.trim() || null,
        image_url: imageUri,
        price: parseFloat(price),
        stock_quantity: parseInt(stock, 10),
        is_active: true,
        is_featured: false,
      };

      await createProduct(payload);

      Alert.alert(
        isRTL ? "تم الحفظ" : "Saved",
        isRTL ? "تم حفظ المنتج في الكلاود ✅" : "Product saved to cloud successfully",
        [{ text: isRTL ? "حسناً" : "OK", onPress: () => router.back() }]
      );
    } catch (error: any) {
      console.error("Save product error:", error);
      Alert.alert(isRTL ? "خطأ" : "Error", error.message || "Failed to save product");
    } finally {
      setSaving(false);
    }
  }, [name, price, stock, description, selectedCategory, supplier, imageUri, isRTL, router]);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoiding}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <ScrollView
          contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 16, gap: 16 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => {
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace("/(admin)/inventory");
                }
              }}
              hitSlop={20}
              style={styles.backButton}
            >
              <ArrowLeft size={24} color="#181C2E" />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>
                {isRTL ? "إضافة منتج جديد" : "Add New Product"}
              </Text>
              <Text style={styles.subtitle}>
                {isRTL ? "املأ البيانات أدناه" : "Fill in the details below"}
              </Text>
            </View>
            <AdminMoreTrigger />
          </View>

          {/* Image Picker */}
          <View style={styles.section}>
            <TouchableOpacity
              activeOpacity={0.8}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              style={[styles.imagePicker, imageUri && styles.imagePickerHasImage]}
              onPress={handleImagePick}
            >
              {imageUri ? (
                <>
                  <Image source={{ uri: imageUri }} style={styles.productImage} resizeMode="cover" />
                  <View style={styles.imageOverlay}>
                    <Camera size={28} color="#FFFFFF" />
                  </View>
                </>
              ) : (
                <View style={styles.imagePickerPlaceholder}>
                  <Camera size={36} color="#C09248" />
                  <Text style={styles.imagePickerText}>
                    {isRTL ? "اضغط لإضافة صورة المنتج" : "Tap to add product image"}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Product Name */}
          <View style={styles.section}>
            <Text style={styles.label}>{isRTL ? "اسم المنتج *" : "Product Name *"}</Text>
            <TextInput
              style={[styles.input, { textAlign: isRTL ? "right" : "left" }]}
              value={name}
              onChangeText={setName}
              placeholder={isRTL ? "مثال: كرواسون بالشوكولاتة" : "e.g. Chocolate Croissant"}
              placeholderTextColor="#878787"
              autoCapitalize="words"
              returnKeyType="next"
            />
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.label}>{isRTL ? "الوصف" : "Description"}</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline, { textAlign: isRTL ? "right" : "left" }]}
              value={description}
              onChangeText={setDescription}
              placeholder={isRTL ? "وصف مختصر للمنتج" : "Short product description"}
              placeholderTextColor="#878787"
              multiline
              numberOfLines={3}
              returnKeyType="next"
              // Fix icon overlap - disable any pointer events on nested elements
              pointerEvents="box-none"
            />
          </View>

          {/* Price & Stock Row */}
          <View style={styles.twoColumnRow}>
            <View style={styles.sectionHalf}>
              <Text style={styles.label}>{isRTL ? "السعر (ج.م) *" : "Price (EGP) *"}</Text>
              <TextInput
                style={[styles.input, { textAlign: isRTL ? "right" : "left" }]}
                value={price}
                onChangeText={setPrice}
                placeholder={isRTL ? "0.00" : "0.00"}
                placeholderTextColor="#878787"
                keyboardType="decimal-pad"
                returnKeyType="next"
              />
            </View>
            <View style={styles.sectionHalf}>
              <Text style={styles.label}>{isRTL ? "الكمية في المخزن *" : "Stock Quantity *"}</Text>
              <TextInput
                style={[styles.input, { textAlign: isRTL ? "right" : "left" }]}
                value={stock}
                onChangeText={setStock}
                placeholder={isRTL ? "0" : "0"}
                placeholderTextColor="#878787"
                keyboardType="numeric"
                returnKeyType="next"
              />
            </View>
          </View>

          {/* Category Selector - Pressable with Modal */}
          <View style={styles.section}>
            <Text style={styles.label}>{isRTL ? "الفئة *" : "Category *"}</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              style={styles.dropdown}
              onPress={() => setShowCategoryModal(true)}
            >
              <View style={styles.dropdownContent}>
                <Text style={[styles.dropdownText, { textAlign: isRTL ? "right" : "left" }]}>{selectedCategory}</Text>
                <View style={styles.dropdownArrow}>
                  <ChevronDown size={20} color="#878787" />
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* Supplier - Working TextInput */}
          <View style={styles.section}>
            <Text style={styles.label}>{isRTL ? "المورد" : "Supplier"}</Text>
            <TextInput
              style={[styles.input, { textAlign: isRTL ? "right" : "left" }]}
              value={supplier}
              onChangeText={setSupplier}
              placeholder={isRTL ? "اسم المورد (اختياري)" : "Supplier name (optional)"}
              placeholderTextColor="#878787"
              autoCapitalize="words"
              returnKeyType="done"
            />
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              activeOpacity={0.7}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              style={styles.cancelButton}
              onPress={() => router.back()}
            >
              <X size={20} color="#EF4444" />
              <Text style={styles.cancelButtonText}>{isRTL ? "إلغاء" : "Cancel"}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              style={styles.saveButton}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <View style={styles.buttonLoading}>
                  <Save size={20} color="#FFFFFF" />
                </View>
              ) : (
                <>
                  <Save size={20} color="#FFFFFF" />
                  <Text style={styles.saveButtonText}>{isRTL ? "حفظ المنتج" : "Save Product"}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Category Selection Modal */}
      <Modal visible={showCategoryModal} animationType="slide" transparent={true}>
        <TouchableOpacity
          activeOpacity={1}
          style={styles.modalOverlay}
          onPress={() => setShowCategoryModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isRTL ? "اختر الفئة" : "Select Category"}
              </Text>
              <TouchableOpacity
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                onPress={handleAddCategory}
              >
                <Plus size={24} color="#C09248" />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.modalList} showsVerticalScrollIndicator={false}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  activeOpacity={0.7}
                  hitSlop={{ top: 10, bottom: 10, left: 15, right: 15 }}
                  style={[
                    styles.modalItem,
                    selectedCategory === cat && styles.modalItemSelected,
                  ]}
                >
                  <TouchableOpacity
                    onPress={() => handleCategorySelect(cat)}
                    style={{ flex: 1 }}
                  >
                    <Text style={[
                      styles.modalItemText,
                      selectedCategory === cat && styles.modalItemTextSelected,
                    ]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                  <View style={{ flexDirection: "row", gap: 12 }}>
                    <TouchableOpacity onPress={() => handleEditCategory(cat)}>
                      <Text>✏️</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeleteCategory(cat)}>
                      <Text>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
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
  keyboardAvoiding: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
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

  // Sections
  section: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontFamily: "Quicksand-Medium",
    color: "#181C2E",
  },

  // Inputs
  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: "Quicksand-Regular",
    color: "#181C2E",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#181C2E",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  inputMultiline: {
    paddingTop: 14,
    paddingBottom: 14,
    minHeight: 100,
  },

  // Two column row
  twoColumnRow: {
    flexDirection: "row",
    gap: 12,
  },
  sectionHalf: {
    flex: 1,
    gap: 8,
  },

  // Dropdown
  dropdown: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#181C2E",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  dropdownContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dropdownText: {
    fontSize: 16,
    fontFamily: "Quicksand-Regular",
    color: "#181C2E",
    flex: 1,
  },
  dropdownArrow: {
    marginLeft: 8,
  },

  // Image Picker
  imagePicker: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#E5E7EB",
    overflow: "hidden",
    shadowColor: "#181C2E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  imagePickerHasImage: {
    borderColor: "#C09248",
  },
  imagePickerPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  imagePickerText: {
    fontSize: 14,
    fontFamily: "Quicksand-Medium",
    color: "#C09248",
    textAlign: "center",
  },
  productImage: {
    width: "100%",
    height: "100%",
  },
  imageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
  },

  // Buttons
  buttonRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#EF4444",
    shadowColor: "#181C2E",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Quicksand-Bold",
    color: "#EF4444",
  },
  saveButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: "#C09248",
    shadowColor: "#181C2E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Quicksand-Bold",
    color: "#FFFFFF",
  },
  buttonLoading: {
    flexDirection: "row",
    alignItems: "center",
  },

  // Category Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
    maxHeight: "70%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "Quicksand-Bold",
    color: "#181C2E",
  },
  modalList: {
    gap: 8,
  },
  modalItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
  },
  modalItemSelected: {
    backgroundColor: "#FEF3E2",
    borderWidth: 1,
    borderColor: "#C09248",
  },
  modalItemText: {
    fontSize: 16,
    fontFamily: "Quicksand-Medium",
    color: "#181C2E",
  },
  modalItemTextSelected: {
    color: "#C09248",
    fontWeight: "600",
  },
  modalCheck: {
    marginLeft: 8,
  },
});