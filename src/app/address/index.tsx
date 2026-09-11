import { router } from "expo-router";
import { ChevronLeft, MapPin, Plus, Trash2 } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSupabaseQuery } from "../../../hooks/useSupabaseQuery";
import { deleteAddress, getAddresses } from "../../../lib/queries";
import { useAuthStore } from "../../../store/auth.store";

export default function Addresses() {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);

  const {
    data: addresses,
    loading,
    refetch,
  } = useSupabaseQuery({
    fn: getAddresses,
    params: { userId: user?.id ?? "" },
    skip: !user,
  });

  const handleDelete = (id: string) => {
    Alert.alert(t("addresses.deleteTitle"), t("addresses.deleteConfirm"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: async () => {
          if (!user) return;
          try {
            await deleteAddress({ id, userId: user.id });
            refetch({ userId: user.id });
          } catch {
            Alert.alert(t("common.somethingWentWrong"));
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center justify-between px-5 py-3">
        <Pressable onPress={() => router.back()}>
          <ChevronLeft size={24} color="#1a1a1a" />
        </Pressable>

        <Text className="h1-bold text-dark-100">{t("addresses.title")}</Text>

        <Pressable onPress={() => router.push("/address/add")}>
          <Plus size={24} color="#1a1a1a" />
        </Pressable>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#FE8C00" />
        </View>
      ) : (
        <FlatList
          data={addresses}
          keyExtractor={(item) => item.id}
          contentContainerClassName="px-5 pt-4 gap-y-3 pb-10"
          renderItem={({ item }) => (
            <View className="border border-gray-200 rounded-2xl p-4 flex-row items-start justify-between">
              <View className="flex-row items-start gap-x-3 flex-1">
                <MapPin size={20} color="#FE8C00" />

                <View className="flex-1">
                  <Text className="paragraph-bold text-dark-100">
                    {item.label || t("addresses.defaultLabel")}
                  </Text>
                  <Text className="paragraph-regular text-gray-100 mt-1">
                    {item.full_name} - {item.phone}
                  </Text>
                  <Text className="paragraph-regular text-gray-100">
                    {item.address_line}
                  </Text>
                </View>
              </View>

              <Pressable onPress={() => handleDelete(item.id)}>
                <Trash2 size={18} color="#EF4444" />
              </Pressable>
            </View>
          )}
          ListEmptyComponent={
            <View className="items-center py-16">
              <MapPin size={48} color="#D1D5DB" />
              <Text className="paragraph-regular text-gray-100 mt-4">
                {t("addresses.empty")}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
