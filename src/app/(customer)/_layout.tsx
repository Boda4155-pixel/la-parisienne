import Ionicons from "@expo/vector-icons/Ionicons";
import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CUSTOMER_COLORS } from "../../lib/customerTheme";

export default function CustomerLayout() {
  const insets = useSafeAreaInsets();
  const C = CUSTOMER_COLORS;
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.tabActive,
        tabBarInactiveTintColor: C.tabInactive,
        tabBarStyle: {
          backgroundColor: C.card,
          height: 75 + insets.bottom,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          borderTopWidth: 1,
          borderTopColor: C.border,
          elevation: 0,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      }}
    >
      <Tabs.Screen name="home" options={{ title: "Home", tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? "home" : "home-outline"} size={22} color={color} /> }} />
      <Tabs.Screen name="menu" options={{ title: "Menu", tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? "restaurant" : "restaurant-outline"} size={22} color={color} /> }} />
      <Tabs.Screen name="cart" options={{ title: "Cart", tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? "cart" : "cart-outline"} size={22} color={color} /> }} />
      <Tabs.Screen name="orders" options={{ title: "Orders", tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? "time" : "time-outline"} size={22} color={color} /> }} />
      <Tabs.Screen name="account" options={{ title: "Account", tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? "person" : "person-outline"} size={22} color={color} /> }} />
      
      <Tabs.Screen name="product/[id]" options={{ href: null, tabBarStyle: { display: "none" } }} />
      <Tabs.Screen name="delivery-location" options={{ href: null, tabBarStyle: { display: "none" } }} />
    </Tabs>
  );
}