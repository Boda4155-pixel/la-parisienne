import Constants from "expo-constants";
import { router } from "expo-router";
import { Eye, EyeOff, Lock, Mail } from "lucide-react-native";
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

export default function SignUpWhite() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [focus, setFocus] = useState("");
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

  // Auto-redirect if already authenticated
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.replace("/(customer)/home" as any);
      }
    };
    checkSession();
  }, [router]);

  const signUpWithEmail = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert(t("common.error"), t("auth.fillAllFields"));
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert(t("common.error"), t("auth.passwordsDontMatch"));
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });
      if (error) throw error;
      Alert.alert(t("auth.signUpSuccess"), t("auth.signUpSuccessDesc"));
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
            {/* Header with Real Croissant */}
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
                {t("auth.createAccount")}
              </Text>
              <Text className="text-black/50 text-[13px] mt-2 text-center">
                {t("auth.signUpSubtitle")}
              </Text>
            </View>

            <View className="mt-8 gap-y-4 pb-10">
              {/* Email */}
              <View
                className={`h-[60px] rounded-[20px] border flex-row items-center px-5 bg-white ${
                  focus === "email" ? "border-[#D4B57A]" : "border-black/5"
                }`}
              >
                <Mail
                  size={18}
                  color={focus === "email" ? "#D4B57A" : "#AAA"}
                />
                <View className={`flex-1 ${isRTL ? "mr-4" : "ml-4"}`}>
                  <Text className="text-[#8B6F47] text-[10px] font-medium">
                    {t("auth.email")}
                  </Text>
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    onFocus={() => setFocus("email")}
                    onBlur={() => setFocus("")}
                    placeholder={t("auth.emailPlaceholder")}
                    placeholderTextColor="#BBB"
                    className="text-black text-[14px] p-0 -mt-1"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    textAlign={isRTL ? "right" : "left"}
                  />
                </View>
              </View>

              {/* Password */}
              <View
                className={`h-[60px] rounded-[20px] border flex-row items-center px-5 bg-white ${
                  focus === "pass" ? "border-[#D4B57A]" : "border-black/5"
                }`}
              >
                <Lock
                  size={18}
                  color={focus === "pass" ? "#D4B57A" : "#AAA"}
                />
                <View className={`flex-1 ${isRTL ? "mr-4" : "ml-4"}`}>
                  <Text className="text-[#8B6F47] text-[10px] font-medium">
                    {t("auth.password")}
                  </Text>
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    onFocus={() => setFocus("pass")}
                    onBlur={() => setFocus("")}
                    placeholder="••••••••"
                    placeholderTextColor="#BBB"
                    className="text-black text-[14px] p-0 -mt-1"
                    secureTextEntry={!showPassword}
                    textAlign={isRTL ? "right" : "left"}
                  />
                </View>
                <Pressable onPress={() => setShowPassword(!showPassword)} className="p-2">
                  {showPassword ? (
                    <EyeOff size={20} color="#8B6F47" />
                  ) : (
                    <Eye size={20} color="#AAA" />
                  )}
                </Pressable>
              </View>

              {/* Confirm Password */}
              <View
                className={`h-[60px] rounded-[20px] border flex-row items-center px-5 bg-white ${
                  focus === "confirm" ? "border-[#D4B57A]" : "border-black/5"
                }`}
              >
                <Lock
                  size={18}
                  color={focus === "confirm" ? "#D4B57A" : "#AAA"}
                />
                <View className={`flex-1 ${isRTL ? "mr-4" : "ml-4"}`}>
                  <Text className="text-[#8B6F47] text-[10px] font-medium">
                    {t("auth.confirmPassword")}
                  </Text>
                  <TextInput
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    onFocus={() => setFocus("confirm")}
                    onBlur={() => setFocus("")}
                    placeholder="••••••••"
                    placeholderTextColor="#BBB"
                    className="text-black text-[14px] p-0 -mt-1"
                    secureTextEntry={!showPassword}
                    textAlign={isRTL ? "right" : "left"}
                  />
                </View>
                <Pressable onPress={() => setShowPassword(!showPassword)} className="p-2">
                  {showPassword ? (
                    <EyeOff size={20} color="#8B6F47" />
                  ) : (
                    <Eye size={20} color="#AAA" />
                  )}
                </Pressable>
              </View>

              {/* Sign up button */}
              <Pressable
                onPress={signUpWithEmail}
                disabled={loading}
                className="h-[56px] rounded-[20px] bg-[#D4B57A] items-center justify-center mt-2 active:bg-[#b99b5d]"
              >
                <Text className="text-[#1A1A1A] font-bold text-[16px]">
                  {loading ? t("auth.sending") : t("auth.signUpWithEmail")}
                </Text>
              </Pressable>

              {/* Sign in link */}
              <View className="flex-row justify-center pt-4">
                <Text className="text-black/40 text-[13px]">
                  {t("auth.haveAccount")}
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
