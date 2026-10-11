import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getFavoritesCount, getOrdersCount, getProfile } from "../../../lib/queries";
import { useAuthStore } from "../../../store/auth.store";

type Profile = { id: string; full_name: string | null; email: string | null; phone: string | null; role: string; avatar_url: string | null };

export default function CustomerAccount() {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
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
    return <View style={{ flex: 1, backgroundColor: "#F9F6F0", justifyContent: "center", alignItems: "center", paddingTop: insets.top }}><ActivityIndicator size="large" color="#8B7355" /></View>;
  }

  const MenuItem = ({ icon, title, subtitle, badge, onPress, isLast }: any) => (
    <Pressable onPress={onPress} style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 18, paddingVertical: 16, backgroundColor: "#FFFCF8", borderBottomWidth: isLast ? 0 : 1, borderBottomColor: "#F2EDE3" }}>
      <Ionicons name={icon} size={22} color="#8B7355" style={{ width: 28 }} />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={{ fontSize: 14, fontWeight: "700", color: "#2B2117" }}>{title}</Text>
        <Text style={{ fontSize: 11, color: "#9A8B7A", marginTop: 2 }}>{subtitle}</Text>
      </View>
      {badge !== null && badge !== undefined ? (
        <View style={{ backgroundColor: "#F5F0E6", minWidth: 24, height: 22, borderRadius: 11, justifyContent: "center", alignItems: "center", paddingHorizontal: 6, marginRight: 8, borderWidth: 1, borderColor: "#EDE8DF" }}>
          <Text style={{ fontSize: 11, fontWeight: "800", color: "#8B7355" }}>{badge}</Text>
        </View>
      ) : null}
      <Ionicons name="chevron-forward" size={16} color="#C4B8A5" />
    </Pressable>
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#F9F6F0" }}>
      {/* Header like image */}
      <View style={{ paddingTop: insets.top + 6, paddingBottom: 14, alignItems: "center", backgroundColor: "#F9F6F0" }}>
        <Text style={{ fontSize: 20, fontWeight: "900", color: "#2B2117", letterSpacing: 0.3 }}>Account</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 110 }}>
        {/* Profile Card - same as image */}
        <View style={{ backgroundColor: "#FFFCF8", borderRadius: 16, borderWidth: 1, borderColor: "#EDE8DF", padding: 14, flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
          <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: "#F5F0E6", borderWidth: 1.5, borderColor: "#D9C5B0", justifyContent: "center", alignItems: "center", overflow: "hidden" }}>
            {profile?.avatar_url ? <Image source={{ uri: profile.avatar_url }} style={{ width: "100%", height: "100%" }} /> : <Ionicons name="person" size={26} color="#C4B8A5" />}
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={{ fontSize: 15, fontWeight: "800", color: "#2B2117" }} numberOfLines={1}>{displayName}</Text>
            <Text style={{ fontSize: 11, color: "#9A8B7A", marginTop: 2 }} numberOfLines={1}>{displayEmail}</Text>
            <Pressable onPress={() => router.push("/profile/edit" as any)} style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 }}>
              <Ionicons name="pencil" size={12} color="#8B7355" />
              <Text style={{ fontSize: 11, fontWeight: "700", color: "#8B7355" }}>Edit Profile</Text>
            </Pressable>
          </View>
        </View>

        {/* Menu - Exactly like screenshot */}
        <View style={{ backgroundColor: "#FFFCF8", borderRadius: 16, borderWidth: 1, borderColor: "#EDE8DF", overflow: "hidden" }}>
          <MenuItem icon="clipboard-outline" title="My Orders" subtitle="Track your orders and view history" badge={ordersCount ?? 3} onPress={() => router.push("/(customer)/orders" as any)} />
          <MenuItem icon="heart-outline" title="Favorites" subtitle="Your saved products" badge={favoritesCount ?? 12} onPress={() => router.push("/favorite" as any)} />
          <MenuItem icon="location-outline" title="Saved Addresses" subtitle="Manage your delivery addresses" onPress={() => router.push("/addresses" as any)} />
          <MenuItem icon="card-outline" title="Payment Methods" subtitle="Cards and other payment options" onPress={() => router.push("/payment-methods" as any)} />
          <MenuItem icon="notifications-outline" title="Notifications" subtitle="Order updates and offers" onPress={() => router.push("/notifications" as any)} />
          <MenuItem icon="help-circle-outline" title="Help & Support" subtitle="FAQs and contact us" onPress={() => router.push("/help" as any)} />
          <MenuItem icon="settings-outline" title="Settings" subtitle="App preferences and account" onPress={() => router.push("/profile/settings" as any)} />
          <Pressable onPress={handleLogout} style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 18, paddingVertical: 16, backgroundColor: "#FFFCF8" }}>
            <Ionicons name="log-out-outline" size={22} color="#8B7355" style={{ width: 28 }} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: "#2B2117" }}>Log Out</Text>
              <Text style={{ fontSize: 11, color: "#9A8B7A", marginTop: 2 }}>Sign out from your account</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#C4B8A5" />
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}