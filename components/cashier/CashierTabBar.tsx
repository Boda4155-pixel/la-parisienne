import { usePathname } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import {
  ClipboardList,
  LayoutGrid,
  MoreHorizontal,
  ShoppingBag,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TAB_BAR_HEIGHT = 60;

const navigationItems = [
  {
    id: "home",
    label: "home",
    icon: ShoppingBag,
    href: "/(cashier)/home",
  },
  {
    id: "orders",
    label: "orders",
    icon: ClipboardList,
    href: "/(cashier)/orders",
  },
  {
    id: "products",
    label: "products",
    icon: LayoutGrid,
    href: "/(cashier)/products",
  },
  {
    id: "more",
    label: "more",
    icon: MoreHorizontal,
    href: "/(cashier)/account",
  },
];

type CashierTabBarProps = {
  children: React.ReactNode;
};

const CashierTabBar = ({ children }: CashierTabBarProps) => {
  const pathname = usePathname();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const isActiveTab = (href: string) => {
    return pathname === href || pathname.startsWith(href + "/");
  };

  const navigate = (href: string) => {
    router.push(href as any);
  };

  return (
    <View style={styles.container}>
      <View style={[
        styles.contentArea,
        { paddingBottom: TAB_BAR_HEIGHT + insets.bottom },
      ]}>
        {children}
      </View>

      <View
        style={[
          styles.tabBar,
          { paddingBottom: insets.bottom, height: TAB_BAR_HEIGHT + insets.bottom },
        ]}
      >
        {navigationItems.map((tab) => {
          const Icon = tab.icon;
          const active = isActiveTab(tab.href);
          return (
            <Pressable
              key={tab.id}
              style={[styles.tabItem, { flex: 1 }]}
              onPress={() => navigate(tab.href)}
              accessibilityRole="button"
              accessibilityLabel={t(`tabs.${tab.label}`, tab.label)}
            >
              <View style={styles.tabItemContent}>
                <Icon size={24} color={active ? "#FE8C00" : "#9CA3AF"} />
                <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                  {t(`tabs.${tab.label}`, tab.label)}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FDF8F3",
  },
  contentArea: {
    flex: 1,
    backgroundColor: "#FDF8F3",
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
    paddingBottom: 0,
  },
  tabItem: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
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

export default CashierTabBar;