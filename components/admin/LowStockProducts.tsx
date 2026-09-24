import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { AlertTriangle } from "lucide-react-native";
import type { LowStockProduct } from "../../lib/adminQueries";

type LowStockProductsProps = {
  data: LowStockProduct[];
};

const LowStockProducts = ({ data }: LowStockProductsProps) => {
  if (!data || data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <AlertTriangle size={24} color="#2F9B65" />
        <Text style={styles.emptyText}>All products in stock</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {data.map((item) => (
        <View key={item.id} style={styles.row}>
          <View style={styles.productInfo}>
            <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.category}>Category: {item.category_id ?? "Uncategorized"}</Text>
          </View>
          <View style={[styles.stockInfo, { minWidth: 100, alignItems: "flex-end" }]}>
            <View style={styles.stockBadge}>
              <Text style={styles.stockText}>{item.stock_quantity} left</Text>
            </View>
            <Text style={styles.price}>{item.price.toLocaleString()} EGP</Text>
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
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Quicksand-Medium",
    color: "#2F9B65",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  productInfo: {
    flex: 1,
    minWidth: 0,
  },
  productName: {
    fontSize: 13,
    fontFamily: "Quicksand-Medium",
    color: "#181C2E",
  },
  category: {
    fontSize: 11,
    fontFamily: "Quicksand-Regular",
    color: "#9CA3AF",
    marginTop: 2,
  },
  stockInfo: {
    minWidth: 100,
  },
  stockBadge: {
    backgroundColor: "#FEF3C7",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: "flex-end",
  },
  stockText: {
    fontSize: 11,
    fontFamily: "Quicksand-Bold",
    color: "#92400E",
  },
  price: {
    fontSize: 11,
    fontFamily: "Quicksand-Medium",
    color: "#6B7280",
    marginTop: 4,
    textAlign: "right",
  },
});

export default LowStockProducts;