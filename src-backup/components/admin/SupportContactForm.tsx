import React from "react";
import { Alert, Pressable, SafeAreaView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { useTranslation } from "react-i18next";

import { createSupportContact, getAllSupportContacts, updateSupportContact } from "../../../lib/adminQueries";
import { useAdminStore } from "../../../store/admin.store";
import AdminMoreTrigger from "./AdminMoreTrigger";

interface Props {
  id?: string | null;
}

export default function SupportContactForm({ id }: Props) {
  const { t } = useTranslation();
  const [contactPhone, setContactPhone] = React.useState("");
  const [contactLabel, setContactLabel] = React.useState<string | null>(null);
  const [contactPrimary, setContactPrimary] = React.useState(false);

  React.useEffect(() => {
    if (!id) return;
    getAllSupportContacts().then((data) => {
      const item = data.find((c) => c.id === id);
      if (item) {
        setContactPhone(item.phone);
        setContactLabel(item.label);
        setContactPrimary(item.is_primary);
      }
    }).catch(() => {});
  }, [id]);

  const isNew = !id;

  const handleSave = async () => {
    try {
      const payload = { phone: contactPhone, label: contactLabel, is_primary: contactPrimary };
      if (isNew) {
        await createSupportContact(payload);
      } else {
        await updateSupportContact(id!, payload);
      }
      useAdminStore.getState().refresh();
      Alert.alert(t("common.saved"));
    } catch (error: any) {
      Alert.alert(t("common.somethingWentWrong"), error?.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{t("admin.settings.supportContacts.title")}</Text>
          <Text style={styles.subtitle}>
            {isNew ? t("admin.settings.supportContacts.add") : t("admin.settings.supportContacts.edit")}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <AdminMoreTrigger />
        </View>
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.formLabel}>{t("admin.settings.supportContacts.phone")}</Text>
        <TextInput placeholder={t("admin.settings.supportContacts.phone")} value={contactPhone} onChangeText={setContactPhone} keyboardType="phone-pad" style={styles.input} />
        <Text style={styles.formLabel}>{t("admin.settings.supportContacts.label")}</Text>
        <TextInput placeholder={t("admin.settings.supportContacts.label")} value={contactLabel ?? ""} onChangeText={setContactLabel} style={styles.input} />
        <View style={styles.switchContainer}>
          <Text style={styles.switchLabel}>{t("admin.settings.supportContacts.primary")}</Text>
          <Switch value={contactPrimary} onValueChange={setContactPrimary} thumbColor={contactPrimary ? "#FE8C00" : "#F5F5F5"} trackColor={{ false: "#F5F5F5", true: "#FFF4E5" }} />
        </View>
        <Pressable style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>{t("common.save")}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FDF8F3" },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    marginBottom: 24, paddingHorizontal: 20, paddingTop: 12,
  },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  title: { fontSize: 28, fontFamily: "Quicksand-Bold", color: "#181C2E" },
  subtitle: { fontSize: 14, fontFamily: "Quicksand-Regular", color: "#878787", marginTop: 4 },
  formContainer: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 20, shadowColor: "#181C2E", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3 },
  formLabel: { fontSize: 14, fontFamily: "Quicksand-Medium", color: "#878787", marginBottom: 8 },
  input: { borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 14, fontFamily: "Quicksand-Regular" },
  switchContainer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12 },
  switchLabel: { fontSize: 14, fontFamily: "Quicksand-Medium", color: "#878787" },
  saveButton: { backgroundColor: "#FE8C00", borderRadius: 8, padding: 12, marginTop: 20, alignItems: "center", justifyContent: "center" },
  saveButtonText: { color: "#FFFFFF", fontSize: 14, fontFamily: "Quicksand-Bold" },
});