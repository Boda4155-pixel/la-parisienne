import React, { useState, useCallback, useEffect, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  TextInput,
  Pressable,
  FlatList,
  ActivityIndicator,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import {
  Search,
  X,
  CheckCircle,
  Plus,
  Users,
  Clock,
  TrendingUp,
  ChevronRight,
  Mail,
  Lock,
  User,
} from "lucide-react-native";

import { useSupabaseQuery } from "../../../hooks/useSupabaseQuery";
import {
  getStaffMembers,
  updateStaffRole,
  toggleStaffActive,
  type StaffMember,
  type StaffRole,
  createStaff,
} from "../../../lib/adminQueries";
import AdminMoreTrigger from "../../../components/admin/AdminMoreTrigger";

// ===========================================
// Role Colors & Labels (Bilingual)
// ===========================================

const ROLE_CONFIG: Record<
  StaffRole,
  { label: { en: string; ar: string }; color: string; bgColor: string }
> = {
  cashier: { label: { en: "Cashier", ar: "كاشير" }, color: "#10B981", bgColor: "#D1FAE5" },
  supervisor: { label: { en: "Supervisor", ar: "مشرف" }, color: "#3B82F6", bgColor: "#DBEAFE" },
  admin: { label: { en: "Admin", ar: "مدير" }, color: "#8B5CF6", bgColor: "#EEE2FF" },
  delivery: { label: { en: "Delivery", ar: "توصيل" }, color: "#F59E0B", bgColor: "#FEF3C7" },
};

// ===========================================
// Format Functions
// ===========================================

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "EGP",
  }).format(amount);
};

const timeAgo = (dateStr: string | null): string => {
  if (!dateStr) return "";
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.round(diffMs / 60000);
    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.round(diffMs / 3600000);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.round(diffMs / 86400000);
    return `${diffDays}d ago`;
  } catch {
    return "";
  }
};

// ===========================================
// Main Staff Screen Component
// ===========================================

