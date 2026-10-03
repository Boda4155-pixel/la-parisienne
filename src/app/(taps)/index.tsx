import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { Check, Gift, ShoppingBag } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Animated, Dimensions, FlatList, Image, Modal, Pressable, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "../../../lib/supabase";
import { useCartStore } from "../../../store/cart.store";

const { width } = Dimensions.get('window');
const COLORS = { gold: "#C6A86B", black: "#1A1A1A", cream: "#FFFBF5", beige: "#F7EFE3", gray: "#9A9A9A" };

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [banners, setBanners] = useState<any[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [cats, setCats] = useState<any[]>([]);
  const [activeCat, setActiveCat] = useState('all');
  const [loading, setLoading] = useState(true);
  const [activeBanner, setActiveBanner] = useState(0);
  const [showOffers, setShowOffers] = useState(false);
  const [addedId, setAddedId] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const bannerRef = useRef<FlatList>(null);
  const toastAnim = useRef(new Animated.Value(0)).current;
  const cartItems = useCartStore(s => s.items);
  const addToCartStore = useCartStore(s => s.addItem);
  const cartCount = cartItems.reduce((a,b) => a + b.quantity, 0);

  useEffect(() => {
    const load = async () => {
      const [bRes, oRes, pRes, cRes] = await Promise.all([
        supabase.from("banners").select("*").eq("is_active", true).order("sort_order"),
        supabase.from("offers").select("*").eq("is_active", true).order("created_at", { ascending: false }),
        supabase.from("products").select("*").eq("is_available", true).order("created_at", { ascending: false }).limit(20),
        supabase.from("categories").select("*").order("name")
      ]);
      if (bRes.data) setBanners(bRes.data);
      if (oRes.data) setOffers(oRes.data);
      if (pRes.data) setProducts(pRes.data);
      if (cRes.data) setCats(cRes.data);
      setLoading(false);
    };
    load();
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;
    const it = setInterval(() => {
      const next = (activeBanner + 1) % banners.length;
      setActiveBanner(next);
      bannerRef.current?.scrollToIndex({ index: next, animated: true });
    }, 4000);
    return () => clearInterval(it);
  }, [activeBanner, banners.length]);

  const filtered = activeCat === 'all' ? products : products.filter(p => p.category_id === activeCat);

  const handleAddToCart = async (product: any) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    addToCartStore({
      id: product.id,
      name: product.name,
      price: product.price,
      image_url: product.image_url || product.image,
    } as any);

    // نفس حركة categories
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 1500);

    setShowToast(true);
    Animated.sequence([
      Animated.timing(toastAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.delay(1500),
      Animated.timing(toastAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => setShowToast(false));
  };

  if (loading) return <View style={{ flex: 1, backgroundColor: COLORS.cream, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator color={COLORS.gold} size="large" /></View>;

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.cream }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 130 }}>
        
        <View style={{ paddingHorizontal: 24, paddingTop: insets.top + 10, paddingBottom: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => setShowOffers(true)} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.beige }}>
            <Gift size={18} color={COLORS.black} />
            {offers.length > 0 && <View style={{ position: 'absolute', top: -2, right: -2, width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.gold }} />}
          </TouchableOpacity>

          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontWeight: '900', fontSize: 16, letterSpacing: 3, color: COLORS.gold }}>LA PARISIENNE</Text>
            <Text style={{ fontSize: 9, letterSpacing: 1.5, color: COLORS.gray, marginTop: 2 }}>FRENCH BAKERY</Text>
          </View>

          <TouchableOpacity onPress={() => router.navigate('/cart' as any)} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.beige }}>
            <ShoppingBag size={18} color={COLORS.black} />
            {cartCount > 0 && (
              <View style={{ position: 'absolute', top: -4, right: -4, backgroundColor: COLORS.black, minWidth: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4 }}>
                <Text style={{ color: 'white', fontSize: 10, fontWeight: '700' }}>{cartCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View>
          {banners.length > 0 ? (
            <FlatList
              ref={bannerRef}
              data={banners}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={i => i.id}
              onMomentumScrollEnd={e => setActiveBanner(Math.round(e.nativeEvent.contentOffset.x / (width-48)))}
              contentContainerStyle={{ paddingHorizontal: 24 }}
              ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => item.product_id && router.push(`/product/${item.product_id}` as any)} style={{ width: width-48, height: 190, borderRadius: 24, overflow: 'hidden', backgroundColor: COLORS.beige }} activeOpacity={0.9}>
                  <Image source={{ uri: item.image_url || item.image }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                  <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <View style={{ backgroundColor: 'rgba(255,255,255,0.92)', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 14, maxWidth: '65%' }}>
                      <Text style={{ color: COLORS.black, fontWeight: '800', fontSize: 18 }} numberOfLines={2}>{item.title}</Text>
                      {item.subtitle ? <Text style={{ color: COLORS.gray, fontSize: 11, marginTop: 3 }} numberOfLines={1}>{item.subtitle}</Text> : null}
                    </View>
                    <View style={{ backgroundColor: COLORS.black, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 }}>
                      <Text style={{ color: 'white', fontSize: 10, fontWeight: '800' }}>{item.button_text || 'SHOP NOW'}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
            />
          ) : (
            <TouchableOpacity onPress={() => router.navigate('/categories' as any)} style={{ marginHorizontal: 24, height: 190, borderRadius: 24, overflow: 'hidden', backgroundColor: COLORS.beige }}>
              <Image source={{ uri: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800' }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <View style={{ backgroundColor: 'rgba(255,255,255,0.92)', padding: 14, borderRadius: 14 }}>
                  <Text style={{ fontSize: 20, fontWeight: '800' }}>Taste the{'\n'}French moment.</Text>
                </View>
                <View style={{ backgroundColor: COLORS.black, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20 }}>
                  <Text style={{ color: 'white', fontSize: 11, fontWeight: '700' }}>SHOP NOW</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        </View>

        <View style={{ marginTop: 26 }}>
          <View style={{ paddingHorizontal: 24, flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 18, fontWeight: '800' }}>Catégories</Text>
            <TouchableOpacity onPress={() => router.navigate('/categories' as any)}><Text style={{ color: COLORS.gold, fontSize: 12, fontWeight: '600' }}>See all</Text></TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, marginTop: 14 }}>
            <TouchableOpacity onPress={() => setActiveCat('all')} style={{ paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20, marginRight: 10, backgroundColor: activeCat==='all'?COLORS.black:'white', borderWidth: 1, borderColor: COLORS.beige }}>
              <Text style={{ color: activeCat==='all'?'white':COLORS.black, fontSize: 12, fontWeight: '600' }}>All</Text>
            </TouchableOpacity>
            {cats.map(cat => (
              <TouchableOpacity key={cat.id} onPress={() => setActiveCat(cat.id)} style={{ paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20, marginRight: 10, backgroundColor: activeCat===cat.id?COLORS.black:'white', borderWidth: 1, borderColor: COLORS.beige }}>
                <Text style={{ color: activeCat===cat.id?'white':COLORS.black, fontSize: 12, fontWeight: '600' }}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={{ marginTop: 30, paddingHorizontal: 24 }}>
          <Text style={{ fontSize: 18, fontWeight: '800', marginBottom: 14 }}>Popular Products</Text>
          {filtered.map(item => {
            const isAdded = addedId === item.id;
            return (
              <TouchableOpacity key={item.id} onPress={() => router.push(`/product/${item.id}` as any)} activeOpacity={0.8} style={{ flexDirection: 'row', backgroundColor: 'white', borderRadius: 20, padding: 12, marginBottom: 12, alignItems: 'center', borderWidth: 1, borderColor: isAdded ? COLORS.gold : 'transparent' }}>
                <Image source={{ uri: item.image_url || item.image }} style={{ width: 72, height: 72, borderRadius: 16, backgroundColor: COLORS.beige }} />
                <View style={{ flex: 1, marginLeft: 14 }}>
                  <Text style={{ fontWeight: '700', fontSize: 13 }}>{item.name}</Text>
                  <Text style={{ fontSize: 11, color: COLORS.gray, marginTop: 2 }}>{item.price} EGP</Text>
                </View>
                <TouchableOpacity onPress={() => handleAddToCart(item)} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: isAdded ? COLORS.gold : COLORS.black, justifyContent: 'center', alignItems: 'center' }}>
                  {isAdded ? <Check size={18} color="white" /> : <Text style={{ color: 'white', fontSize: 18 }}>+</Text>}
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {showToast && (
        <Animated.View style={{ position: 'absolute', bottom: 110, alignSelf: 'center', backgroundColor: COLORS.black, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 25, flexDirection: 'row', alignItems: 'center', gap: 8, opacity: toastAnim, transform: [{ translateY: toastAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
          <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: COLORS.gold, justifyContent: 'center', alignItems: 'center' }}><Check size={14} color="white" /></View>
          <Text style={{ color: 'white', fontWeight: '700', fontSize: 14 }}>تمت الإضافة للسلة</Text>
        </Animated.View>
      )}

      <Modal visible={showOffers} transparent animationType="slide">
        <Pressable onPress={() => setShowOffers(false)} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
          <Pressable style={{ backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '75%' }}>
            <View style={{ width: 40, height: 4, backgroundColor: '#DDD', borderRadius: 2, alignSelf: 'center', marginBottom: 16 }} />
            <Text style={{ fontSize: 18, fontWeight: '800', marginBottom: 16 }}>Available Offers</Text>
            <ScrollView>{offers.map(off => (<View key={off.id} style={{ backgroundColor: COLORS.beige, borderRadius: 16, padding: 16, marginBottom: 12 }}><Text style={{ fontWeight: '800' }}>{off.title}</Text><Text style={{ color: COLORS.gray, fontSize: 12 }}>{off.code}</Text></View>))}</ScrollView>
            <TouchableOpacity onPress={() => setShowOffers(false)} style={{ marginTop: 16, backgroundColor: COLORS.cream, padding: 14, borderRadius: 12, alignItems: 'center' }}><Text style={{ fontWeight: '700' }}>Close</Text></TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}