import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

export default function CashierLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: '#2D1E16', tabBarStyle: { height: 65, backgroundColor: 'white' } }}>
      <Tabs.Screen name="index" options={{ href: null }} />
      <Tabs.Screen name="stats" options={{ title: 'الاحصائيات', tabBarIcon: ({color}) => <Ionicons name="bar-chart-outline" size={22} color={color} /> }} />
      <Tabs.Screen name="menu" options={{ title: 'قائمتي', tabBarIcon: ({color}) => <Ionicons name="restaurant-outline" size={22} color={color} /> }} />
      <Tabs.Screen name="drivers" options={{ title: 'الطلبات', tabBarIcon: ({color}) => <Ionicons name="receipt-outline" size={22} color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'البروفايل', tabBarIcon: ({color}) => <Ionicons name="person-outline" size={22} color={color} /> }} />
    </Tabs>
  );
}