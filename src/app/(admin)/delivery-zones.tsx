import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { supabase } from '../../../lib/supabase';
import { ADMIN_COLORS } from "../../../lib/adminTheme";

export default function Dashboard() {
  const { t } = useTranslation();
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
      labels: Object.keys(grouped).reverse().length? Object.keys(grouped).reverse() : [t('admin.dashboard.noData')],
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

  if(loading) return <View style={s.center}><ActivityIndicator color={ADMIN_COLORS.textPrimary} size="large"/></View>;

  return (
    <View style={s.bg}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom: 120}}>
        <Text style={s.h1}>{t('admin.nav.dashboard')}</Text>
        <Text style={s.sub}>La Parisienne • {t('admin.dashboard.ordersCount', { count: stats.totalCount })} • Live</Text>

        <View style={s.grid}>
          <View style={[s.card, {backgroundColor:ADMIN_COLORS.cardSecondary, borderColor:ADMIN_COLORS.borderLight}]}><Text style={[s.lab,{color:ADMIN_COLORS.textPrimary, opacity:0.9}]}>{t('admin.dashboard.pending')}</Text><Text style={[s.val,{color:ADMIN_COLORS.textPrimary}]}>{stats.pending}</Text><Text style={[s.sm,{color:ADMIN_COLORS.textSecondary}]}>{t('admin.dashboard.needAction')}</Text></View>
          <View style={s.card}><Text style={s.lab}>{t('admin.dashboard.todaySales')}</Text><Text style={s.val}>EGP {stats.today}</Text><Text style={s.sm}>{t('admin.dashboard.ordersToday', { count: stats.todayCount })}</Text></View>
          <View style={s.card}><Text style={s.lab}>{t('admin.dashboard.totalRevenue')}</Text><Text style={s.val}>EGP {stats.total}</Text><Text style={s.sm}>{t('admin.dashboard.totalOrders', { count: stats.totalCount })}</Text></View>
          <View style={s.card}><Text style={s.lab}>{t('admin.dashboard.delivered')}</Text><Text style={s.val}>{stats.delivered}</Text><Text style={s.sm}>{t('admin.dashboard.completed')}</Text></View>
        </View>

        <View style={s.chartBox}>
          <Text style={s.chartTitle}>{t('admin.dashboard.salesLast7Days')}</Text>
          <BarChart
            data={{ labels: chart.labels, datasets: [{ data: chart.data }] }}
            width={Dimensions.get('window').width - 50}
            height={220}
            yAxisLabel="EGP "
            yAxisSuffix=""
            chartConfig={{
              backgroundColor: ADMIN_COLORS.card,
              backgroundGradientFrom: ADMIN_COLORS.card,
              backgroundGradientTo: ADMIN_COLORS.card,
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
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
          <View style={s.miniCard}><Text style={s.miniLab}>{t('admin.dashboard.users')}</Text><Text style={s.miniVal}>{stats.users}</Text></View>
          <View style={s.miniCard}><Text style={s.miniLab}>{t('admin.dashboard.products')}</Text><Text style={s.miniVal}>{stats.products}</Text></View>
          <View style={s.miniCard}><Text style={s.miniLab}>{t('admin.dashboard.ordersLabel')}</Text><Text style={s.miniVal}>{stats.totalCount}</Text></View>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  bg:{flex:1, backgroundColor:ADMIN_COLORS.background, padding:16, paddingTop:50},
  center:{flex:1, backgroundColor:ADMIN_COLORS.background, justifyContent:'center', alignItems:'center'},
  h1:{color:ADMIN_COLORS.textPrimary, fontSize:30, fontWeight:'800'},
  sub:{color:ADMIN_COLORS.textSecondary, marginBottom:20, marginTop:4, fontWeight:'700'},
  grid:{flexDirection:'row', flexWrap:'wrap', gap:12},
  card:{backgroundColor:ADMIN_COLORS.card, width:'47%', padding:18, borderRadius:18, borderWidth:1, borderColor:ADMIN_COLORS.border},
  lab:{color:ADMIN_COLORS.textSecondary, fontSize:10, letterSpacing:1, fontWeight:'700', textTransform:'uppercase'}, val:{color:ADMIN_COLORS.textPrimary, fontSize:20, fontWeight:'800', marginTop:8}, sm:{color:ADMIN_COLORS.textMuted, fontSize:11, marginTop:4},
  chartBox:{backgroundColor:ADMIN_COLORS.card, borderRadius:18, padding:16, marginTop:16, borderWidth:1, borderColor:ADMIN_COLORS.border},
  chartTitle:{color:ADMIN_COLORS.textPrimary, fontWeight:'800', fontSize:14},
  rowStats:{flexDirection:'row', gap:12, marginTop:16, marginBottom:40},
  miniCard:{flex:1, backgroundColor:ADMIN_COLORS.card, padding:14, borderRadius:14, borderWidth:1, borderColor:ADMIN_COLORS.border, alignItems:'center'},
  miniLab:{color:ADMIN_COLORS.textSecondary, fontSize:10, fontWeight:'700', textTransform:'uppercase'}, miniVal:{color:ADMIN_COLORS.textPrimary, fontSize:18, fontWeight:'800', marginTop:4}
});