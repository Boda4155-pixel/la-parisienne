import { router } from "expo-router";
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Headset,
  Heart,
  Info,
  LogOut,
  MapPin,
  Package,
  Settings as SettingsIcon,
  User as UserIcon,
} from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useSupabaseQuery } from "../../../hooks/useSupabaseQuery";
import { getFavoritesCount, getOrdersCount } from "../../../lib/queries";
import { useAuthStore } from "../../../store/auth.store";
import { useCartStore } from "../../../store/cart.store";

export default function Profile() {
  const { t } = useTranslation();
  const profile = useAuthStore((s) => s.profile);
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const clearCart = useCartStore((s: any) => s.clearCart);

  const { data: ordersCount } = useSupabaseQuery({
    fn: () => getOrdersCount(),
    skip:!user,
  });

  const { data: favoritesCount } = useSupabaseQuery({
    fn: () => getFavoritesCount(),
    skip:!user,
  });

  const handleSignOut = () => {
    Alert.alert(t("profile.logoutTitle"), t("profile.logoutConfirm"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("profile.logout"),
        style: "destructive",
        onPress: async () => {
          try {
            clearCart?.();
            await signOut();
            router.replace("/(auth)/login" as any);
          } catch (e: any) {
            Alert.alert("Error", e.message);
          }
        },
      },
    ]);
  };

  if (!user) {
    return (
      <SafeAreaView className="flex-1 bg-[#FDFBF7] justify-center items-center px-5">
        <View className="size-20 rounded-full bg-[#FAF6F0] items-center justify-center mb-4">
          <UserIcon size={32} color="#9CA3AF" />
        </View>
        <Text className="text-[18px] font-bold text-dark-100">{t("profile.guest")}</Text>
        <Pressable onPress={() => router.push("/(auth)/login" as any)} className="bg-[#1A1A1A] mt-6 px-8 py-3.5 rounded-2xl">
          <Text className="text-white font-bold">تسجيل الدخول</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const MenuItem = ({ icon: Icon, label, subtitle, onPress, badge }: any) => (
    <Pressable onPress={onPress} className="flex-row items-center justify-between py-[18px] px-5 bg-white active:bg-[#FAF6F0]">
      <View className="flex-row items-center gap-x-4 flex-1">
        <View className="size-10 rounded-full bg-[#FAF6F0] items-center justify-center">
          <Icon size={20} color="#8B6F47" strokeWidth={1.6} />
        </View>
        <View className="flex-1">
          <View className="flex-row items-center gap-x-2">
            <Text className="text-[15px] font-semibold text-[#1A1A1A]">{label}</Text>
            {badge > 0 && (
              <View className="bg-[#FE8C00] px-2 py-0.5 rounded-full min-w-[22px] items-center">
                <Text className="text-[11px] font-bold text-white">{badge}</Text>
              </View>
            )}
          </View>
          <Text className="text-[12px] text-[#9A9A9A] mt-0.5">{subtitle}</Text>
        </View>
      </View>
      <ChevronRight size={18} color="#C4C4C4" strokeWidth={1.5} />
    </Pressable>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#FDFBF7]" edges={["top"]}>
      <View className="flex-row items-center justify-between px-5 py-3 bg-[#FDFBF7]">
        <Pressable onPress={() => router.push("/profile/settings" as any)} className="size-9 items-center justify-center -ml-2">
          <SettingsIcon size={22} color="#1A1A1A" strokeWidth={1.7} />
        </Pressable>
        <Text className="text-[18px] font-bold text-[#1A1A1A] tracking-wide">My Account</Text>
        <Pressable onPress={() => router.canGoBack()? router.back() : router.push("/(tabs)" as any)} className="size-9 items-center justify-center -mr-2">
          <ChevronLeft size={24} color="#1A1A1A" style={{ transform: [{ scaleX: -1 }] }} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1" contentContainerStyle={{ paddingBottom: 120 }}>
        <Pressable onPress={() => router.push("/profile/edit" as any)} className="flex-row items-center px-6 py-6 gap-x-4">
          <View className="size-[68px] rounded-full bg-[#E8DDD0] items-center justify-center overflow-hidden border border-[#F0EDE8]">
            <UserIcon size={36} color="#8B6F47" />
          </View>
          <View className="flex-1">
            <Text className="text-[17px] font-bold text-[#1A1A1A]" numberOfLines={1}>
              {profile?.full_name || user?.email?.split("@")[0]}
            </Text>
            <Text className="text-[13px] text-[#8A8A8A] mt-1" numberOfLines={1}>
              {profile?.email || user?.email}
            </Text>
            <Text className="text-[11px] text-[#FE8C00] mt-1 font-semibold">Tap to edit →</Text>
          </View>
        </Pressable>

        <View className="mx-5 bg-white rounded-[20px] overflow-hidden border border-[#F2EFE9]">
          <MenuItem
            icon={Package}
            label="My Orders"
            subtitle="Track, view and manage your orders"
            badge={ordersCount}
            onPress={() => router.push("/(tabs)/orders" as any)}
          />
          <View className="h-[1px] bg-[#F7F3EF] mx-5" />
          <MenuItem icon={MapPin} label="Addresses" subtitle="Manage your delivery addresses" onPress={() => router.push("/addresses" as any)} />
          <View className="h-[1px] bg-[#F7F3EF] mx-5" />
          <MenuItem icon={CreditCard} label="Payment Methods" subtitle="Cards and cash on delivery" onPress={() => router.push("/payment-methods" as any)} />
          <View className="h-[1px] bg-[#F7F3EF] mx-5" />
          <MenuItem icon={Heart} label="Favorites" subtitle="Your saved items" badge={favoritesCount} onPress={() => router.push("/(tabs)/favorite" as any)} />
          <View className="h-[1px] bg-[#F7F3EF] mx-5" />
          <MenuItem icon={Bell} label="Notifications" subtitle="Order updates and promotions" onPress={() => router.push("/notifications" as any)} />
          <View className="h-[1px] bg-[#F7F3EF] mx-5" />
          <MenuItem icon={Headset} label="Help & Support" subtitle="FAQs and contact us" onPress={() => router.push("/help" as any)} />
          <View className="h-[1px] bg-[#F7F3EF] mx-5" />
          <MenuItem icon={Info} label="About La Parisienne" subtitle="Our story and values" onPress={() => router.push("/about" as any)} />
        </View>

        <Pressable onPress={handleSignOut} className="mx-5 mt-8 h-[52px] rounded-[14px] border border-[#D9D0C3] flex-row items-center justify-center gap-x-2 bg-[#FDFBF7]">
          <LogOut size={18} color="#8B6F47" strokeWidth={1.6} />
          <Text className="text-[14px] font-semibold text-[#8B6F47]">Log Out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}