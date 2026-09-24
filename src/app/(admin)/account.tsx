import React from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Settings as SettingsIcon, LogOut, Mail } from "lucide-react-native";
import AdminMoreTrigger from "../../../components/admin/AdminMoreTrigger";
import { useTranslation } from "react-i18next";
import { router } from "expo-router";

import { useAuthStore } from "../../../store/auth.store";

export default function Account() {
  const { t } = useTranslation();
  const { profile, signOut } = useAuthStore();

  const handleLogout = async () => {
    Alert.alert(
      t("admin.account.logoutTitle"),
      t("admin.account.logoutConfirm"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("admin.account.logoutButton"),
          style: "destructive",
          onPress: async () => {
            try {
              await signOut();
              router.replace("/sign-in");
            } catch (err: any) {
              Alert.alert(t("common.somethingWentWrong"), err?.message);
            }
          },
        },
      ],
    );
  };

  const handleSettings = () => {
    router.push("/profile/settings");
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{t("admin.account.title")}</Text>
          <View style={styles.headerActions}>
            <AdminMoreTrigger />
            <Pressable onPress={handleSettings}>
              <SettingsIcon size={22} color="#181C2E" />
            </Pressable>
          </View>
        </View>

        {/* Admin Info Card */}
        <View style={styles.card}>
          <View style={styles.rowItem}>
            <View style={[styles.icon, { backgroundColor: "#FE8C0020" }]}>
              <Mail size={20} color="#FE8C00" />
            </View>
            <View>
              <Text style={styles.label}>{t("admin.account.email")}</Text>
              <Text style={styles.value}>
                {profile?.email ?? t("admin.account.noEmail")}
              </Text>
            </View>
          </View>
        </View>

        {/* Settings Link */}
        <Pressable style={styles.menuItem} onPress={handleSettings}>
          <View style={styles.menuLeft}>
            <View style={[styles.icon, { backgroundColor: "#F1F5F9" }]}>
              <SettingsIcon size={20} color="#6B7280" />
            </View>
            <Text style={styles.menuLabel}>{t("admin.account.settings")}</Text>
          </View>
        </Pressable>

        {/* Logout Button */}
        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color="#FFFFFF" />
          <Text style={styles.logoutLabel}>
            {t("admin.account.logoutButton")}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FDF8F3",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  headerActions: {
    flexDirection: "row",
    gap: 12,
  },
  title: {
    fontSize: 28,
    fontFamily: "Quicksand-Bold",
    color: "#181C2E",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#181C2E",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  rowItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 11,
    fontFamily: "Quicksand-Medium",
    color: "#878787",
    textTransform: "uppercase",
  },
  value: {
    fontSize: 16,
    fontFamily: "Quicksand-SemiBold",
    color: "#181C2E",
    marginTop: 2,
  },
  menuItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#181C2E",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  menuLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  menuLabel: {
    fontSize: 15,
    fontFamily: "Quicksand-SemiBold",
    color: "#181C2E",
  },
  logoutButton: {
    backgroundColor: "#EF4444",
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginTop: 16,
    shadowColor: "#181C2E",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  logoutLabel: {
    fontSize: 15,
    fontFamily: "Quicksand-Bold",
    color: "#FFFFFF",
  },
});
