import { router } from "expo-router";
import {
  Bell,
  CreditCard,
  Headphones,
  Heart,
  MapPin,
  Package,
  Pencil,
  Settings as SettingsIcon,
  User,
} from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import ProfileRow from "../../../components/ProfileRow";
import { useSupabaseQuery } from "../../../hooks/useSupabaseQuery";
import { getFavoritesCount, getOrdersCount } from "../../../lib/queries";
import { useAuthStore } from "../../../store/auth.store";

export default function Profile() {
  const { t } = useTranslation();
  const profile = useAuthStore((state) => state.profile);
  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);

  const { data: ordersCount } = useSupabaseQuery({
    fn: getOrdersCount,
    params: { userId: user?.id ?? "" },
    skip: !user,
  });

  const { data: favoritesCount } = useSupabaseQuery({
    fn: getFavoritesCount,
    params: { userId: user?.id ?? "" },
    skip: !user,
  });

  const handleSignOut = () => {
    Alert.alert(t("profile.logoutTitle"), t("profile.logoutConfirm"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("profile.logout"),
        style: "destructive",
        onPress: () => signOut(),
      },
    ]);
  };

  const showComingSoon = () => {
    Alert.alert(t("profile.comingSoonTitle"), t("profile.comingSoonMessage"));
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-5 py-3">
        <Text className="h1-bold text-dark-100 text-center">
          {t("tabs.account")}
        </Text>
      </View>

      <ScrollView
        contentContainerClassName="px-5 pb-10"
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Card */}
        <View className="bg-gray-50 rounded-3xl p-5 flex-row items-center gap-x-4 mt-2">
          <View className="size-16 rounded-full bg-white border border-gray-200 items-center justify-center">
            <User size={28} color="#9CA3AF" />
          </View>

          <View className="flex-1">
            <Text className="h3-bold text-dark-100">
              {profile?.full_name || t("profile.guest")}
            </Text>
            <Text className="paragraph-regular text-gray-100 mt-0.5">
              {profile?.email}
            </Text>

            <Pressable
              onPress={() => router.push("/profile/edit")}
              className="flex-row items-center gap-x-1.5 mt-2"
            >
              <Pencil size={14} color="#FE8C00" />
              <Text className="small-bold text-primary">
                {t("profile.editProfile")}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Main List */}
        <View className="mt-6">
          <ProfileRow
            icon={<Package size={18} color="#FE8C00" />}
            label={t("profile.myOrders")}
            subtitle={t("profile.myOrdersSubtitle")}
            badge={ordersCount ?? undefined}
            onPress={() => router.push("/orders")}
          />

          <ProfileRow
            icon={<Heart size={18} color="#FE8C00" />}
            label={t("profile.favorites")}
            subtitle={t("profile.favoritesSubtitle")}
            badge={favoritesCount ?? undefined}
            onPress={() => router.push("/(tabs)/favorite")}
          />

          <ProfileRow
            icon={<MapPin size={18} color="#FE8C00" />}
            label={t("profile.savedAddresses")}
            subtitle={t("profile.savedAddressesSubtitle")}
            onPress={() => router.push("/address")}
          />

          <ProfileRow
            icon={<CreditCard size={18} color="#FE8C00" />}
            label={t("profile.paymentMethods")}
            subtitle={t("profile.paymentMethodsSubtitle")}
            onPress={showComingSoon}
          />

          <ProfileRow
            icon={<Bell size={18} color="#FE8C00" />}
            label={t("profile.notifications")}
            subtitle={t("profile.notificationsSubtitle")}
            onPress={showComingSoon}
          />

          <ProfileRow
            icon={<Headphones size={18} color="#FE8C00" />}
            label={t("profile.help")}
            subtitle={t("profile.helpSubtitle")}
            onPress={showComingSoon}
          />

          <ProfileRow
            icon={<SettingsIcon size={18} color="#FE8C00" />}
            label={t("profile.settings")}
            subtitle={t("profile.settingsSubtitle")}
            onPress={() => router.push("/profile/settings")}
          />
        </View>

        {/* Logout */}
        <Pressable
          onPress={handleSignOut}
          className="flex-row items-center justify-between border border-red-200 rounded-2xl p-4 mt-6"
        >
          <View className="flex-row items-center gap-x-3">
            <View className="size-10 rounded-full bg-red-50 items-center justify-center">
              <Package size={18} color="#EF4444" />
            </View>
            <View>
              <Text className="paragraph-bold text-red-500">
                {t("profile.logout")}
              </Text>
              <Text className="small-regular text-gray-100">
                {t("profile.logoutSubtitle")}
              </Text>
            </View>
          </View>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
