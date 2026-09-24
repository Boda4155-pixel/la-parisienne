import React from "react";
import { FlatList, Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { Clock, Globe, MapPin, Phone, Settings as SettingsIcon } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { router } from "expo-router";

import { useSupabaseQuery } from "../../../hooks/useSupabaseQuery";
import { getAllStoreHours, getAllDeliveryZones, getAllSupportContacts } from "../../../lib/adminQueries";
import AdminMoreTrigger from "../../../components/admin/AdminMoreTrigger";

interface SettingsRow {
  id: string;
  titleKey: string;
  subtitleKey: string;
  icon: React.ReactNode;
  href: string;
}

export default function Settings() {
  const { t } = useTranslation();
  const { data: storeHours } = useSupabaseQuery({ fn: getAllStoreHours, skip: false });
  const { data: deliveryZones } = useSupabaseQuery({ fn: getAllDeliveryZones, skip: false });
  const { data: supportContacts } = useSupabaseQuery({ fn: getAllSupportContacts, skip: false });

  const rows: SettingsRow[] = [
    {
      id: "store-hours",
      titleKey: "admin.settings.storeHours.title",
      subtitleKey: "admin.settings.storeHours.subtitle",
      icon: <Clock size={22} color="#FE8C00" />,
      href: "/settings/store-hours",
    },
    {
      id: "store-location",
      titleKey: "admin.settings.storeLocation.title",
      subtitleKey: "admin.settings.storeLocation.subtitle",
      icon: <MapPin size={22} color="#FE8C00" />,
      href: "/settings/store-location",
    },
    {
      id: "delivery-zones",
      titleKey: "admin.settings.deliveryZones.title",
      subtitleKey: "admin.settings.deliveryZones.subtitle",
      icon: <MapPin size={22} color="#FE8C00" />,
      href: "/settings/delivery-zones",
    },
    {
      id: "language",
      titleKey: "admin.settings.language.title",
      subtitleKey: "admin.settings.language.subtitle",
      icon: <Globe size={22} color="#FE8C00" />,
      href: "/settings/language",
    },
    {
      id: "support-contacts",
      titleKey: "admin.settings.supportContacts.title",
      subtitleKey: "admin.settings.supportContacts.subtitle",
      icon: <Phone size={22} color="#FE8C00" />,
      href: "/settings/support-contacts",
    },
  ];

  const renderItem = ({ item }: { item: SettingsRow }) => (
    <Pressable style={styles.row} onPress={() => router.push(item.href as any)}>
      <View style={styles.rowIcon}>{item.icon}</View>
      <View style={styles.rowContent}>
        <Text style={styles.rowTitle}>{t(item.titleKey)}</Text>
        <Text style={styles.rowSubtitle} numberOfLines={1}>
          {t(item.subtitleKey)}
        </Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );

  const Header = React.useCallback(() => (
    <>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{t("admin.settings.title")}</Text>
          <Text style={styles.subtitle}>{t("admin.settings.subtitle")}</Text>
        </View>
        <View style={styles.headerActions}>
          <AdminMoreTrigger />
        </View>
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.summaryIcon}>
          <SettingsIcon size={24} color="#FE8C00" />
        </View>
        <View style={styles.summaryContent}>
          <Text style={styles.summaryLabel}>{t("admin.settings.total")}</Text>
          <Text style={styles.summaryValue}>
            {(storeHours?.length ?? 0) + (deliveryZones?.length ?? 0) + (supportContacts?.length ?? 0)}
          </Text>
        </View>
      </View>
    </>
  ), [storeHours?.length, deliveryZones?.length, supportContacts?.length, t]);

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={rows}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={Header}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FDF8F3",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
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
  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    shadowColor: "#181C2E",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 24,
  },
  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#FE8C0022",
    alignItems: "center",
    justifyContent: "center",
  },
  summaryContent: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    fontFamily: "Quicksand-Medium",
    color: "#878787",
    textTransform: "uppercase",
  },
  summaryValue: {
    fontSize: 24,
    fontFamily: "Quicksand-Bold",
    color: "#181C2E",
    marginTop: 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: 12,
    paddingHorizontal: 16,
    shadowColor: "#181C2E",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#FE8C0022",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  rowContent: {
    flex: 1,
    minWidth: 0,
  },
  rowTitle: {
    fontSize: 16,
    fontFamily: "Quicksand-SemiBold",
    color: "#181C2E",
  },
  rowSubtitle: {
    fontSize: 12,
    fontFamily: "Quicksand-Regular",
    color: "#9CA3AF",
    marginTop: 3,
  },
  chevron: {
    fontSize: 24,
    color: "#D1D5DB",
    fontFamily: "Quicksand-Regular",
  },
});