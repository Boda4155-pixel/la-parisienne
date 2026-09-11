import { router, useLocalSearchParams } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import CartButton from "../../../components/CartButton";
import MenuCard from "../../../components/MenuCard";
import { useSupabaseQuery } from "../../../hooks/useSupabaseQuery";
import { getProducts } from "../../../lib/queries";
import { Product } from "../../../type";

export default function CategoryDetails() {
  const { t } = useTranslation();
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>();

  const {
    data: products,
    loading,
    error,
  } = useSupabaseQuery({
    fn: getProducts,
    params: { categoryId: id },
    skip: !id,
  });

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center justify-between px-5 py-3">
        <Pressable onPress={() => router.back()}>
          <ChevronLeft size={24} color="#1a1a1a" />
        </Pressable>

        <Text className="h1-bold text-dark-100" numberOfLines={1}>
          {name || t("categories.title")}
        </Text>

        <CartButton />
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#FE8C00" />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-5">
          <Text className="paragraph-regular text-gray-100 text-center">
            {t("common.errorLoading")}
          </Text>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperClassName="gap-7"
          contentContainerClassName="gap-7 px-5 pt-4 pb-10"
          renderItem={({ item }) => (
            <View className="flex-1 max-w-[48%]">
              <MenuCard item={item as Product} />
            </View>
          )}
          ListEmptyComponent={
            <View className="items-center py-16">
              <Text className="paragraph-regular text-gray-100">
                {t("categories.noProducts")}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
