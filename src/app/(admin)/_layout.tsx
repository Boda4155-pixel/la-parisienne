import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AdminLayout() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: '#E8C87A',
      tabBarInactiveTintColor: '#666',
      tabBarStyle: {
        backgroundColor: '#1A1A1A',
        borderTopWidth: 1,
        borderTopColor: '#2A2A2A',
        height: 75 + insets.bottom,
        paddingBottom: insets.bottom + 10,
        paddingTop: 10,
        position: 'absolute',
      },
      headerShown: false,
    }}>
      <Tabs.Screen name="dashboard" options={{ title: 'Dashboard', tabBarIcon: ({c, focused}: any) => <Ionicons name={focused? "home" : "home-outline"} size={24} color={c} /> } as any} />
      <Tabs.Screen name="sales" options={{ title: 'Sales', tabBarIcon: ({color, focused}: any) => <Ionicons name={focused? "bar-chart" : "bar-chart-outline"} size={24} color={color} /> } as any} />
      <Tabs.Screen name="orders" options={{ title: 'Orders', tabBarIcon: ({color, focused}: any) => <Ionicons name={focused? "receipt" : "receipt-outline"} size={24} color={color} /> } as any} />
      <Tabs.Screen name="products" options={{ title: 'Menu', tabBarIcon: ({color, focused}: any) => <Ionicons name={focused? "fast-food" : "fast-food-outline"} size={24} color={color} /> } as any} />
      <Tabs.Screen name="account" options={{ title: 'Account', tabBarIcon: ({color, focused}: any) => <Ionicons name={focused? "person" : "person-outline"} size={24} color={color} /> } as any} />

      <Tabs.Screen name="categories" options={{ href: null } as any} />
      <Tabs.Screen name="users" options={{ href: null } as any} />
      <Tabs.Screen name="settings" options={{ href: null } as any} />
      <Tabs.Screen name="coupons" options={{ href: null } as any} />
      <Tabs.Screen name="delivery-zones" options={{ href: null } as any} />
      <Tabs.Screen name="opening-hours" options={{ href: null } as any} />
      <Tabs.Screen name="tax-settings" options={{ href: null } as any} />
    </Tabs>
  );
}
