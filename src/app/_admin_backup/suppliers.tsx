import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft } from "lucide-react-native";
import { useRouter } from "expo-router";
import { I18nManager } from "react-native";
import AdminMoreTrigger from "../../../components/admin/AdminMoreTrigger";

export default function SuppliersScreen() {
  const router = useRouter();
  const isRTL = I18nManager.isRTL;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <SafeAreaView style={styles.inner}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace("/(admin)/dashboard");
              }
            }}
            hitSlop={20}
            style={styles.backButton}
          >
            <ArrowLeft size={24} color="#181C2E" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>
              {isRTL ? "الموردين" : "Suppliers"}
            </Text>
            <Text style={styles.subtitle}>
              {isRTL ? "قائمة الموردين" : "Supplier List"}
            </Text>
          </View>
          <AdminMoreTrigger />
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.placeholderText}>
            {isRTL ? "قائمة الموردين قريباً" : "Supplier list coming soon"}
          </Text>
        </View>
      </SafeAreaView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FDF8F3",
  },
  inner: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    paddingBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    fontFamily: "Quicksand-Bold",
    color: "#181C2E",
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Quicksand-Regular",
    color: "#878787",
    marginTop: 2,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  placeholderText: {
    fontSize: 16,
    fontFamily: "Quicksand-Medium",
    color: "#878787",
    textAlign: "center",
  },
});