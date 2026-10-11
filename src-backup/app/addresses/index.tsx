import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { I18nManager } from "react-native";
import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../../lib/supabase";
import { useAuthStore } from "../../../store/auth.store";

export default function Addresses() {
  const { t } = useTranslation();
  const isRTL = I18nManager.isRTL;
  const user = useAuthStore((s: any) => s.user);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user?.id) return;
    setLoading(true);
    const { data } = await supabase.from("addresses").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setData(data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, [user?.id]);

  if (loading) return <View className="flex-1 justify-center items-center bg-white"><ActivityIndicator /></View>;

  return (
    <SafeAreaView className="flex-1 bg-white px-5">
      <View className="flex-row justify-between items-center py-4">
        <Text className="text-2xl font-black" style={{ textAlign: isRTL ? "right" : "left" }}>{t("addresses.title")}</Text>
        <Pressable onPress={() => router.push("/addresses/add" as any)} className="bg-black h-10 px-5 rounded-full justify-center">
          <Text className="text-white font-bold" style={{ textAlign: isRTL ? "right" : "center" }}>{t("addresses.addNewAddress")}</Text>
        </Pressable>
      </View>
      <FlatList
        data={data}
        keyExtractor={i => i.id}
        ListEmptyComponent={<Text className="text-center text-gray-400 mt-20">{t("addresses.empty")}</Text>}
        renderItem={({ item }) => (
          <View className="border border-gray-200 p-4 rounded-2xl mb-3">
            <Text className="font-bold" style={{ textAlign: isRTL ? "right" : "left" }}>{item.label} - {item.full_name}</Text>
            <Text className="text-gray-500 mt-1" style={{ textAlign: isRTL ? "right" : "left" }}>{item.area}, {item.street}</Text>
            <Pressable
              onPress={() => Alert.alert(
                t("addresses.deleteTitle"),
                t("addresses.deleteConfirm"),
                [
                  { text: t("common.no"), style: "cancel" },
                  {
                    text: t("common.delete"),
                    style: "destructive",
                    onPress: async () => {
                      await supabase.from("addresses").delete().eq("id", item.id);
                      load();
                    },
                  },
                ]
              )}
            >
              <Text className="text-red-500 text-xs mt-2">{t("common.delete")}</Text>
            </Pressable>
          </View>
        )}
      />
    </SafeAreaView>
  );
}