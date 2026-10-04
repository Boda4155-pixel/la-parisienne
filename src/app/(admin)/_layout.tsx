import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AdminLayout() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  
  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: '#16A34A',
      tabBarInactiveTintColor: '#9CA3AF',
      tabBarStyle: {
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E5E5E5',
        height: 75 + insets.bottom,
        paddingBottom: insets.bottom + 10,
        paddingTop: 6,
        position: 'absolute',
      },
      headerShown: false,
      tabBarLabelStyle:{fontWeight:'700', fontSize:11}
    }}>
      <Tabs.Screen name="dashboard" options={{ title: t('admin.nav.dashboard'), tabBarIcon: ({focused}: any) => (
        <View style={{alignItems:'center'}}>
          {focused && <View style={{width:18, height:3, borderRadius:2, backgroundColor:'#16A34A', marginBottom:4}}/>}
          <Ionicons name={focused? "home" : "home-outline"} size={24} color={focused ? "#16A34A" : "#9CA3AF"} />
        </View>
      ) } as any} />
      <Tabs.Screen name="sales" options={{ title: t('admin.nav.sales'), tabBarIcon: ({focused}: any) => (
        <View style={{alignItems:'center'}}>
          {focused && <View style={{width:18, height:3, borderRadius:2, backgroundColor:'#16A34A', marginBottom:4}}/>}
          <Ionicons name={focused? "bar-chart" : "bar-chart-outline"} size={24} color={focused ? "#16A34A" : "#9CA3AF"} />
        </View>
      ) } as any} />
      <Tabs.Screen name="orders" options={{ title: t('admin.nav.orders'), tabBarIcon: ({focused}: any) => (
        <View style={{alignItems:'center'}}>
          {focused && <View style={{width:18, height:3, borderRadius:2, backgroundColor:'#16A34A', marginBottom:4}}/>}
          <Ionicons name={focused? "receipt" : "receipt-outline"} size={24} color={focused ? "#16A34A" : "#9CA3AF"} />
        </View>
      ) } as any} />
      <Tabs.Screen name="products" options={{ title: t('admin.nav.products'), tabBarIcon: ({focused}: any) => (
        <View style={{alignItems:'center'}}>
          {focused && <View style={{width:18, height:3, borderRadius:2, backgroundColor:'#16A34A', marginBottom:4}}/>}
          <Ionicons name={focused? "fast-food" : "fast-food-outline"} size={24} color={focused ? "#16A34A" : "#9CA3AF"} />
        </View>
      ) } as any} />
      <Tabs.Screen name="account" options={{ title: t('admin.nav.account'), tabBarIcon: ({focused}: any) => (
        <View style={{alignItems:'center'}}>
          {focused && <View style={{width:18, height:3, borderRadius:2, backgroundColor:'#16A34A', marginBottom:4}}/>}
          <Ionicons name={focused? "person" : "person-outline"} size={24} color={focused ? "#16A34A" : "#9CA3AF"} />
        </View>
      ) } as any} />
      
      <Tabs.Screen name="store-location" options={{ href: null } as any} />
      <Tabs.Screen name="settings" options={{ href: null } as any} />
      <Tabs.Screen name="support-contacts" options={{ href: null } as any} />
      <Tabs.Screen name="edit-profile" options={{ href: null } as any} />
      <Tabs.Screen name="categories" options={{ href: null } as any} />
      <Tabs.Screen name="users" options={{ href: null } as any} />
      <Tabs.Screen name="coupons" options={{ href: null } as any} />
      <Tabs.Screen name="delivery-zones" options={{ href: null } as any} />
      <Tabs.Screen name="opening-hours" options={{ href: null } as any} />
      <Tabs.Screen name="tax-settings" options={{ href: null } as any} />
      <Tabs.Screen name="printer-settings" options={{ href: null } as any} />
      <Tabs.Screen name="language" options={{ href: null } as any} />
      <Tabs.Screen name="notifications" options={{ href: null } as any} />
      <Tabs.Screen name="about" options={{ href: null } as any} />
      <Tabs.Screen name="privacy" options={{ href: null } as any} />
      <Tabs.Screen name="terms" options={{ href: null } as any} />
      <Tabs.Screen name="feedback" options={{ href: null } as any} />
    </Tabs>
  );
}