export default function StaffScreen() {
  const { t, i18n } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<StaffRole | "all">("all");
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<"role" | "toggle" | null>(null);
  // Add Staff Modal state
  const [addStaffModalVisible, setAddStaffModalVisible] = useState(false);
  const [newStaffName, setNewStaffName] = useState("");
  const [newStaffPhone, setNewStaffPhone] = useState("");
  const [newStaffRole, setNewStaffRole] = useState<StaffRole>("cashier");
  const [newStaffPassword, setNewStaffPassword] = useState("");
  const [addingStaff, setAddingStaff] = useState(false);

  const isRTL = i18n.dir() === "rtl";

  const { data: staff, loading, error, refetch } = useSupabaseQuery({
    fn: () => getStaffMembers(searchQuery, roleFilter),
  });

  // Re-fetch when filter or search changes
  useEffect(() => {
    refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleFilter]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const filteredStaff = useMemo(() => staff ?? [], [staff]);

  // Handle Role Change
  const handleRoleChange = async (staffId: string, newRole: StaffRole) => {
    setUpdatingId(staffId);
    setActionType("role");
    const success = await updateStaffRole(staffId, newRole);
    if (success) await refetch();
    setUpdatingId(null);
    setActionType(null);
  };

  // Handle Active Toggle
  const handleToggleActive = async (staffId: string, isActive: boolean) => {
    setUpdatingId(staffId);
    setActionType("toggle");
    const success = await toggleStaffActive(staffId, isActive);
    if (success) await refetch();
    setUpdatingId(null);
    setActionType(null);
  };

  // Handle Add Staff
  const handleAddStaff = async () => {
    if (!newStaffName.trim()) {
      Alert.alert(
        isRTL ? "خطأ" : "Error",
        isRTL ? "يرجى إدخال اسم الموظف" : "Please enter the staff member's name"
      );
      return;
    }
    if (!newStaffPhone.trim()) {
      Alert.alert(
        isRTL ? "خطأ" : "Error",
        isRTL ? "يرجى إدخال رقم الهاتف" : "Please enter the staff member's phone"
      );
      return;
    }

    setAddingStaff(true);
    const result = await createStaff({
      full_name: newStaffName.trim(),
      phone: newStaffPhone.trim(),
      role: newStaffRole,
      password: newStaffPassword,
    });

    if (result) {
      Alert.alert(
        isRTL ? "نجاح" : "Success",
        isRTL
          ? `تم إرسافة ${result.full_name ?? newStaffName} بنجاح`
          : `${result.full_name ?? newStaffName} has been added successfully`
      );
      setAddStaffModalVisible(false);
      // Reset form
      setNewStaffName("");
      setNewStaffPhone("");
      setNewStaffPassword("");
      setNewStaffRole("cashier");
      await refetch();
    } else {
      Alert.alert(
        isRTL ? "خطأ" : "Error",
        isRTL ? "فشل إضافة الموظف" : "Failed to add staff member"
      );
    }

    setAddingStaff(false);
  };

  // Render individual staff item
  const renderStaffItem = ({ item }: { item: StaffMember }) => {
    const isUpdating = updatingId === item.id;
    const roleConfig = ROLE_CONFIG[item.role as StaffRole] || ROLE_CONFIG.cashier;
    const isActive = item.is_active ?? true;

    return (
      <View style={styles.staffCard}>
        {/* Left: Avatar */}
        <View style={styles.avatarContainer}>
          <View style={[styles.avatarBg, { backgroundColor: roleConfig.bgColor }]}>
            <Users size={24} color={roleConfig.color} />
          </View>
        </View>

        {/* Middle: Details */}
        <View style={styles.detailsContainer}>
          <View style={styles.nameRoleContainer}>
            <Text style={styles.staffName}>
              {item.full_name ?? (isRTL ? "موظف" : "Staff Member")}
            </Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>
                {roleConfig.label[isRTL ? "ar" : "en"]}
              </Text>
            </View>
          </View>
          <View style={styles.statusContainer}>
            <Text style={styles.statusText}>
              {isActive
                ? "Active now"
                : `Last active ${timeAgo(item.lastActive)}`}
            </Text>
          </View>
          <View style={styles.statsContainer}>
            <Text style={styles.statsText}>
              {item.todayOrders ?? 0} Orders | {formatCurrency(item.todayRevenue ?? 0)}
            </Text>
          </View>
        </View>

        {/* Right: Actions */}
        <View style={styles.actionsContainer}>
          {isUpdating ? (
            <View style={styles.updatingIndicator}>
              <ActivityIndicator size={16} color="#FFFFFF" />
            </View>
          ) : (
            <>
              {/* Role Change (for non-admins viewing admin/cashier etc) */}
              {item.role !== "admin" && (
                <View style={styles.roleSelector}>
                  <Text style={styles.roleSelectorLabel}>Role:</Text>
                  {Object.keys(ROLE_CONFIG).map((role) => {
                    const roleKey = role as StaffRole;
                    if (roleKey === item.role) return null;
                    return (
                      <Pressable
                        key={roleKey}
                        style={[
                          styles.roleOption,
                          roleKey === "cashier" && styles.roleCashier,
                          roleKey === "supervisor" && styles.roleSupervisor,
                          roleKey === "admin" && styles.roleAdmin,
                          roleKey === "delivery" && styles.roleDelivery,
                        ]}
                        onPress={() => handleRoleChange(item.id, roleKey)}
                      >
                        <Text style={styles.roleOptionText}>
                          {ROLE_CONFIG[roleKey].label[isRTL ? "ar" : "en"]}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}
              {/* Active Toggle */}
              <Pressable
                style={[
                  styles.toggleButton,
                  isActive && styles.toggleActive,
                  !isActive && styles.toggleInactive,
                ]}
                onPress={() => handleToggleActive(item.id, !isActive)}
              >
                <Text style={styles.toggleButtonText}>
                  {isActive ? "Deactivate" : "Activate"}
                </Text>
              </Pressable>
            </>
          )}
          <Pressable style={styles.actionButton} onPress={() => {}}>
            <ChevronRight size={20} color="#878787" />
          </Pressable>
        </View>
      </View>
    );
  };

  // Skeleton Card for loading state
  const SkeletonCard = () => (
    <View style={styles.staffCard}>
      <View style={styles.skeletonAvatar} />
      <View style={styles.skeletonDetails} />
      <View style={styles.skeletonActions} />
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#C09248"]} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.title}>
              {isRTL ? "إدارة الموظفين والكاشيرات" : "Staff Management"}
            </Text>
            <Text style={styles.subtitle}>
              {isRTL ? "تحكم في جميع الموظفين" : "Manage all staff members"}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              style={styles.addButton}
              onPress={() => setAddStaffModalVisible(true)}
            >
              <Plus size={20} color="#FFFFFF" />
              <Text style={styles.addButtonText}>Add New Staff</Text>
            </Pressable>
          </View>
          <AdminMoreTrigger />
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Search size={20} color="#878787" />
            <TextInput
              style={styles.searchInput}
              placeholder={isRTL ? "ابحث باسم الموظف..." : "Search by staff name..."}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#878787"
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery("")}>
                <X size={20} color="#878787" />
              </Pressable>
            )}
          </View>
        </View>

        {/* Role Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
          contentContainerStyle={styles.filterContent}
        >
          {["all", "cashier", "supervisor", "admin", "delivery"].map((role) => {
            const isAll = role === "all";
            const label = isAll
              ? { en: "All", ar: "الكل" }
              : ROLE_CONFIG[role as StaffRole].label;
            return (
              <Pressable
                key={role}
                style={[
                  styles.filterChip,
                  roleFilter === role && styles.activeFilterChip,
                ]}
                onPress={() => setRoleFilter(role as StaffRole | "all")}
              >
                <Text style={styles.filterChipText}>
                  {label[isRTL ? "ar" : "en"]}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Staff Count */}
        <Text style={styles.countText}>
          {filteredStaff.length} {isRTL ? "موظف" : "staff"}
        </Text>

        {/* Staff List */}
        {loading && !staff ? (
          <View style={styles.skeletonContainer}>
            {[...Array(5)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </View>
        ) : filteredStaff.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              {isRTL ? "لا يوجد موظفين" : "No staff found"}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredStaff}
            keyExtractor={(item) => item.id}
            renderItem={renderStaffItem}
            scrollEnabled={false}
            contentContainerStyle={styles.staffList}
          />
        )}
      </ScrollView>

      {/* Add Staff Modal */}
      <Modal
        visible={addStaffModalVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setAddStaffModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.6)",
              justifyContent: "center",
              alignItems: "center",
              padding: 20,
            }}
          >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={styles.modalCard}>
                {/* Header with Close */}
                <View style={styles.modalCardHeader}>
                  <Text style={styles.modalTitle}>
                    {isRTL ? "إضافة موظف جديد" : "Add New Staff"}
                  </Text>
                  <Pressable
                    onPress={() => setAddStaffModalVisible(false)}
                    style={styles.modalCloseButton}
                  >
                    <Text style={styles.modalCloseText}>✕</Text>
                  </Pressable>
                </View>

                <ScrollView
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.modalScrollContent}
                >
                  {/* Name Field */}
                  <View style={styles.modalField}>
                    <Text style={styles.modalLabel}>
                      {isRTL ? "الاسم الكامل" : "Full Name"}
                    </Text>
                    <View style={styles.modalInputContainer}>
                      <User size={20} color="#878787" />
                      <TextInput
                        style={styles.modalInput}
                        value={newStaffName}
                        onChangeText={setNewStaffName}
                        placeholder={
                          isRTL ? "أدخل الاسم الكامل" : "Enter full name"
                        }
                        placeholderTextColor="#878787"
                      />
                    </View>
                  </View>

                  {/* Phone Field */}
                  <View style={styles.modalField}>
                    <Text style={styles.modalLabel}>
                      {isRTL ? "رقم الهاتف" : "Phone Number"}
                    </Text>
                    <View style={styles.modalInputContainer}>
                      <Mail size={20} color="#878787" />
                      <TextInput
                        style={styles.modalInput}
                        value={newStaffPhone}
                        onChangeText={setNewStaffPhone}
                        placeholder={
                          isRTL ? "أدخل رقم الهاتف" : "Enter phone number"
                        }
                        placeholderTextColor="#878787"
                        keyboardType="phone-pad"
                      />
                    </View>
                  </View>

                  {/* Role Dropdown */}
                  <View style={styles.modalField}>
                    <Text style={styles.modalLabel}>
                      {isRTL ? "الدور" : "Role"}
                    </Text>
                    <View style={styles.modalSelect}>
                      {(["cashier", "supervisor", "admin", "delivery"] as StaffRole[]).map(
                        (role) => {
                          return (
                            <Pressable
                              key={role}
                              style={[
                                styles.modalSelectOption,
                                newStaffRole === role &&
                                  styles.modalSelectOptionSelected,
                              ]}
                              onPress={() => setNewStaffRole(role)}
                            >
                              <Text
                                style={[
                                  styles.modalSelectOptionText,
                                  newStaffRole === role &&
                                    styles.modalSelectOptionTextSelected,
                                ]}
                              >
                                {ROLE_CONFIG[role].label[isRTL ? "ar" : "en"]}
                              </Text>
                            </Pressable>
                          );
                        }
                      )}
                    </View>
                  </View>

                  {/* Password Field */}
                  <View style={styles.modalField}>
                    <Text style={styles.modalLabel}>
                      {isRTL ? "كلمة المرور" : "Password"}
                    </Text>
                    <View style={styles.modalInputContainer}>
                      <Lock size={20} color="#878787" />
                      <TextInput
                        style={styles.modalInput}
                        value={newStaffPassword}
                        onChangeText={setNewStaffPassword}
                        placeholder={
                          isRTL ? "أدخل كلمة المرور" : "Enter password"
                        }
                        placeholderTextColor="#878787"
                        secureTextEntry
                      />
                    </View>
                  </View>

                  {/* Buttons */}
                  <View style={styles.modalButtons}>
                    <Pressable
                      style={styles.modalCancelButton}
                      onPress={() => {
                        setAddStaffModalVisible(false);
                        setNewStaffName("");
                        setNewStaffPhone("");
                        setNewStaffPassword("");
                        setNewStaffRole("cashier");
                      }}
                    >
                      <Text style={styles.modalCancelText}>
                        {isRTL ? "إلغاء" : "Cancel"}
                      </Text>
                    </Pressable>
                    <Pressable
                      style={[
                        styles.modalConfirmButton,
                        addingStaff && styles.modalConfirmButtonLoading,
                      ]}
                      onPress={handleAddStaff}
                      disabled={addingStaff}
                    >
                      {addingStaff ? (
                        <ActivityIndicator size={16} color="#FFFFFF" />
                      ) : (
                        <Text style={styles.modalConfirmText}>
                          {isRTL ? "إضافة" : "Add Staff"}
                        </Text>
                      )}
                    </Pressable>
                  </View>
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  headerActions: {
    flexDirection: "row",
    gap: 12,
  },
  addButton: {
    backgroundColor: "#C09248",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  addButtonText: {
    fontSize: 14,
    fontFamily: "Quicksand-Bold",
    color: "#FFFFFF",
  },

  // Search Container
  searchContainer: {
    marginBottom: 16,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: "#181C2E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    fontFamily: "Quicksand-Regular",
    color: "#181C2E",
  },

  // Filter Chips
  filterContainer: {
    marginBottom: 16,
  },
  filterContent: {
    gap: 8,
  },
  filterChip: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  activeFilterChip: {
    backgroundColor: "#C09248",
    borderColor: "#C09248",
  },
  filterChipText: {
    fontSize: 12,
    fontFamily: "Quicksand-Medium",
    color: "#878787",
  },

  // Count Text
  countText: {
    fontSize: 14,
    fontFamily: "Quicksand-Regular",
    color: "#878787",
    marginBottom: 16,
  },

  // Staff Card
  staffCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#181C2E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatarBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },

  // Details Container
  detailsContainer: {
    flex: 1,
  },
  nameRoleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  staffName: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "Quicksand-Bold",
    color: "#181C2E",
  },
  roleBadge: {
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  roleBadgeText: {
    fontSize: 11,
    fontFamily: "Quicksand-Medium",
    color: "#181C2E",
    fontWeight: "600",
  },
  statusContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusText: {
    fontSize: 12,
    fontFamily: "Quicksand-Regular",
    color: "#6B7280",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginTop: 4,
  },
  statsText: {
    fontSize: 12,
    fontFamily: "Quicksand-Regular",
    color: "#878787",
  },

  // Actions Container
  actionsContainer: {
    width: 100,
    alignItems: "flex-end",
    gap: 8,
  },
  updatingIndicator: {
    alignItems: "center",
    justifyContent: "center",
  },
  roleSelector: {
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
  },
  roleSelectorLabel: {
    fontSize: 11,
    fontFamily: "Quicksand-Regular",
    color: "#6B7280",
    marginBottom: 4,
  },
  roleOption: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginBottom: 2,
  },
  roleCashier: {
    backgroundColor: "#D1FAE5",
  },
  roleSupervisor: {
    backgroundColor: "#DBEAFE",
  },
  roleAdmin: {
    backgroundColor: "#EEE2FF",
  },
  roleDelivery: {
    backgroundColor: "#FEF3C7",
  },
  roleOptionText: {
    fontSize: 11,
    fontFamily: "Quicksand-Regular",
    color: "#374151",
  },
  toggleButton: {
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  toggleActive: {
    backgroundColor: "#10B981",
  },
  toggleInactive: {
    backgroundColor: "#EF4444",
  },
  toggleButtonText: {
    fontSize: 11,
    fontFamily: "Quicksand-Bold",
    color: "#FFFFFF",
  },
  actionButton: {
    alignItems: "center",
    justifyContent: "center",
  },

  // Empty State
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
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

  // Skeleton
  skeletonContainer: {
    gap: 12,
  },
  skeletonAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#E5E7EB",
  },
  skeletonDetails: {
    flex: 1,
    marginLeft: 16,
  },
  skeletonActions: {
    width: 100,
    alignItems: "flex-end",
  },

  // Staff List
  staffList: {
    gap: 12,
  },

  // Add Staff Modal
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    width: "100%",
    maxWidth: 400,
    shadowColor: "#181C2E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "Quicksand-Bold",
    color: "#181C2E",
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  modalCloseText: {
    fontSize: 16,
    fontFamily: "Quicksand-Bold",
    color: "#181C2E",
  },
  modalScrollContent: {
    paddingBottom: 10,
  },
  modalField: {
    marginBottom: 16,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Quicksand-Medium",
    color: "#181C2E",
    marginBottom: 8,
  },
  modalInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  modalInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    fontFamily: "Quicksand-Regular",
    color: "#181C2E",
  },
  modalSelect: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  modalSelectOption: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  modalSelectOptionSelected: {
    backgroundColor: "#C09248",
    borderColor: "#C09248",
  },
  modalSelectOptionText: {
    fontSize: 12,
    fontFamily: "Quicksand-Medium",
    color: "#878787",
  },
  modalSelectOptionTextSelected: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCancelText: {
    fontSize: 14,
    fontFamily: "Quicksand-Medium",
    color: "#181C2E",
    fontWeight: "600",
  },
  modalConfirmButton: {
    flex: 1,
    backgroundColor: "#C09248",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  modalConfirmButtonLoading: {
    opacity: 0.9,
  },
  modalConfirmText: {
    fontSize: 14,
    fontFamily: "Quicksand-Bold",
    color: "#FFFFFF",
    fontWeight: "600",
  },
});