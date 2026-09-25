import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { LogOut, UserRound, Bell, Settings, Shield } from "lucide-react-native";
import { useAuthStore } from "../../../store/auth.store";

const LANGUAGES = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "ar", name: "Arabic", nativeName: "العربية" },
  { code: "fr", name: "French", nativeName: "Français" },
];

export default function CashierAccount() {
  const { t, i18n: translationI18n } = useTranslation();
  const isRTL = translationI18n.language === "ar";
  const { profile, signOut } = useAuthStore();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const handleSignOut = async () => {
    try {
      await signOut();
      Alert.alert(t("common.success", "Success"), t("cashier.settings.signedOut", "Signed out successfully"));
    } catch (error: any) {
      Alert.alert(t("common.error", "Error"), error.message ?? t("cashier.settings.failedToSignOut", "Failed to sign out"));
    }
  };

  const handleLanguageChange = (languageCode: string) => {
    translationI18n.changeLanguage(languageCode);
  };

  const handleNotificationsToggle = () => {
    setNotificationsEnabled(!notificationsEnabled);
    // In a real app, you'd save this to preferences/device settings
  };

  return (
    <SafeAreaView className="flex-1 bg-[#FDF8F3]">
      <View className="px-5 py-3">
        <Text className="h1-bold text-dark-100">{t("cashier.settings.title", "Settings")}</Text>
      </View>

      <ScrollView className="flex-1 px-5 pb-24">
        {/* Profile Section */}
        <View className="rounded-3xl bg-white p-5 shadow-md shadow-dark-100/10 mb-5">
          <View className="size-20 rounded-full bg-primary/10 items-center justify-center mb-4">
            <UserRound size={40} color="#FE8C00" />
          </View>

          <View className="gap-y-3">
            <View className="flex-row items-center justify-between border-b border-gray-100 pb-3">
              <Text className="paragraph-regular text-gray-500">{t("cashier.settings.name", "Name")}</Text>
              <Text className="paragraph-bold text-dark-100">
                {profile?.full_name ?? "—"}
              </Text>
            </View>
            <View className="flex-row items-center justify-between border-b border-gray-100 pb-3">
              <Text className="paragraph-regular text-gray-500">{t("cashier.settings.email", "Email")}</Text>
              <Text className="paragraph-bold text-dark-100">
                {profile?.email ?? "—"}
              </Text>
            </View>
            <View className="flex-row items-center justify-between border-b border-gray-100 pb-3">
              <Text className="paragraph-regular text-gray-500">{t("cashier.settings.phone", "Phone")}</Text>
              <Text className="paragraph-bold text-dark-100">
                {profile?.phone ?? "—"}
              </Text>
            </View>
            <View className="flex-row items-center justify-between">
              <Text className="paragraph-regular text-gray-500">{t("cashier.settings.role", "Role")}</Text>
              <View
                className="rounded-full px-3 py-1"
                style={{ backgroundColor: "#D4A574" }}
              >
                <Text className="small-bold text-white">{t("cashier.settings.cashier", "Cashier")}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Language Section */}
        <View className="rounded-3xl bg-white p-5 shadow-md shadow-dark-100/10 mb-5">
          <View className="flex-row items-center gap-x-2 mb-4">
            <Settings size={20} color="#C9A86A" />
            <Text className="h5-bold text-dark-100">{t("cashier.settings.language", "Language")}</Text>
          </View>

          {LANGUAGES.map((lang) => (
            <Pressable
              key={lang.code}
              onPress={() => handleLanguageChange(lang.code)}
              className="flex-row items-center justify-between py-3"
              style={{
                borderBottomWidth: lang.code !== LANGUAGES[LANGUAGES.length - 1].code ? 1 : 0,
                borderBottomColor: "#f3f4f6",
              }}
            >
              <View className="flex-row items-center gap-x-3" style={{ flexDirection: isRTL ? "row-reverse" : "row" }}>
                <Text className="paragraph-bold text-dark-100">{lang.nativeName}</Text>
                {translationI18n.language === lang.code && (
                  <View className="size-5 rounded-full border-2 border-primary" />
                )}
              </View>
              {translationI18n.language === lang.code && (
                <Text className="small-bold text-primary">✓</Text>
              )}
            </Pressable>
          ))}
        </View>

        {/* Notifications Section */}
        <View className="rounded-3xl bg-white p-5 shadow-md shadow-dark-100/10 mb-5">
          <View className="flex-row items-center gap-x-2 mb-4">
            <Bell size={20} color="#C9A86A" />
            <Text className="h5-bold text-dark-100">
              {typeof t("cashier.settings.notifications", "Notifications") === "string"
                ? t("cashier.settings.notifications", "Notifications")
                : "Notifications"}
            </Text>
          </View>

          <Pressable
            onPress={handleNotificationsToggle}
            className="flex-row items-center justify-between py-3"
          >
            <View className="flex-row items-center gap-x-3" style={{ flexDirection: isRTL ? "row-reverse" : "row" }}>
              <Text className="paragraph-bold text-dark-100">
                {typeof t("cashier.settings.pushNotifications", "Push Notifications") === "string"
                  ? t("cashier.settings.pushNotifications", "Push Notifications")
                  : "Push Notifications"}
              </Text>
            </View>
            <View
              className={`rounded-full size-12 items-center justify-center ${
                notificationsEnabled ? "bg-primary" : "bg-gray-300"
              }`}
              style={{ transform: [{ translateX: notificationsEnabled ? 12 : 0 }] }}
            >
              <View className="size-6 rounded-full bg-white" />
            </View>
          </Pressable>

          <Pressable
            className="flex-row items-center justify-between py-3 mt-2"
          >
            <View className="flex-row items-center gap-x-3" style={{ flexDirection: isRTL ? "row-reverse" : "row" }}>
              <Text className="paragraph-bold text-dark-100">
                {typeof t("cashier.settings.orderAlerts", "Order Alerts") === "string"
                  ? t("cashier.settings.orderAlerts", "Order Alerts")
                  : "Order Alerts"}
              </Text>
            </View>
            <Text className="paragraph-regular text-gray-400">
              {typeof t("cashier.settings.enabled", "Enabled") === "string"
                ? t("cashier.settings.enabled", "Enabled")
                : "Enabled"}
            </Text>
          </Pressable>
        </View>

        {/* Security Section */}
        <View className="rounded-3xl bg-white p-5 shadow-md shadow-dark-100/10 mb-5">
          <View className="flex-row items-center gap-x-2 mb-4">
            <Shield size={20} color="#C9A86A" />
            <Text className="h5-bold text-dark-100">{t("cashier.settings.security", "Security")}</Text>
          </View>

          <Pressable
            className="flex-row items-center justify-between py-3"
          >
            <View className="flex-row items-center gap-x-3" style={{ flexDirection: isRTL ? "row-reverse" : "row" }}>
              <Text className="paragraph-bold text-dark-100">
                {t("cashier.settings.changePin", "Change PIN")}
              </Text>
            </View>
            <Text className="paragraph-regular text-gray-400">{t("cashier.settings.comingSoon", "Coming soon")}</Text>
          </Pressable>

          <Pressable
            className="flex-row items-center justify-between py-3 mt-2"
          >
            <View className="flex-row items-center gap-x-3" style={{ flexDirection: isRTL ? "row-reverse" : "row" }}>
              <Text className="paragraph-bold text-dark-100">
                {t("cashier.settings.biometricAuth", "Biometric Auth")}
              </Text>
            </View>
            <Text className="paragraph-regular text-gray-400">{t("cashier.settings.comingSoon", "Coming soon")}</Text>
          </Pressable>
        </View>

        {/* Sign Out */}
        <Pressable
          onPress={handleSignOut}
          className="bg-[#C0392B] rounded-full py-4 flex-row items-center justify-center gap-x-2"
        >
          <LogOut size={18} color="#ffffff" />
          <Text className="paragraph-bold text-white">{t("cashier.settings.signOut", "Sign Out")}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}