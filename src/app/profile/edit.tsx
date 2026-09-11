import { router } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomButton from "../../../components/CustomButton";
import CustomInput from "../../../components/CustomInput";
import { updateProfile } from "../../../lib/queries";
import { useAuthStore } from "../../../store/auth.store";

export default function EditProfile() {
  const { t } = useTranslation();
  const profile = useAuthStore((state) => state.profile);
  const user = useAuthStore((state) => state.user);
  const loadProfile = useAuthStore((state) => state.loadProfile);

  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [submitting, setSubmitting] = useState(false);

  const handleSave = async () => {
    if (!user) return;

    if (!fullName.trim()) {
      Alert.alert(t("profile.missingName"));
      return;
    }

    setSubmitting(true);

    try {
      await updateProfile({
        userId: user.id,
        fullName: fullName.trim(),
        phone: phone.trim(),
      });

      await loadProfile(user.id);

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

        <Text className="h1-bold text-dark-100">{t("profile.editTitle")}</Text>
      </View>

      <ScrollView contentContainerClassName="px-5 pt-4 gap-y-5 pb-10">
        <CustomInput
          label={t("profile.fullName")}
          value={fullName}
          onChangeText={setFullName}
        />

        <CustomInput
          label={t("profile.phone")}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          editable={false}
        />

        <CustomInput
          label={t("profile.email")}
          value={profile?.email ?? ""}
          editable={false}
        />

        <CustomButton
          title={t("profile.saveChanges")}
          isLoading={submitting}
          onPress={handleSave}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
