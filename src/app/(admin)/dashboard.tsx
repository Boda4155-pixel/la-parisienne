import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Dimensions, ScrollView, Text, View } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { ADMIN_COLORS } from '../../../lib/adminTheme';
import { supabase } from '../../../lib/supabase';

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

  if(loading) return <View style={{flex:1, backgroundColor: ADMIN_COLORS.background, justifyContent:'center', alignItems:'center'}}><ActivityIndicator color={ADMIN_COLORS.primary} size="large"/></View>;

  return (
    <View style={{flex:1, backgroundColor: ADMIN_COLORS.background, padding:16, paddingTop:50}}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{paddingBottom: 120}}>
        <Text style={{color: ADMIN_COLORS.textPrimary, fontSize:30, fontWeight:'800'}}>{t('admin.nav.dashboard')}</Text>
        <Text style={{color: ADMIN_COLORS.textSecondary, marginBottom:20, marginTop:4, fontWeight:'700'}}>La Parisienne • {t('admin.dashboard.ordersCount', { count: stats.totalCount })} • Live</Text>

        <View style={{flexDirection:'row', flexWrap:'wrap', gap:12}}>
          <View style={{backgroundColor: ADMIN_COLORS.primary, width:'47%', padding:18, borderRadius:18, borderWidth:1, borderColor: ADMIN_COLORS.primary}}>
            <Text style={{color: ADMIN_COLORS.primaryText, opacity:0.9, fontSize:10, letterSpacing:1, fontWeight:'700', textTransform:'uppercase'}}>{t('admin.dashboard.pending')}</Text>
            <Text style={{color: ADMIN_COLORS.primaryText, fontSize:20, fontWeight:'800', marginTop:8}}>{stats.pending}</Text>
            <Text style={{color: ADMIN_COLORS.background, opacity:0.7, fontSize:11, marginTop:4}}>{t('admin.dashboard.needAction')}</Text>
          </View>
          <View style={{backgroundColor: ADMIN_COLORS.card, width:'47%', padding:18, borderRadius:18, borderWidth:1, borderColor: ADMIN_COLORS.border}}>
            <Text style={{color: ADMIN_COLORS.textMuted, fontSize:10, letterSpacing:1, fontWeight:'700', textTransform:'uppercase'}}>{t('admin.dashboard.todaySales')}</Text>
            <Text style={{color: ADMIN_COLORS.textPrimary, fontSize:20, fontWeight:'800', marginTop:8}}>EGP {stats.today}</Text>
            <Text style={{color: ADMIN_COLORS.textSecondary, fontSize:11, marginTop:4}}>{t('admin.dashboard.ordersToday', { count: stats.todayCount })}</Text>
          </View>
          <View style={{backgroundColor: ADMIN_COLORS.card, width:'47%', padding:18, borderRadius:18, borderWidth:1, borderColor: ADMIN_COLORS.border}}>
            <Text style={{color: ADMIN_COLORS.textMuted, fontSize:10, letterSpacing:1, fontWeight:'700', textTransform:'uppercase'}}>{t('admin.dashboard.totalRevenue')}</Text>
            <Text style={{color: ADMIN_COLORS.textPrimary, fontSize:20, fontWeight:'800', marginTop:8}}>EGP {stats.total}</Text>
            <Text style={{color: ADMIN_COLORS.textSecondary, fontSize:11, marginTop:4}}>{t('admin.dashboard.totalOrders', { count: stats.totalCount })}</Text>
          </View>
          <View style={{backgroundColor: ADMIN_COLORS.card, width:'47%', padding:18, borderRadius:18, borderWidth:1, borderColor: ADMIN_COLORS.border}}>
            <Text style={{color: ADMIN_COLORS.textMuted, fontSize:10, letterSpacing:1, fontWeight:'700', textTransform:'uppercase'}}>{t('admin.dashboard.delivered')}</Text>
            <Text style={{color: ADMIN_COLORS.textPrimary, fontSize:20, fontWeight:'800', marginTop:8}}>{stats.delivered}</Text>
            <Text style={{color: ADMIN_COLORS.textSecondary, fontSize:11, marginTop:4}}>{t('admin.dashboard.completed')}</Text>
          </View>
        </View>

        <View style={{backgroundColor: ADMIN_COLORS.card, borderRadius:18, padding:16, marginTop:16, borderWidth:1, borderColor: ADMIN_COLORS.border}}>
          <Text style={{color: ADMIN_COLORS.textPrimary, fontWeight:'800', fontSize:14}}>{t('admin.dashboard.salesLast7Days')}</Text>
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
              color: (opacity = 1) => `rgba(26, 26, 26, ${opacity})`,
              labelColor: () => ADMIN_COLORS.textPrimary,
              style: { borderRadius: 16 },
              barPercentage: 0.6,
            }}
            style={{ borderRadius: 16, marginTop: 10 }}
            fromZero
            showValuesOnTopOfBars
          />
        </View>

        <View style={{flexDirection:'row', gap:12, marginTop:16, marginBottom:40}}>
          <View style={{flex:1, backgroundColor: ADMIN_COLORS.card, padding:14, borderRadius:14, borderWidth:1, borderColor: ADMIN_COLORS.border, alignItems:'center'}}>
            <Text style={{color: ADMIN_COLORS.textMuted, fontSize:10, fontWeight:'700', textTransform:'uppercase'}}>{t('admin.dashboard.users')}</Text>
            <Text style={{color: ADMIN_COLORS.textPrimary, fontSize:18, fontWeight:'800', marginTop:4}}>{stats.users}</Text>
          </View>
          <View style={{flex:1, backgroundColor: ADMIN_COLORS.card, padding:14, borderRadius:14, borderWidth:1, borderColor: ADMIN_COLORS.border, alignItems:'center'}}>
            <Text style={{color: ADMIN_COLORS.textMuted, fontSize:10, fontWeight:'700', textTransform:'uppercase'}}>{t('admin.dashboard.products')}</Text>
            <Text style={{color: ADMIN_COLORS.textPrimary, fontSize:18, fontWeight:'800', marginTop:4}}>{stats.products}</Text>
          </View>
          <View style={{flex:1, backgroundColor: ADMIN_COLORS.card, padding:14, borderRadius:14, borderWidth:1, borderColor: ADMIN_COLORS.border, alignItems:'center'}}>
            <Text style={{color: ADMIN_COLORS.textMuted, fontSize:10, fontWeight:'700', textTransform:'uppercase'}}>{t('admin.dashboard.ordersLabel')}</Text>
            <Text style={{color: ADMIN_COLORS.textPrimary, fontSize:18, fontWeight:'800', marginTop:4}}>{stats.totalCount}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}