import React from "react";
import { Pressable, StyleSheet } from "react-native";
import { MoreVertical } from "lucide-react-native";
import { useTranslation } from "react-i18next";

import { useAdminMore } from "./AdminMoreContext";

export default function AdminMoreTrigger() {
  const { t } = useTranslation();
  const { moreOpen, setMoreOpen } = useAdminMore();

  return (
    <Pressable
      style={styles.trigger}
      onPress={() => setMoreOpen(!moreOpen)}
      accessibilityRole="button"
      accessibilityLabel={t("admin.nav.more")}
    >
      <MoreVertical size={22} color="#181C2E" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  trigger: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
});