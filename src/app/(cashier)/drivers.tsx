import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../../lib/supabase';

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [filter, setFilter] = useState<'open' | 'closed'>('open');
  const [loading, setLoading] = useState(true);

  const loadOrders = async () => {
    setLoading(true);
    const openStatus = ['pending','preparing','ready','on_the_way','picked_up','new'];
    const closedStatus = ['delivered','cancelled','closed','completed'];

    const { data, error } = await supabase
     .from('orders')
     .select('*')
     .in('status', filter === 'open'? openStatus : closedStatus)
     .order('created_at', { ascending: false });

    if (!error) setOrders(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadOrders();
    const ch = supabase.channel('orders-real')
     .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => loadOrders())
     .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [filter]);

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color="#2D1E16" /></View>;

  return (
    <View style={{ flex: 1, backgroundColor: '#F8F6F3' }}>
      <View style={{ backgroundColor: 'white', paddingTop: 50, paddingHorizontal: 16, paddingBottom: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontWeight: '900', fontSize: 18 }}>طلبات جارية</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity onPress={() => setFilter('closed')} style={{ backgroundColor: filter === 'closed'? '#2D1E16' : '#F0F0F0', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 }}>
              <Text style={{ fontSize: 12, color: filter === 'closed'? 'white' : '#888', fontWeight: '700' }}>مغلقة</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setFilter('open')} style={{ backgroundColor: filter === 'open'? '#7C4DFF' : '#F0F0F0', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 }}>
              <Text style={{ fontSize: 12, color: filter === 'open'? 'white' : '#888', fontWeight: '700' }}>مفتوح</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 12, paddingBottom: 120 }}>
        {orders.length === 0? (
          <View style={{ marginTop: 120, alignItems: 'center' }}>
            <Ionicons name="receipt-outline" size={64} color="#DDD" />
            <Text style={{ marginTop: 12, color: '#999', fontWeight: '700' }}>مفيش طلبات {filter === 'open'? 'مفتوحة' : 'مغلقة'}</Text>
            <Text style={{ fontSize: 12, color: '#BBB', marginTop: 6 }}>الطلبات الحقيقية من Supabase هتظهر هنا</Text>
          </View>
        ) : orders.map((order) => {
          let items: any[] = [];
          try { items = typeof order.items === 'string'? JSON.parse(order.items) : order.items || []; } catch {}
          const time = new Date(order.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });

          return (
            <View key={order.id} style={{ backgroundColor: 'white', borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#EEE', overflow: 'hidden' }}>
              <View style={{ backgroundColor: order.status === 'cancelled'? '#FFEBEE' : '#EDE7F6', padding: 12, flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontWeight: '900', fontSize: 13 }}>طلب #{order.id.slice(0, 6)} • {order.status}</Text>
                <Text style={{ fontSize: 11, fontWeight: '700' }}>{time}</Text>
              </View>

              <View style={{ padding: 12, gap: 10 }}>
                <Text style={{ fontWeight: '700', textAlign: 'right' }}>{order.customer_name}</Text>
                {order.phone? (
                  <TouchableOpacity onPress={() => Linking.openURL(`tel:${order.phone}`)} style={{ backgroundColor: '#E0F2F1', padding: 12, borderRadius: 10, flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Ionicons name="call" size={16} color="#00796B" />
                    <Text style={{ fontWeight: '800', flex: 1, textAlign: 'right' }}>{order.phone}</Text>
                  </TouchableOpacity>
                ) : null}
                <Text style={{ fontSize: 12, color: '#666', textAlign: 'right' }}>{order.address}</Text>

                <View style={{ borderTopWidth: 1, borderTopColor: '#F0F0F0', paddingTop: 10 }}>
                  {items.map((it: any, i: number) => (
                    <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                      <Text style={{ fontSize: 12 }}>{it.price} ج</Text>
                      <Text style={{ fontSize: 12, flex: 1, textAlign: 'right' }}>{it.qty || it.quantity || 1}x {it.name}</Text>
                    </View>
                  ))}
                </View>

                <Text style={{ fontWeight: '900', textAlign: 'right', backgroundColor: '#F5F5F5', padding: 8, borderRadius: 8 }}>الإجمالي: {order.total_price} ج</Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}