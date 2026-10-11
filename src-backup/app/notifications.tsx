import { useTranslation } from "react-i18next";
import { I18nManager } from "react-native";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { getNotifications, markNotificationRead } from "../../lib/queries";

export default function NotificationsScreen() {
  const { t } = useTranslation();
  const isRTL = I18nManager.isRTL;
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const res = await getNotifications();
    setData(res.data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  if (loading) return <View className="flex-1 items-center justify-center bg-[#FDFBF7]"><ActivityIndicator /></View>;

  return (
    <ScrollView className="flex-1 bg-[#FDFBF7] p-5">
      <Text className="text-[18px] font-bold mb-4" style={{ textAlign: isRTL ? "right" : "left" }}>
        {t("profile.notifications")}
      </Text>
      {data.length === 0 && (
        <Text className="text-center mt-20 text-gray-400">
          {t("notifications.empty")}
        </Text>
      )}
      {data.map((n: any) => (
        <Pressable
          key={n.id}
          onPress={async () => { await markNotificationRead({ id: n.id }); load(); }}
          className={`bg-white rounded-2xl p-4 mb-3 border ${n.is_read ? "border-[#F2EFE9]" : "border-[#D4B57A]"}`}
        >
          <Text className="font-bold" style={{ textAlign: isRTL ? "right" : "left" }}>
            {n.title}
          </Text>
          <Text className="text-[12px] text-gray-500 mt-1" style={{ textAlign: isRTL ? "right" : "left" }}>
            {n.body}
          </Text>
          <Text className="text-[10px] text-gray-400 mt-2" style={{ textAlign: isRTL ? "right" : "left" }}>
            {new Date(n.created_at).toLocaleString()}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}