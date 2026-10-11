import { supabase } from "../../../lib/supabase";
import { getAllDeliveryZones, getAddresses } from "../../../lib/queries";
import { useAuthStore } from "../../../store/auth.store";
import { CUSTOMER_COLORS } from "../../../lib/customerTheme";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { router } from "expo-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  I18nManager,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft, Globe, Lock, Moon, Shield, Trash2, User, Bell, MapPin, Info, X } from "lucide-react-native";
import ActionSheet, { ActionSheetOption } from "../../../components/ActionSheet";
import { changeAppLanguage } from "../../../i18next/i18next";

const LANGUAGE_LABELS: Record<string, string> = {
  en: "English",
  ar: "العربية",
  fr: "Français",
};

// =========================================
// Types
// =========================================

type SettingRowProps = {
  icon: React.ReactNode;
  label: string;
  subtitle?: string;
  value?: string;
  onPress: () => void;
  last?: boolean;
  showChevron?: boolean;
};

type DeliveryZone = {
  id: string;
  label: string;
  time: string;
  fee: number;
};

type Address = {
  id: string;
  label: string;
  full_name: string;
  phone: string;
  address_line: string;
  street: string;
  area: string;
  city: string;
  is_default: boolean;
};

// =========================================
// Static Helper Components
// =========================================

const SettingsRow: React.FC<SettingRowProps> = ({
  icon,
  label,
  subtitle,
  value,
  onPress,
  last = false,
  showChevron = true,
}) => {
  const C = CUSTOMER_COLORS;
  const isRTL = I18nManager.isRTL;

  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 14,
        paddingHorizontal: 16,
        backgroundColor: C.card,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: C.border,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", flex: 1, gap: 12 }}>
        <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: C.searchBg, justifyContent: "center", alignItems: "center" }}>
          {icon}
        </View>
        <View style={{ flex: 1, alignItems: isRTL ? "flex-end" : "flex-start" }}>
          <Text style={{ fontSize: 15, fontWeight: "600", color: C.textPrimary, textAlign: isRTL ? "right" : "left" }}>{label}</Text>
          {subtitle ? <Text style={{ fontSize: 12, color: C.textSecondary, marginTop: 2, textAlign: isRTL ? "right" : "left" }}>{subtitle}</Text> : null}
        </View>
      </View>
      {value ? <Text style={{ fontSize: 13, color: C.textSecondary, marginRight: isRTL ? 0 : 8, marginLeft: isRTL ? 8 : 0 }}>{value}</Text> : null}
      {showChevron ? <ChevronLeft size={18} color={C.textSecondary} style={{ transform: [{ rotate: isRTL ? "180deg" : "0deg" }] }} /> : null}
    </Pressable>
  );
};

const SectionHeader: React.FC<{ title: string }> = ({ title }) => {
  const C = CUSTOMER_COLORS;
  const isRTL = I18nManager.isRTL;

  return (
    <Text
      style={{
        fontSize: 11,
        fontWeight: "700",
        color: C.textSecondary,
        textTransform: "uppercase",
        letterSpacing: 0.5,
        marginTop: 22,
        marginBottom: 8,
        paddingHorizontal: 4,
        textAlign: isRTL ? "right" : "left",
      }}
    >
      {title}
    </Text>
  );
};

const SettingsGroup: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const C = CUSTOMER_COLORS;
  return (
    <View
      style={{
        backgroundColor: C.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: C.border,
        overflow: "hidden",
        marginBottom: 6,
      }}
    >
      {children}
    </View>
  );
};

const NotificationRow: React.FC<{
  icon: React.ReactNode;
  label: string;
  subtitle?: string;
  value: boolean;
  onValueChange: (val: boolean) => void;
  last?: boolean;
}> = ({ icon, label, subtitle, value, onValueChange, last = false }) => {
  const C = CUSTOMER_COLORS;
  const isRTL = I18nManager.isRTL;

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 14,
        paddingHorizontal: 16,
        backgroundColor: C.card,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: C.border,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", flex: 1, gap: 12 }}>
        <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: C.searchBg, justifyContent: "center", alignItems: "center" }}>
          {icon}
        </View>
        <View style={{ flex: 1, alignItems: isRTL ? "flex-end" : "flex-start" }}>
          <Text style={{ fontSize: 15, fontWeight: "600", color: C.textPrimary, textAlign: isRTL ? "right" : "left" }}>{label}</Text>
          {subtitle ? <Text style={{ fontSize: 12, color: C.textSecondary, marginTop: 2, textAlign: isRTL ? "right" : "left" }}>{subtitle}</Text> : null}
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: C.border, true: C.accent }}
        thumbColor={value ? C.card : C.textSecondary}
        style={{ transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }] }}
      />
    </View>
  );
};

