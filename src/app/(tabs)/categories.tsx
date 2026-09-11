import { router } from "expo-router";
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
import CategoryCard from "../../../components/CategoryCard";
import { useSupabaseQuery } from "../../../hooks/useSupabaseQuery";
import { getCategoriesWithCount } from "../../../lib/queries";

export default function Categories() {
  const { t } = useTranslation();

  const {
    data: categories,
    loading,
    error,
  } = useSupabaseQuery({
    fn: getCategoriesWithCount,
  });

  return (
    <SafeAreaView className="flex-1 bg-[#FDF8F3]">
      <View className="flex-row items-center justify-between px-5 py-3">
        <Pressable onPress={() => router.back()}>
          <ChevronLeft size={24} color="#1a1a1a" />
        </Pressable>

        <Text className="h1-bold text-dark-100">{t("categories.title")}</Text>

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
          data={categories}
          keyExtractor={(item) => item.id}
          contentContainerClassName="px-5 pt-4 pb-10"
          renderItem={({ item }) => (
            <CategoryCard
              title={item.name}
              itemsCount={item.productsCount}
              image={{ uri: item.image_url ?? undefined }}
              onPress={() =>
                router.push({
                  pathname: "/category/[id]",
                  params: { id: item.id },
                })
              }
            />
          )}
          ListEmptyComponent={
            <View className="items-center py-10">
              <Text className="paragraph-regular text-gray-100">
                {t("categories.empty")}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
