import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { Image, Pressable, Text, View } from "react-native";

import { Product } from "../type";

const ProductMiniCard = ({ item }: { item: Product }) => {
  const { t } = useTranslation();

  return (
    <Pressable
      onPress={() =>
        router.push({
          pathname: "/product/[id]",
          params: { id: item.id },
        })
      }
      className="w-32 mr-4"
    >
      <View
        className="w-32 h-32 rounded-2xl overflow-hidden bg-gray-50"
        style={{
          shadowColor: "#1a1a1a",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 3,
        }}
      >
        <Image
          source={{ uri: item.image_url ?? undefined }}
          className="w-full h-full"
          resizeMode="cover"
        />
      </View>

      <Text className="paragraph-bold text-dark-100 mt-2" numberOfLines={1}>
        {item.name}
      </Text>

      <Text className="paragraph-bold text-primary text-center">
        {item.price} {t("common.currency")}
      </Text>
    </Pressable>
  );
};

export default ProductMiniCard;
