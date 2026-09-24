import React from "react";
import { Alert, Pressable, SafeAreaView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { useTranslation } from "react-i18next";

import { DAY_NAMES } from "../../lib/settingsConstants";
import { createStoreHour, getAllStoreHours, updateStoreHour } from "../../../lib/adminQueries";
import { useAdminStore } from "../../../store/admin.store";
import AdminMoreTrigger from "./AdminMoreTrigger";

interface Props {
  id?: string | null;
}

export default function StoreHourForm({ id }: Props) {
  const { t } = useTranslation();
  const [day, setDay] = React.useState<number>(0);
  const [openTime, setOpenTime] = React.useState("09:00");
  const [closeTime, setCloseTime] = React.useState("18:00");
  const [isOpen, setIsOpen] = React.useState(true);

  React.useEffect(() => {
    if (id) {
      getAllStoreHours().then((data) => {
        const item = data.find((h) => h.id === id);
        if (item) {
          setDay(item.day_of_week);
          setOpenTime(item.open_time);
          setCloseTime(item.close_time);
          setIsOpen(item.is_open);
        }
      }).catch(() => {});
    }
  }, [id]);

  const isNew = !id;

  const handleSave = async () => {
    try {
      if (isNew) {
        await createStoreHour({ day_of_week: day, open_time: openTime, close_time: closeTime, is_open: isOpen });
      } else {
        await updateStoreHour(id!, { day_of_week: day, open_time: openTime, close_time: closeTime, is_open: isOpen });
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
          <Text style={styles.title}>{t("admin.settings.storeHours.title")}</Text>
          <Text style={styles.subtitle}>
            {isNew ? t("admin.settings.storeHours.add") : t("admin.settings.storeHours.edit")}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <AdminMoreTrigger />
        </View>
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.formLabel}>{t("admin.settings.storeHours.day")}</Text>
        <View style={styles.pickerContainer}>
          {DAY_NAMES.map((dayKey: string, index: number) => (
            <Pressable
              key={dayKey}
              style={[styles.dayButton, day === index ? styles.dayButtonActive : null]}
              onPress={() => setDay(index)}
            >
              <Text style={styles.dayButtonText}>{t(dayKey)}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.formLabel}>{t("admin.settings.storeHours.openTime")}</Text>
        <TextInput placeholder={t("admin.settings.storeHours.openTime")} value={openTime} onChangeText={setOpenTime} style={styles.input} />
        <Text style={styles.formLabel}>{t("admin.settings.storeHours.closeTime")}</Text>
        <TextInput placeholder={t("admin.settings.storeHours.closeTime")} value={closeTime} onChangeText={setCloseTime} style={styles.input} />
        <View style={styles.switchContainer}>
          <Text style={styles.switchLabel}>{t("admin.settings.storeHours.isOpen")}</Text>
          <Switch value={isOpen} onValueChange={setIsOpen} thumbColor={isOpen ? "#FE8C00" : "#F5F5F5"} trackColor={{ false: "#F5F5F5", true: "#FFF4E5" }} />
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
  pickerContainer: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  dayButton: { alignItems: "center", justifyContent: "center", paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 8 },
  dayButtonActive: { backgroundColor: "#FE8C00" },
  dayButtonText: { color: "#FFFFFF", fontSize: 12, fontFamily: "Quicksand-Medium" },
  switchContainer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12 },
  switchLabel: { fontSize: 14, fontFamily: "Quicksand-Medium", color: "#878787" },
  saveButton: { backgroundColor: "#FE8C00", borderRadius: 8, padding: 12, marginTop: 20, alignItems: "center", justifyContent: "center" },
  saveButtonText: { color: "#FFFFFF", fontSize: 14, fontFamily: "Quicksand-Bold" },
});
