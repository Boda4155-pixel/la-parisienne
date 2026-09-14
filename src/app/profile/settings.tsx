import { router } from "expo-router";
import {
  ChevronLeft,
  Globe,
  Lock,
  Moon,
  Shield,
  Trash2,
  User,
} from "lucide-react-native";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import ActionSheet, {
  ActionSheetOption,
} from "../../../components/ActionSheet";
import { changeAppLanguage } from "../../../i18next/i18next";
import { useAuthStore } from "../../../store/auth.store";

const LANGUAGE_LABELS: Record<string, string> = {
  en: "English",
  ar: "العربية",
  fr: "Français",
};

export default function Settings() {
  const { t, i18n } = useTranslation();
  const signOut = useAuthStore((state) => state.signOut);

  const [languageSheetVisible, setLanguageSheetVisible] = useState(false);

  const [actionSheet, setActionSheet] = useState<{
    visible: boolean;
    title?: string;
    message?: string;
    options: ActionSheetOption[];
    showCancel?: boolean;
  }>({
    visible: false,
    options: [],
  });

  const showComingSoon = () => {
    setActionSheet({
      visible: true,
      title: t("profile.comingSoonTitle"),
      message: t("profile.comingSoonMessage"),
      options: [],
      showCancel: true,
    });
  };

  const languageOptions: ActionSheetOption[] = (
    ["en", "ar", "fr"] as const
  ).map((lang) => ({
    label: LANGUAGE_LABELS[lang],
    selected: lang === i18n.language,
    onPress: () => {
      if (lang !== i18n.language) {
        changeAppLanguage(lang);
      }
    },
  }));

  const handleDeleteAccount = () => {
    setActionSheet({
      visible: true,
      title: t("profile.deleteAccountTitle"),
      message: t("profile.deleteAccountConfirm"),
      options: [
        {
          label: t("common.delete"),
          destructive: true,
          onPress: () => {
            // TODO: Edge Function بـ service role
            showComingSoon();
          },
        },
      ],
      showCancel: true,
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center px-5 py-3 gap-x-4">
        <Pressable onPress={() => router.back()}>
          <ChevronLeft size={24} color="#1a1a1a" />
        </Pressable>

        <Text className="h1-bold text-dark-100">{t("profile.settings")}</Text>
      </View>

      <ScrollView
        contentContainerClassName="px-5 pb-10"
        showsVerticalScrollIndicator={false}
      >
        {/* Account Section */}
        <SectionHeader title={t("profile.sectionAccount")} />

        <SettingsGroup>
          <SettingsRow
            icon={<User size={18} color="#FE8C00" />}
            label={t("profile.personalInfo")}
            subtitle={t("profile.personalInfoSubtitle")}
            onPress={() => router.push("/profile/edit")}
          />

          <SettingsRow
            icon={<Lock size={18} color="#FE8C00" />}
            label={t("profile.changePassword")}
            subtitle={t("profile.changePasswordSubtitle")}
            onPress={showComingSoon}
            last
          />
        </SettingsGroup>

        {/* App Preferences */}
        <SectionHeader title={t("profile.sectionPreferences")} />

        <SettingsGroup>
          <SettingsRow
            icon={<Globe size={18} color="#FE8C00" />}
            label={t("profile.language")}
            value={LANGUAGE_LABELS[i18n.language]}
            onPress={() => setLanguageSheetVisible(true)}
          />

          <SettingsRow
            icon={<Moon size={18} color="#FE8C00" />}
            label={t("profile.theme")}
            value={t("profile.themeLight")}
            onPress={showComingSoon}
            last
          />
        </SettingsGroup>

        {/* Privacy & Security */}
        <SectionHeader title={t("profile.sectionPrivacy")} />

        <SettingsGroup>
          <SettingsRow
            icon={<Shield size={18} color="#FE8C00" />}
            label={t("profile.privacyPolicy")}
            onPress={showComingSoon}
          />

          <SettingsRow
            icon={<Shield size={18} color="#FE8C00" />}
            label={t("profile.termsConditions")}
            onPress={showComingSoon}
            last
          />
        </SettingsGroup>

        {/* Delete Account */}
        <Pressable
          onPress={handleDeleteAccount}
          className="flex-row items-center gap-x-3 border border-red-200 rounded-2xl p-4 mt-6"
        >
          <Trash2 size={18} color="#EF4444" />

          <View className="flex-1">
            <Text className="paragraph-bold text-red-500">
              {t("profile.deleteAccount")}
            </Text>

            <Text className="small-regular text-gray-100">
              {t("profile.deleteAccountSubtitle")}
            </Text>
          </View>
        </Pressable>
      </ScrollView>

      {/* Language Action Sheet */}
      <ActionSheet
        visible={languageSheetVisible}
        onClose={() => setLanguageSheetVisible(false)}
        title={t("profile.language")}
        options={languageOptions}
      />

      {/* General Action Sheet */}
      <ActionSheet
        visible={actionSheet.visible}
        onClose={() =>
          setActionSheet((prev) => ({
            ...prev,
            visible: false,
          }))
        }
        title={actionSheet.title}
        message={actionSheet.message}
        options={actionSheet.options}
        showCancel={actionSheet.showCancel}
      />
    </SafeAreaView>
  );
}

// =========================================
// Helper Components
// =========================================

function SectionHeader({ title }: { title: string }) {
  return (
    <Text className="small-bold text-primary mt-6 mb-2 uppercase">{title}</Text>
  );
}

function SettingsGroup({ children }: { children: React.ReactNode }) {
  return (
    <View className="bg-gray-50 rounded-2xl overflow-hidden">{children}</View>
  );
}

function SettingsRow({
  icon,
  label,
  subtitle,
  value,
  onPress,
  last = false,
}: {
  icon: React.ReactNode;
  label: string;
  subtitle?: string;
  value?: string;
  onPress: () => void;
  last?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={
        last
          ? "flex-row items-center justify-between p-4"
          : "flex-row items-center justify-between p-4 border-b border-gray-100"
      }
    >
      <View className="flex-row items-center gap-x-3 flex-1">
        {icon}

        <View className="flex-1">
          <Text className="paragraph-bold text-dark-100">{label}</Text>

          {subtitle && (
            <Text className="small-regular text-gray-100 mt-0.5">
              {subtitle}
            </Text>
          )}
        </View>
      </View>

      {value && (
        <Text className="paragraph-regular text-gray-100 mr-2">{value}</Text>
      )}

      <ChevronLeft
        size={18}
        color="#9CA3AF"
        style={{ transform: [{ rotate: "180deg" }] }}
      />
    </Pressable>
  );
}
