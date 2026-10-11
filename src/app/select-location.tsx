import { useTranslation } from "react-i18next";
import { I18nManager } from "react-native";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SelectLocation() {
  const { t } = useTranslation();
  const isRTL = I18nManager.isRTL;

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: "#FFFBF5",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <View style={{ alignItems: "center", gap: 12, marginBottom: 24 }}>
        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: 36,
            borderWidth: 2,
            borderColor: "#D4B57A",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: "#8B6F47", fontSize: 32, fontWeight: "800" }}>
            LP
          </Text>
        </View>
        <Text
          style={{ color: "#8B6F47", fontSize: 22, fontWeight: "300", letterSpacing: 2 }}
        >
          {t("common.brandName")}
        </Text>
        <Text style={{ color: "#8B6F47", fontSize: 13 }}>
          {t("auth.brandTagline")}
        </Text>
      </View>
      <Text style={{ fontSize: 22, fontWeight: "800", textAlign: isRTL ? "right" : "center", marginBottom: 8 }}>
        {t("selectLocation.title")}
      </Text>
      <Text style={{ fontSize: 13, color: "#8E8E8E", textAlign: isRTL ? "right" : "center", marginBottom: 24 }}>
        {t("selectLocation.subtitle")}
      </Text>
      <Pressable
        onPress={() => router.replace("/(customer)/home" as any)}
        style={{
          backgroundColor: "#D4B57A",
          paddingHorizontal: 36,
          paddingVertical: 16,
          borderRadius: 28,
        }}
      >
        <Text style={{ color: "#1A1A1A", fontWeight: "900", fontSize: 16 }}>
          {t("orderSuccess.backHome")}
        </Text>
      </Pressable>
    </SafeAreaView>
  );
}