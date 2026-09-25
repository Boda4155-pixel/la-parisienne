import React from "react";
import { View, Text, Pressable, ScrollView, StyleSheet } from "react-native";
import {
  Home,
  ClipboardList,
  Package,
  Grid,
  Users,
  CreditCard,
  Shield,
  Gift,
  BarChart3,
  MessageSquare,
  Settings as SettingsIcon,
  Globe,
} from "lucide-react-native";
import { router, usePathname } from "expo-router";
import { useTranslation } from "react-i18next";

import { changeAppLanguage } from "../../i18next/i18next";

const navigationItems = [
  {
    id: "dashboard",
    label: "dashboard",
    icon: Home,
    href: "/dashboard",
  },
  {
    id: "orders",
    label: "orders",
    icon: ClipboardList,
    href: "/orders",
  },
  {
    id: "inventory",
    label: "inventory",
    icon: Package,
    href: "/inventory",
  },
  {
    id: "categories",
    label: "categories",
    icon: Grid,
    href: "/categories",
  },
  {
    id: "customers",
    label: "customers",
    icon: Users,
    href: "/customers",
  },
  {
    id: "staff",
    label: "staff",
    icon: CreditCard,
    href: "/staff",
  },
  {
    id: "fleet",
    label: "fleet",
    icon: Shield,
    href: "/fleet",
  },
  {
    id: "coupons",
    label: "coupons",
    icon: Gift,
    href: "/coupons",
  },
  {
    id: "analytics",
    label: "analytics",
    icon: BarChart3,
    href: "/analytics",
  },
  {
    id: "permissions",
    label: "permissions",
    icon: Shield,
    href: "/permissions",
  },
  {
    id: "messenger",
    label: "messenger",
    icon: MessageSquare,
    href: "/messenger",
  },
  {
    id: "settings",
    label: "settings",
    icon: SettingsIcon,
    href: "/settings",
  },
];

const AdminSidebar = ({ onNavigate }: { onNavigate?: () => void }) => {
  const { t, i18n } = useTranslation();
  const pathname = usePathname();

  const isRTL = i18n.dir() === "rtl";

  const handleLanguageToggle = async () => {
    const newLang = i18n.language === "ar" ? "en" : "ar";
    await changeAppLanguage(newLang);
  };

  return (
    <View style={styles.sidebarContainer}>
      {/* Sidebar Header */}
      <View style={styles.sidebarHeader}>
        <Text style={styles.sidebarTitle}>
          {t("admin.brandName") ?? "La Parisienne"}
        </Text>
      </View>

      {/* Navigation */}
      <ScrollView
        style={styles.sidebarNav}
        contentContainerStyle={styles.sidebarNavContent}
        showsVerticalScrollIndicator={false}
      >
        {navigationItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Pressable
              key={item.id}
              onPress={() => {
                router.push(item.href as any);
                onNavigate?.();
              }}
              style={({ pressed }) => [
                styles.navItem,
                isActive && styles.navItemActive,
                pressed && styles.navItemPressed,
              ]}
            >
              <Icon size={20} color={isActive ? "#FE8C00" : "#9CA3AF"} />
              <Text
                style={[
                  styles.navLabel,
                  isActive && styles.navLabelActive,
                ]}
              >
                {t(`admin.nav.${item.label}`, item.label)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Language Toggle & User profile at bottom */}
      <View style={styles.sidebarFooter}>
        <Pressable
          style={styles.languageButton}
          onPress={handleLanguageToggle}
        >
          <Globe size={20} color={isRTL ? "#FE8C00" : "#9CA3AF"} />
          <Text style={styles.languageButtonText}>
            {isRTL ? "English" : "عربي"}
          </Text>
        </Pressable>
        <Pressable style={styles.profileButton}>
          <View style={styles.profileDot} />
          <Text style={styles.profileName}>Admin</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sidebarContainer: {
    flex: 1,
    backgroundColor: "#181C2E",
    height: "100%",
  },
  sidebarHeader: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#2A2F45",
  },
  sidebarTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    fontFamily: "Quicksand-Bold",
  },
  sidebarNav: {
    flex: 1,
  },
  sidebarNavContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
    gap: 4,
  },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  navItemActive: {
    backgroundColor: "#FE8C0022",
  },
  navItemPressed: {
    opacity: 0.8,
  },
  navLabel: {
    fontSize: 14,
    fontFamily: "Quicksand-Medium",
    color: "#9CA3AF",
    flex: 1,
  },
  navLabelActive: {
    color: "#FE8C00",
    fontWeight: "500",
  },
  sidebarFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#2A2F45",
    gap: 12,
  },
  languageButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "#2A2F45",
  },
  languageButtonText: {
    fontSize: 14,
    fontFamily: "Quicksand-Medium",
    color: "#FFFFFF",
  },
  profileButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  profileDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#10B981",
  },
  profileName: {
    fontSize: 14,
    fontFamily: "Quicksand-Medium",
    color: "#FFFFFF",
  },
});

export default AdminSidebar;