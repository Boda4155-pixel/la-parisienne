import React, { useEffect, useState, ReactNode } from "react";
import {
  View,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  Text,
  ScrollView,
  SafeAreaView,
} from "react-native";
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
  X,
} from "lucide-react-native";
import { router, usePathname } from "expo-router";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AdminMoreTrigger from "./AdminMoreTrigger";
import AdminSidebar from "./AdminSidebar";
import { AdminMoreProvider, useAdminMore } from "./AdminMoreContext";

const SIDEBAR_WIDTH = 260;
const DESKTOP_BREAKPOINT = 768;
const TAB_BAR_HEIGHT = 60;

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
    id: "products",
    label: "products",
    icon: Package,
    href: "/products",
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
    id: "cashiers",
    label: "cashiers",
    icon: CreditCard,
    href: "/cashiers",
  },
  {
    id: "delivery-riders",
    label: "deliveryRiders",
    icon: Shield,
    href: "/delivery-riders",
  },
  {
    id: "coupons",
    label: "coupons",
    icon: Gift,
    href: "/coupons",
  },
  {
    id: "reports",
    label: "reports",
    icon: BarChart3,
    href: "/reports",
  },
  {
    id: "reviews",
    label: "reviews",
    icon: MessageSquare,
    href: "/reviews",
  },
  {
    id: "settings",
    label: "settings",
    icon: SettingsIcon,
    href: "/settings",
  },
];

const mainTabs = [
  { id: "dashboard", label: "dashboard", icon: Home, href: "/dashboard" },
  { id: "orders", label: "orders", icon: ClipboardList, href: "/orders" },
  { id: "products", label: "products", icon: Package, href: "/products" },
  { id: "account", label: "account", icon: CreditCard, href: "/account" },
];

const moreItems = navigationItems.filter(
  (item) => !["dashboard", "orders", "products"].includes(item.id as any)
);

type AdminLayoutProps = {
  children: ReactNode;
};

