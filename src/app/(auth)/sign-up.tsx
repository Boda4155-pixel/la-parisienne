import { Link } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Text, View } from "react-native";
import CustomButton from "../../../components/CustomButton";
import CustomInput from "../../../components/CustomInput";
import { useAuthStore } from "../../../store/auth.store";

const SignUp = () => {
  const signUp = useAuthStore((state) => state.signUp);
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });

  const submit = async () => {
    const { name, email, phone, password } = form;

    if (!name || !email || !password) {
      Alert.alert(t("common.error"), t("auth.fillAllFields"));
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert(t("common.error"), t("auth.invalidEmail"));
      return;
    }

    if (password.length < 6) {
      Alert.alert(t("common.error"), t("auth.passwordTooShort"));
      return;
    }

    setIsSubmitting(true);

    try {
      await signUp(email, password, name, phone || undefined);
    } catch (error: any) {
      Alert.alert(
        t("auth.signUpFailed"),
        error?.message || t("common.somethingWentWrong"),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View className="gap-10 bg-white rounded-lg p-5 mt-5">
      <CustomInput
        placeholder={t("auth.fullNamePlaceholder")}
        value={form.name}
        onChangeText={(text) => setForm((prev) => ({ ...prev, name: text }))}
        label={t("auth.fullName")}
      />
      <CustomInput
        placeholder={t("auth.emailPlaceholder")}
        value={form.email}
        onChangeText={(text) => setForm((prev) => ({ ...prev, email: text }))}
        label={t("auth.email")}
        keyboardType="email-address"
      />
      <CustomInput
        placeholder={t("auth.phonePlaceholder")}
        value={form.phone}
        onChangeText={(text) => setForm((prev) => ({ ...prev, phone: text }))}
        label={t("auth.phone")}
        keyboardType="phone-pad"
      />
      <CustomInput
        placeholder={t("auth.passwordPlaceholder")}
        value={form.password}
        onChangeText={(text) =>
          setForm((prev) => ({ ...prev, password: text }))
        }
        label={t("auth.password")}
        secureTextEntry={true}
      />

      <CustomButton
        title={t("auth.signUp")}
        isLoading={isSubmitting}
        onPress={submit}
      />

      <View className="flex justify-center mt-5 flex-row gap-2">
        <Text className="base-regular text-gray-100">
          {t("auth.haveAccount")}
        </Text>
        <Link href="/sign-in" className="base-bold text-primary">
          {t("auth.signIn")}
        </Link>
      </View>
    </View>
  );
};

export default SignUp;
