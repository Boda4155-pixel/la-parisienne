import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import StatCard from "../../../components/admin/StatCard";
import { useAdminStore } from "../../../store/admin.store";
import { useSupabaseQuery } from "../../../hooks/useSupabaseQuery";
import { getDashboardStats } from "../../../lib/adminQueries";
import AdminMoreTrigger from "../../../components/admin/AdminMoreTrigger";

export default function Dashboard() {
  const [refreshing, setRefreshing] = React.useState(false);

  const { data: stats, loading: loadingStats } = useSupabaseQuery({
    fn: getDashboardStats,
    skip: false,
  });

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    useAdminStore.getState().refresh();
    setRefreshing(false);
  }, []);

  const loading = loadingStats;

  return (
    <SafeAreaView style={styles.container}>
      {/* Page Title */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Dashboard</Text>
          <Text style={styles.subtitle}>
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </Text>
        </View>
        <AdminMoreTrigger />
      </View>

      {/* Stat Cards Row - 2x2 grid */}
      <View style={styles.statsContainer}>
        <StatCard
          title="Total Revenue"
          value={stats?.totalRevenue ?? 0}
          suffix="EGP"
          icon={require("lucide-react-native").TrendingUp}
          color="#FE8C00"
          loading={loading}
        />
        <StatCard
          title="Total Orders"
          value={stats?.totalOrders ?? 0}
          icon={require("lucide-react-native").ShoppingCart}
          color="#FE8C00"
          loading={loading}
        />
        <StatCard
          title="Total Customers"
          value={stats?.totalCustomers ?? 0}
          icon={require("lucide-react-native").Users}
          color="#FE8C00"
          loading={loading}
        />
        <StatCard
          title="Pending Orders"
          value={stats?.pendingOrders ?? 0}
          icon={require("lucide-react-native").Clock}
          color="#FE8C00"
          loading={loading}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FDF8F3",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#181C2E",
    fontFamily: "Quicksand-Bold",
  },
  subtitle: {
    fontSize: 14,
    color: "#878787",
    marginTop: 4,
    fontFamily: "Quicksand-Regular",
  },
  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    paddingHorizontal: 20,
  },
});