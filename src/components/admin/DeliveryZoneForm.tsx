import React from "react";
import { Alert, Pressable, SafeAreaView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { useTranslation } from "react-i18next";

import { createDeliveryZone, getAllDeliveryZones, updateDeliveryZone } from "../../../lib/adminQueries";
import { useAdminStore } from "../../../store/admin.store";
import AdminMoreTrigger from "./AdminMoreTrigger";

interface Props {
  id?: string | null;
}

export default function DeliveryZoneForm({ id }: Props) {
  const { t } = useTranslation();
  const [zoneName, setZoneName] = React.useState("");
  const [zoneNameEn, setZoneNameEn] = React.useState("");
  const [zoneNameFr, setZoneNameFr] = React.useState("");
  const [zoneNameAr, setZoneNameAr] = React.useState("");
  const [zonePrice, setZonePrice] = React.useState("");
  const [zoneActive, setZoneActive] = React.useState(true);

  React.useEffect(() => {
    if (!id) return;
    getAllDeliveryZones().then((data) => {
      const item = data.find((z) => z.id === id);
      if (item) {
        setZoneName(item.name || "");
        setZoneNameEn(item.name_en || "");
        setZoneNameFr(item.name_fr || "");
        setZoneNameAr(item.name_ar || "");
        setZonePrice(item.price.toString());
        setZoneActive(item.is_active);
      }
    }).catch(() => {});
  }, [id]);

  const isNew = !id;

  const handleSave = async () => {
    try {
      const payload = {
        name: zoneName,
        name_en: zoneNameEn || null,
        name_fr: zoneNameFr || null,
        name_ar: zoneNameAr || null,
        price: parseFloat(zonePrice),
        is_active: zoneActive,
      };
      if (isNew) {
        await createDeliveryZone(payload);
      } else {
        await updateDeliveryZone(id!, payload);
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
          <Text style={styles.title}>{t("admin.settings.deliveryZones.title")}</Text>
          <Text style={styles.subtitle}>
            {isNew ? t("admin.settings.deliveryZones.add") : t("admin.settings.deliveryZones.edit")}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <AdminMoreTrigger />
        </View>
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.formLabel}>{t("admin.settings.deliveryZones.name")}</Text>
        <TextInput placeholder={t("admin.settings.deliveryZones.name")} value={zoneName} onChangeText={setZoneName} style={styles.input} />
        <Text style={styles.formLabel}>{t("admin.settings.deliveryZones.nameEn")}</Text>
        <TextInput placeholder={t("admin.settings.deliveryZones.nameEn")} value={zoneNameEn} onChangeText={setZoneNameEn} style={styles.input} />
        <Text style={styles.formLabel}>{t("admin.settings.deliveryZones.nameFr")}</Text>
        <TextInput placeholder={t("admin.settings.deliveryZones.nameFr")} value={zoneNameFr} onChangeText={setZoneNameFr} style={styles.input} />
        <Text style={styles.formLabel}>{t("admin.settings.deliveryZones.nameAr")}</Text>
        <TextInput placeholder={t("admin.settings.deliveryZones.nameAr")} value={zoneNameAr} onChangeText={setZoneNameAr} style={styles.input} />
        <Text style={styles.formLabel}>{t("admin.settings.deliveryZones.price")}</Text>
        <TextInput placeholder={t("admin.settings.deliveryZones.price")} value={zonePrice} onChangeText={setZonePrice} keyboardType="numeric" style={styles.input} />
        <View style={styles.switchContainer}>
          <Text style={styles.switchLabel}>{t("admin.coupons.active")}</Text>
          <Switch value={zoneActive} onValueChange={setZoneActive} thumbColor={zoneActive ? "#FE8C00" : "#F5F5F5"} trackColor={{ false: "#F5F5F5", true: "#FFF4E5" }} />
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