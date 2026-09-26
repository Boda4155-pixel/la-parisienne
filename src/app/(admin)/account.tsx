import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Switch,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { LogOut, Mail, Calendar, Shield } from "lucide-react-native";

import { useAuthStore } from "../../../store/auth.store";
import { changeAppLanguage } from "../../../i18next/i18next";
import AdminMoreTrigger from "../../../components/admin/AdminMoreTrigger";

type LanguageOption = {
  lang: string;
  label: { en: string; ar: string; fr: string };
  flag: string;
};

const LANGUAGES: LanguageOption[] = [
  { lang: "ar", label: { en: "العربية", ar: "العربية", fr: "العربية" }, flag: "🇪🇬" },
  { lang: "en", label: { en: "English", ar: "English", fr: "English" }, flag: "🇬🇧" },
  { lang: "fr", label: { en: "Français", ar: "Français", fr: "Français" }, flag: "🇫🇷" },
];

const ROLE_LABELS: Record<string, { en: string; ar: string; fr: string }> = {
  admin: { en: "ADMINISTRATOR", ar: "مسؤول", fr: "ADMINISTRATEUR" },
  cashier: { en: "CASHIER", ar: "كاشير", fr: "CAISSIER" },
  supervisor: { en: "SUPERVISOR", ar: "مشرف", fr: "SUPERVISEUR" },
  delivery: { en: "DELIVERY", ar: "توصيل", fr: "LIVRAISON" },
};

