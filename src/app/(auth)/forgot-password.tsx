import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

import AlertModal from "../../../components/AlertModal";
import CustomButton from "../../../components/CustomButton";
import CustomInput from "../../../components/CustomInput";
import { useAuthStore } from "../../../store/auth.store";

const ForgotPassword = () => {
  const { t } = useTranslation();
  const requestPasswordReset = useAuthStore(
    (state) => state.requestPasswordReset,
  );

  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modal, setModal] = useState<{
    visible: boolean;
    type: "success" | "error";
    message: string;
  }>({ visible: false, type: "success", message: "" });

  const submit = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email || !emailRegex.test(email)) {
      setModal({
        visible: true,
        type: "error",
        message: t("auth.invalidEmail"),
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await requestPasswordReset(email);

      setModal({
        visible: true,
        type: "success",
        message: t("auth.resetEmailSent"),
      });
    } catch (error: any) {
      setModal({
        visible: true,
        type: "error",
        message: error?.message || t("auth.somethingWentWrong"),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View className="gap-8 bg-white rounded-3xl p-6 mt-5">
      <View className="gap-1">
        <Text className="h1-bold text-dark-100">
          {t("auth.forgotPasswordTitle")}
        </Text>
        <Text className="paragraph-regular text-gray-100">
          {t("auth.forgotPasswordSubtitle")}
        </Text>
      </View>

      <CustomInput
        placeholder={t("auth.emailPlaceholder")}
        value={email}
        onChangeText={setEmail}
        label={t("auth.email")}
        keyboardType="email-address"
      />

      <CustomButton
        title={t("auth.sendResetLink")}
        isLoading={isSubmitting}
        onPress={submit}
      />

      <AlertModal
        visible={modal.visible}
        type={modal.type}
        message={modal.message}
        onClose={() => {
          setModal((prev) => ({ ...prev, visible: false }));
          if (modal.type === "success") {
            router.back();
          }
        }}
      />
    </View>
  );
};

export default ForgotPassword;
