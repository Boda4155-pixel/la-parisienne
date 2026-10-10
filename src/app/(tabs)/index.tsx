import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";
import { router, useFocusEffect } from "expo-router";
import { Check, Menu, ShoppingBag } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  AppState,
  Dimensions,
  FlatList,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "../../../lib/supabase";
import { useCartStore } from "../../../store/cart.store";

const { width: screenWidth } = Dimensions.get("window");

const COLORS = {
  bg: "#FDF6EF",
  white: "#FFFFFF",
  black: "#1A1A1A",
  gold: "#8B6F47",
  goldLight: "#B8A08A",
  goldBtn: "#D2A679",
  btnText: "#2C1810",
  iconColor: "#B08968",
  labelColor: "#5C4A3A",
  productText: "#2B2B2B",
  productBorder: "#F2E8DC",
  plusBtn: "#F8E8D8",
  seeAll: "#C19A6B",
  loading: "#C9A67D",
};

// Toast colors kept exactly from original (cart logic as-is)
const TOAST = {
  bg: "#1A1A1A",
  gold: "#C6A86B",
};

function getCategoryEmoji(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes("pastr") || lower.includes("croissant") || lower.includes("choux") || lower.includes("éclair")) return "🥐";
  if (lower.includes("dess")) return "🍰";
  if (lower.includes("macar")) return "🧁";
  if (lower.includes("drink") || lower.includes("coffee") || lower.includes("tea") || lower.includes("boisson")) return "☕";
  if (lower.includes("bread") || lower.includes("pain")) return "🍞";
  if (lower.includes("cake")) return "🎂";
  if (lower.includes("cookie") || lower.includes("biscuit")) return "🍪";
  return "🍽️";
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [products, setProducts] = useState<any[]>([]);
  const [cats, setCats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addedId, setAddedId] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const toastAnim = useRef(new Animated.Value(0)).current;

  // Location hook (kept from original)
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number; text: string } | null>(null);
  const [locLoading, setLocLoading] = useState(true);

  const cartItems = useCartStore((s) => s.items);
  const addToCartStore = useCartStore((s) => s.addItem);
  const cartCount = cartItems.reduce((a, b) => a + b.quantity, 0);

  // Location fetch (kept from original)
  const fetchFreshLocation = async () => {
    setLocLoading(true);
    try {
      let { status } = await Location.getForegroundPermissionsAsync();
      if (status !== "granted") {
        const req = await Location.requestForegroundPermissionsAsync();
        status = req.status;
      }
      if (status !== "granted") {
        await AsyncStorage.removeItem("user_location");
        setUserLoc(null);
        setLocLoading(false);
        return;
      }
      const enabled = await Location.hasServicesEnabledAsync();
      if (!enabled) {
        await AsyncStorage.removeItem("user_location");
        setUserLoc(null);
        setLocLoading(false);
        return;
      }
      let pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const [addr] = await Location.reverseGeocodeAsync({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });
      const locObj = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        text: addr
          ? `${addr.district || addr.subregion || addr.city || ""} - ${addr.street || addr.name || ""}`.trim()
          : `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`,
      };
      setUserLoc(locObj);
      await AsyncStorage.setItem("user_location", JSON.stringify(locObj));
    } catch (e) {
      console.log("loc error", e);
      const saved = await AsyncStorage.getItem("user_location");
      if (!saved) setUserLoc(null);
    } finally {
      setLocLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchFreshLocation();
      const sub = AppState.addEventListener("change", (state) => {
        if (state === "active") fetchFreshLocation();
      });
      return () => sub.remove();
    }, []),
  );

  // Data fetching — real Supabase only
  useEffect(() => {
    const load = async () => {
      const [pRes, cRes] = await Promise.all([
        supabase.from("products").select("*").limit(6),
        supabase.from("categories").select("*").order("name"),
      ]);
      if (pRes.data) setProducts(pRes.data);
      if (cRes.data) setCats(cRes.data);
      setLoading(false);
    };
    load();
  }, []);

  // Cart logic — kept as is
  const handleAddToCart = async (product: any) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    addToCartStore({
      id: product.id,
      name: product.name,
      price: product.price,
      image_url: product.image_url || product.image,
    } as any);
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 1500);
    setShowToast(true);
    Animated.sequence([
      Animated.timing(toastAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.delay(1500),
      Animated.timing(toastAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => setShowToast(false));
  };

  // Loading
  if (loading)
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator color={COLORS.loading} size="large" />
      </View>
    );

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 130 }}>
        {/* Header */}
        <View
          style={{
            backgroundColor: COLORS.white,
            height: 52 + insets.top,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingHorizontal: 16,
            paddingTop: insets.top,
          }}
        >
          <View style={{ width: 40, height: 40, justifyContent: "center", alignItems: "center" }}>
            <Menu size={18} color={COLORS.black} />
          </View>

          <View style={{ alignItems: "center" }}>
            <Text
              style={{
                fontFamily: "serif",
                fontSize: 16,
                color: COLORS.gold,
                fontWeight: "700",
                letterSpacing: 1.5,
                textAlign: "center",
              }}
            >
              LA PARISIENNE
            </Text>
            <Text style={{ fontSize: 7, color: COLORS.goldLight, letterSpacing: 0.5 }}>
              {'FRENCH BAKERY & DESSERTS'}
            </Text>
          </View>

          <TouchableOpacity
            onPress={() => router.navigate("/(tabs)/cart" as any)}
            style={{ width: 40, height: 40, justifyContent: "center", alignItems: "center" }}
          >
            <ShoppingBag size={18} color={COLORS.black} />
            {cartCount > 0 && (
              <View
                style={{
                  position: "absolute",
                  top: -4,
                  right: -4,
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: COLORS.black,
                }}
              />
            )}
          </TouchableOpacity>
        </View>

        {/* Hero Banner */}
        <View
          style={{
            margin: 16,
            height: 170,
            borderRadius: 20,
            backgroundColor: COLORS.black,
            overflow: "hidden",
            position: "relative",
          }}
        >
          <Image
            source={require("../../../assets/images/croissant-real.png")}
            style={{ width: "100%", height: "100%", opacity: 0.9 }}
            resizeMode="cover"
          />
          {/* Dark gradient overlay (left→right, black 60% → transparent) */}
          <View
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 0,
              bottom: 0,
              backgroundColor: "rgba(0,0,0,0.6)",
            }}
          />
          {/* Content */}
          <View
            style={{
              position: "absolute",
              left: 16,
              top: 30,
              bottom: 16,
              justifyContent: "space-between",
            }}
          >
            <View>
              <Text style={{ color: COLORS.white, fontSize: 20, fontWeight: "700" }}>Taste the</Text>
              <Text style={{ color: COLORS.white, fontSize: 20, fontWeight: "700" }}>French moment.</Text>
            </View>
            <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, marginTop: 6 }}>
              Freshly baked. Made with love.
            </Text>
            <TouchableOpacity
              onPress={() => router.navigate("/(tabs)/categories" as any)}
              style={{
                backgroundColor: COLORS.goldBtn,
                borderRadius: 8,
                paddingVertical: 7,
                paddingHorizontal: 16,
                marginTop: 14,
                width: 90,
              }}
            >
              <Text style={{ color: COLORS.btnText, fontSize: 10, fontWeight: "700" }}>SHOP NOW</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Floating White Card — Categories + Products */}
        <View
          style={{
            backgroundColor: COLORS.white,
            borderTopLeftRadius: 22,
            borderTopRightRadius: 22,
            marginTop: -18,
            paddingTop: 16,
            paddingHorizontal: 16,
            paddingBottom: 12,
            zIndex: 10,
          }}
        >
          {/* Categories */}
          <View style={{ marginBottom: 16 }}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8 }}
            >
              {cats.map((cat) => (
                <View key={cat.id} style={{ width: 60, alignItems: "center" }}>
                  <View
                    style={{
                      width: 38,
                      height: 38,
                      backgroundColor: "#FFFBF5",
                      borderRadius: 19,
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ fontSize: 20 }}>{getCategoryEmoji(cat.name)}</Text>
                  </View>
                  <Text
                    style={{
                      fontSize: 10,
                      color: COLORS.labelColor,
                      marginTop: 6,
                      textAlign: "center",
                    }}
                  >
                    {cat.name}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Popular Products */}
          <View>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginTop: 14,
                marginBottom: 12,
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 14, fontWeight: "700", color: COLORS.black }}>Popular Products</Text>
              <TouchableOpacity onPress={() => router.navigate("/(tabs)/categories" as any)}>
                <Text style={{ fontSize: 11, color: COLORS.seeAll }}>See all</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={products}
              keyExtractor={(item) => item.id}
              numColumns={3}
              columnWrapperStyle={{ gap: 8 }}
              renderItem={({ item }) => {
                const isAdded = addedId === item.id;
                return (
                  <TouchableOpacity
                    onPress={() => router.push(`/product/${item.id}` as any)}
                    activeOpacity={0.8}
                    style={{
                      backgroundColor: COLORS.white,
                      borderWidth: 1,
                      borderColor: COLORS.productBorder,
                      borderRadius: 14,
                      width: (screenWidth - 40) / 3 - 8,
                      padding: 8,
                    }}
                  >
                    <View style={{ width: 70, height: 70, borderRadius: 8, alignSelf: "center", justifyContent: "center", alignItems: "center" }}>
                      <Image
                        source={{ uri: item.image_url || item.image }}
                        style={{ width: 70, height: 70, borderRadius: 8 }}
                        resizeMode="contain"
                      />
                    </View>
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: "600",
                        color: COLORS.productText,
                        marginTop: 8,
                      }}
                      numberOfLines={1}
                    >
                      {item.name}
                    </Text>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
                      <Text style={{ fontSize: 9, fontWeight: "600", color: COLORS.productText }}>
                        {item.price} EGP
                      </Text>
                      <TouchableOpacity
                        onPress={() => handleAddToCart(item)}
                        style={{
                          width: 18,
                          height: 18,
                          backgroundColor: COLORS.plusBtn,
                          borderRadius: 6,
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        <Text style={{ color: COLORS.gold, fontSize: 12, fontWeight: "700" }}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={() => (
                <View style={{ width: "100%", alignItems: "center", paddingTop: 20 }}>
                  <Text style={{ fontSize: 12, color: COLORS.labelColor }}>No products yet</Text>
                </View>
              )}
            />
          </View>
        </View>
      </ScrollView>

      {/* Toast — cart logic kept as is */}
      {showToast && (
        <Animated.View
          style={{
            position: "absolute",
            bottom: 110,
            alignSelf: "center",
            backgroundColor: TOAST.bg,
            paddingHorizontal: 20,
            paddingVertical: 12,
            borderRadius: 25,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            opacity: toastAnim,
            transform: [
              {
                translateY: toastAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
            ],
          }}
        >
          <View
            style={{
              width: 22,
              height: 22,
              borderRadius: 11,
              backgroundColor: TOAST.gold,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Check size={14} color={COLORS.white} />
          </View>
          <Text style={{ color: COLORS.white, fontWeight: "700", fontSize: 14 }}>تمت الإضافة للسلة</Text>
        </Animated.View>
      )}
    </View>
  );
}
