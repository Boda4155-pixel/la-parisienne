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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import {
  Send,
  Clock,
  Users,
  Target,
  AlertTriangle,
  Info,
  Star,
  X,
} from "lucide-react-native";

import { useSupabaseQuery } from "../../../hooks/useSupabaseQuery";
import {
  sendAdminNotification,
  getRecentBroadcasts,
  type TargetType,
} from "../../../lib/adminQueries";
import AdminMoreTrigger from "../../../components/admin/AdminMoreTrigger";

// Message templates
const MESSAGE_TEMPLATES = [
  {
    id: "stock",
    label: { en: "Stock Alert", ar: "تنبيه مخزون" },
    title: { en: "Stock Alert", ar: "تنبيه مخزون" },
    body: {
      en: "Stock Alert: Please review items with low quantities.",
      ar: "تنبيه مخزون: يرجى مراجعة الأصناف ذات الكميات المنخفضة",
    },
  },
  {
    id: "promotion",
    label: { en: "New Promotion", ar: "عروض جديدة" },
    title: { en: "New Promotion Active", ar: "عروض جديدة" },
    body: {
      en: "New promotion: The new commercial offer is now active.",
      ar: "عروض جديدة: تم تفعيل العرض التجاري الجديد",
    },
  },
  {
    id: "meeting",
    label: { en: "Urgent Meeting", ar: "اجتماع عاجل" },
    title: { en: "Urgent Shift Meeting", ar: "اجتماع عاجل لجميع المشرفين" },
    body: {
      en: "Urgent: All supervisors are required to attend a shift meeting.",
      ar: "اجتماع عاجل لجميع المشرفين",
    },
  },
];

const TARGET_OPTIONS: { key: TargetType; label: { en: string; ar: string } }[] = [
  { key: "all", label: { en: "All Users", ar: "الكل" } },
  { key: "role", label: { en: "By Role", ar: "بالدور" } },
  { key: "branch", label: { en: "By Branch", ar: "بالفرع" } },
  { key: "user", label: { en: "Individual", ar: "فرد" } },
];

const MAX_MESSAGE_LENGTH = 500;

