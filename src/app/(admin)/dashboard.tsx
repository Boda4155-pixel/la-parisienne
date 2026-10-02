import { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { supabase } from '../../../lib/supabase';

export default function Dashboard() {
  const [stats, setStats] = useState({ today:0, todayCount:0, total:0, totalCount:0, pending:0, delivered:0, users:0, products:0 });
  const [chart, setChart] = useState({ labels: [''], data: [0] });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data: orders } = await supabase.from('orders').select('total, status, created_at');
    const { count: usersCount } = await supabase.from('profiles').select('id', { count: 'exact', head: true });
    const { count: productsCount } = await supabase.from('products').select('id', { count: 'exact', head: true });

    const todayStr = new Date().toISOString().split('T')[0];
    let todayOrders = orders?.filter(o => o.created_at.startsWith(todayStr)) || [];
    if(todayOrders.length === 0 && orders && orders.length > 0) {
      const lastDate = orders[0]?.created_at?.split('T')[0];
      if(lastDate) todayOrders = orders.filter(o => o.created_at.startsWith(lastDate)) || [];
    }

    const grouped: any = {};
    orders?.slice(0,6).forEach(o => {
      const d = new Date(o.created_at).toLocaleDateString('en-GB', {day:'2-digit', month:'short'});
      grouped[d] = (grouped[d]||0) + Number(o.total);
    });

    setChart({
      labels: Object.keys(grouped).reverse().length? Object.keys(grouped).reverse() : ['No data'],
      data: Object.values(grouped).reverse().length? Object.values(grouped).reverse() as number[] : [0]
    });

    setStats({
      today: todayOrders.reduce((s,o)=> s + Number(o.total), 0),
      todayCount: todayOrders.length,
      total: orders?.reduce((s,o)=> s + Number(o.total), 0) || 0,
      totalCount: orders?.length || 0,
      pending: orders?.filter(o => o.status === 'pending').length || 0,
      delivered: orders?.filter(o => o.status === 'delivered').length || 0,
      users: usersCount || 0,
      products: productsCount || 0,
    });
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase.channel('dash').on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, load).subscribe();
    return () => { supabase.removeChannel(ch); }
  }, []);

  if(loading) return <View style={s.center}><ActivityIndicator color="#E8C87A" size="large"/></View>;

  return (
    <View style={s.bg}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom: 120}}>
        <Text style={s.h1}>Dashboard</Text>
        <Text style={s.sub}>La Parisienne • {stats.totalCount} orders • Live</Text>

        <View style={s.grid}>
          <View style={[s.card, {backgroundColor:'#E8C87A'}]}><Text style={[s.lab,{color:'#000'}]}>PENDING</Text><Text style={[s.val,{color:'#000'}]}>{stats.pending}</Text><Text style={[s.sm,{color:'#333'}]}>Need action</Text></View>
          <View style={s.card}><Text style={s.lab}>TODAY SALES</Text><Text style={s.val}>EGP {stats.today}</Text><Text style={s.sm}>{stats.todayCount} orders</Text></View>
          <View style={s.card}><Text style={s.lab}>TOTAL REVENUE</Text><Text style={s.val}>EGP {stats.total}</Text><Text style={s.sm}>{stats.totalCount} total</Text></View>
          <View style={s.card}><Text style={s.lab}>DELIVERED</Text><Text style={s.val}>{stats.delivered}</Text><Text style={s.sm}>Completed</Text></View>
        </View>

        <View style={s.chartBox}>
          <Text style={s.chartTitle}>Sales Last 7 Days</Text>
          <BarChart
            data={{ labels: chart.labels, datasets: [{ data: chart.data }] }}
            width={Dimensions.get('window').width - 50}
            height={220}
            yAxisLabel="EGP "
            yAxisSuffix=""
            chartConfig={{
              backgroundColor: '#1E1E1E',
              backgroundGradientFrom: '#1E1E1E',
              backgroundGradientTo: '#1E1E1E',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(232, 200, 122, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              style: { borderRadius: 16 },
              barPercentage: 0.6,
            }}
            style={{ borderRadius: 16, marginTop: 10 }}
            fromZero
            showValuesOnTopOfBars
          />
        </View>

        <View style={s.rowStats}>
          <View style={s.miniCard}><Text style={s.miniLab}>USERS</Text><Text style={s.miniVal}>{stats.users}</Text></View>
          <View style={s.miniCard}><Text style={s.miniLab}>PRODUCTS</Text><Text style={s.miniVal}>{stats.products}</Text></View>
          <View style={s.miniCard}><Text style={s.miniLab}>ORDERS</Text><Text style={s.miniVal}>{stats.totalCount}</Text></View>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  bg:{flex:1, backgroundColor:'#121212', padding:16, paddingTop:50},
  center:{flex:1, backgroundColor:'#121212', justifyContent:'center', alignItems:'center'},
  h1:{color:'#fff', fontSize:30, fontWeight:'bold'},
  sub:{color:'#E8C87A', marginBottom:20, marginTop:4},
  grid:{flexDirection:'row', flexWrap:'wrap', gap:12},
  card:{backgroundColor:'#1E1E1E', width:'47%', padding:18, borderRadius:18, borderWidth:1, borderColor:'#2A2A2A'},
  lab:{color:'#888', fontSize:10, letterSpacing:1}, val:{color:'#E8C87A', fontSize:20, fontWeight:'bold', marginTop:8}, sm:{color:'#666', fontSize:11, marginTop:4},
  chartBox:{backgroundColor:'#1E1E1E', borderRadius:18, padding:16, marginTop:16, borderWidth:1, borderColor:'#2A2A2A'},
  chartTitle:{color:'#fff', fontWeight:'bold', fontSize:14},
  rowStats:{flexDirection:'row', gap:12, marginTop:16, marginBottom:40},
  miniCard:{flex:1, backgroundColor:'#1E1E1E', padding:14, borderRadius:14, borderWidth:1, borderColor:'#2A2A2A', alignItems:'center'},
  miniLab:{color:'#888', fontSize:10}, miniVal:{color:'#E8C87A', fontSize:18, fontWeight:'bold', marginTop:4}
});