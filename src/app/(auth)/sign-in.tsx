import { Link } from "expo-router";
import { useState } from "react";
import { Alert, Text, View } from "react-native";

import { useTranslation } from "react-i18next";
import CustomButton from "../../../components/CustomButton";
import CustomInput from "../../../components/CustomInput";
import { useAuthStore } from "../../../store/auth.store";

const SignIn = () => {
  const signIn = useAuthStore((state) => state.signIn);
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    identifier: "",
    password: "",
  });

  const isEmailInput = form.identifier.includes("@");

  const submit = async () => {
    const { identifier, password } = form;
    if (!identifier || !password) {
      Alert.alert(t("common.error"), t("auth.fillAllFields"));
      return;
    }

    setIsSubmitting(true);

    try {
      await signIn(identifier, password);
    } catch (error: any) {
      Alert.alert(
        t("auth.signInFailed"),
        error?.message || t("common.somethingWentWrong"),
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <View className="gap-10 bg-white rounded-lg p-5 mt-5">
      <CustomInput
        placeholder={t("auth.emailOrPhonePlaceholder")}
        value={form.identifier}
        onChangeText={(text) =>
          setForm((prev) => ({
            ...prev,
            identifier: text,
          }))
        }
        label={t("auth.emailOrPhone")}
        keyboardType={isEmailInput ? "email-address" : "default"}
      />

      <CustomInput
        placeholder={t("auth.passwordPlaceholder")}
        value={form.password}
        onChangeText={(text) =>
          setForm((prev) => ({
            ...prev,
            password: text,
          }))
        }
        label={t("auth.password")}
        secureTextEntry
      />

      <CustomButton
        title={t("auth.signIn")}
        isLoading={isSubmitting}
        onPress={submit}
      />

      <View className="flex justify-center mt-5 flex-row gap-2">
        <Text className="base-regular text-gray-100">
          {t("auth.noAccount")}
        </Text>

        <Link href="/sign-up" className="base-bold text-primary">
          {t("auth.signUp")}
        </Link>
      </View>
    </View>
  );
};

export default SignIn;
