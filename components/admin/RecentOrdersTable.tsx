import React from "react";
import { View, Text, StyleSheet } from "react-native";
import type { RecentOrder } from "../../lib/adminQueries";

type RecentOrdersTableProps = {
  data: RecentOrder[];
};

const RecentOrdersTable = ({ data }: RecentOrdersTableProps) => {
  if (!data || data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No orders yet</Text>
      </View>
    );
  }

  const STATUS_COLORS: Record<string, string> = {
    pending: "#F59E0B",
    confirmed: "#3B82F6",
    preparing: "#8B5CF6",
    out_for_delivery: "#FE8C00",
    delivered: "#2F9B65",
    cancelled: "#EF4444",
  };

  const STATUS_LABELS: Record<string, string> = {
    pending: "Pending",
    confirmed: "Confirmed",
    preparing: "Preparing",
    out_for_delivery: "Out for Delivery",
    delivered: "Delivered",
    cancelled: "Cancelled",
  };

  return (
    <View style={styles.container}>
      {data.map((item, index) => (
        <View key={item.id} style={styles.row}>
          <View style={styles.idContainer}>
            <Text style={styles.orderId}>{item.id.slice(0, 8)}</Text>
          </View>
          <View style={styles.statusBadge}>
            <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[item.status] ?? "#9CA3AF" }]} />
            <Text style={styles.statusText}>{STATUS_LABELS[item.status] ?? item.status}</Text>
          </View>
          <Text style={styles.customerName} numberOfLines={1}>
            {item.customer_name ?? item.customer_email ?? "—"}
          </Text>
          <Text style={styles.total}>{item.total.toLocaleString()} EGP</Text>
          <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}</Text>
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
    gap: 8,
    paddingVertical: 10,
  },
  idContainer: {
    minWidth: 70,
  },
  orderId: {
    fontSize: 12,
    fontFamily: "Quicksand-Medium",
    color: "#181C2E",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    minWidth: 80,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontFamily: "Quicksand-Medium",
    color: "#6B7280",
  },
  customerName: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Quicksand-Regular",
    color: "#6B7280",
  },
  total: {
    fontSize: 12,
    fontFamily: "Quicksand-Bold",
    color: "#181C2E",
    minWidth: 60,
    textAlign: "right",
  },
  date: {
    fontSize: 11,
    fontFamily: "Quicksand-Regular",
    color: "#878787",
    minWidth: 70,
    textAlign: "right",
  },
});

export default RecentOrdersTable;