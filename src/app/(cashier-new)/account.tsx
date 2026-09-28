import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "../../../store/auth.store";
import { UserRound, Bell, Settings, Shield, LogOut } from "lucide-react-native";

const GOLD = "#C9973F";
const DARK = "#1A1512";
const MUTED = "#6B6359";
const TERTIARY = "#9C9488";
const BORDER = "#E8E4DC";
const SUCCESS = "#2F7D46";
const CANVAS = "#F7F3EC";
const CARD_BG = "#FFFFFF";

export default function CashierNewAccount() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const insets = useSafeAreaInsets();
  const { profile, signOut } = useAuthStore();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [orderAlertsEnabled, setOrderAlertsEnabled] = useState(true);

  const LANGUAGES = [
    { code: "en", name: "English", nativeName: "English" },
    { code: "ar", name: "Arabic", nativeName: "العربية" },
    { code: "fr", name: "French", nativeName: "Français" },
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
      Alert.alert(t("common.success", "Success"), t("cashier.settings.signedOut", "Signed out successfully"));
    } catch (error: any) {
      Alert.alert(t("common.error", "Error"), error.message ?? t("cashier.settings.failedToSignOut", "Failed to sign out"));
    }
  };

  const handleLanguageChange = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
  };

  const handleNotificationsToggle = () => setNotificationsEnabled(!notificationsEnabled);
  const handleOrderAlertsToggle = () => setOrderAlertsEnabled(!orderAlertsEnabled);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 8 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Section */}
        <View style={styles.section}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarWrap}>
              <UserRound size={40} color={GOLD} />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.label}>{t("cashier.settings.name", "Name")}</Text>
              <Text style={styles.value}>{profile?.full_name ?? "—"}</Text>
              <Text style={styles.label}>{t("cashier.settings.email", "Email")}</Text>
              <Text style={styles.value}>{profile?.email ?? "—"}</Text>
              <Text style={styles.label}>{t("cashier.settings.phone", "Phone")}</Text>
              <Text style={styles.value}>{profile?.phone ?? "—"}</Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>{t("cashier.settings.cashier", "Cashier")}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Language Section */}
        <View style={styles.section}>
          <View style={styles.sectionTitle}>
            <Settings size={20} color={TERTIARY} />
            <Text style={styles.sectionTitleText}>{t("cashier.settings.language", "Language")}</Text>
          </View>
          {LANGUAGES.map((lang) => (
            <Pressable
              key={lang.code}
              onPress={() => handleLanguageChange(lang.code)}
              style={styles.languageItem}
            >
              <View style={{ flexDirection: isRTL ? "row-reverse" : "row", gap: 8 }}>
                <Text style={styles.languageText}>{lang.nativeName}</Text>
                {i18n.language === lang.code && <View style={styles.checkmark} />}
              </View>
              {i18n.language === lang.code && <Text style={styles.selectedDot}>✓</Text>}
            </Pressable>
          ))}
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <View style={styles.sectionTitle}>
            <Bell size={20} color={TERTIARY} />
            <Text style={styles.sectionTitleText}>
              {t("cashier.settings.notifications", "Notifications")}
            </Text>
          </View>
          <Pressable style={styles.toggleRow} onPress={handleNotificationsToggle}>
            <View style={{ flexDirection: isRTL ? "row-reverse" : "row" }}>
              <Text style={styles.toggleLabel}>
                {t("cashier.settings.pushNotifications", "Push Notifications")}
              </Text>
            </View>
            <View style={styles.toggleSwitch}>
              <View
                style={[
                  styles.toggleThumb,
                  { backgroundColor: notificationsEnabled ? SUCCESS : "#E5E7EB" },
                ]}
              />
            </View>
          </Pressable>
          <Pressable style={styles.toggleRow} onPress={handleOrderAlertsToggle}>
            <View style={{ flexDirection: isRTL ? "row-reverse" : "row" }}>
              <Text style={styles.toggleLabel}>
                {t("cashier.settings.orderAlerts", "Order Alerts")}
              </Text>
            </View>
            <View style={styles.toggleSwitch}>
              <View
                style={[
                  styles.toggleThumb,
                  { backgroundColor: orderAlertsEnabled ? SUCCESS : "#E5E7EB" },
                ]}
              />
            </View>
          </Pressable>
        </View>

        {/* Security Section */}
        <View style={styles.section}>
          <View style={styles.sectionTitle}>
            <Shield size={20} color={TERTIARY} />
            <Text style={styles.sectionTitleText}>{t("cashier.settings.security", "Security")}</Text>
          </View>
          <Pressable style={styles.actionRow} onPress={() => Alert.alert(t("cashier.settings.comingSoon", "Coming soon"), t("cashier.settings.changePin", "Change PIN"))}>
            <View style={{ flexDirection: isRTL ? "row-reverse" : "row" }}>
              <Text style={styles.actionText}>{t("cashier.settings.changePin", "Change PIN")}</Text>
            </View>
          </Pressable>
          <Pressable style={styles.actionRow} onPress={() => Alert.alert(t("cashier.settings.comingSoon", "Coming soon"), t("cashier.settings.biometricAuth", "Biometric Auth"))}>
            <View style={{ flexDirection: isRTL ? "row-reverse" : "row" }}>
              <Text style={styles.actionText}>{t("cashier.settings.biometricAuth", "Biometric Auth")}</Text>
            </View>
          </Pressable>
        </View>

        {/* Sign Out */}
        <Pressable style={styles.signOutBtn} onPress={handleSignOut}>
          <View style={{ flexDirection: isRTL ? "row-reverse" : "row", gap: 8 }}>
            <LogOut size={18} color="#FFFFFF" />
            <Text style={styles.signOutText}>{t("cashier.settings.signOut", "Sign Out")}</Text>
          </View>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CANVAS },
  scroll: { paddingBottom: 24 },
  section: { marginHorizontal: 16, marginBottom: 16 },
  profileHeader: { flexDirection: "row", alignItems: "center", gap: 16, paddingVertical: 16 },
  avatarWrap: { width: 56, height: 56, borderRadius: 28, backgroundColor: CARD_BG, justifyContent: "center", alignItems: "center" },
  profileInfo: { gap: 4 },
  label: { fontSize: 12, color: MUTED },
  value: { fontSize: 14, fontWeight: "600", color: DARK },
  roleBadge: { backgroundColor: "#FAF3E7", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  roleText: { fontSize: 10, fontWeight: "600", color: "#B37F2C" },
  sectionTitle: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  sectionTitleText: { fontSize: 16, fontWeight: "600", color: DARK },
  languageItem: { paddingVertical: 12, borderBottomWidth: 1, borderColor: BORDER },
  languageText: { fontSize: 14, color: DARK },
  checkmark: { width: 12, height: 12, borderRadius: 6, backgroundColor: GOLD },
  selectedDot: { fontSize: 10, color: GOLD },
  toggleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderColor: BORDER },
  toggleLabel: { fontSize: 14, color: DARK },
  toggleSwitch: { width: 40, height: 20, borderRadius: 10, backgroundColor: "#E5E7EB", justifyContent: "center", alignItems: "center", overflow: "hidden" },
  toggleThumb: { width: 16, height: 16, borderRadius: 8, marginLeft: 2 },
  actionRow: { paddingVertical: 12, borderBottomWidth: 1, borderColor: BORDER },
  actionText: { fontSize: 14, color: DARK },
  signOutBtn: { marginHorizontal: 16, marginVertical: 8, paddingVertical: 12, borderRadius: 12, backgroundColor: "#C0392B", justifyContent: "center", alignItems: "center" },
  signOutText: { fontSize: 14, fontWeight: "600", color: "#FFFFFF" },
});