export default function MessengerScreen() {
  const { t, i18n } = useTranslation();
  const [targetType, setTargetType] = useState<TargetType>("all");
  const [targetValue, setTargetValue] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const isRTL = i18n.dir() === "rtl";

  const {
    data: broadcasts,
    loading: broadcastsLoading,
    refetch: refetchBroadcasts,
  } = useSupabaseQuery({ fn: () => getRecentBroadcasts() });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetchBroadcasts();
    setRefreshing(false);
  }, [refetchBroadcasts]);

  // Character counter
  const charCount = body.length;
  const charRemaining = MAX_MESSAGE_LENGTH - charCount;

  // Handle template select
  const applyTemplate = (template: typeof MESSAGE_TEMPLATES[0]) => {
    setTitle(template.title[isRTL ? "ar" : "en"]);
    setBody(template.body[isRTL ? "ar" : "en"]);
  };

  // Handle send
  const handleSend = async () => {
    if (!title.trim() || !body.trim()) return;

    setSending(true);
    const success = await sendAdminNotification(targetType, targetValue, title.trim(), body.trim());

    if (success) {
      setShowSuccess(true);
      setTitle("");
      setBody("");
      setTargetValue("");
      setTimeout(() => setShowSuccess(false), 3000);
      await refetchBroadcasts();
    } else {
      console.error("Failed to send notification");
    }

    setSending(false);
  };

  // Render broadcast item
  const renderBroadcast = ({ item }: { item: { id: string; title: string; body: string; target_type: string; created_at: string; read_count: number } }) => {
    const targetConfig = TARGET_OPTIONS.find((t) => t.key === item.target_type);

    return (
      <View style={styles.broadcastCard}>
        <View style={styles.broadcastHeader}>
          <Text style={styles.broadcastTitle} numberOfLines={1}>
            {item.title}
          </Text>
          {targetConfig && (
            <View style={styles.broadcastBadge}>
              <Text style={styles.broadcastBadgeText}>
                {targetConfig.label[isRTL ? "ar" : "en"]}
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.broadcastBody} numberOfLines={2}>
          {item.body}
        </Text>
        <View style={styles.broadcastMeta}>
          <View style={styles.broadcastMetaItem}>
            <Clock size={10} color="#878787" />
            <Text style={styles.broadcastMetaText}>
              {new Date(item.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </View>
          <View style={styles.broadcastMetaItem}>
            <Users size={10} color="#878787" />
            <Text style={styles.broadcastMetaText}>
              {item.read_count ?? 0} {isRTL ? "قراءة" : "reads"}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  // Skeleton
  const SkeletonCard = () => (
    <View style={styles.broadcastCard}>
      <View style={styles.skeletonLine} />
      <View style={[styles.skeletonLine, { width: "70%" }]} />
      <View style={styles.skeletonLineShort} />
    </View>
  );

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
              {isRTL ? "مركز الرسائل والتنبيهات" : "Admin Messenger"}
            </Text>
            <Text style={styles.subtitle}>
              {isRTL ? "إرسال رسائل مباشرة أو تنبيهات للموظفين" : "Send direct messages or broadcast alerts to staff"}
            </Text>
          </View>
          <AdminMoreTrigger />
        </View>

        {/* Success Feedback */}
        {showSuccess && (
          <View style={styles.successBanner}>
            <Info size={16} color="#FFFFFF" />
            <Text style={styles.successText}>
              {isRTL ? "تم إرسال التنبيه بنجاح" : "Notification sent successfully"}
            </Text>
            <Pressable onPress={() => setShowSuccess(false)}>
              <X size={14} color="#FFFFFF" />
            </Pressable>
          </View>
        )}

        {/* Recipient Selection */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            {isRTL ? "إرسال إلى" : "Recipient"}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.targetContainer}
            contentContainerStyle={styles.targetContent}
          >
            {TARGET_OPTIONS.map((opt) => (
              <Pressable
                key={opt.key}
                style={[
                  styles.targetChip,
                  targetType === opt.key && styles.activeTargetChip,
                ]}
                onPress={() => setTargetType(opt.key)}
              >
                <Text
                  style={[
                    styles.targetChipText,
                    targetType === opt.key && styles.activeTargetChipText,
                  ]}
                >
                  {opt.label[isRTL ? "ar" : "en"]}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Target value input (for role/branch/user) */}
          {(targetType === "role" || targetType === "branch" || targetType === "user") && (
            <TextInput
              style={styles.input}
              placeholder={
                isRTL
                  ? targetType === "role"
                    ? "أدخل الدور..."
                    : targetType === "branch"
                    ? "أدخل الفرع..."
                    : "أدخل اسم الموظف..."
                  : targetType === "role"
                  ? "Enter role..."
                  : targetType === "branch"
                  ? "Enter branch..."
                  : "Enter staff name..."
              }
              value={targetValue}
              onChangeText={setTargetValue}
              placeholderTextColor="#878787"
            />
          )}
        </View>

        {/* Message Templates */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            {isRTL ? "قوالب الرسائل" : "Message Templates"}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.templatesContainer}
            contentContainerStyle={styles.templatesContent}
          >
            {MESSAGE_TEMPLATES.map((template) => (
              <Pressable
                key={template.id}
                style={styles.templateChip}
                onPress={() => applyTemplate(template)}
              >
                <Text style={styles.templateChipText}>
                  {template.label[isRTL ? "ar" : "en"]}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Message Composer */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            {isRTL ? "إنشاء التنبيه" : "Compose Notification"}
          </Text>

          {/* Title input */}
          <TextInput
            style={styles.input}
            placeholder={isRTL ? "عنوان التنبيه..." : "Notification title..."}
            value={title}
            onChangeText={setTitle}
            placeholderTextColor="#878787"
          />

          {/* Body textarea */}
          <TextInput
            style={styles.textArea}
            placeholder={isRTL ? "نص الرسالة..." : "Message body..."}
            value={body}
            onChangeText={setBody}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            placeholderTextColor="#878787"
          />

          {/* Character counter */}
          <View style={styles.charCounter}>
            <Text
              style={[
                styles.charCounterText,
                charRemaining < 50 && styles.charCounterWarning,
              ]}
            >
              {charCount}/{MAX_MESSAGE_LENGTH}
            </Text>
          </View>

          {/* Send Button */}
          <Pressable
            style={[
              styles.sendButton,
              (!title.trim() || !body.trim()) && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={sending || !title.trim() || !body.trim()}
          >
            {sending ? (
              <ActivityIndicator size={16} color="#FFFFFF" />
            ) : (
              <>
                <Send size={18} color="#FFFFFF" />
                <Text style={styles.sendButtonText}>
                  {isRTL ? "إرسال التنبيه" : "Send Notification"}
                </Text>
              </>
            )}
          </Pressable>
        </View>

        {/* Recent Broadcasts */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {isRTL ? "الرسائل الأخيرة" : "Recent Broadcasts"}
            </Text>
          </View>

          {broadcastsLoading && !broadcasts ? (
            <View style={styles.broadcastList}>
              {[...Array(3)].map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </View>
          ) : broadcasts && broadcasts.length === 0 ? (
            <View style={styles.emptyState}>
              <AlertTriangle size={32} color="#D1D5DB" />
              <Text style={styles.emptyText}>
                {isRTL ? "لا توجد رسائل سابقة" : "No recent broadcasts"}
              </Text>
            </View>
          ) : (
            <FlatList
              data={broadcasts}
              keyExtractor={(item) => item.id}
              renderItem={renderBroadcast}
              scrollEnabled={false}
              contentContainerStyle={styles.broadcastList}
            />
          )}
        </View>
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

  // Card
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
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
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  // Target Chips
  targetContainer: {
    marginBottom: 12,
  },
  targetContent: {
    gap: 8,
  },
  targetChip: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginRight: 8,
  },
  activeTargetChip: {
    backgroundColor: "#C09248",
    borderColor: "#C09248",
  },
  targetChipText: {
    fontSize: 12,
    fontFamily: "Quicksand-Medium",
    color: "#878787",
  },
  activeTargetChipText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },

  // Input
  input: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: "Quicksand-Regular",
    color: "#181C2E",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  textArea: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: "Quicksand-Regular",
    color: "#181C2E",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    minHeight: 100,
    textAlignVertical: "top",
  },

  // Character Counter
  charCounter: {
    alignItems: "flex-end",
    marginBottom: 12,
  },
  charCounterText: {
    fontSize: 12,
    fontFamily: "Quicksand-Regular",
    color: "#878787",
  },
  charCounterWarning: {
    color: "#EF4444",
    fontWeight: "600",
  },

  // Send Button
  sendButton: {
    backgroundColor: "#C09248",
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  sendButtonDisabled: {
    backgroundColor: "#9CA3AF",
  },
  sendButtonText: {
    fontSize: 14,
    fontFamily: "Quicksand-Bold",
    color: "#FFFFFF",
  },

  // Templates
  templatesContainer: {
    marginBottom: 0,
  },
  templatesContent: {
    gap: 8,
  },
  templateChip: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginRight: 8,
  },
  templateChipText: {
    fontSize: 12,
    fontFamily: "Quicksand-Medium",
    color: "#181C2E",
  },

  // Success Banner
  successBanner: {
    backgroundColor: "#10B981",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  successText: {
    fontSize: 14,
    fontFamily: "Quicksand-Bold",
    color: "#FFFFFF",
    flex: 1,
  },

  // Broadcast Card
  broadcastCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#C09248",
  },
  broadcastHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  broadcastTitle: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Quicksand-Bold",
    color: "#181C2E",
    flex: 1,
  },
  broadcastBadge: {
    backgroundColor: "#FEF3C7",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 8,
  },
  broadcastBadgeText: {
    fontSize: 10,
    fontFamily: "Quicksand-Bold",
    color: "#92400E",
  },
  broadcastBody: {
    fontSize: 13,
    fontFamily: "Quicksand-Regular",
    color: "#6B7280",
    marginBottom: 8,
    lineHeight: 18,
  },
  broadcastMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  broadcastMetaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  broadcastMetaText: {
    fontSize: 11,
    fontFamily: "Quicksand-Regular",
    color: "#878787",
  },
  broadcastList: {
    gap: 8,
  },

  // Skeleton
  skeletonLine: {
    height: 14,
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonLineShort: {
    height: 14,
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
    width: "60%",
  },

  // Empty State
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: "Quicksand-Regular",
    color: "#9CA3AF",
  },
});