import React from "react";
import { View, StyleSheet, Text } from "react-native";

import AdminMoreTrigger from "./AdminMoreTrigger";

type AdminPageHeaderProps = {
  title: string;
  subtitle?: string;
};

export default function AdminPageHeader({
  title,
  subtitle,
}: AdminPageHeaderProps) {
  return (
    <View style={styles.header}>
      <View>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? (
          <Text style={styles.subtitle}>{subtitle}</Text>
        ) : null}
      </View>
      <AdminMoreTrigger />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontFamily: "Quicksand-Bold",
    color: "#181C2E",
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Quicksand-Regular",
    color: "#878787",
    marginTop: 4,
  },
});