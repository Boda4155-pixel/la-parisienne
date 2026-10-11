import { getFavorites, removeFavorite } from "../../lib/queries";
import { CUSTOMER_COLORS } from "../../lib/customerTheme";
import Ionicons from "@expo/vector-icons/Ionicons";

import { router } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { I18nManager, Alert, FlatList, Image, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type FavoriteProduct = {
  id: string;
  product_id: string;
  products: {
    id: string;
    name: string;
    price: number;
    image_url: string | null;
    stock_quantity?: number;
    is_active?: boolean;
  }[];
};

export default function FavoritesScreen() {
  const { t } = useTranslation();
  const C = CUSTOMER_COLORS;
  const isRTL = I18nManager.isRTL;
  const [favorites, setFavorites] = useState<FavoriteProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFavorites = async () => {
    const { data, error } = await getFavorites();
    return { data: (data as FavoriteProduct[]) || [], error };
  };

  useEffect(() => {
    const load = async () => {
      const { data, error } = await fetchFavorites();
      if (!error) setFavorites(data);
      setLoading(false);
    };
    load();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    const { data, error } = await fetchFavorites();
    if (!error) setFavorites(data);
    setRefreshing(false);
  };

  const handleRemove = (favoriteId: string, productName: string) => {
    Alert.alert(
      t("favorites.removeItem"),
      t("favorites.removeConfirmation", { name: productName }),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("favorites.removeItem"),
          style: "destructive",
          onPress: async () => {
            const { error } = await removeFavorite({ productId: favoriteId });
            if (!error) {
              setFavorites((prev) => prev.filter((f) => f.products?.[0]?.id !== favoriteId));
            }
          },
        },
      ]
    );
  };

  const handleProductPress = (productId: string) => {
    router.push(`/product/${productId}` as any);
  };

  const renderItem = ({ item }: { item: FavoriteProduct }) => {
    const product = item.products?.[0];
    if (!product) return null;

    const isOutOfStock = (product.stock_quantity ?? 0) <= 0;

    return (
      <Pressable
        onPress={() => handleProductPress(product.id)}
        style={{
          backgroundColor: C.card,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: C.border,
          overflow: "hidden",
          marginBottom: 16,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 14, padding: 4 }}>
          <View
            style={{
              width: 96,
              height: 96,
              borderRadius: 12,
              backgroundColor: C.searchBg,
              overflow: "hidden",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {product.image_url ? (
              <Image source={{ uri: product.image_url }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
            ) : (
              <Ionicons name="image-outline" size={32} color={C.textSecondary} />
            )}
          </View>

          <View style={{ flex: 1, paddingVertical: 12, paddingRight: 8 }}>
            <Text
              style={{ fontSize: 15, fontWeight: "700", color: C.textPrimary, textAlign: isRTL ? "right" : "left" }}
              numberOfLines={1}
            >
              {product.name}
            </Text>
            <Text style={{ fontSize: 13, color: C.textSecondary, marginTop: 4, textAlign: isRTL ? "right" : "left" }}>
              {product.price} {t("common.currency")}
            </Text>
            {isOutOfStock && (
              <Text style={{ fontSize: 11, color: "#EF4444", marginTop: 2, fontWeight: "700" }}>
                {t("product.outOfStock")}
              </Text>
            )}
          </View>
        </View>

        <Pressable
          onPress={() => handleRemove(product.id, product.name)}
          style={{
            borderTopWidth: 1,
            borderTopColor: C.border,
            paddingVertical: 12,
            alignItems: "center",
          }}
        >
          <Ionicons name="trash-outline" size={18} color={C.textSecondary} />
          <Text style={{ fontSize: 13, color: C.textSecondary, marginTop: 4 }}>{t("favorites.removeItem")}</Text>
        </Pressable>
      </Pressable>
    );
  };

  const renderEmpty = () => (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 32, gap: 16 }}>
      <View
        style={{
          width: 96,
          height: 96,
          borderRadius: 48,
          backgroundColor: C.searchBg,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Ionicons name="heart-outline" size={36} color={C.textSecondary} />
      </View>
      <Text style={{ fontSize: 18, fontWeight: "700", color: C.textPrimary, textAlign: "center" }}>
        {t("favorites.empty")}
      </Text>
      <Text style={{ fontSize: 13, color: C.textSecondary, textAlign: "center" }}>{t("favorites.empty")}</Text>
      {favorites.length === 0 && !loading && (
        <Pressable
          onPress={() => router.replace("/(customer)/home" as any)}
          style={{
            backgroundColor: C.accent,
            borderRadius: 24,
            paddingHorizontal: 28,
            paddingVertical: 12,
            marginTop: 8,
          }}
        >
          <Text style={{ color: C.card, fontSize: 14, fontWeight: "700" }}>{t("favorites.empty", "Browse Menu")}</Text>
        </Pressable>
      )}
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.background }}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 20,
          paddingVertical: 14,
          borderBottomWidth: 1,
          borderBottomColor: C.border,
          backgroundColor: C.card,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: C.searchBg,
            justifyContent: "center",
            alignItems: "center",
            marginRight: isRTL ? 0 : 12,
            marginLeft: isRTL ? 12 : 0,
          }}
        >
          <Ionicons name="chevron-back" size={20} color={C.textPrimary} style={{ transform: [{ rotate: isRTL ? "180deg" : "0deg" }] }} />
        </Pressable>
        <Text style={{ fontSize: 20, fontWeight: "800", color: C.textPrimary, flex: 1, textAlign: isRTL ? "right" : "left" }}>
          {t("favoritesScreen")}
        </Text>
      </View>

      {/* Content */}
      <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 16 }}>
        {loading ? (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <Text style={{ color: C.textSecondary }}>{t("common.loading")}</Text>
          </View>
        ) : favorites.length === 0 ? (
          renderEmpty()
        ) : (
          <FlatList
            data={favorites}
            keyExtractor={(item) => (item.products?.[0]?.id ?? item.id)}
            renderItem={renderItem}
            refreshing={refreshing}
            onRefresh={onRefresh}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 40 }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
