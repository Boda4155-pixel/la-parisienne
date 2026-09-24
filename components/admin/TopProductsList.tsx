import React from "react";
import { View, Text, StyleSheet } from "react-native";

type TopProductsListProps = {
  data: Array<{
    id: string;
    name: string;
    units_sold: number;
    revenue: number;
  }>;
};

const TopProductsList = ({ data }: TopProductsListProps) => {
  if (!data || data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No products sold yet</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {data.map((product, index) => (
        <View key={product.id} style={styles.row}>
          <View style={[styles.rank, { backgroundColor: index === 0 ? "#FE8C00" : index === 1 ? "#D4A574" : "#E5E7EB" }]}>
            <Text style={styles.rankText}>{index + 1}</Text>
          </View>
          <View style={[styles.info, { flex: 1, minWidth: 0 }]}>
            <Text style={styles.name} numberOfLines={1}>{product.name}</Text>
            <Text style={styles.subText}>{product.units_sold} units sold</Text>
          </View>
          <View style={[styles.revenueContainer, { minWidth: 80, alignItems: "flex-end" }]}>
            <Text style={styles.revenue}>{product.revenue.toLocaleString()} EGP</Text>
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {},
  emptyContainer: {
    paddingVertical: 24,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#9CA3AF",
    fontFamily: "Quicksand-Regular",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },
  rank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  rankText: {
    fontSize: 12,
    fontWeight: "bold",
    fontFamily: "Quicksand-Bold",
    color: "#FFFFFF",
  },
  info: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: 14,
    fontFamily: "Quicksand-Medium",
    color: "#181C2E",
  },
  subText: {
    fontSize: 11,
    fontFamily: "Quicksand-Regular",
    color: "#878787",
    marginTop: 2,
  },
  revenueContainer: {
    minWidth: 80,
  },
  revenue: {
    fontSize: 14,
    fontFamily: "Quicksand-Bold",
    color: "#FE8C00",
    textAlign: "right",
  },
});

export default TopProductsList;