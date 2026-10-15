import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CUSTOMER_COLORS } from "../../../lib/customerTheme";
import { getFavoritesCount, getOrdersCount, getProfile } from "../../../lib/queries";
import { useAuthStore } from "../../../store/auth.store";

type Profile = { id: string; full_name: string | null; email: string | null; phone: string | null; role: string; avatar_url: string | null };

export default function CustomerAccount() {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const C = CUSTOMER_COLORS;
  const { profile: authProfile, signOut } = useAuthStore();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [ordersCount, setOrdersCount] = useState<number | null>(null);
  const [favoritesCount, setFavoritesCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const p = await getProfile();
      if (p.data) setProfile(p.data as Profile);
      const o = await getOrdersCount();
      setOrdersCount(o.data);
      const f = await getFavoritesCount();
      setFavoritesCount(f.data);
      setLoading(false);
    })();
  }, []);

  const displayName = profile?.full_name || authProfile?.full_name || "Abdelrahman Sawi";
  const displayEmail = profile?.email || authProfile?.email || "abdelrahman@gmail.com";

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: async () => { await signOut(); router.replace("/(auth)/login" as any); } },
    ]);
  };

  if (loading) {
    return <View style={{ flex: 1, backgroundColor: C.background, justifyContent: "center", alignItems: "center", paddingTop: insets.top }}><ActivityIndicator size="large" color={C.textPrimary} /></View>;
  }

  const MenuItem = ({ icon, title, subtitle, badge, onPress, isLast }: any) => (
    <Pressable onPress={onPress} style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 18, paddingVertical: 16, backgroundColor: C.card, borderBottomWidth: isLast ? 0 : 1, borderBottomColor: C.searchBg }}>
      <Ionicons name={icon} size={22} color={C.textSecondary} style={{ width: 28 }} />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={{ fontSize: 14, fontWeight: "700", color: C.textPrimary }}>{title}</Text>
        <Text style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>{subtitle}</Text>
      </View>
      {badge !== null && badge !== undefined ? (
        <View style={{ backgroundColor: C.searchBg, minWidth: 24, height: 22, borderRadius: 11, justifyContent: "center", alignItems: "center", paddingHorizontal: 6, marginRight: 8, borderWidth: 1, borderColor: C.border }}>
          <Text style={{ fontSize: 11, fontWeight: "800", color: C.textSecondary }}>{badge}</Text>
        </View>
      ) : null}
      <Ionicons name="chevron-forward" size={16} color={C.textMuted} />
    </Pressable>
  );

  return (
    <View style={{ flex: 1, backgroundColor: C.background }}>
      <View style={{ paddingTop: insets.top + 6, paddingBottom: 14, alignItems: "center", backgroundColor: C.background }}>
        <Text style={{ fontSize: 20, fontWeight: "900", color: C.textPrimary, letterSpacing: 0.3 }}>Account</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 110 }}>
        <View style={{ backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.border, padding: 14, flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
          <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: C.searchBg, borderWidth: 1.5, borderColor: C.border, justifyContent: "center", alignItems: "center", overflow: "hidden" }}>
            {profile?.avatar_url ? <Image source={{ uri: profile.avatar_url }} style={{ width: "100%", height: "100%" }} /> : <Ionicons name="person" size={26} color={C.textMuted} />}
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={{ fontSize: 15, fontWeight: "800", color: C.textPrimary }} numberOfLines={1}>{displayName}</Text>
            <Text style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }} numberOfLines={1}>{displayEmail}</Text>
            <Pressable onPress={() => router.push("/profile/edit" as any)} style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 }}>
              <Ionicons name="pencil" size={12} color={C.textSecondary} />
              <Text style={{ fontSize: 11, fontWeight: "700", color: C.textSecondary }}>Edit Profile</Text>
            </Pressable>
          </View>
        </View>

        <View style={{ backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.border, overflow: "hidden" }}>
          <MenuItem icon="clipboard-outline" title="My Orders" subtitle="Track your orders and view history" badge={ordersCount ?? 3} onPress={() => router.push("/(customer)/orders" as any)} />
          <MenuItem icon="heart-outline" title="Favorites" subtitle="Your saved products" badge={favoritesCount ?? 12} onPress={() => router.push("/favorite" as any)} />
          <MenuItem icon="location-outline" title="Saved Addresses" subtitle="Manage your delivery addresses" onPress={() => router.push("/addresses" as any)} />
          <MenuItem icon="card-outline" title="Payment Methods" subtitle="Cards and other payment options" onPress={() => router.push("/payment-methods" as any)} />
          <MenuItem icon="notifications-outline" title="Notifications" subtitle="Order updates and offers" onPress={() => router.push("/notifications" as any)} />
          <MenuItem icon="help-circle-outline" title="Help & Support" subtitle="FAQs and contact us" onPress={() => router.push("/help" as any)} />
          <MenuItem icon="settings-outline" title="Settings" subtitle="App preferences and account" onPress={() => router.push("/profile/settings" as any)} />
          <Pressable onPress={handleLogout} style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 18, paddingVertical: 16, backgroundColor: C.card }}>
            <Ionicons name="log-out-outline" size={22} color={C.textSecondary} style={{ width: 28 }} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: C.textPrimary }}>Log Out</Text>
              <Text style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>Sign out from your account</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={C.textMuted} />
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}