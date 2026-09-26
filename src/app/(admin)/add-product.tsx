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
  Keyboard,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  Plus,
  Camera,
  Save,
  X,
  Image as ImageIcon,
} from "lucide-react-native";

import AdminMoreTrigger from "../../../components/admin/AdminMoreTrigger";

// ===========================================
// Category Options
// ===========================================

const CATEGORIES = [
  { value: "bakery", label: { en: "Bakery", ar: "معجنات" } },
  { value: "cookies", label: { en: "Cookies", ar: "كوكيز" } },
  { value: "cake", label: { en: "Cake", ar: "كيك" } },
  { value: "drinks", label: { en: "Drinks", ar: "مشروبات" } },
];

type CategoryValue = typeof CATEGORIES[number]["value"];

// ===========================================
// Add Product Screen
// ===========================================

export default function AddProductScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const isRTL = I18nManager.isRTL;

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [category, setCategory] = useState<CategoryValue>("bakery");
  const [description, setDescription] = useState("");
  const [supplier, setSupplier] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleImagePick = useCallback(async () => {
    // Note: expo-image-picker not installed. Using placeholder.
    Alert.alert(
      isRTL ? "تنبيه" : "Feature Coming Soon",
      isRTL ? "اختيار الصورة سيضاف قريباً" : "Image selection will be added soon"
    );
  }, [isRTL]);

  const handleSave = useCallback(async () => {
    // Validate required fields
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

    // Simulate API call - replace with actual Supabase insert
    await new Promise((resolve) => setTimeout(resolve, 800));

    setSaving(false);

    Alert.alert(
      isRTL ? "تم الحفظ" : "Saved",
      isRTL ? "تم إضافة المنتج بنجاح" : "Product added successfully",
      [{ text: isRTL ? "حسناً" : "OK", onPress: () => router.back() }]
    );
  }, [name, price, stock, isRTL, router]);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
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
            style={[
              styles.imagePicker,
              imageUri && styles.imagePickerHasImage,
            ]}
            onPress={handleImagePick}
          >
            {imageUri ? (
              <>
                <Image
                  source={{ uri: imageUri }}
                  style={styles.productImage}
                  resizeMode="cover"
                />
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

        {/* Category Dropdown */}
        <View style={styles.section}>
          <Text style={styles.label}>{isRTL ? "الفئة *" : "Category *"}</Text>
          <TouchableOpacity
            activeOpacity={0.7}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            style={styles.dropdown}
            onPress={() => Keyboard.dismiss()}
          >
            <View style={styles.dropdownContent}>
              <Text style={[styles.dropdownText, { textAlign: isRTL ? "right" : "left" }]}>
                {CATEGORIES.find((c) => c.value === category)?.label[isRTL ? "ar" : "en"]}
              </Text>
              <View style={styles.dropdownArrow}>
                <Plus size={20} color="#878787" />
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Supplier */}
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
            <Text style={styles.cancelButtonText}>
              {isRTL ? "إلغاء" : "Cancel"}
            </Text>
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
                <Text style={styles.saveButtonText}>
                  {isRTL ? "حفظ المنتج" : "Save Product"}
                </Text>
              </>
            )}
          </TouchableOpacity>
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
    paddingBottom: 40,
    gap: 16,
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
});