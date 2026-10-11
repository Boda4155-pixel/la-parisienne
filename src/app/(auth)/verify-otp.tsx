import { router, useLocalSearchParams } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { I18nManager } from "react-native";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../../lib/supabase";

export default function VerifyOtp() {
  const { t } = useTranslation();
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const [code, setCode] = useState("");
  const inputRefs = useRef<(TextInput | null)[]>([null, null, null, null, null, null]);
  const isRTL = I18nManager.isRTL;

  const digits: string[] = [...code.split(""), ...Array(Math.max(6 - code.length, 0)).fill("")];

  const handleCodeChange = (text: string, index: number) => {
    const newCode = code.substring(0, index) + text + code.substring(index + 1);
    const trimmed = newCode.substring(0, 6);
    setCode(trimmed);

    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    } else if (!text && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleKeyPress = ({ nativeEvent }: any, index: number) => {
    if (nativeEvent.key === "Back" && index === 0) {
      router.back();
    }
    if (
      nativeEvent.key === "Back" &&
      index > 0 &&
      !code[index]
    ) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const verifyOtp = async () => {
    if (code.length !== 6) {
      Alert.alert(t("common.error"), t("auth.fillAllFields"));
      return;
    }
    try {
      const { error } = await supabase.auth.verifyOtp({
        phone: phone ?? "",
        token: code,
        type: "sms",
      });
      if (error) throw error;
      router.replace("/(customer)/home" as any);
    } catch (e: any) {
      Alert.alert(t("common.error"), e.message);
    }
  };

  const handleResend = async () => {
    if (!phone) return;
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: phone,
      });
      if (error) throw error;
      Alert.alert(t("otp.resendSuccess"), t("otp.resendSuccess"));
    } catch (e: any) {
      Alert.alert(t("common.error"), e.message);
    }
  };

  return (
    <View className="flex-1 bg-[#FFFBF5]">
      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <View className="px-5 pt-2">
              <Pressable onPress={() => router.back()} className={`self-${isRTL ? 'end' : 'start'} py-2`}>
                <ChevronLeft size={28} color="#8B6F47" style={{ transform: [{ rotate: isRTL ? '180deg' : '0deg' }] }} />
              </Pressable>
              <Text className="text-black text-[26px] font-bold text-center mt-6" style={{ textAlign: isRTL ? "right" : "center" }}>
                {t("otp.title")}
              </Text>
              <Text className="text-black/50 text-[13px] mt-2 text-center" style={{ textAlign: isRTL ? "right" : "center" }}>
                {phone ? `${t("otp.subtitle")} ${phone}` : t("otp.subtitle")}
              </Text>
            </View>

            {/* OTP Inputs */}
            <View className="flex-row justify-center gap-x-2 mt-10">
              {digits.map((digit, index) => (
                <View
                  key={index}
                  className="w-[50px] h-[60px] rounded-[12px] border border-[#D4B57A]/30 bg-white items-center justify-center"
                >
                  <TextInput
                    ref={(ref: TextInput | null) => { inputRefs.current[index] = ref; }}
                    value={digit}
                    onChangeText={(text) => handleCodeChange(text, index)}
                    onKeyPress={(e) => handleKeyPress(e, index)}
                    className="text-black text-[28px] font-bold text-center w-full h-full"
                    keyboardType="number-pad"
                    maxLength={1}
                    selectTextOnFocus={false}
                    autoFocus={index === 0}
                    textAlign="center"
                  />
                </View>
              ))}
            </View>

            {/* Verify button */}
            <Pressable
              onPress={verifyOtp}
              className="h-[56px] rounded-[20px] bg-[#1A1A1A] items-center justify-center mx-7 mt-10 active:bg-black"
            >
              <Text className="text-white font-bold text-[16px]">
                {t("otp.verifyButton")}
              </Text>
            </Pressable>

            {/* Resend */}
            <View className="flex-row justify-center items-center mt-6">
              <Text className="text-black/50 text-[13px]">
                {t("otp.resendPrompt")}
              </Text>
              <Pressable onPress={handleResend}>
                <Text className="text-[#8B6F47] text-[13px] font-bold ml-2">
                  {t("otp.resendLink")}
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
