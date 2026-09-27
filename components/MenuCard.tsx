import { router } from "expo-router";
import { Heart } from "lucide-react-native";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Image, Platform, Pressable, Text } from "react-native";

import { addFavorite, isProductFavorite, removeFavorite } from "../lib/queries";
import { useAuthStore } from "../store/auth.store";
import { useCartStore } from "../store/cart.store";
import { Product } from "../type";

const MenuCard = ({ item }: { item: Product }) => {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const addItem = useCartStore((state) => state.addItem);

  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (!user) return;

    isProductFavorite({ userId: user.id, productId: item.id })
      .then((result) => setIsFavorite(result.data ?? false))
      .catch(() => {});
  }, [user, item.id]);

  const handleAddToCart = (e: any) => {
    e.stopPropagation();

    addItem({
      id: item.id,
      name: item.name,
      price: item.price,
      image_url: item.image_url ?? "",
    });
  };

  const handleToggleFavorite = async (e: any) => {
    e.stopPropagation();

    if (!user) {
      router.push("/sign-in");
      return;
    }

    const nextValue = !isFavorite;
    setIsFavorite(nextValue);

    try {
      if (nextValue) {
        await addFavorite({ userId: user.id, productId: item.id });
      } else {
        await removeFavorite({ userId: user.id, productId: item.id });
      }
    } catch {
      setIsFavorite(!nextValue);
    }
  };

  return (
    <Pressable
      className="menu-card"
      style={
        Platform.OS === "android"
          ? { elevation: 10, shadowColor: "#878787" }
          : {}
      }
      onPress={() =>
        router.push({
          pathname: "/product/[id]",
          params: { id: item.id },
        })
      }
    >
      <Pressable
        onPress={handleToggleFavorite}
        className="absolute top-2 right-2 z-10 bg-white rounded-full p-1.5"
      >
        <Heart
          size={16}
          color={isFavorite ? "#EF4444" : "#9CA3AF"}
          fill={isFavorite ? "#EF4444" : "transparent"}
        />
      </Pressable>

      <Image
        source={{ uri: item.image_url ?? undefined }}
        className="size-32 absolute -top-10"
        resizeMode="contain"
      />

      <Text
        className="text-center base-bold text-dark-100 mb-2"
        numberOfLines={1}
      >
        {item.name}
      </Text>

      <Text className="body-regular text-gray-200 mb-4">
        {t("common.from")} {item.price} {t("common.currency")}
      </Text>

      <Pressable onPress={handleAddToCart}>
        <Text className="paragraph-bold text-primary">
          {t("product.addToCart")} +
        </Text>
      </Pressable>
    </Pressable>
  );
};

export default MenuCard;
