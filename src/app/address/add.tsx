import { router } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomButton from "../../../components/CustomButton";
import CustomInput from "../../../components/CustomInput";
import { addAddress } from "../../../lib/queries";
import { useAuthStore } from "../../../store/auth.store";

export default function AddAddress() {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);

  const [label, setLabel] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [area, setArea] = useState("");
  const [street, setStreet] = useState("");
  const [buildingNumber, setBuildingNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSave = async () => {
    if (!user) return;

    if (!fullName.trim() || !phone.trim() || !area.trim() || !street.trim()) {
      Alert.alert(t("addresses.missingInfo"));
      return;
    }

    setSubmitting(true);

    try {
      const addressLine = [area.trim(), street.trim(), buildingNumber.trim()]
        .filter(Boolean)
        .join(", ");

      await addAddress({
        userId: user.id,
        label: label.trim() || t("addresses.defaultLabel"),
        fullName: fullName.trim(),
        phone: phone.trim(),
        addressLine,
        street: street.trim(),
        buildingNumber: buildingNumber.trim() || null,
        area: area.trim(),
        notes: notes.trim() || null,
        latitude: 0,
        longitude: 0,
      });

      router.back();
    } catch (error: any) {
      Alert.alert(t("common.somethingWentWrong"), error?.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center px-5 py-3 gap-x-4">
        <Pressable onPress={() => router.back()}>
          <ChevronLeft size={24} color="#1a1a1a" />
        </Pressable>

        <Text className="h1-bold text-dark-100">{t("addresses.addTitle")}</Text>
      </View>

      <ScrollView contentContainerClassName="px-5 gap-y-5 pb-10">
        <CustomInput
          label={t("addresses.label")}
          placeholder={t("addresses.labelPlaceholder")}
          value={label}
          onChangeText={setLabel}
        />

        <CustomInput
          label={t("addresses.fullName")}
          value={fullName}
          onChangeText={setFullName}
        />

        <CustomInput
          label={t("addresses.phone")}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />

        <CustomInput
          label={t("addresses.area")}
          value={area}
          onChangeText={setArea}
        />

        <CustomInput
          label={t("addresses.street")}
          value={street}
          onChangeText={setStreet}
        />

        <CustomInput
          label={t("addresses.buildingNumber")}
          value={buildingNumber}
          onChangeText={setBuildingNumber}
        />

        <CustomInput
          label={t("addresses.notes")}
          value={notes}
          onChangeText={setNotes}
        />

        <CustomButton
          title={t("addresses.save")}
          isLoading={submitting}
          onPress={handleSave}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
