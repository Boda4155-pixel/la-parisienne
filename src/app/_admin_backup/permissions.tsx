import React, { useState, useCallback, useEffect, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  Pressable,
  FlatList,
  ActivityIndicator,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";

import { useSupabaseQuery } from "../../../hooks/useSupabaseQuery";
import {
  getRolePermissions,
  updateRolePermissions,
  type StaffRole,
} from "../../../lib/adminQueries";
import AdminMoreTrigger from "../../../components/admin/AdminMoreTrigger";

// Permission definitions
const PERMISSIONS = [
  { key: "process-orders", label: { en: "Process Orders", ar: "معالجة الطلبات" } },
  { key: "cancel-orders", label: { en: "Cancel Orders", ar: "إلغاء الطلبات" } },
  { key: "refund-orders", label: { en: "Refund Orders", ar: "استرداد الأموال" } },
  {
    key: "manage-products-stock",
    label: { en: "Manage Products & Stock", ar: "إدارة المنتجات والمخزون" },
  },
  {
    key: "view-analytics-reports",
    label: { en: "View Analytics & Reports", ar: "عرض التقارير والتحليلات" },
  },
  {
    key: "edit-staff-roles",
    label: { en: "Edit Staff & Roles", ar: "تعديل الموظفين والصلاحيات" },
  },
];

// Default permissions for each role (fallback if DB doesn't have data)
const DEFAULT_PERMISSIONS: Record<string, { [key: string]: boolean }> = {
  cashier: {
    "process-orders": true,
    "cancel-orders": true,
    "refund-orders": false,
    "manage-products-stock": false,
    "view-analytics-reports": false,
    "edit-staff-roles": false,
  },
  supervisor: {
    "process-orders": true,
    "cancel-orders": true,
    "refund-orders": true,
    "manage-products-stock": true,
    "view-analytics-reports": true,
    "edit-staff-roles": false,
  },
  admin: {
    "process-orders": true,
    "cancel-orders": true,
    "refund-orders": true,
    "manage-products-stock": true,
    "view-analytics-reports": true,
    "edit-staff-roles": true,
  },
};

export default function PermissionsScreen() {
  const { t, i18n } = useTranslation();
  const [selectedRole, setSelectedRole] = useState<StaffRole>("cashier");
  const [permissions, setPermissions] = useState<{ [key: string]: boolean }>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const isRTL = i18n.dir() === "rtl";

  // Fetch permissions for selected role
  const {
    data: rolePermissions,
    loading: roleLoading,
    refetch: refetchPermissions,
  } = useSupabaseQuery({
    fn: () => getRolePermissions(selectedRole as 'cashier' | 'supervisor' | 'admin'),
  });

  // Re-fetch when role changes
  useEffect(() => {
    setLoading(true);
    refetchPermissions()
      .then(() => setLoading(false))
      .catch(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRole]);

  // Update local state when fetched data arrives
  useEffect(() => {
    if (rolePermissions) {
      setPermissions(rolePermissions);
    }
  }, [rolePermissions]);

  // Initialize with default permissions on first load
  useEffect(() => {
    if (Object.keys(permissions).length === 0) {
      const defaults = DEFAULT_PERMISSIONS[selectedRole] || DEFAULT_PERMISSIONS.cashier;
      setPermissions(defaults);
    }
  }, [selectedRole, permissions]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetchPermissions();
    setRefreshing(false);
  }, [refetchPermissions]);

  // Toggle permission handler
  const togglePermission = async (key: string) => {
    setPermissions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Save all permissions
  const handleSave = async () => {
    setSaving(true);
    try {
      const enabledKeys = Object.entries(permissions)
        .filter(([, enabled]) => enabled)
        .map(([key]) => key);

      const success = await updateRolePermissions(selectedRole, enabledKeys);

      if (success) {
        // Optionally show success toast/notification
        console.log("Permissions saved successfully");
      } else {
        // Revert on failure
        await refetchPermissions();
        console.error("Failed to save permissions");
      }
    } catch (err: any) {
      console.error("Supabase Save Permissions Exception:", err?.message ?? err);
      // Revert on failure
      await refetchPermissions();
    } finally {
      setSaving(false);
    }
  };

  // Create new role handler (placeholder)
  const handleCreateNewRole = async () => {
    alert("Create new role functionality coming soon");
  };

  const showSkeleton = loading && !rolePermissions;

  // Get current permission value with fallback
  const getPermissionValue = (key: string): boolean => {
    return permissions[key] ?? DEFAULT_PERMISSIONS[selectedRole][key] ?? false;
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#C09248"]}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.title}>
              {isRTL ? "إدارة الصلاحيات والأدوار" : "Roles & Permissions"}
            </Text>
            <Text style={styles.subtitle}>
              {isRTL ? "اختر دورًا لإدارة إمكانياته" : "Choose a role to manage its capabilities"}
            </Text>
          </View>
          <AdminMoreTrigger />
        </View>

        {/* Role Selector Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.roleTabsContainer}
          contentContainerStyle={styles.roleTabsContent}
        >
          {[
            { role: "cashier", label: { en: "Cashier", ar: "كاشير" } },
            { role: "supervisor", label: { en: "Supervisor", ar: "مشرف" } },
            { role: "admin", label: { en: "Admin", ar: "مدير" } },
          ].map((roleItem) => (
            <Pressable
              key={roleItem.role}
              style={[
                styles.roleTab,
                selectedRole === roleItem.role && styles.activeRoleTab,
              ]}
              onPress={() => setSelectedRole(roleItem.role as StaffRole)}
            >
              <Text
                style={[
                  styles.roleTabText,
                  selectedRole === roleItem.role && styles.activeRoleTabText,
                ]}
              >
                {roleItem.label[isRTL ? "ar" : "en"]}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Permissions Card */}
        {!showSkeleton && (
          <View style={styles.permissionsCard}>
            <Text style={styles.sectionTitle}>
              {isRTL ? "الصلاحيات النشطة" : "Active Permissions"}
            </Text>
            {PERMISSIONS.map((perm) => (
              <View
                key={perm.key}
                style={styles.permissionItem}
              >
                <View style={styles.permissionInfo}>
                  <Text style={styles.permissionLabel}>
                    {perm.label[isRTL ? "ar" : "en"]}
                  </Text>
                </View>
                <View style={styles.permissionToggle}>
                  <Switch
                    trackColor={{ false: "#F3F4F6", true: "#C09248" }}
                    thumbColor="#FFFFFF"
                    ios_backgroundColor="#FFFFFF"
                    value={getPermissionValue(perm.key)}
                    onValueChange={() => togglePermission(perm.key)}
                    disabled={saving}
                  />
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Save Button */}
        <Pressable
          style={styles.saveButton}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size={16} color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>
              {isRTL ? "حفظ التغييرات" : "Save Changes"}
            </Text>
          )}
        </Pressable>

        {/* Create New Role Button */}
        <Pressable
          style={styles.createRoleButton}
          onPress={handleCreateNewRole}
        >
          <Text style={styles.createRoleButtonText}>
            {isRTL ? "إضافة دور جديد" : "+ Create New Role"}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

// ===========================================
// Styles
// ===========================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FDF8F3",
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  headerTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    fontFamily: "Quicksand-Bold",
    color: "#181C2E",
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Quicksand-Regular",
    color: "#878787",
    marginTop: 4,
  },

  // Role Tabs
  roleTabsContainer: {
    marginBottom: 24,
  },
  roleTabsContent: {
    gap: 12,
  },
  roleTab: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginRight: 8,
  },
  activeRoleTab: {
    backgroundColor: "#C09248",
    borderColor: "#C09248",
  },
  roleTabText: {
    fontSize: 12,
    fontFamily: "Quicksand-Medium",
    color: "#878787",
  },
  activeRoleTabText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },

  // Permissions Card
  permissionsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#181C2E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Quicksand-Bold",
    color: "#181C2E",
    marginBottom: 16,
  },
  permissionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  permissionInfo: {
    flex: 1,
  },
  permissionLabel: {
    fontSize: 14,
    fontFamily: "Quicksand-Regular",
    color: "#181C2E",
  },
  permissionToggle: {
    alignItems: "flex-end",
  },

  // Save Button
  saveButton: {
    backgroundColor: "#C09248",
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonText: {
    fontSize: 14,
    fontFamily: "Quicksand-Bold",
    color: "#FFFFFF",
  },

  // Create Role Button
  createRoleButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#C09248",
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  createRoleButtonText: {
    fontSize: 14,
    fontFamily: "Quicksand-Bold",
    color: "#C09248",
  },

  // Skeleton
  skeletonContainer: {
    gap: 12,
  },
  skeletonTitle: {
    width: "50%",
    height: 18,
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
    marginBottom: 12,
  },
  skeletonContent: {
    width: "80%",
    height: 14,
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
    marginBottom: 8,
  },

  // Empty State
  emptyText: {
    fontSize: 16,
    fontFamily: "Quicksand-Regular",
    color: "#9CA3AF",
  },

  // Error State
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    fontFamily: "Quicksand-Regular",
    color: "#181C2E",
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: "#C09248",
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  retryButtonText: {
    fontSize: 14,
    fontFamily: "Quicksand-Bold",
    color: "#FFFFFF",
  },
});