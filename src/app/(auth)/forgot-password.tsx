import { router } from "expo-router";
import { ChevronLeft, Mail } from "lucide-react-native";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { I18nManager } from "react-native";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../../lib/supabase";

export default function ForgotPassword() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [focus, setFocus] = useState(false);
  const [loading, setLoading] = useState(false);
  const isRTL = I18nManager.isRTL;

  const y = useSharedValue(0);

  useEffect(() => {
    y.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const anim = useAnimatedStyle(() => ({
    transform: [{ translateY: y.value }],
  }));

  const handleReset = async () => {
    if (!email) {
      Alert.alert(t("common.error"), t("auth.emailRequired"));
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: "laparisienne://(auth)/reset-password",
      });
      if (error) throw error;
      Alert.alert(t("auth.resetSuccess"), t("auth.resetEmailSent"));
      router.replace("/(auth)/login" as any);
    } catch (e: any) {
      Alert.alert(t("common.error"), e.message);
    } finally {
      setLoading(false);
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
            contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
            keyboardShouldPersistTaps="handled"
            className="px-7"
          >
            {/* Header */}
            <View className="items-center mt-2">
              <View className="w-[280px] h-[280px] rounded-full bg-[#FFF3E0] absolute top-4" />
              <Animated.View style={anim} className="mt-6">
                <Image
                  source={require("../../../assets/images/croissant-real.png")}
                  style={{ width: 200, height: 140 }}
                  resizeMode="contain"
                />
              </Animated.View>

              <View className="w-[90px] h-[14px] bg-black/10 rounded-full mt-[-10px]" />

              <View className="w-[68px] h-[68px] rounded-full border border-[#D4B57A] bg-white items-center justify-center mt-6">
                <Text className="text-[#8B6F47] text-[26px] font-bold tracking-widest">
                  LP
                </Text>
              </View>
              <Text className="text-[#8B6F47] text-[24px] mt-3 tracking-[2px] font-light">
                {t("common.brandName")}
              </Text>
              <Text className="text-[#8B6F47]/50 text-[10px] tracking-[3px] mt-1">
                {t("auth.brandTagline")}
              </Text>
            </View>

            <View className="mt-8">
              <Text className="text-black text-[26px] font-bold text-center">
                {t("auth.forgotPasswordTitle")}
              </Text>
              <Text className="text-black/50 text-[13px] mt-2 text-center">
                {t("auth.forgotPasswordSubtitle")}
              </Text>
            </View>

            <View className="mt-8 gap-y-4 pb-10">
              {/* Email */}
              <View
                className={`h-[60px] rounded-[20px] border flex-row items-center px-5 bg-white ${
                  focus ? "border-[#D4B57A]" : "border-black/5"
                }`}
              >
                <Mail
                  size={18}
                  color={focus ? "#D4B57A" : "#AAA"}
                />
                <View className={`flex-1 ${isRTL ? "mr-4" : "ml-4"}`}>
                  <Text className="text-[#8B6F47] text-[10px] font-medium">
                    {t("auth.email")}
                  </Text>
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    onFocus={() => setFocus(true)}
                    onBlur={() => setFocus(false)}
                    placeholder={t("auth.emailPlaceholder")}
                    placeholderTextColor="#BBB"
                    className="text-black text-[14px] p-0 -mt-1"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    textAlign={isRTL ? "right" : "left"}
                  />
                </View>
              </View>

              {/* Reset button */}
              <Pressable
                onPress={handleReset}
                disabled={loading}
                className="h-[56px] rounded-[20px] bg-[#D4B57A] items-center justify-center mt-2 active:bg-[#b99b5d]"
              >
                <Text className="text-[#1A1A1A] font-bold text-[16px]">
                  {loading ? t("auth.sending") : t("auth.sendResetLink")}
                </Text>
              </Pressable>

              {/* Back to sign in */}
              <View className="flex-row justify-center pt-4">
                <Text className="text-black/40 text-[13px]">
                  {t("auth.rememberPassword")}
                </Text>
                <Pressable
                  onPress={() => router.push("/(auth)/login" as any)}
                >
                  <Text className="text-[#8B6F47] text-[13px] font-bold">
                    {" "} {t("auth.signIn")}
                  </Text>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
