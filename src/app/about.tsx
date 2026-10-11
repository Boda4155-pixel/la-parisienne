import { useTranslation } from "react-i18next";
import { I18nManager } from "react-native";
import { ScrollView, Text } from "react-native";

export default function About() {
  const { t } = useTranslation();
  return (
    <ScrollView className="flex-1 bg-[#FDFBF7] p-6">
      <Text className="text-[28px] font-bold">{t("common.brandName")}</Text>
      <Text className="text-[#8B6F47] tracking-[3px] text-[12px] mt-1">{t("auth.brandTagline")}</Text>
      <Text
        className="text-[14px] leading-[22px] mt-6"
        style={{ textAlign: I18nManager.isRTL ? "right" : "left" }}
      >
        {t("about.content")}
      </Text>
    </ScrollView>
  );
}