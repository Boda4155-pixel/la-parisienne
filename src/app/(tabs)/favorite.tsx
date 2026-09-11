import { router } from "expo-router";
import { Heart } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import MenuCard from "../../../components/MenuCard";
import { useSupabaseQuery } from "../../../hooks/useSupabaseQuery";
import { getFavorites } from "../../../lib/queries";
import { useAuthStore } from "../../../store/auth.store";
import { Product } from "../../../type";

export default function Favorite() {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);

  const {
    data: favorites,
    loading,
    error,
  } = useSupabaseQuery({
    fn: getFavorites,
    params: { userId: user?.id ?? "" },
    skip: !user,
  });

  const products: Product[] =
    favorites?.map((fav: any) => fav.products).filter(Boolean) ?? [];

  if (!user) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center px-8">
        <Heart size={56} color="#D1D5DB" />
        <Text className="h2-bold text-dark-100 mt-6 text-center">
          {t("favorites.loginRequired")}
        </Text>
        <Pressable
          onPress={() => router.push("/sign-in")}
          className="bg-dark-100 rounded-full px-8 py-4 mt-6"
        >
          <Text className="paragraph-bold text-white">
            {t("favorites.login")}
          </Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-5 py-3">
        <Text className="h1-bold text-dark-100">{t("tabs.favorite")}</Text>
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
          contentContainerClassName="gap-7 px-5 pt-4 pb-28"
          renderItem={({ item }) => (
            <View className="flex-1 max-w-[48%]">
              <MenuCard item={item} />
            </View>
          )}
          ListEmptyComponent={
            <View className="items-center py-16 px-8">
              <Heart size={48} color="#D1D5DB" />
              <Text className="paragraph-regular text-gray-100 mt-4 text-center">
                {t("favorites.empty")}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
