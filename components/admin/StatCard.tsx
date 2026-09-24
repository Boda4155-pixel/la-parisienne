import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { LucideIcon } from "lucide-react-native";

type StatCardProps = {
  title: string;
  value: number | string;
  suffix?: string;
  icon: LucideIcon;
  color?: string;
  loading?: boolean;
};

const StatCard = ({ title, value, suffix = "", icon: Icon, color = "#FE8C00", loading }: StatCardProps) => {
  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.iconContainer}>
          <Icon size={24} color={color} />
        </View>
        <View style={styles.content}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.value} numberOfLines={1}>
            {loading ? "..." : `${value} ${suffix}`}
          </Text>
        </View>
      </View>
      <View style={styles.bottom} />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    width: "48%",
    flex: 0,
    flexBasis: "48%",
    minWidth: 0,
    shadowColor: "#181C2E",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#FE8C0022",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 12,
    fontFamily: "Quicksand-Medium",
    color: "#878787",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 20,
    fontWeight: "600",
    fontFamily: "Quicksand-Bold",
    color: "#181C2E",
    marginTop: 4,
  },
  bottom: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginTop: 16,
  },
});

export default StatCard;