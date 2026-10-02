import React from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { router } from "expo-router";

import { createCoupon } from "../../../../lib/adminQueries";
import AdminMoreTrigger from "../../../../components/admin/AdminMoreTrigger";

export default function NewCoupon() {
  const { t } = useTranslation();

  const [code, setCode] = React.useState("");
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [discountType, setDiscountType] = React.useState<"percentage" | "fixed_amount">("percentage");
  const [discountValue, setDiscountValue] = React.useState("");
  const [maxDiscount, setMaxDiscount] = React.useState("");
  const [usageLimit, setUsageLimit] = React.useState("");
  const [minOrder, setMinOrder] = React.useState("");
  const [expiresAt, setExpiresAt] = React.useState("");
  const [isActive, setIsActive] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);

  const handleSave = async () => {
    if (!code.trim()) {
      Alert.alert(t("admin.coupons.codeRequired"));
      return;
    }

    const discountVal = parseFloat(discountValue);
    if (isNaN(discountVal)) {
      Alert.alert(t("admin.coupons.discountValueRequired"));
      return;
    }

    setSubmitting(true);

    try {
      await createCoupon({
        code: code.trim(),
        name: name.trim() || null,
        description: description.trim() || null,
        discount_type: discountType,
        discount_value: discountVal,
        max_discount: maxDiscount.trim() ? Number(maxDiscount) : null,
        usage_limit: usageLimit.trim() ? Number(usageLimit) : null,
        min_order_amount: minOrder.trim() ? Number(minOrder) : 0,
        expires_at: expiresAt.trim() || null,
        is_active: isActive,
      });

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
        <Text style={styles.title}>{t("admin.coupons.new")}</Text>
        <AdminMoreTrigger />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={styles.label}>{t("admin.coupons.code")}</Text>
          <TextInput
            style={styles.input}
            value={code}
            onChangeText={setCode}
            placeholder={t("admin.coupons.codePlaceholder")}
            placeholderTextColor="#9CA3AF"
            editable={!submitting}
            autoCapitalize="characters"
          />

          <Text style={[styles.label, { marginTop: 20 }]}>
            {t("admin.coupons.name")}
          </Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder={t("admin.coupons.namePlaceholder")}
            placeholderTextColor="#9CA3AF"
            editable={!submitting}
          />

          <Text style={[styles.label, { marginTop: 20 }]}>
            {t("admin.coupons.description")}
          </Text>
          <TextInput
            style={styles.input}
            value={description}
            onChangeText={setDescription}
            placeholder={t("admin.coupons.descriptionPlaceholder")}
            placeholderTextColor="#9CA3AF"
            editable={!submitting}
            multiline
          />

          <Text style={[styles.label, { marginTop: 20 }]}>
            {t("admin.coupons.discountType")}
          </Text>
          <View style={styles.pickerRow}>
            <Pressable
              style={[
                styles.pickerButton,
                discountType === "percentage" && styles.pickerButtonActive,
              ]}
              onPress={() => !submitting && setDiscountType("percentage")}
            >
              <Text style={[styles.pickerButtonText, discountType === "percentage" && styles.pickerButtonTextActive]}>
                {t("admin.coupons.percentage")}
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.pickerButton,
                discountType === "fixed_amount" && styles.pickerButtonActive,
              ]}
              onPress={() => !submitting && setDiscountType("fixed_amount")}
            >
              <Text style={[styles.pickerButtonText, discountType === "fixed_amount" && styles.pickerButtonTextActive]}>
                {t("admin.coupons.fixed")}
              </Text>
            </Pressable>
          </View>

          <Text style={[styles.label, { marginTop: 20 }]}>
            {t("admin.coupons.discountValue")}
          </Text>
          <TextInput
            style={styles.input}
            value={discountValue}
            onChangeText={setDiscountValue}
            placeholder={t("admin.coupons.discountValuePlaceholder")}
            placeholderTextColor="#9CA3AF"
            editable={!submitting}
            keyboardType="decimal-pad"
          />

          <Text style={[styles.label, { marginTop: 20 }]}>
            {t("admin.coupons.maxDiscount")}
          </Text>
          <TextInput
            style={styles.input}
            value={maxDiscount}
            onChangeText={setMaxDiscount}
            placeholder={t("admin.coupons.maxDiscountPlaceholder")}
            placeholderTextColor="#9CA3AF"
            editable={!submitting}
            keyboardType="decimal-pad"
          />

          <Text style={[styles.label, { marginTop: 20 }]}>
            {t("admin.coupons.usageLimit")}
          </Text>
          <TextInput
            style={styles.input}
            value={usageLimit}
            onChangeText={setUsageLimit}
            placeholder={t("admin.coupons.usageLimitPlaceholder")}
            placeholderTextColor="#9CA3AF"
            editable={!submitting}
            keyboardType="numeric"
          />

          <Text style={[styles.label, { marginTop: 20 }]}>
            {t("admin.coupons.minOrder")}
          </Text>
          <TextInput
            style={styles.input}
            value={minOrder}
            onChangeText={setMinOrder}
            placeholder={t("admin.coupons.minOrderPlaceholder")}
            placeholderTextColor="#9CA3AF"
            editable={!submitting}
            keyboardType="decimal-pad"
          />

          <Text style={[styles.label, { marginTop: 20 }]}>
            {t("admin.coupons.expiresAt")}
          </Text>
          <TextInput
            style={styles.input}
            value={expiresAt}
            onChangeText={setExpiresAt}
            placeholder={t("admin.coupons.expiresAtPlaceholder")}
            placeholderTextColor="#9CA3AF"
            editable={!submitting}
          />

          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>{t("admin.coupons.active")}</Text>
            <Pressable
              style={[styles.toggleSwitch, isActive && styles.toggleSwitchActive]}
              onPress={() => !submitting && setIsActive((v) => !v)}
            >
              <View style={[styles.toggleThumb, isActive && styles.toggleThumbActive]} />
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
  pickerRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  pickerButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
  },
  pickerButtonActive: {
    backgroundColor: "#FE8C00",
  },
  pickerButtonText: {
    fontSize: 14,
    fontFamily: "Quicksand-Medium",
    color: "#181C2E",
  },
  pickerButtonTextActive: {
    color: "#FFFFFF",
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 24,
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
});