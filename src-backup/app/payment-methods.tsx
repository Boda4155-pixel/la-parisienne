import { Banknote } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { I18nManager } from "react-native";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { useSupabaseQuery } from "../../hooks/useSupabaseQuery";
import { supabase } from "../../lib/supabase";

const getPaymentMethods = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase.from("payment_methods").select("*").eq("user_id", user?.id);
  if (error) throw error;
  return data;
};

export default function PaymentMethods() {
  const { t } = useTranslation();
  const isRTL = I18nManager.isRTL;
  const { data, loading } = useSupabaseQuery({ fn: getPaymentMethods });

  return (
    <ScrollView className="flex-1 bg-[#FDFBF7] p-5">
      <Text className="text-[18px] font-bold mb-4" style={{ textAlign: isRTL ? "right" : "left" }}>
        {t("profile.paymentMethods")}
      </Text>

      <View className="bg-white rounded-2xl p-4 flex-row items-center gap-x-3 border border-[#F2EFE9] mb-3">
        <View className="size-10 bg-[#FAF6F0] rounded-full items-center justify-center">
          <Banknote size={20} color="#8B6F47" />
        </View>
        <View>
          <Text className="font-semibold" style={{ textAlign: isRTL ? "right" : "left" }}>
            {t("checkout.cashOnDelivery")}
          </Text>
          <Text className="text-[12px] text-gray-500" style={{ textAlign: isRTL ? "right" : "left" }}>
            {t("payment.cashDesc")}
          </Text>
        </View>
        <View className="ml-auto bg-green-100 px-2 py-1 rounded-full">
          <Text className="text-[10px] text-green-700">{t("payment.defaultLabel")}</Text>
        </View>
      </View>

      {loading && <ActivityIndicator className="mt-10" />}
      {data?.map((m: any) => (
        <View key={m.id} className="bg-white rounded-2xl p-4 mt-3 border border-[#F2EFE9]">
          <Text className="font-semibold" style={{ textAlign: isRTL ? "right" : "left" }}>
            {m.card_brand} •••• {m.last4}
          </Text>
        </View>
      ))}
      {data?.length === 0 && !loading && (
        <Text className="text-center text-gray-400 mt-6 text-[13px]" style={{ textAlign: isRTL ? "right" : "center" }}>
          {t("payment.noSavedCards")}
        </Text>
      )}
    </ScrollView>
  );
}