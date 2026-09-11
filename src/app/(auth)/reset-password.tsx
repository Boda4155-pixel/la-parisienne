import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";

import AlertModal from "../../../components/AlertModal";
import CustomButton from "../../../components/CustomButton";
import CustomInput from "../../../components/CustomInput";
import { useAuthStore } from "../../../store/auth.store";

const ResetPassword = () => {
  const { t } = useTranslation();
  const updatePassword = useAuthStore((state) => state.updatePassword);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modal, setModal] = useState<{
    visible: boolean;
    type: "success" | "error";
    message: string;
  }>({ visible: false, type: "success", message: "" });

  const submit = async () => {
    if (password.length < 6) {
      setModal({
        visible: true,
        type: "error",
        message: t("auth.passwordTooShort"),
      });
      return;
    }

    if (password !== confirmPassword) {
      setModal({
        visible: true,
        type: "error",
        message: t("auth.passwordsDontMatch"),
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await updatePassword(password);

      setModal({
        visible: true,
        type: "success",
        message: t("auth.passwordUpdated"),
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
          {t("auth.resetPasswordTitle")}
        </Text>
        <Text className="paragraph-regular text-gray-100">
          {t("auth.resetPasswordSubtitle")}
        </Text>
      </View>

      <CustomInput
        placeholder={t("auth.newPasswordPlaceholder")}
        value={password}
        onChangeText={setPassword}
        label={t("auth.newPassword")}
        secureTextEntry
      />

      <CustomInput
        placeholder={t("auth.confirmPasswordPlaceholder")}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        label={t("auth.confirmPassword")}
        secureTextEntry
      />

      <CustomButton
        title={t("auth.updatePassword")}
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
            router.replace("/sign-in");
          }
        }}
      />
    </View>
  );
};

export default ResetPassword;
