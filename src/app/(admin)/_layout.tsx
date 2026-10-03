import { Ionicons } from '@expo/vector-icons';
import { Tabs, usePathname, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { BackHandler } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const HIDDEN_ROUTES = [
  'store-location',
  'settings',
  'support-numbers',
  'edit-profile',
  'categories',
  'users',
  'coupons',
  'delivery-zones',
  'opening-hours',
  'tax-settings',
  'printer-settings',
  'language',
  'notifications',
  'about',
  'privacy',
  'terms',
  'feedback'
];

export default function AdminLayout() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();

  const isHidden = HIDDEN_ROUTES.some(r => pathname.includes(r));

  // ده اللي بيحل مشكلة زرار الرجوع اللي انت معلم عليه
  useEffect(() => {
    const onBackPress = () => {
      // لو انت جوه صفحة مخفية زي settings او support-numbers
      if (isHidden) {
        if (router.canGoBack()) {
          router.back();
          return true; // منعنا الرجوع للرئيسية
        }
      }
      // لو انت في التابات الرئيسية سيبه يتصرف طبيعي
      return false;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [isHidden, pathname]);
  
  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: '#E8C87A',
      tabBarInactiveTintColor: '#666',
      tabBarStyle: isHidden ? { display: 'none' } : {
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
      <Tabs.Screen name="dashboard" options={{ title: t('admin.nav.dashboard'), tabBarIcon: ({color, focused}: any) => <Ionicons name={focused? "home" : "home-outline"} size={24} color={color} /> } as any} />
      <Tabs.Screen name="sales" options={{ title: t('admin.nav.sales'), tabBarIcon: ({color, focused}: any) => <Ionicons name={focused? "bar-chart" : "bar-chart-outline"} size={24} color={color} /> } as any} />
      <Tabs.Screen name="orders" options={{ title: t('admin.nav.orders'), tabBarIcon: ({color, focused}: any) => <Ionicons name={focused? "receipt" : "receipt-outline"} size={24} color={color} /> } as any} />
      <Tabs.Screen name="products" options={{ title: t('admin.nav.products'), tabBarIcon: ({color, focused}: any) => <Ionicons name={focused? "fast-food" : "fast-food-outline"} size={24} color={color} /> } as any} />
      <Tabs.Screen name="account" options={{ title: t('admin.nav.account'), tabBarIcon: ({color, focused}: any) => <Ionicons name={focused? "person" : "person-outline"} size={24} color={color} /> } as any} />
      
      {/* الصفحات المخفية */}
      <Tabs.Screen name="store-location" options={{ href: null } as any} />
      <Tabs.Screen name="settings" options={{ href: null } as any} />
      <Tabs.Screen name="support-numbers" options={{ href: null } as any} />
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