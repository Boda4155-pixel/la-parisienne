import React from "react";
import { Alert, FlatList, Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { Phone, Plus, Pencil, Trash2 } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { router } from "expo-router";

import { useSupabaseQuery } from "../../../../hooks/useSupabaseQuery";
import {
  AdminSupportContact,
  createSupportContact,
  deleteSupportContact,
  getAllSupportContacts,
  updateSupportContact,
} from "../../../../lib/adminQueries";
import { useAdminStore } from "../../../../store/admin.store";
import AdminMoreTrigger from "../../../../components/admin/AdminMoreTrigger";

export default function SupportContactsSettings() {
  const { t } = useTranslation();
  const { refreshTrigger } = useAdminStore();
  const { data: supportContacts, refetch } = useSupabaseQuery({
    fn: getAllSupportContacts,
    skip: false,
  });

  const handleRefresh = React.useCallback(() => {
    useAdminStore.getState().refresh();
    refetch();
  }, [refetch]);

  const handleDelete = (id: string) => {
    Alert.alert(
      t("admin.settings.supportContacts.deleteTitle"),
      t("admin.settings.supportContacts.deleteConfirm"),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: async () => {
            try {
              await deleteSupportContact(id);
              handleRefresh();
            } catch (deleteError: any) {
              Alert.alert(t("common.somethingWentWrong"), deleteError?.message);
            }
          },
        },
      ],
    );
  };

  const renderItem = ({ item }: { item: AdminSupportContact }) => (
    <Pressable
      style={styles.row}
      onPress={() => router.push(`/(admin)/settings/support-contacts/${item.id}` as any)}
    >
      <View style={styles.rowContent}>
        <Text style={styles.rowTitle}>{item.phone}</Text>
        <View style={styles.rowMeta}>
          <Text style={styles.rowValue}>{item.label ?? t("admin.settings.supportContacts.noLabel")}</Text>
          <View style={[styles.statusBadge, item.is_primary ? styles.statusActive : styles.statusInactive]}>
            <View style={[styles.statusDot, item.is_primary ? styles.statusDotActive : styles.statusDotInactive]} />
            <Text style={[styles.statusText, item.is_primary ? styles.statusTextActive : styles.statusTextInactive]}>
              {item.is_primary ? t("admin.settings.supportContacts.primary") : ""}
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.actions}>
        <Pressable
          style={styles.iconButton}
          onPress={() => router.push(`/(admin)/settings/support-contacts/${item.id}` as any)}
        >
          <Pencil size={16} color="#FE8C00" />
        </Pressable>
        <Pressable
          style={styles.iconButton}
          onPress={() => handleDelete(item.id)}
        >
          <Trash2 size={16} color="#EF4444" />
        </Pressable>
      </View>
    </Pressable>
  );

  const Header = React.useCallback(() => (
    <>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{t("admin.settings.supportContacts.title")}</Text>
          <Text style={styles.subtitle}>{t("admin.settings.supportContacts.subtitle")}</Text>
        </View>
        <View style={styles.headerActions}>
          <AdminMoreTrigger />
          <Pressable style={styles.addButton} onPress={() => router.push("/(admin)/settings/support-contacts/new" as any)}>
            <Plus size={18} color="#FFFFFF" />
            <Text style={styles.addButtonText}>{t("admin.settings.supportContacts.add")}</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.summaryIcon}>
          <Phone size={24} color="#FE8C00" />
        </View>
        <View style={styles.summaryContent}>
          <Text style={styles.summaryLabel}>{t("admin.settings.supportContacts.total")}</Text>
          <Text style={styles.summaryValue}>{supportContacts?.length ?? 0}</Text>
        </View>
      </View>
    </>
  ), [supportContacts?.length, t]);

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={supportContacts ?? []}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={Header}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{t("admin.settings.supportContacts.empty")}</Text>
          </View>
        )}
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
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FE8C00",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  addButtonText: {
    fontSize: 14,
    fontFamily: "Quicksand-Bold",
    color: "#FFFFFF",
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
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#181C2E",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  rowContent: {
    flex: 1,
    minWidth: 0,
    paddingRight: 12,
  },
  rowTitle: {
    fontSize: 15,
    fontFamily: "Quicksand-SemiBold",
    color: "#181C2E",
  },
  rowValue: {
    fontSize: 12,
    fontFamily: "Quicksand-Regular",
    color: "#878787",
    marginTop: 4,
  },
  rowMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    gap: 8,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusActive: { backgroundColor: "#DCFCE7" },
  statusInactive: { backgroundColor: "#F3F4F6" },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusDotActive: { backgroundColor: "#2F9B65" },
  statusDotInactive: { backgroundColor: "#9CA3AF" },
  statusText: { fontSize: 10, fontFamily: "Quicksand-Medium" },
  statusTextActive: { color: "#166534" },
  statusTextInactive: { color: "#6B7280" },
  actions: {
    flexDirection: "row",
    gap: 6,
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#FE8C0015",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    fontSize: 14,
    fontFamily: "Quicksand-Regular",
    color: "#878787",
    textAlign: "center",
    paddingVertical: 24,
  },
  errorText: {
    fontSize: 14,
    fontFamily: "Quicksand-Regular",
    color: "#EF4444",
    textAlign: "center",
    paddingVertical: 24,
  },
  emptyContainer: {
    paddingVertical: 32,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Quicksand-Regular",
    color: "#9CA3AF",
    textAlign: "center",
  },
});