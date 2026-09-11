import { CheckCircle, XCircle } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { Modal, Pressable, Text, View } from "react-native";

type AlertModalProps = {
  visible: boolean;
  type: "success" | "error";
  message: string;
  onClose: () => void;
};

const AlertModal = ({ visible, type, message, onClose }: AlertModalProps) => {
  const { t } = useTranslation();
  const isSuccess = type === "success";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 items-center justify-center px-6">
        <View className="bg-white rounded-3xl p-6 w-full max-w-sm items-center gap-4">
          <View
            className={
              isSuccess
                ? "bg-green-100 rounded-full p-4"
                : "bg-red-100 rounded-full p-4"
            }
          >
            {isSuccess ? (
              <CheckCircle size={32} color="#16A34A" />
            ) : (
              <XCircle size={32} color="#DC2626" />
            )}
          </View>

          <Text className="paragraph-medium text-dark-100 text-center">
            {message}
          </Text>

          <Pressable
            onPress={onClose}
            className="bg-primary rounded-full py-3 w-full items-center mt-2"
          >
            <Text className="paragraph-bold text-white">{t("common.ok")}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

export default AlertModal;
