import { useTranslation } from "react-i18next";
import { I18nManager } from "react-native";
import { useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";
import { createSupportTicket } from "../../lib/queries";

export default function HelpScreen() {
  const { t } = useTranslation();
  const isRTL = I18nManager.isRTL;
  const [subject, setSubject] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const send = async () => {
    if (!subject || !msg) return Alert.alert(t("common.error"), t("help.fillRequired"));
    setLoading(true);
    try {
      await createSupportTicket(subject, msg);
      Alert.alert(t("common.done"), t("help.messageSent"));
      setSubject("");
      setMsg("");
    } catch (e: any) {
      Alert.alert(t("common.error"), e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-[#FDFBF7] p-5">
      <Text className="font-bold text-[18px]" style={{ textAlign: isRTL ? "right" : "left" }}>
        {t("profile.help")}
      </Text>
      <Text className="text-[13px] text-gray-500 mt-3" style={{ textAlign: isRTL ? "right" : "left" }}>
        {t("help.subtitle")}
      </Text>
      <TextInput
        placeholder={t("help.subjectPlaceholder")}
        value={subject}
        onChangeText={setSubject}
        className="bg-white border border-[#E8E8E8] rounded-xl px-4 h-[48px] mt-6 mb-3"
        style={{ textAlign: isRTL ? "right" : "left" }}
      />
      <TextInput
        placeholder={t("help.messagePlaceholder")}
        value={msg}
        onChangeText={setMsg}
        multiline
        className="bg-white border border-[#E8E8E8] rounded-xl px-4 py-3 h-[120px] mb-4"
        style={{ textAlign: isRTL ? "right" : "left" }}
      />
      <Pressable
        onPress={send}
        className="bg-[#1A1A1A] h-[48px] rounded-xl items-center justify-center"
      >
        <Text className="text-white font-bold text-base">
          {loading ? t("common.loading") : t("help.sendMessage")}
        </Text>
      </Pressable>
    </View>
  );
}