const AdminLayoutContent = ({ children }: AdminLayoutProps) => {
  const { t, i18n } = useTranslation();
  const isRtl = ["ar"].includes(i18n.language ?? "en");
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const isDesktop = width >= DESKTOP_BREAKPOINT;
  const insets = useSafeAreaInsets();

  const { moreOpen, setMoreOpen } = useAdminMore();

  // On desktop, sidebar is always visible; on mobile, it's hidden (replaced by bottom tabs)

  const navigate = (href: string | null) => {
    if (href) {
      router.push(href as any);
    }
    setMoreOpen(false);
  };

  const isActiveTab = (href: string | null) => {
    if (!href) return moreOpen;
    return pathname === href || pathname.startsWith(href + "/");
  };

  const isActiveMoreItem = (href: string) => {
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <View style={styles.container}>
      {/* Mobile backdrop for more drawer */}
      {!isDesktop && moreOpen && (
        <Pressable
          style={styles.moreBackdrop}
          onPress={() => setMoreOpen(false)}
        />
      )}

      {/* Desktop Sidebar */}
      {isDesktop && (
        <View
          style={[
            styles.sidebar,
            isRtl ? styles.sidebarRtl : styles.sidebarLtr,
          ]}
        >
          <AdminSidebar onNavigate={() => {}} />
        </View>
      )}

      {/* Mobile More Drawer */}
      {!isDesktop && moreOpen && (
        <View style={[{ ...styles.moreDrawer, ...(isRtl ? styles.moreDrawerRtl : styles.moreDrawerLtr) }]}>
          <SafeAreaView style={styles.moreDrawerContent}>
            <View style={styles.moreDrawerHeader}>
              <Text style={styles.moreDrawerTitle}>{t("admin.brandName") ?? "La Parisienne"}</Text>
              <Pressable onPress={() => setMoreOpen(false)} style={styles.moreDrawerClose}>
                <X size={22} color="#181C2E" />
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.moreDrawerList}>
              {moreItems.map((item) => {
                const Icon = item.icon;
                const active = isActiveMoreItem(item.href);
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => navigate(item.href)}
                    style={[
                      styles.moreDrawerItem,
                      active && styles.moreDrawerItemActive,
                    ]}
                  >
                    <Icon size={22} color={active ? "#FE8C00" : "#9CA3AF"} />
                    <Text style={[{ ...styles.moreDrawerLabel, ...(isRtl ? styles.moreDrawerLabelRtl : styles.moreDrawerLabelLtr) }, active && styles.moreDrawerLabelActive]}>
                      {t(`admin.nav.${item.label}`, item.label)}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </SafeAreaView>
        </View>
      )}

      {/* Main content area */}
      <View
        style={[
          styles.contentArea,
          isDesktop && (isRtl ? styles.contentAreaRtl : styles.contentAreaLtr),
          !isDesktop && { paddingBottom: TAB_BAR_HEIGHT + insets.bottom },
        ]}
      >
        {children}

        {/* Mobile Bottom Tab Bar */}
        {!isDesktop && (
          <View style={[styles.tabBar, { paddingBottom: insets.bottom, height: TAB_BAR_HEIGHT + insets.bottom }]}>
            {mainTabs.map((tab) => {
              const Icon = tab.icon;
              const active = isActiveTab(tab.href);
              return (
                <Pressable
                  key={tab.id}
                  style={[
                    styles.tabItem,
                    { flex: 1 },
                    isRtl && styles.tabItemRtl,
                  ]}
                  onPress={() => tab.href ? navigate(tab.href) : setMoreOpen(true)}
                  accessibilityRole="button"
                  accessibilityLabel={t(`admin.nav.${tab.label}`, tab.label)}
                >
                  <View style={styles.tabItemContent}>
                    <Icon
                      size={24}
                      color={active ? "#FE8C00" : "#9CA3AF"}
                    />
                    <Text
                      style={[
                        styles.tabLabel,
                        active && styles.tabLabelActive,
                      ]}
                    >
                      {t(`admin.nav.${tab.label}`, tab.label)}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>
    </View>
  );
};

const AdminLayout = ({ children }: AdminLayoutProps) => {
  return (
    <AdminMoreProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </AdminMoreProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FDF8F3",
    flexDirection: "row",
  },
  sidebar: {
    position: "absolute",
    top: 0,
    width: SIDEBAR_WIDTH,
    height: "100%",
    backgroundColor: "#181C2E",
    zIndex: 100,
  },
  sidebarLtr: {
    left: 0,
  },
  sidebarRtl: {
    right: 0,
  },
  moreBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#00000066",
    zIndex: 150,
  },
  moreDrawer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 300,
    backgroundColor: "#FFFFFF",
    zIndex: 200,
    shadowColor: "#000",
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 10,
  },
  moreDrawerLtr: {
    right: 0,
  },
  moreDrawerRtl: {
    left: 0,
  },
  moreDrawerContent: {
    flex: 1,
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  moreDrawerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  moreDrawerTitle: {
    fontSize: 18,
    fontFamily: "Quicksand-Bold",
    color: "#181C2E",
  },
  moreDrawerClose: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  moreDrawerList: {
    gap: 4,
    paddingBottom: TAB_BAR_HEIGHT + 20,
  },
  moreDrawerItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  moreDrawerItemActive: {
    backgroundColor: "#FE8C0022",
  },
  moreDrawerLabel: {
    fontSize: 15,
    fontFamily: "Quicksand-Medium",
    color: "#181C2E",
    flex: 1,
  },
  moreDrawerLabelLtr: {
    textAlign: "left",
  },
  moreDrawerLabelRtl: {
    textAlign: "right",
  },
  moreDrawerLabelActive: {
    color: "#FE8C00",
    fontWeight: "600",
  },
  contentArea: {
    flex: 1,
    backgroundColor: "#FDF8F3",
  },
  contentAreaLtr: {
    marginLeft: SIDEBAR_WIDTH,
  },
  contentAreaRtl: {
    marginRight: SIDEBAR_WIDTH,
  },
  tabBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: TAB_BAR_HEIGHT,
    backgroundColor: "#181C2E",
    borderTopWidth: 1,
    borderTopColor: "#2A2F45",
    flexDirection: "row",
    alignItems: "center",
    zIndex: 100,
    paddingBottom: 0, // handled by SafeAreaView on content
  },
  tabItem: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
  },
  tabItemRtl: {
    // RTL handled by flex order if needed
  },
  tabItemContent: {
    alignItems: "center",
    gap: 4,
  },
  tabLabel: {
    fontSize: 10,
    fontFamily: "Quicksand-Medium",
    color: "#9CA3AF",
  },
  tabLabelActive: {
    color: "#FE8C00",
  },
});

export default AdminLayout;