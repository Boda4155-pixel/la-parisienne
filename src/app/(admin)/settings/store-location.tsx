import React from "react";
import { Alert, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from "react-native";
import { MapPin } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { useSupabaseQuery } from "../../../../hooks/useSupabaseQuery";
import { getStoreLocation, updateStoreLocation } from "../../../../lib/adminQueries";
import { useAdminStore } from "../../../../store/admin.store";
import AdminMoreTrigger from "../../../../components/admin/AdminMoreTrigger";

export default function StoreLocationSettings() {
  const { t } = useTranslation();
  const { data, refetch } = useSupabaseQuery({
    fn: getStoreLocation,
    skip: false,
  });

  const [address, setAddress] = React.useState(data?.address ?? "");
  const [latitude, setLatitude] = React.useState(data?.latitude?.toString() ?? "");
  const [longitude, setLongitude] = React.useState(data?.longitude?.toString() ?? "");

  React.useEffect(() => {
    if (data) {
      setAddress(data.address);
      setLatitude(data.latitude?.toString() ?? "");
      setLongitude(data.longitude?.toString() ?? "");
    }
  }, [data]);

  const handleSave = async () => {
    try {
      await updateStoreLocation({
        address,
        latitude: parseFloat(latitude) || 0,
        longitude: parseFloat(longitude) || 0,
      });
      useAdminStore.getState().refresh();
      refetch();
      Alert.alert(t("common.saved"));
    } catch (error: any) {
      Alert.alert(t("common.somethingWentWrong"), error?.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{t("admin.settings.storeLocation.title")}</Text>
          <Text style={styles.subtitle}>{t("admin.settings.storeLocation.subtitle")}</Text>
        </View>
        <View style={styles.headerActions}>
          <AdminMoreTrigger />
        </View>
      </View>

      <View style={styles.formContainer}>
        <View style={styles.formIcon}>
          <MapPin size={22} color="#FE8C00" />
        </View>
        <Text style={styles.formLabel}>{t("admin.settings.storeLocation.address")}</Text>
        <TextInput
          placeholder={t("admin.settings.storeLocation.address")}
          value={address}
          onChangeText={setAddress}
          style={styles.input}
        />
        <Text style={styles.formLabel}>{t("admin.settings.storeLocation.latitude")}</Text>
        <TextInput
          placeholder={t("admin.settings.storeLocation.latitude")}
          value={latitude}
          onChangeText={setLatitude}
          keyboardType="numeric"
          style={styles.input}
        />
        <Text style={styles.formLabel}>{t("admin.settings.storeLocation.longitude")}</Text>
        <TextInput
          placeholder={t("admin.settings.storeLocation.longitude")}
          value={longitude}
          onChangeText={setLongitude}
          keyboardType="numeric"
          style={styles.input}
        />
        <Pressable style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>{t("common.save")}</Text>
        </Pressable>
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
  formIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#FE8C0022",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontFamily: "Quicksand-Medium",
    color: "#878787",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 14,
    fontFamily: "Quicksand-Regular",
  },
  saveButton: {
    backgroundColor: "#FE8C00",
    borderRadius: 8,
    padding: 12,
    marginTop: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "Quicksand-Bold",
  },
});