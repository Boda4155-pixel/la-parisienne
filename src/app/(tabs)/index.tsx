import { router } from "expo-router";
import { Coffee, Cookie, Croissant, Menu, Wheat } from "lucide-react-native";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  FlatList,
  ImageBackground,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AppDrawer from "../../../components/AppDrawer";
import CartButton from "../../../components/CartButton";
import ProductMiniCard from "../../../components/ProductMiniCard";
import { images } from "../../../constants";
import { useSupabaseQuery } from "../../../hooks/useSupabaseQuery";
import {
  getCategoriesWithCount,
  getFeaturedProducts,
} from "../../../lib/queries";
const CATEGORY_ICONS = [Croissant, Cookie, Coffee, Wheat];
export default function Index() {
  const { t } = useTranslation();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const { data: categories, loading: loadingCategories } = useSupabaseQuery({
    fn: getCategoriesWithCount,
  });

  const { data: featured, loading: loadingFeatured } = useSupabaseQuery({
    fn: getFeaturedProducts,
  });

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 py-3">
          <View>
            <CartButton />
          </View>

          <View className="flex-row items-center gap-x-3">
            <Text className="h2-bold text-dark-100 font-quicksand-bold">
              {" "}
              {t("common.brandName")}
            </Text>
          </View>
          <Pressable
            onPress={() => setDrawerVisible(true)}
            className="size-10 rounded-full bg-gray-50 items-center justify-center"
          >
            <Menu size={20} color="#1a1a1a" />
          </Pressable>
        </View>

        {/* Hero */}
        <View className="px-5">
          <ImageBackground
            source={images.pizzaOne}
            className="w-full h-64 rounded-3xl overflow-hidden justify-center"
            imageStyle={{ borderRadius: 24 }}
          >
            <View
              className="absolute inset-0 rounded-3xl"
              style={{ backgroundColor: "rgba(0,0,0,0.35)" }}
            />

            <View className="px-6 items-center gap-y-3">
              <Text className="h1-bold text-white leading-tight text-center">
                {t("home.heroTitle")}
              </Text>

              <Text className="paragraph-regular text-white/90 text-center">
                {t("home.heroSubtitle")}
              </Text>

              <Pressable
                onPress={() => router.push("/categories")}
                className="bg-primary rounded-full px-6 py-3 mt-1"
              >
                <Text className="paragraph-bold text-white">
                  {t("home.shopNow")}
                </Text>
              </Pressable>
            </View>
          </ImageBackground>
        </View>

        <View
          className="mx-5 -mt-8 bg-white rounded-3xl px-4 py-5 gap-y-3"
          style={{
            shadowColor: "#1a1a1a",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.08,
            shadowRadius: 12,
            elevation: 4,
          }}
        >
          {loadingCategories ? (
            <ActivityIndicator color="#FE8C00" />
          ) : (
            <View className="flex-row justify-between">
              {(categories ?? []).slice(0, 4).map((category, index) => {
                const Icon = CATEGORY_ICONS[index % CATEGORY_ICONS.length];

                return (
                  <Pressable
                    key={category.id}
                    onPress={() =>
                      router.push({
                        pathname: "/category/[id]",
                        params: { id: category.id, name: category.name },
                      })
                    }
                    className="items-center gap-y-2 flex-1"
                  >
                    <View className="size-14 rounded-full bg-primary/10 items-center justify-center">
                      <Icon size={24} color="#FE8C00" />
                    </View>
                    <Text
                      className="small-bold text-dark-100 text-center"
                      numberOfLines={1}
                    >
                      {category.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        {/* Popular Products */}
        <View className="px-5 mt-8 mb-4 flex-row items-center justify-between">
          <Text className="h2-bold text-dark-100">
            {t("home.popularProducts")}
          </Text>

          <Pressable onPress={() => router.push("/categories")}>
            <Text className="paragraph-bold text-primary">
              {t("home.viewAll")}
            </Text>
          </Pressable>
        </View>

        {loadingFeatured ? (
          <ActivityIndicator color="#FE8C00" className="my-6" />
        ) : (
          <FlatList
            data={featured}
            keyExtractor={(item) => item.id}
            numColumns={3}
            columnWrapperClassName="gap-x-3 px-5"
            contentContainerClassName="gap-y-3 pb-40"
            renderItem={({ item }) => <ProductMiniCard item={item} />}
            scrollEnabled={false}
          />
        )}
        <AppDrawer
          visible={drawerVisible}
          onClose={() => setDrawerVisible(false)}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
