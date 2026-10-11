import { router, useLocalSearchParams } from "expo-router";
import { ChevronLeft, Minus, Plus, Share2 } from "lucide-react-native";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { I18nManager } from "react-native";
import { Image, Pressable, ScrollView, Share, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSupabaseQuery } from "../../../hooks/useSupabaseQuery";
import { getProductById } from "../../../lib/queries";
import { useCartStore } from "../../../store/cart.store";

export default function ProductDetails() {
  const { t } = useTranslation();
  const isRTL = I18nManager.isRTL;
  const { id } = useLocalSearchParams<{ id: string }>();
  const addItem = useCartStore((state) => state.addItem);
  const [quantity, setQuantity] = useState(1);

  const { data: product, loading } = useSupabaseQuery({
    fn: getProductById,
    params: { id: id! },
    skip: !id,
  });

  const handleShare = async () => {
    if (!product) return;
    try {
      await Share.share({
        message: t("product.shareMessage", { name: product.name, price: product.price }),
      });
    } catch (e) {}
  };

  const handleAddToCart = () => {
    if (!product) return;
    const stock = product.stock_quantity ?? Infinity;
    const qtyToAdd = Math.min(quantity, stock);
    for (let i = 0; i < qtyToAdd; i++) {
      addItem({
        id: product.id,
        name: product.name,
        price: product.price,
        image_url: product.image_url || "",
      });
    }
    // بعد ما يضيف يوديك للسلة عشان تشوفه زي الصورة اللي بعتها
    router.push("/(customer)/cart" as any);
  };

  if (loading || !product) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <Text className="paragraph-regular text-gray-100">
          {t("common.loading")}
        </Text>
      </SafeAreaView>
    );
  }

  const maxQty = product.stock_quantity ?? 99;
  const isOutOfStock = (product.stock_quantity ?? 0) <= 0;

  return (
    <SafeAreaView className="flex-1 bg-[#FDF8F3]">
      <View className="flex-row items-center justify-between px-5 py-3">
        <Pressable onPress={() => router.back()} style={{ transform: [{ rotate: isRTL ? "180deg" : "0deg" }] }}>
          <ChevronLeft size={24} color="#1a1a1a" />
        </Pressable>
        <Text className="paragraph-bold text-dark-100" style={{ textAlign: isRTL ? "right" : "left" }}>
          {t("product.details")}
        </Text>
        <Pressable onPress={handleShare} className="w-10 h-10 rounded-full bg-white items-center justify-center">
          <Share2 size={22} color="#1a1a1a" />
        </Pressable>
      </View>

      <ScrollView contentContainerClassName="pb-8">
        <Image source={{ uri: product.image_url }} className="w-full h-72 rounded-3xl" resizeMode="cover" />
        <View className="px-5 mt-5 gap-4">
          <View className="flex-row items-start justify-between">
            <View className="flex-1 gap-1">
              <Text className="h1-bold text-dark-100" style={{ textAlign: isRTL ? "right" : "left" }}>{product.name}</Text>
              <Text className="paragraph-regular text-gray-100" style={{ textAlign: isRTL ? "right" : "left" }}>{product.description}</Text>
            </View>
          </View>
          <View className="flex-row items-center justify-between">
            <Text className="h2-bold text-dark-100" style={{ textAlign: isRTL ? "right" : "left" }}>
              {product.price} {t("common.currency")}
            </Text>
            <View className="flex-row items-center gap-4 bg-white rounded-full px-4 py-2 border border-gray-100">
              <Pressable onPress={() => setQuantity((q) => Math.max(1, q - 1))}>
                <Minus size={18} color="#1a1a1a" />
              </Pressable>
              <Text className="paragraph-bold text-dark-100 min-w-[20px] text-center">{quantity}</Text>
              <Pressable onPress={() => setQuantity((q) => Math.min(q + 1, maxQty))}>
                <Plus size={18} color="#1a1a1a" />
              </Pressable>
            </View>
          </View>
          <Pressable
            onPress={handleAddToCart}
            disabled={isOutOfStock}
            className={`rounded-full py-4 items-center mt-2 ${isOutOfStock ? "bg-gray-300" : "bg-dark-100"} active:opacity-80`}
          >
            <Text className="paragraph-bold text-white">
              {t("product.addToCart")}
            </Text>
          </Pressable>
          <View className="flex-row gap-3 mt-2">
            <View className="flex-1 items-center bg-white rounded-2xl py-3 border border-gray-100">
              <Text className="small-bold text-dark-100 text-center" style={{ textAlign: isRTL ? "right" : "center" }}>{t("product.freshDaily")}</Text>
            </View>
            <View className="flex-1 items-center bg-white rounded-2xl py-3 border border-gray-100">
              <Text className="small-bold text-dark-100 text-center" style={{ textAlign: isRTL ? "right" : "center" }}>{t("product.qualityIngredients")}</Text>
            </View>
            <View className="flex-1 items-center bg-white rounded-2xl py-3 border border-gray-100">
              <Text className="small-bold text-dark-100 text-center" style={{ textAlign: isRTL ? "right" : "center" }}>{t("product.madeWithLove")}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
