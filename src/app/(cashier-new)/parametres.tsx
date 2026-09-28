import { useState } from "react";
import {
  View,
  Text,
  Pressable,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "../../../store/auth.store";
import { Settings, Shield, Globe, Calendar, MapPin, Clock3, Banknote } from "lucide-react-native";

const GOLD = "#C9973F";
const DARK = "#1A1512";
const MUTED = "#6B6359";
const TERTIARY = "#9C9488";
const BORDER = "#E8E4DC";
const SUCCESS = "#2F7D46";
const WARNING = "#D9822B";
const CANVAS = "#F7F3EC";
const CARD_BG = "#FFFFFF";
const INPUT_BG = "#F3EEE5";

export default function CashierNewParametres() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === "ar";
  const insets = useSafeAreaInsets();
  const { profile } = useAuthStore();
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [autoPrint, setAutoPrint] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const OPEN_HOURS = [
    { day: "Lun", open: "06:00", close: "20:00" },
    { day: "Mar", open: "06:00", close: "20:00" },
    { day: "Mer", open: "06:00", close: "20:00" },
    { day: "Jeu", open: "06:00", close: "20:00" },
    { day: "Ven", open: "06:00", close: "20:00" },
    { day: "Sam", open: "07:00", close: "19:00" },
    { day: "Dim", open: "08:00", close: "18:00" },
  ];

  const handleToggleNotif = () => setNotifEnabled(!notifEnabled);
  const handleTogglePrint = () => setAutoPrint(!autoPrint);
  const handleToggleSound = () => setSoundEnabled(!soundEnabled);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 8 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>{t("cashier.settings.title", "Paramètres")}</Text>

        {/* Store Info */}
        <View style={styles.section}>
          <View style={styles.sectionTitle}>
            <Settings size={20} color={TERTIARY} />
            <Text style={styles.sectionTitleText}>{t("cashier.settings.title", "Informations du magasin")}</Text>
          </View>
          <View style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Nom du magasin</Text>
              <Text style={styles.rowVal}>La Parisienne</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Adresse</Text>
              <Text style={styles.rowVal}>123 Rue de la Paix, Paris</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Téléphone</Text>
              <Text style={styles.rowVal}>+33 1 23 45 67 89</Text>
            </View>
          </View>
        </View>

        {/* Opening Hours */}
        <View style={styles.section}>
          <View style={styles.sectionTitle}>
            <Calendar size={20} color={TERTIARY} />
            <Text style={styles.sectionTitleText}>Horaires d'ouverture</Text>
          </View>
          {OPEN_HOURS.map((day) => (
            <View key={day.day} style={styles.hourRow}>
              <Text style={styles.hourLabel}>{day.day}</Text>
              <View style={styles.hourRange}>
                <Text style={styles.hourTime}>{day.open}</Text>
                <Text style={styles.hourSep}>–</Text>
                <Text style={styles.hourTime}>{day.close}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Payment Methods */}
        <View style={styles.section}>
          <View style={styles.sectionTitle}>
            <Banknote size={20} color={TERTIARY} />
            <Text style={styles.sectionTitleText}>Moyens de paiement</Text>
          </View>
          <View style={styles.card}>
            <View style={styles.paymentItem}>
              <Text style={styles.paymentLabel}>Espèces</Text>
              <View style={styles.paymentStatus}>
                <Text style={styles.paymentActive}>Actif</Text>
              </View>
            </View>
            <View style={styles.paymentItem}>
              <Text style={styles.paymentLabel}>Carte bancaire</Text>
              <View style={styles.paymentStatus}>
                <Text style={styles.paymentActive}>Actif</Text>
              </View>
            </View>
            <View style={styles.paymentItem}>
              <Text style={styles.paymentLabel}>Chèque</Text>
              <View style={styles.paymentStatus}>
                <Text style={styles.paymentInactive}>Inactif</Text>
              </View>
            </View>
            <View style={styles.paymentItem}>
              <Text style={styles.paymentLabel}>Ticket Restaurant</Text>
              <View style={styles.paymentStatus}>
                <Text style={styles.paymentInactive}>Inactif</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <View style={styles.sectionTitle}>
            <Clock3 size={20} color={TERTIARY} />
            <Text style={styles.sectionTitleText}>Notifications</Text>
          </View>
          <View style={styles.card}>
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Alertes de nouvelles commandes</Text>
              <View style={styles.toggleSwitch}>
                <View
                  style={[
                    styles.toggleThumb,
                    { backgroundColor: notifEnabled ? SUCCESS : "#E5E7EB" },
                  ]}
                />
              </View>
            </View>
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Impression automatique des tickets</Text>
              <View style={styles.toggleSwitch}>
                <View
                  style={[
                    styles.toggleThumb,
                    { backgroundColor: autoPrint ? SUCCESS : "#E5E7EB" },
                  ]}
                />
              </View>
            </View>
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Son activé pour les alertes</Text>
              <View style={styles.toggleSwitch}>
                <View
                  style={[
                    styles.toggleThumb,
                    { backgroundColor: soundEnabled ? SUCCESS : "#E5E7EB" },
                  ]}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          <Pressable style={styles.btnSecondary} onPress={() => Alert.alert("Info", "Sauvegarde des paramètres effectuée")}>
            <Text style={styles.btnText}>Sauvegarder</Text>
          </Pressable>
          <Pressable style={styles.btnPrimary} onPress={() => Alert.alert("Info", "Paramètres réinitialisés aux valeurs par défaut")}>
            <Text style={styles.btnText}>Réinitialiser</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: CANVAS },
  scroll: { paddingBottom: 24 },
  title: { fontSize: 22, fontWeight: "700", color: DARK, marginHorizontal: 16, marginTop: 12, marginBottom: 16 },
  section: { marginHorizontal: 16, marginBottom: 16 },
  sectionTitle: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  sectionTitleText: { fontSize: 16, fontWeight: "600", color: DARK },
  card: { marginHorizontal: 16, backgroundColor: CARD_BG, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: BORDER },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6, borderBottomWidth: 1, borderColor: BORDER },
  rowLabel: { fontSize: 13, color: MUTED },
  rowVal: { fontSize: 13, fontWeight: "600", color: DARK },
  hourRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8 },
  hourLabel: { fontSize: 13, color: MUTED, width: 30 },
  hourRange: { flexDirection: "row", gap: 4 },
  hourTime: { fontSize: 12, color: DARK },
  hourSep: { fontSize: 12, color: MUTED },
  paymentItem: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderColor: BORDER },
  paymentLabel: { fontSize: 13, color: MUTED },
  paymentStatus: { flexDirection: "row", alignItems: "center", gap: 4 },
  paymentActive: { fontSize: 11, fontWeight: "600", color: SUCCESS },
  paymentInactive: { fontSize: 11, fontWeight: "600", color: "#E5E7EB" },
  toggleRow: { paddingVertical: 10, borderBottomWidth: 1, borderColor: BORDER },
  toggleLabel: { fontSize: 13, color: DARK },
  toggleSwitch: { width: 40, height: 20, borderRadius: 10, backgroundColor: "#E5E7EB", justifyContent: "center", alignItems: "center", overflow: "hidden" },
  toggleThumb: { width: 16, height: 16, borderRadius: 8, marginLeft: 2 },
  actions: { flexDirection: "row", gap: 10, marginHorizontal: 16, marginTop: 24 },
  btnSecondary: { flex: 1, backgroundColor: INPUT_BG, paddingVertical: 12, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  btnPrimary: { flex: 1, backgroundColor: DARK, paddingVertical: 12, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  btnText: { fontSize: 14, fontWeight: "600", color: "#FFFFFF" },
});