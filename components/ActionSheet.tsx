import { Check } from "lucide-react-native";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  Animated,
  Dimensions,
  Modal,
  Pressable,
  Text,
  View,
} from "react-native";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export type ActionSheetOption = {
  label: string;
  onPress: () => void;
  selected?: boolean;
  destructive?: boolean;
  icon?: React.ReactNode;
};

type ActionSheetProps = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  options: ActionSheetOption[];
  showCancel?: boolean;
};

const ActionSheet = ({
  visible,
  onClose,
  title,
  message,
  options,
  showCancel = true,
}: ActionSheetProps) => {
  const { t } = useTranslation();
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          damping: 20,
          stiffness: 200,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: SCREEN_HEIGHT,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleOptionPress = (option: ActionSheetOption) => {
    onClose();
    setTimeout(() => option.onPress(), 200);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end">
        <Animated.View
          className="absolute inset-0 bg-black/50"
          style={{ opacity: backdropOpacity }}
        >
          <Pressable className="flex-1" onPress={onClose} />
        </Animated.View>

        <Animated.View
          style={{ transform: [{ translateY }] }}
          className="bg-white rounded-t-3xl px-5 pt-3 pb-8"
        >
          <View className="w-10 h-1 bg-gray-200 rounded-full self-center mb-4" />

          {title && (
            <Text className="h3-bold text-dark-100 text-center mb-1">
              {title}
            </Text>
          )}

          {message && (
            <Text className="paragraph-regular text-gray-100 text-center mb-4">
              {message}
            </Text>
          )}

          <View className="gap-y-1 mt-2">
            {options.map((option, index) => (
              <Pressable
                key={index}
                onPress={() => handleOptionPress(option)}
                className="flex-row items-center justify-between py-3.5 px-2"
              >
                <View className="flex-row items-center gap-x-3">
                  {option.icon}
                  <Text
                    className={
                      option.destructive
                        ? "paragraph-bold text-red-500"
                        : "paragraph-bold text-dark-100"
                    }
                  >
                    {option.label}
                  </Text>
                </View>

                {option.selected && <Check size={18} color="#FE8C00" />}
              </Pressable>
            ))}
          </View>

          {showCancel && (
            <Pressable
              onPress={onClose}
              className="bg-gray-50 rounded-2xl py-3.5 items-center mt-3"
            >
              <Text className="paragraph-bold text-dark-100">
                {t("common.cancel")}
              </Text>
            </Pressable>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
};

export default ActionSheet;
