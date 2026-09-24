import React from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { router } from "expo-router";

import { createCategory } from "../../../../lib/adminQueries";
import AdminMoreTrigger from "../../../../components/admin/AdminMoreTrigger";

export default function NewCategory() {
  const { t } = useTranslation();

  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [sortOrder, setSortOrder] = React.useState("");
  const [is_active, setIsActive] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert(t("admin.categories.nameRequired"));
      return;
    }

    setSubmitting(true);

    try {
      await createCategory({
        name: name.trim(),
        description: description.trim() || null,
        sort_order: sortOrder.trim() ? Number(sortOrder) : null,
        is_active: is_active,
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
        <Text style={styles.title}>{t("admin.categories.new")}</Text>
        <AdminMoreTrigger />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <Text style={styles.label}>{t("admin.categories.name")}</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder={t("admin.categories.namePlaceholder")}
            placeholderTextColor="#9CA3AF"
            editable={!submitting}
          />

          <Text style={[styles.label, { marginTop: 20 }]}>
            {t("admin.categories.description")}
          </Text>
          <TextInput
            style={styles.input}
            value={description}
            onChangeText={setDescription}
            placeholder={t("admin.categories.descriptionPlaceholder")}
            placeholderTextColor="#9CA3AF"
            editable={!submitting}
            multiline
          />

          <Text style={[styles.label, { marginTop: 20 }]}>
            {t("admin.categories.sortOrder")}
          </Text>
          <TextInput
            style={styles.input}
            value={sortOrder}
            onChangeText={setSortOrder}
            placeholder={t("admin.categories.sortOrderPlaceholder")}
            placeholderTextColor="#9CA3AF"
            editable={!submitting}
            keyboardType="numeric"
          />

          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>{t("admin.categories.active")}</Text>
            <Pressable
              style={[styles.toggleSwitch, is_active && styles.toggleSwitchActive]}
              onPress={() => !submitting && setIsActive((v) => !v)}
            >
              <View style={[styles.toggleThumb, is_active && styles.toggleThumbActive]} />
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