export default function AccountScreen() {
  const { t, i18n } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState<string>(i18n.language || "en");
  const [pushNotifications, setPushNotifications] = useState(true);
  const [soundAlerts, setSoundAlerts] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const { profile, signOut } = useAuthStore();
  const isRTL = i18n.dir() === "rtl";

  const getInitials = (name?: string | null): string => {
    if (!name) return "?";
    const parts = name.split(" ");
    const initials = parts.map((p) => p[0]).join("").toUpperCase().slice(0, 2);
    return initials || "?";
  };

  const handleLanguageChange = async (lang: string) => {
    try {
      await changeAppLanguage(lang);
      setSelectedLanguage(lang);
    } catch (err) {
      console.error("Language change error:", err);
      Alert.alert(t("common.error"), t("common.somethingWentWrong"));
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await signOut();
      Alert.alert(
        t("common.success") || "Success",
        t("admin.account.logoutSuccess") || "Logged out successfully"
      );
      // Navigate to sign-in - router import would be needed
    } catch (err: any) {
      console.error("Logout error:", err);
      Alert.alert(t("common.error"), err?.message || t("common.somethingWentWrong"));
    } finally {
      setLoggingOut(false);
    }
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(true);
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  const executeLogout = () => {
    setShowLogoutConfirm(false);
    handleLogout();
  };

  // Format date
  const formatDate = (dateStr: string | null): string => {
    if (!dateStr) return "";
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    try {
      return new Date(dateStr).toLocaleDateString("en-US", options);
    } catch {
      return dateStr;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>{t("admin.account.title")}</Text>
            <Text style={styles.subtitle}>
              {isRTL ? "إدارة الحساب والإعدادات" : "Manage your account settings"}
            </Text>
          </View>
          <AdminMoreTrigger />
        </View>

        {/* Card 1: Profile Header */}
        <View style={styles.card}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{getInitials(profile?.full_name)}</Text>
                <Pressable style={styles.editBadge}>
                  <Shield size={12} color="#FFFFFF" />
                </Pressable>
              </View>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{profile?.full_name || "Admin"}</Text>
              <View style={styles.roleBadge}>
                <Text style={styles.roleText}>
                  {ROLE_LABELS[profile?.role as keyof typeof ROLE_LABELS]?.[isRTL ? "ar" : "en"] ||
                    (isRTL ? "مسؤول" : "Administrator")}
                </Text>
              </View>
            </View>
          </View>

          {/* Email */}
          <View style={styles.infoRow}>
            <Mail size={16} color="#181C2E" />
            <Text style={styles.infoLabel}>{isRTL ? "البريد الإلكتروني" : "Email"}</Text>
            <Text style={styles.infoValue}>{profile?.email || "admin@app.com"}</Text>
          </View>

          {/* Registration Date */}
          {profile?.created_at && (
            <View style={styles.infoRow}>
              <Calendar size={16} color="#181C2E" />
              <Text style={styles.infoLabel}>{isRTL ? "تاريخ التسجيل" : "Member Since"}</Text>
              <Text style={styles.infoValue}>{formatDate(profile.created_at)}</Text>
            </View>
          )}
        </View>

        {/* Card 2: Application Preferences */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {isRTL ? "تفضيلات التطبيق" : "Application Preferences"}
          </Text>

          {/* Language Selector */}
          <View style={styles.languageSection}>
            <Text style={styles.languageLabel}>
              {isRTL ? "اللغة" : "Language"}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.languageChipsContainer}
            >
              {LANGUAGES.map((lang) => (
                <Pressable
                  key={lang.lang}
                  style={[
                    styles.languageChip,
                    selectedLanguage === lang.lang && styles.languageChipSelected,
                  ]}
                  onPress={() => handleLanguageChange(lang.lang)}
                >
                  <Text style={[
                    styles.languageChipText,
                    selectedLanguage === lang.lang && styles.languageChipTextSelected,
                  ]}>
                    {lang.flag} {lang.label[isRTL ? "ar" : "en"]}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Notification Settings */}
          <View style={styles.toggleRow}>
            <View>
              <Text style={styles.toggleLabel}>
                {isRTL ? "تفعيل إشعارات الدفع" : "Push Notifications"}
              </Text>
              <Text style={styles.toggleSubtitle}>
                {isRTL ? "تلقي تنبيهات الطلب" : "Receive order alerts"}
              </Text>
            </View>
            <Switch
              trackColor={{ false: "#F3F4F6", true: "#C09248" }}
              thumbColor="#FFFFFF"
              value={pushNotifications}
              onValueChange={setPushNotifications}
            />
          </View>

          <View style={styles.toggleRow}>
            <View>
              <Text style={styles.toggleLabel}>
                {isRTL ? "تفعيل تنبيهات الصوت" : "Sound Alerts"}
              </Text>
              <Text style={styles.toggleSubtitle}>
                {isRTL ? "تنبيهات صوتية للطلبات الجديدة" : "Audio alerts for new orders"}
              </Text>
            </View>
            <Switch
              trackColor={{ false: "#F3F4F6", true: "#C09248" }}
              thumbColor="#FFFFFF"
              value={soundAlerts}
              onValueChange={setSoundAlerts}
            />
          </View>
        </View>

        {/* Card 3: Security & Management */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {isRTL ? "الأمان والإدارة" : "Security & Management"}
          </Text>

          <Pressable style={styles.menuItem} onPress={() => {}}>
            <Shield size={20} color="#C09248" />
            <Text style={styles.menuItemText}>
              {isRTL ? "تغيير كلمة المرور" : "Change Password"}
            </Text>
          </Pressable>

          <Pressable style={styles.menuItem} onPress={() => {}}>
            <Shield size={20} color="#C09248" />
            <Text style={styles.menuItemText}>
              {isRTL ? "إدارة الصلاحيات" : "Manage Roles & Permissions"}
            </Text>
          </Pressable>
        </View>

        {/* Card 4: App Information */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {isRTL ? "معلومات التطبيق" : "App Information"}
          </Text>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>
              {isRTL ? "إصدار التطبيق" : "App Version"}
            </Text>
            <Text style={styles.infoValue}>v1.0.0 La Parisienne Admin</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>
              {isRTL ? "حالة الاتصال" : "Connection Status"}
            </Text>
            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Connected</Text>
            </View>
          </View>
        </View>

        {/* Card 5: Danger Zone */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {isRTL ? "منطقة الخطر" : "Danger Zone"}
          </Text>

          <Pressable
            style={styles.dangerButton}
            onPress={confirmLogout}
            disabled={loggingOut}
          >
            {loggingOut ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <LogOut size={20} color="#FFFFFF" />
                <Text style={styles.dangerButtonText}>
                  {isRTL ? "تسجيل الخروج" : "Log Out"}
                </Text>
              </>
            )}
          </Pressable>
        </View>

        {/* Logout Confirmation Modal */}
        {showLogoutConfirm && (
          <View style={styles.modalOverlay}>
            <View style={styles.modal}>
              <Text style={styles.modalTitle}>
                {isRTL ? "تأكيد تسجيل الخروج" : "Confirm Logout"}
              </Text>
              <Text style={styles.modalMessage}>
                {isRTL
                  ? "هل أنت متأكد من رغبتك في تسجيل الخروج؟ سيتم إغلاق جميع الجلسات."
                  : "Are you sure you want to log out? All sessions will be closed."}
              </Text>
              <View style={styles.modalButtons}>
                <Pressable style={styles.modalButton} onPress={cancelLogout}>
                  <Text style={styles.modalButtonText}>
                    {isRTL ? "إلغاء" : "Cancel"}
                  </Text>
                </Pressable>
                <Pressable
                  style={[styles.modalButton, styles.modalButtonDestructive]}
                  onPress={executeLogout}
                >
                  <Text style={styles.modalButtonTextDestructive}>
                    {isRTL ? "تسجيل الخروج" : "Logout"}
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FDF8F3",
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    fontFamily: "Quicksand-Bold",
    color: "#181C2E",
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Quicksand-Regular",
    color: "#878787",
    marginTop: 4,
  },

  // Card
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#181C2E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Quicksand-Bold",
    color: "#181C2E",
    marginBottom: 16,
  },

  // Profile Header
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#C09248",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 28,
    fontWeight: "700",
    fontFamily: "Quicksand-Bold",
    color: "#FFFFFF",
  },
  editBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#FE8C00",
    borderRadius: 12,
    padding: 4,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: "700",
    fontFamily: "Quicksand-Bold",
    color: "#181C2E",
    marginBottom: 8,
  },
  roleBadge: {
    backgroundColor: "#FE8C0020",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  roleText: {
    fontSize: 12,
    fontWeight: "700",
    fontFamily: "Quicksand-Bold",
    color: "#C09248",
    textTransform: "uppercase",
  },

  // Info Row
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 11,
    fontFamily: "Quicksand-Regular",
    color: "#878787",
    textTransform: "uppercase",
    marginLeft: 16,
  },
  infoValue: {
    fontSize: 14,
    fontFamily: "Quicksand-Regular",
    color: "#6B7280",
    marginLeft: 8,
  },

  // Language Selector
  languageSection: {
    marginBottom: 20,
  },
  languageLabel: {
    fontSize: 14,
    fontFamily: "Quicksand-Medium",
    color: "#181C2E",
    marginBottom: 12,
  },
  languageChipsContainer: {
    flexDirection: "row",
  },
  languageChip: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginRight: 8,
  },
  languageChipSelected: {
    backgroundColor: "#C09248",
    borderColor: "#C09248",
  },
  languageChipText: {
    fontSize: 12,
    fontFamily: "Quicksand-Medium",
    color: "#878787",
  },
  languageChipTextSelected: {
    color: "#FFFFFF",
  },

  // Toggle Rows
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  toggleLabel: {
    fontSize: 14,
    fontFamily: "Quicksand-Medium",
    color: "#181C2E",
  },
  toggleSubtitle: {
    fontSize: 11,
    fontFamily: "Quicksand-Regular",
    color: "#878787",
    marginTop: 2,
  },
  toggleSwitch: {
    width: 44,
    height: 24,
  },

  // Menu Item
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  menuItemText: {
    fontSize: 14,
    fontFamily: "Quicksand-Regular",
    color: "#181C2E",
    marginLeft: 16,
    flex: 1,
  },

  // Status Badge
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10B981",
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontFamily: "Quicksand-Regular",
    color: "#6B7287",
  },

  // Danger Button
  dangerButton: {
    backgroundColor: "#EF4444",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    shadowColor: "#181C2E",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  dangerButtonText: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: "Quicksand-Bold",
    color: "#FFFFFF",
  },

  // Modal
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#00000066",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modal: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 20,
    shadowColor: "#181C2E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "Quicksand-Bold",
    color: "#181C2E",
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 14,
    fontFamily: "Quicksand-Regular",
    color: "#6B7287",
    marginBottom: 20,
    textAlign: "center",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  modalButtonText: {
    fontSize: 14,
    fontFamily: "Quicksand-Medium",
    color: "#181C2E",
  },
  modalButtonDestructive: {
    backgroundColor: "#EF4444",
  },
  modalButtonTextDestructive: {
    fontSize: 14,
    fontFamily: "Quicksand-Medium",
    color: "#FFFFFF",
  },
});