import { router, useLocalSearchParams } from "expo-router";
import { CheckCircle2 } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function OrderSuccess() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();

  const orderNumber = id ? `#${id.slice(0, 8).toUpperCase()}` : "";

  return (
    <SafeAreaView className="flex-1 bg-white items-center justify-center px-8">
      <View className="size-24 rounded-full bg-primary/10 items-center justify-center mb-6">
        <CheckCircle2 size={56} color="#FE8C00" />
      </View>

      <Text className="h1-bold text-dark-100 text-center">
        {t("orderSuccess.title")}
      </Text>

      <Text className="paragraph-regular text-gray-100 text-center mt-2">
        {t("orderSuccess.message")}
      </Text>

      <View className="w-full border border-gray-200 rounded-2xl p-4 mt-6">
        <View className="flex-row items-center justify-between">
          <Text className="paragraph-regular text-gray-100">
            {t("orderSuccess.orderNumber")}
          </Text>
          <Text className="paragraph-bold text-dark-100">{orderNumber}</Text>
        </View>
      </View>

      <Pressable
        onPress={() =>
          router.replace({
            pathname: "/order/track/[id]",
            params: { id: id! },
          })
        }
        className="bg-dark-100 rounded-full py-4 w-full items-center mt-8"
      >
        <Text className="paragraph-bold text-white">
          {t("orderSuccess.trackOrder")}
        </Text>
      </Pressable>

      <Pressable
        onPress={() => router.replace("/(tabs)")}
        className="py-4 items-center mt-2"
      >
        <Text className="paragraph-bold text-primary">
          {t("orderSuccess.backHome")}
        </Text>
      </Pressable>
    </SafeAreaView>
  );
}