// =========================================
// Main Component
// =========================================

export default function Settings() {
  const { t, i18n } = useTranslation();
  const C = CUSTOMER_COLORS;
  const isRTL = I18nManager.isRTL;
  const colorScheme = useColorScheme();
  const { updatePassword } = useAuthStore();

  const [languageSheetVisible, setLanguageSheetVisible] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [contentModalVisible, setContentModalVisible] = useState(false);
  const [contentTitle, setContentTitle] = useState("");
  const [contentBody, setContentBody] = useState("");
  const [loadingContent, setLoadingContent] = useState(false);

  // Password form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  // Delivery & order data
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [defaultAddress, setDefaultAddress] = useState<Address | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  // Notification prefs (stored locally — no backend preference table exists)
  const [notifyOrders, setNotifyOrders] = useState(true);
  const [notifyPromos, setNotifyPromos] = useState(true);

  // Generic action sheet for alerts
  const [alertSheet, setAlertSheet] = useState<{
    visible: boolean;
    title?: string;
    message?: string;
    options?: ActionSheetOption[];
    showCancel?: boolean;
  }>({ visible: false, options: [] });

  // =========================================
  // Data Loading
  // =========================================

  const fetchDeliveryData = async () => {
    let zonesResult: DeliveryZone[] = [];
    let defaultAddressResult: Address | null = null;

    const zonesRes = await getAllDeliveryZones();
    if (!zonesRes.error && zonesRes.data) {
      zonesResult = zonesRes.data as DeliveryZone[];
    }

    const addrRes = await getAddresses();
    if (!addrRes.error && addrRes.data) {
      const def = (addrRes.data as Address[]).find((a) => a.is_default);
      defaultAddressResult = def || null;
    }

    return { zones: zonesResult, defaultAddress: defaultAddressResult };
  };

  const fetchNotificationPrefs = async () => {
    const o = await AsyncStorage.getItem("notif_orders");
    const p = await AsyncStorage.getItem("notif_promos");
    return { notifyOrders: o !== null ? o === "true" : true, notifyPromos: p !== null ? p === "true" : true };
  };

  useEffect(() => {
    const load = async () => {
      const { zones, defaultAddress } = await fetchDeliveryData();
      setZones(zones);
      setDefaultAddress(defaultAddress);
      setLoadingData(false);

      const { notifyOrders, notifyPromos } = await fetchNotificationPrefs();
      setNotifyOrders(notifyOrders);
      setNotifyPromos(notifyPromos);
    };
    load();
  }, []);

  // =========================================
  // Handlers
  // =========================================

  const languageOptions: ActionSheetOption[] = (
    ["en", "ar", "fr"] as const
  ).map((lang) => ({
    label: LANGUAGE_LABELS[lang],
    selected: lang === i18n.language,
    onPress: () => {
      if (lang !== i18n.language) {
        changeAppLanguage(lang);
      }
    },
  }));

  const handleSavePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert(t("common.error"), t("auth.fillAllFields"));
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert(t("common.error"), t("auth.passwordTooShort"));
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert(t("common.error"), t("auth.passwordsDontMatch"));
      return;
    }

    setSavingPassword(true);
    try {
      await updatePassword(newPassword);
      Alert.alert(t("common.done"), t("profile.passwordChanged"));
      setPasswordModalVisible(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (e: any) {
      Alert.alert(t("common.error"), e.message || t("common.somethingWentWrong"));
    } finally {
      setSavingPassword(false);
    }
  };

  const handlePrivacyPolicy = async () => {
    setLoadingContent(true);
    setContentModalVisible(true);
    setContentTitle(t("profile.privacyPolicy"));
    try {
      const { data, error } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "privacy_policy")
        .single();

      if (error || !data || !data.value) {
        setContentBody(t("profile.privacyPolicyNotAvailable"));
      } else {
        setContentBody(data.value);
      }
    } catch {
      setContentBody(t("profile.privacyPolicyNotAvailable"));
    }
    setLoadingContent(false);
  };

  const handleTerms = async () => {
    setLoadingContent(true);
    setContentModalVisible(true);
    setContentTitle(t("profile.termsConditions"));
    try {
      const { data, error } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "terms")
        .single();

      if (error || !data || !data.value) {
        setContentBody(t("profile.termsNotAvailable"));
      } else {
        setContentBody(data.value);
      }
    } catch {
      setContentBody(t("profile.termsNotAvailable"));
    }
    setLoadingContent(false);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      t("profile.deleteAccountTitle"),
      t("profile.deleteAccountWarning"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("profile.deleteAccountAction"),
          style: "destructive",
          onPress: () => {
            setAlertSheet({
              visible: true,
              title: t("profile.deleteAccountTitle"),
              message: t("profile.deleteAccountNote"),
              options: [
                {
                  label: t("profile.contactSupport"),
                  onPress: () => {
                    /* Support contact handled via Help screen */
                  },
                },
              ],
              showCancel: true,
            });
          },
        },
      ]
    );
  };

  const toggleNotifyOrders = async (val: boolean) => {
    setNotifyOrders(val);
    await AsyncStorage.setItem("notif_orders", String(val));
  };

  const toggleNotifyPromos = async (val: boolean) => {
    setNotifyPromos(val);
    await AsyncStorage.setItem("notif_promos", String(val));
  };

  const handleThemePress = () => {
    Alert.alert(t("profile.theme"), `${t("profile.themeAuto")}\n${t("profile.themeNotSupported")}`, [
      { text: t("common.done"), style: "default" },
    ]);
  };

  // =========================================
  // Render
  // =========================================

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.background }}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 20,
          paddingVertical: 14,
          borderBottomWidth: 1,
          borderBottomColor: C.border,
          backgroundColor: C.card,
        }}
      >
        <Pressable
          onPress={() => router.back()}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: C.searchBg,
            justifyContent: "center",
            alignItems: "center",
            marginRight: isRTL ? 0 : 12,
            marginLeft: isRTL ? 12 : 0,
          }}
        >
          <ChevronLeft size={20} color={C.textPrimary} style={{ transform: [{ rotate: isRTL ? "180deg" : "0deg" }] }} />
        </Pressable>
        <Text style={{ fontSize: 20, fontWeight: "800", color: C.textPrimary, flex: 1, textAlign: isRTL ? "right" : "left" }}>
          {t("profile.settings")}
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        {/* SECTION A: Account */}
        <SectionHeader title={t("profile.sectionAccount")} />
        <SettingsGroup>
          <SettingsRow
            icon={<User size={18} color={C.accent} />}
            label={t("profile.personalInfo")}
            subtitle={t("profile.personalInfoSubtitle")}
            onPress={() => router.push("/profile/edit" as any)}
          />
          <SettingsRow
            icon={<Lock size={18} color={C.accent} />}
            label={t("profile.changePassword")}
            subtitle={t("profile.changePasswordSubtitle")}
            onPress={() => setPasswordModalVisible(true)}
            last
          />
        </SettingsGroup>

        {/* SECTION B: App Preferences */}
        <SectionHeader title={t("profile.sectionPreferences")} />
        <SettingsGroup>
          <SettingsRow
            icon={<Globe size={18} color={C.accent} />}
            label={t("profile.language")}
            value={LANGUAGE_LABELS[i18n.language] || "English"}
            onPress={() => setLanguageSheetVisible(true)}
          />
          <SettingsRow
            icon={<Moon size={18} color={C.accent} />}
            label={t("profile.theme")}
            value={colorScheme === "dark" ? t("profile.themeDark") : t("profile.themeLight")}
            onPress={handleThemePress}
            last
          />
        </SettingsGroup>

        {/* Notifications */}
        <SectionHeader title={t("profile.notifications")} />
        <SettingsGroup>
          <NotificationRow
            icon={<Bell size={18} color={C.accent} />}
            label={t("profile.notificationOrders")}
            subtitle={t("profile.notificationPrefsSubtitle")}
            value={notifyOrders}
            onValueChange={toggleNotifyOrders}
          />
          <NotificationRow
            icon={<Bell size={18} color={C.accent} />}
            label={t("profile.notificationPromos")}
            value={notifyPromos}
            onValueChange={toggleNotifyPromos}
            last
          />
        </SettingsGroup>

        {/* SECTION C: Delivery & Orders */}
        <SectionHeader title={t("profile.sectionDelivery")} />
        <SettingsGroup>
          <SettingsRow
            icon={<MapPin size={18} color={C.accent} />}
            label={t("profile.deliverySettings")}
            subtitle={
              loadingData
                ? t("common.loading")
                : zones.length > 0
                ? `${zones.length} ${zones.length === 1 ? t("profile.deliveryZoneCount") : t("profile.deliveryZoneCount_other")}`
                : t("profile.notConfigured")
            }
            onPress={() => {
              Alert.alert(
                t("profile.deliverySettings"),
                zones.length > 0
                  ? zones
                      .map((z) => `${z.label} — ${z.fee} ${t("common.currency")} (${z.time})`)
                      .join("\n")
                  : t("profile.notConfigured"),
                [{ text: t("common.done") }]
              );
            }}
          />
          <SettingsRow
            icon={<Info size={18} color={C.accent} />}
            label={t("profile.orderPreferences")}
            subtitle={t("profile.orderPreferencesSubtitle")}
            onPress={() => {
              Alert.alert(
                t("profile.orderPreferences"),
                defaultAddress
                  ? `${t("profile.defaultAddress")}: ${defaultAddress.full_name}, ${defaultAddress.area}`
                  : t("profile.noDefaultAddress"),
                [{ text: t("common.done") }]
              );
            }}
            last
          />
        </SettingsGroup>

        {/* SECTION D: Privacy & Security */}
        <SectionHeader title={t("profile.sectionPrivacy")} />
        <SettingsGroup>
          <SettingsRow
            icon={<Shield size={18} color={C.accent} />}
            label={t("profile.privacyPolicy")}
            onPress={handlePrivacyPolicy}
          />
          <SettingsRow
            icon={<Shield size={18} color={C.accent} />}
            label={t("profile.termsConditions")}
            onPress={handleTerms}
            last
          />
        </SettingsGroup>

        {/* Delete Account */}
        <Pressable
          onPress={handleDeleteAccount}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            backgroundColor: C.card,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: "#FED7D7",
            padding: 16,
            marginTop: 24,
          }}
        >
          <Trash2 size={20} color="#EF4444" />
          <View style={{ flex: 1, alignItems: isRTL ? "flex-end" : "flex-start" }}>
            <Text style={{ fontSize: 15, fontWeight: "600", color: "#EF4444", textAlign: isRTL ? "right" : "left" }}>{t("profile.deleteAccount")}</Text>
            <Text style={{ fontSize: 12, color: C.textSecondary, marginTop: 2, textAlign: isRTL ? "right" : "left" }}>{t("profile.deleteAccountSubtitle")}</Text>
          </View>
        </Pressable>
      </ScrollView>

      {/* Language Action Sheet */}
      <ActionSheet
        visible={languageSheetVisible}
        onClose={() => setLanguageSheetVisible(false)}
        title={t("profile.language")}
        options={languageOptions}
      />

      {/* Generic Alert Sheet */}
      <ActionSheet
        visible={alertSheet.visible}
        onClose={() => setAlertSheet((prev) => ({ ...prev, visible: false }))}
        title={alertSheet.title}
        message={alertSheet.message}
        options={alertSheet.options || []}
        showCancel={alertSheet.showCancel}
      />

      {/* Change Password Modal */}
      <Modal visible={passwordModalVisible} transparent animationType="slide" statusBarTranslucent>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" }}>
          <View
            style={{
              backgroundColor: C.background,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingHorizontal: 24,
              paddingTop: 20,
              paddingBottom: 24,
              maxHeight: "70%",
            }}
          >
            {/* Drag handle */}
            <View style={{ width: 40, height: 4, backgroundColor: C.border, borderRadius: 2, alignSelf: "center", marginBottom: 16 }} />

            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <Text style={{ fontSize: 18, fontWeight: "800", color: C.textPrimary }}>{t("profile.changePassword")}</Text>
              <Pressable
                onPress={() => {
                  setPasswordModalVisible(false);
                  setCurrentPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                }}
              >
                <X size={22} color={C.textSecondary} />
              </Pressable>
            </View>

            <View style={{ gap: 16 }}>
              <View>
                <Text style={{ fontSize: 13, fontWeight: "600", color: C.textSecondary, marginBottom: 6, textAlign: isRTL ? "right" : "left" }}>
                  {t("profile.currentPassword")}
                </Text>
                <TextInput
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  placeholder={t("profile.currentPasswordPlaceholder")}
                  placeholderTextColor={C.textSecondary}
                  secureTextEntry
                  style={{
                    backgroundColor: C.card,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: C.border,
                    paddingHorizontal: 16,
                    height: 50,
                    fontSize: 15,
                    color: C.textPrimary,
                    textAlign: isRTL ? "right" : "left",
                  }}
                />
              </View>

              <View>
                <Text style={{ fontSize: 13, fontWeight: "600", color: C.textSecondary, marginBottom: 6, textAlign: isRTL ? "right" : "left" }}>
                  {t("auth.newPassword")}
                </Text>
                <TextInput
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder={t("auth.newPasswordPlaceholder")}
                  placeholderTextColor={C.textSecondary}
                  secureTextEntry
                  style={{
                    backgroundColor: C.card,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: C.border,
                    paddingHorizontal: 16,
                    height: 50,
                    fontSize: 15,
                    color: C.textPrimary,
                    textAlign: isRTL ? "right" : "left",
                  }}
                />
              </View>

              <View>
                <Text style={{ fontSize: 13, fontWeight: "600", color: C.textSecondary, marginBottom: 6, textAlign: isRTL ? "right" : "left" }}>
                  {t("auth.confirmPassword")}
                </Text>
                <TextInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder={t("auth.confirmPasswordPlaceholder")}
                  placeholderTextColor={C.textSecondary}
                  secureTextEntry
                  style={{
                    backgroundColor: C.card,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: C.border,
                    paddingHorizontal: 16,
                    height: 50,
                    fontSize: 15,
                    color: C.textPrimary,
                    textAlign: isRTL ? "right" : "left",
                  }}
                />
              </View>
            </View>

            <Pressable
              onPress={handleSavePassword}
              disabled={savingPassword}
              style={{
                backgroundColor: C.accent,
                borderRadius: 28,
                height: 56,
                justifyContent: "center",
                alignItems: "center",
                marginTop: 24,
                opacity: savingPassword ? 0.7 : 1,
              }}
            >
              {savingPassword ? (
                <Text style={{ color: C.card, fontSize: 16, fontWeight: "800" }}>{t("profile.saving")}</Text>
              ) : (
                <Text style={{ color: C.card, fontSize: 16, fontWeight: "800" }}>{t("common.save")}</Text>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Content Modal (Privacy Policy / Terms) */}
      <Modal visible={contentModalVisible} transparent animationType="fade" statusBarTranslucent>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center" }}>
          <View
            style={{
              backgroundColor: C.card,
              borderRadius: 20,
              marginHorizontal: 16,
              maxHeight: "75%",
              width: "90%",
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: C.border }}>
              <Text style={{ fontSize: 18, fontWeight: "800", color: C.textPrimary }}>{contentTitle}</Text>
              <Pressable onPress={() => setContentModalVisible(false)}>
                <X size={22} color={C.textSecondary} />
              </Pressable>
            </View>
            <ScrollView style={{ paddingHorizontal: 20, paddingTop: 12 }} showsVerticalScrollIndicator>
              {loadingContent ? (
                <Text style={{ color: C.textSecondary, textAlign: "center", paddingVertical: 32 }}>{t("common.loading")}</Text>
              ) : (
                <Text style={{ fontSize: 13, lineHeight: 20, color: C.textPrimary, textAlign: isRTL ? "right" : "left" }}>{contentBody}</Text>
              )}
            </ScrollView>
            <View style={{ paddingHorizontal: 20, paddingVertical: 12, borderTopWidth: 1, borderTopColor: C.border, alignItems: "flex-end" }}>
              <Pressable
                onPress={() => setContentModalVisible(false)}
                style={{ backgroundColor: C.accent, borderRadius: 20, paddingHorizontal: 20, paddingVertical: 10 }}
              >
                <Text style={{ color: C.card, fontSize: 14, fontWeight: "700" }}>{t("common.done")}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
