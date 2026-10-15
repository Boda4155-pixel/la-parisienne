import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CUSTOMER_COLORS } from '../../../lib/customerTheme';

export default function CashierLayout() {
  const insets = useSafeAreaInsets();
  const C = CUSTOMER_COLORS;
  return (
    <Tabs 
      screenOptions={{ 
        headerShown: false, 
        tabBarActiveTintColor: C.tabActive,
        tabBarInactiveTintColor: C.tabInactive,
        tabBarStyle: { 
          height: 75 + insets.bottom,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          paddingTop: 8,
          backgroundColor: C.background,
          borderTopWidth: 1,
          borderTopColor: C.border,
          elevation: 0,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' }
      }}
    >
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen name="stats" options={{ title: 'الاحصائيات', tabBarIcon: ({color}) => <Ionicons name="bar-chart-outline" size={22} color={color} /> }} />
      <Tabs.Screen name="menu" options={{ title: 'قائمتي', tabBarIcon: ({color}) => <Ionicons name="restaurant-outline" size={22} color={color} /> }} />
      <Tabs.Screen name="drivers" options={{ title: 'الطلبات', tabBarIcon: ({color}) => <Ionicons name="receipt-outline" size={22} color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'البروفايل', tabBarIcon: ({color}) => <Ionicons name="person-outline" size={22} color={color} /> }} />
    </Tabs>
  );
}