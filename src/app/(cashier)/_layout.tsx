import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CashierLayout() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs 
      screenOptions={{ 
        headerShown: false, 
        tabBarActiveTintColor: '#C5A059', // الدهبي هو اللي شغال
        tabBarInactiveTintColor: '#777', // الباقي رمادي
        tabBarStyle: { 
          height: 70 + insets.bottom,
          paddingBottom: insets.bottom + 10,
          paddingTop: 10,
          backgroundColor: '#0A0A0A', // اسود فاخر
          borderTopWidth: 1.5,
          borderTopColor: '#C5A059', // خط دهبي فوق
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '800' }
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