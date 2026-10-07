import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../../lib/supabase';

export default function OrdersDashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    const { data } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (data) setOrders(data);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
      const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', id);
      if (error) throw error;
    } catch (e: any) {
      Alert.alert('خطأ', e.message);
      loadData();
    }
  };

  const getStatusLabel = (status: string) => {
    if (status === 'pending' || status === 'new') return 'جديد - بانتظار القبول';
    if (status === 'preparing') return 'قيد التجهيز 👨‍🍳';
    if (status === 'ready') return 'جاهز للتوصيل 🛵 - ظهر للدليفري';
    if (status === 'out_for_delivery') return 'خرج للتوصيل';
    if (status === 'delivered') return 'تم التوصيل ✅';
    if (status === 'cancelled') return 'ملغي ❌';
    return status;
  };

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F3FF' }}><ActivityIndicator color="#7C4DFF" /></View>;

  return (
    <View style={{ flex: 1, backgroundColor: '#F5F3FF' }}>
      <View style={{ backgroundColor: '#8B5CF6', paddingTop: 55, paddingBottom: 18, paddingHorizontal: 16, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}>
        <Text style={{ color: 'white', fontWeight: '900', fontSize: 20, textAlign: 'right' }}>Abdelrahman El Sawy</Text>
        <Text style={{ color: '#E9D5FF', fontSize: 12, textAlign: 'right' }}>إدارة الطلبات - {orders.length} طلب</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 14, gap: 14, paddingBottom: 110 }}>
        {orders.map(o => {
          const isPending = o.status === 'pending' || o.status === 'new';
          const isPreparing = o.status === 'preparing';
          const isReady = o.status === 'ready' || o.status === 'out_for_delivery';

          return (
            <View key={o.id} style={{ backgroundColor: 'white', borderRadius: 18, overflow: 'hidden', elevation: 3, borderWidth: isReady ? 2 : 0, borderColor: isReady ? '#22C55E' : 'transparent' }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, backgroundColor: isPending ? '#FEF9C3' : isPreparing ? '#E0E7FF' : isReady ? '#DCFCE7' : '#F6F4FF' }}>
                <View style={{ backgroundColor: isPending ? '#FEF08A' : isPreparing ? '#C7D2FE' : isReady ? '#86EFAC' : '#E0E7FF', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10 }}>
                  <Text style={{ fontSize: 11, fontWeight: '900' }}>{getStatusLabel(o.status)}</Text>
                </View>
                <Text style={{ fontWeight: '900', fontSize: 15 }}>#{o.id.slice(0, 8).toUpperCase()}</Text>
              </View>

              <View style={{ padding: 14, gap: 12 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontWeight: '900', fontSize: 18, color: '#7C4DFF' }}>{o.total || o.total_amount} ج</Text>
                  <Text style={{ fontSize: 13, fontWeight: '600' }}>{o.payment_method === 'cash' ? 'كاش عند التسليم 💵' : o.payment_method}</Text>
                </View>

                <TouchableOpacity onPress={() => Linking.openURL(`tel:${o.phone}`)} style={{ backgroundColor: '#F9F9F9', borderRadius: 12, padding: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Ionicons name="call" size={18} color="#7C4DFF" />
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontWeight: '700', fontSize: 13 }}>{o.phone}</Text>
                    <Text style={{ fontSize: 11, color: '#888' }}>اضغط للاتصال</Text>
                  </View>
                </TouchableOpacity>

                <View style={{ backgroundColor: '#F8F7FF', borderRadius: 12, padding: 12, gap: 8, borderWidth: 1, borderColor: '#EDE9FE' }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 6 }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', textAlign: 'right', flex: 1, lineHeight: 22 }}>
                      {o.delivery_address_text || `${o.street || ''} - عمارة ${o.building || ''} - شقة ${o.apartment || ''} - دور ${o.floor || ''}`}
                    </Text>
                    <Text style={{ fontSize: 16 }}>📍</Text>
                  </View>
                  {(o.lat && o.lng) && (
                    <TouchableOpacity onPress={() => Linking.openURL(`https://maps.google.com/?q=${o.lat},${o.lng}`)} style={{ backgroundColor: 'white', borderRadius: 8, padding: 8, alignItems: 'center', marginTop: 4, borderWidth: 1, borderColor: '#DDD' }}>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: '#7C4DFF' }}>📍 فتح على الخريطة</Text>
                    </TouchableOpacity>
                  )}
                  {o.customer_note && <Text style={{ textAlign: 'right', fontSize: 12, color: '#666' }}>📝 {o.customer_note}</Text>}
                </View>

                {/* ازرار حسب الحالة */}
                {isPending && (
                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                    <TouchableOpacity onPress={() => updateStatus(o.id, 'preparing')} style={{ flex: 2, backgroundColor: '#7C4DFF', paddingVertical: 14, borderRadius: 12, alignItems: 'center' }}>
                      <Text style={{ color: 'white', fontWeight: '900', fontSize: 15 }}>قبول ✅</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => updateStatus(o.id, 'cancelled')} style={{ flex: 1, backgroundColor: 'white', borderWidth: 1.5, borderColor: '#FECACA', paddingVertical: 14, borderRadius: 12, alignItems: 'center' }}>
                      <Text style={{ color: '#EF4444', fontWeight: '900' }}>رفض</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {isPreparing && (
                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                    <TouchableOpacity onPress={() => updateStatus(o.id, 'ready')} style={{ flex: 2, backgroundColor: '#16A34A', paddingVertical: 14, borderRadius: 12, alignItems: 'center' }}>
                      <Text style={{ color: 'white', fontWeight: '900', fontSize: 15 }}>جاهز للتوصيل 🛵</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => updateStatus(o.id, 'cancelled')} style={{ flex: 1, backgroundColor: 'white', borderWidth: 1.5, borderColor: '#FECACA', paddingVertical: 14, borderRadius: 12, alignItems: 'center' }}>
                      <Text style={{ color: '#EF4444', fontWeight: '900' }}>الغاء</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {isReady && (
                  <View style={{ gap: 8 }}>
                    <View style={{ backgroundColor: '#F0FDF4', padding: 10, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#BBF7D0' }}>
                      <Text style={{ color: '#16A34A', fontWeight: '900', fontSize: 13 }}>✅ الطلب ظاهر الآن للدليفري</Text>
                    </View>
                    <TouchableOpacity onPress={() => updateStatus(o.id, 'delivered')} style={{ backgroundColor: '#0F172A', paddingVertical: 12, borderRadius: 12, alignItems: 'center' }}>
                      <Text style={{ color: 'white', fontWeight: '800' }}>تأكيد التوصيل - تم التسليم</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {(o.status === 'delivered' || o.status === 'cancelled') && (
                  <View style={{ backgroundColor: o.status === 'delivered' ? '#F0FDF4' : '#FEF2F2', padding: 10, borderRadius: 10, alignItems: 'center' }}>
                    <Text style={{ color: o.status === 'delivered' ? '#16A34A' : '#EF4444', fontWeight: '700', fontSize: 13 }}>{getStatusLabel(o.status)}</Text>
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}