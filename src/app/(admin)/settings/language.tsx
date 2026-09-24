import React from "react";
import { Alert, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "react-i18next";
import AdminMoreTrigger from "../../../../components/admin/AdminMoreTrigger";
import { changeAppLanguage } from "../../../../i18next/i18next";
import { useSupabaseQuery } from "../../../../hooks/useSupabaseQuery";
import { getAppLanguage, setAppLanguage } from "../../../../lib/adminQueries";
import { useAdminStore } from "../../../../store/admin.store";

export default function LanguageSettings() {
  const { t } = useTranslation();
  const { data, refetch } = useSupabaseQuery({
    fn: () => getAppLanguage(),
    skip: false,
  });
  const { refreshTrigger } = useAdminStore();

  const [selectedLanguage, setSelectedLanguage] = React.useState(data ?? "en");

  React.useEffect(() => {
    if (data) {
      setSelectedLanguage(data);
    }
  }, [data]);

  const handleLanguageChange = async (language: string) => {
    try {
      await changeAppLanguage(language);
      await setAppLanguage(language);
      setSelectedLanguage(language);
      useAdminStore.getState().refresh();
      refetch();
      Alert.alert(t("common.saved"));
    } catch (error: any) {
      Alert.alert(t("common.somethingWentWrong"), error?.message);
    }
  };

  const LANGUAGE_OPTIONS = [
    { code: "en", name: "English" },
    { code: "fr", name: "Français" },
    { code: "ar", name: "العربية" },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{t("admin.settings.language.title")}</Text>
          <Text style={styles.subtitle}>{t("admin.settings.language.subtitle")}</Text>
        </View>
        <View style={styles.headerActions}>
          <AdminMoreTrigger />
        </View>
      </View>

      <View style={styles.formContainer}>
        {LANGUAGE_OPTIONS.map((option, index) => (
          <View
            key={option.code}
            style={[
              styles.languageItem,
              selectedLanguage === option.code ? styles.languageItemActive : null,
              index === LANGUAGE_OPTIONS.length - 1 ? styles.languageItemLast : null,
            ]}
          >
            <Text style={styles.languageText}>{option.name}</Text>
            <Text
              style={[styles.statusText, selectedLanguage === option.code ? styles.statusTextActive : styles.statusTextInactive]}
            >
              {selectedLanguage === option.code ? t("admin.settings.language.selected") : ""}
            </Text>
          </View>
        ))}
      </View>
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
  formContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#181C2E",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  languageItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  languageItemActive: {
    backgroundColor: "#FE8C0015",
  },
  languageItemLast: {
    borderBottomWidth: 0,
  },
  languageText: {
    fontSize: 14,
    fontFamily: "Quicksand-Regular",
    color: "#181C2E",
  },
  statusText: {
    fontSize: 12,
    fontFamily: "Quicksand-Medium",
  },
  statusTextActive: {
    color: "#10B981",
  },
  statusTextInactive: {
    color: "#6B7280",
  },
});