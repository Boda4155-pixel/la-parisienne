import { router } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { I18nManager } from "react-native";
import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CustomButton from "../../../components/CustomButton";
import CustomInput from "../../../components/CustomInput";
import { updateProfile } from "../../../lib/queries";
import { useAuthStore } from "../../../store/auth.store";

export default function EditProfile() {
  const { t } = useTranslation();
  const isRTL = I18nManager.isRTL;
  const profile = useAuthStore((state) => state.profile);
  const user = useAuthStore((state) => state.user);
  const loadProfile = useAuthStore((state) => state.loadProfile);

  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [submitting, setSubmitting] = useState(false);

  const handleSave = async () => {
    if (!fullName.trim()) {
      Alert.alert(t("common.error"), t("profile.missingName"));
      return;
    }
    setSubmitting(true);
    try {
      const res = await updateProfile({ full_name: fullName.trim() });
      if (res.error) throw res.error;

      // Refresh the store
      if (loadProfile && user?.id) {
        await loadProfile(user.id);
      }

      Alert.alert(t("common.done"), t("profile.profileUpdated"));
      router.back();
    } catch (e: any) {
      Alert.alert(t("common.error"), e.message || t("profile.updateFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#FDFBF7]">
      <View className="flex-row items-center px-5 py-3">
        <Pressable onPress={() => router.back()} className="size-9 bg-white rounded-full items-center justify-center border border-[#F2EFE9]">
          <ChevronLeft size={20} color={isRTL ? "#8B6F47" : "#1a1a1a"} style={{ transform: [{ rotate: isRTL ? "180deg" : "0deg" }] }} />
        </Pressable>
        <Text className="ml-4 text-[16px] font-bold" style={{ textAlign: isRTL ? "right" : "left" }}>
          {t("profile.editProfile")}
        </Text>
      </View>

      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        <View className="mt-6">
          <CustomInput
            label={t("profile.fullName")}
            value={fullName}
            onChangeText={setFullName}
            placeholder={t("profile.fullNamePlaceholder")}
          />
        </View>

        <View className="mt-4">
          <CustomInput
            label={t("profile.phone")}
            value={phone}
            onChangeText={setPhone}
            placeholder={t("profile.phone")}
            editable={false}
          />
          <Text className="text-[11px] text-gray-400 mt-1" style={{ textAlign: isRTL ? "right" : "left" }}>
            {t("profile.phoneCannotChange")}
          </Text>
        </View>

        <View className="mt-4">
          <CustomInput
            label={t("profile.email")}
            value={user?.email || ""}
            editable={false}
          />
        </View>

        <View className="mt-8">
          <CustomButton
            title={submitting ? t("common.saving") : t("profile.saveChanges")}
            onPress={handleSave}
            isLoading={submitting}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}