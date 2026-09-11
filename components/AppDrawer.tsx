import { router } from "expo-router";
import {
  ClipboardList,
  Heart,
  Home,
  LayoutGrid,
  User,
  X,
} from "lucide-react-native";
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

import { useAuthStore } from "../store/auth.store";

const { width } = Dimensions.get("window");
const DRAWER_WIDTH = width * 0.75;

type AppDrawerProps = {
  visible: boolean;
  onClose: () => void;
};

const AppDrawer = ({ visible, onClose }: AppDrawerProps) => {
  const { t } = useTranslation();
  const profile = useAuthStore((state) => state.profile);

  const translateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;

  useEffect(() => {
    Animated.timing(translateX, {
      toValue: visible ? 0 : -DRAWER_WIDTH,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  const menuItems = [
    { icon: Home, label: t("tabs.home"), route: "/(tabs)" },
    {
      icon: LayoutGrid,
      label: t("tabs.categories"),
      route: "/(tabs)/categories",
    },
    { icon: Heart, label: t("tabs.favorite"), route: "/(tabs)/favorite" },
    { icon: ClipboardList, label: t("tabs.orders"), route: "/(tabs)/orders" },
    { icon: User, label: t("tabs.account"), route: "/(tabs)/profile" },
  ] as const;

  const handleNavigate = (route: string) => {
    onClose();
    router.push(route as any);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 flex-row">
        <Animated.View
          style={{
            width: DRAWER_WIDTH,
            transform: [{ translateX }],
          }}
          className="bg-white h-full pt-14 px-5"
        >
          <View className="flex-row items-center justify-between mb-8">
            <Text className="h2-bold text-dark-100">
              {profile?.full_name || t("profile.guest")}
            </Text>

            <Pressable onPress={onClose}>
              <X size={22} color="#1a1a1a" />
            </Pressable>
          </View>

          <View className="gap-y-2">
            {menuItems.map((item) => (
              <Pressable
                key={item.route}
                onPress={() => handleNavigate(item.route)}
                className="flex-row items-center gap-x-4 py-3"
              >
                <item.icon size={22} color="#1a1a1a" />
                <Text className="paragraph-bold text-dark-100">
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </Animated.View>

        <Pressable className="flex-1 bg-black/40" onPress={onClose} />
      </View>
    </Modal>
  );
};

export default AppDrawer;
