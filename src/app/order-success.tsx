import { router, useLocalSearchParams } from "expo-router";
import { Check } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";
export default function Success() {
  const { id } = useLocalSearchParams();
  return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFCF7', padding: 32 }}>
    <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#C5A46A', justifyContent: 'center', alignItems: 'center' }}><Check size={40} color="white" /></View>
    <Text style={{ fontSize: 22, fontWeight: '800', marginTop: 16 }}>تم الطلب بنجاح!</Text>
    <Text style={{ color: '#9CA3AF', marginTop: 8 }}>رقم الطلب: {String(id).slice(0,8)}</Text>
    <Pressable onPress={() => router.replace('/(tabs)/home' as any)} style={{ marginTop: 24, backgroundColor: '#1A1A1A', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 24 }}><Text style={{ color: 'white', fontWeight: '700' }}>العودة للرئيسية</Text></Pressable>
  </View>
}