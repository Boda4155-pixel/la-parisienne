import React from "react";
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Grid, MapPin, Phone, Plus, Pencil, Trash2 } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { useSupabaseQuery } from "../../../hooks/useSupabaseQuery";
import {
  AdminDeliveryZone,
  AdminStoreHour,
  AdminSupportContact,
  createStoreHour,
  createDeliveryZone,
  createSupportContact,
  deleteStoreHour,
  deleteDeliveryZone,
  deleteSupportContact,
  getAllStoreHours,
  getAllDeliveryZones,
  getAllSupportContacts,
  updateStoreHour,
  updateDeliveryZone,
  updateSupportContact,
  getAppSetting,
  getStoreLocation,
  setAppLanguage,
  updateStoreLocation,
} from "../../../lib/adminQueries";
import { useAdminStore } from "../../../store/admin.store";
import AdminMoreTrigger from "../../../components/admin/AdminMoreTrigger";
import { changeAppLanguage } from "../../../i18next/i18next";

const DAY_NAMES = [
  "admin.settings.storeHours.sunday",
  "admin.settings.storeHours.monday",
  "admin.settings.storeHours.tuesday",
  "admin.settings.storeHours.wednesday",
  "admin.settings.storeHours.thursday",
  "admin.settings.storeHours.friday",
  "admin.settings.storeHours.saturday",
];

export default function Settings() {
  const { t } = useTranslation();

  const [form, setForm] = React.useState<{
    type: "hour" | "zone" | "contact" | null;
    id: string | null;
  }>({ type: null, id: null });

  const handleRefresh = (refetch: () => void) => {
    useAdminStore.getState().refresh();
    refetch();
  };

  const handleDelete = async (
    type: "hour" | "zone" | "contact",
    id: string,
    refetch: () => void,
    title: string,
    confirm: string,
  ) => {
    Alert.alert(title, confirm, [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.delete"),
        style: "destructive",
        onPress: async () => {
          try {
            if (type === "hour") await deleteStoreHour(id);
            else if (type === "zone") await deleteDeliveryZone(id);
            else await deleteSupportContact(id);
            handleRefresh(refetch);
          } catch (error: any) {
            Alert.alert(t("common.somethingWentWrong"), error?.message);
          }
        },
      },
    ]);
  };

  const openForm = (type: "hour" | "zone" | "contact", item?: any) => {
    setForm({ type, id: item?.id ?? null });
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={["hours", "location", "zones", "language", "contacts"]}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <View style={styles.sectionContainer}>
            {item === "hours" && <StoreHoursSection onRefresh={handleRefresh} onEdit={openForm} onDelete={handleDelete} />}
            {item === "location" && <StoreLocationSection onRefresh={handleRefresh} />}
            {item === "zones" && <DeliveryZonesSection onRefresh={handleRefresh} onEdit={openForm} onDelete={handleDelete} />}
            {item === "language" && <LanguageSection onRefresh={handleRefresh} />}
            {item === "contacts" && <SupportContactsSection onRefresh={handleRefresh} onEdit={openForm} onDelete={handleDelete} />}
          </View>
        )}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      />

      <SettingsModal
        visible={form.type !== null}
        onClose={() => setForm({ type: null, id: null })}
        type={form.type}
        id={form.id}
      />
    </SafeAreaView>
  );
}

// =========================================
// Store Hours Section
// =========================================
interface StoreHoursHeaderProps {
  dataLength: number;
  t: (key: string) => string;
  onEdit: (type: "hour" | "zone" | "contact", item?: any) => void;
}
function StoreHoursHeader({ dataLength, t, onEdit }: StoreHoursHeaderProps) {
  return (
    <>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{t("admin.settings.storeHours.title")}</Text>
          <Text style={styles.subtitle}>{t("admin.settings.storeHours.subtitle")}</Text>
        </View>
        <View style={styles.headerActions}>
          <AdminMoreTrigger />
          <Pressable style={styles.addButton} onPress={() => onEdit("hour")}>
            <Plus size={18} color="#FFFFFF" />
            <Text style={styles.addButtonText}>{t("admin.settings.storeHours.add")}</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.summaryIcon}>
          <Grid size={24} color="#FE8C00" />
        </View>
        <View style={styles.summaryContent}>
          <Text style={styles.summaryLabel}>{t("admin.settings.storeHours.total")}</Text>
          <Text style={styles.summaryValue}>{dataLength}</Text>
        </View>
      </View>
    </>
  );
}

interface StoreHoursSectionProps {
  onRefresh: (refetch: () => void) => void;
  onEdit: (type: "hour" | "zone" | "contact", item?: any) => void;
  onDelete: (type: "hour" | "zone" | "contact", id: string, refetch: () => void, title: string, confirm: string) => void;
}
function StoreHoursSection({ onRefresh, onEdit, onDelete }: StoreHoursSectionProps) {
  const { t } = useTranslation();
  const { data, refetch } = useSupabaseQuery({
    fn: getAllStoreHours,
    skip: false,
  });

  const handleDeleteHour = (id: string) => {
    onDelete("hour", id, refetch, t("admin.settings.storeHours.deleteTitle"), t("admin.settings.storeHours.deleteConfirm"));
  };

  const renderItem = ({ item }: { item: AdminStoreHour }) => (
    <Pressable
      style={styles.row}
      onPress={() => onEdit("hour", item)}
    >
      <View style={styles.rowContent}>
        <Text style={styles.rowTitle}>{t(DAY_NAMES[item.day_of_week] ?? "")}</Text>
        <View style={styles.rowMeta}>
          <Text style={styles.rowValue}>
            {item.open_time} - {item.close_time}
          </Text>
          <View style={[styles.statusBadge, item.is_open ? styles.statusActive : styles.statusInactive]}>
            <View style={[styles.statusDot, item.is_open ? styles.statusDotActive : styles.statusDotInactive]} />
            <Text style={[styles.statusText, item.is_open ? styles.statusTextActive : styles.statusTextInactive]}>
              {item.is_open ? t("admin.settings.storeHours.open") : t("admin.settings.storeHours.closed")}
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.actions}>
        <Pressable style={styles.iconButton} onPress={() => onEdit("hour", item)}>
          <Pencil size={16} color="#FE8C00" />
        </Pressable>
        <Pressable style={styles.iconButton} onPress={() => handleDeleteHour(item.id)}>
          <Trash2 size={16} color="#EF4444" />
        </Pressable>
      </View>
    </Pressable>
  );

  return (
    <View>
      <StoreHoursHeader dataLength={data?.length ?? 0} t={t} onEdit={onEdit} />
      <FlatList
        data={data ?? []}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{t("admin.settings.storeHours.empty")}</Text>
          </View>
        )}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

// =========================================
// Store Location Section
// =========================================
interface StoreLocationSectionProps {
  onRefresh: (refetch: () => void) => void;
}
function StoreLocationSection({ onRefresh }: StoreLocationSectionProps) {
  const { t } = useTranslation();
  const { data, refetch } = useSupabaseQuery({
    fn: getStoreLocation,
    skip: false,
  });

  const [address, setAddress] = React.useState(data?.address ?? "");
  const [latitude, setLatitude] = React.useState(data?.latitude?.toString() ?? "");
  const [longitude, setLongitude] = React.useState(data?.longitude?.toString() ?? "");

  React.useEffect(() => {
    if (data) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAddress(data.address);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLatitude(data.latitude?.toString() ?? "");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLongitude(data.longitude?.toString() ?? "");
    }
  }, [data]);

  const handleSave = async () => {
    try {
      await updateStoreLocation({
        address,
        latitude: parseFloat(latitude) || 0,
        longitude: parseFloat(longitude) || 0,
      });
      onRefresh(refetch);
      Alert.alert(t("common.saved"));
    } catch (error: any) {
      Alert.alert(t("common.somethingWentWrong"), error?.message);
    }
  };

  return (
    <View>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{t("admin.settings.storeLocation.title")}</Text>
          <Text style={styles.subtitle}>{t("admin.settings.storeLocation.subtitle")}</Text>
        </View>
        <View style={styles.headerActions}>
          <AdminMoreTrigger />
        </View>
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.formLabel}>{t("admin.settings.storeLocation.address")}</Text>
        <TextInput
          placeholder={t("admin.settings.storeLocation.address")}
          value={address}
          onChangeText={setAddress}
          style={styles.input}
        />
        <Text style={styles.formLabel}>{t("admin.settings.storeLocation.latitude")}</Text>
        <TextInput
          placeholder={t("admin.settings.storeLocation.latitude")}
          value={latitude}
          onChangeText={setLatitude}
          keyboardType="numeric"
          style={styles.input}
        />
        <Text style={styles.formLabel}>{t("admin.settings.storeLocation.longitude")}</Text>
        <TextInput
          placeholder={t("admin.settings.storeLocation.longitude")}
          value={longitude}
          onChangeText={setLongitude}
          keyboardType="numeric"
          style={styles.input}
        />
        <Pressable style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>{t("common.save")}</Text>
        </Pressable>
      </View>
    </View>
  );
}

// =========================================
// Delivery Zones Section
// =========================================
interface DeliveryZonesHeaderProps {
  dataLength: number;
  t: (key: string) => string;
  onEdit: (type: "hour" | "zone" | "contact", item?: any) => void;
}
function DeliveryZonesHeader({ dataLength, t, onEdit }: DeliveryZonesHeaderProps) {
  return (
    <>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{t("admin.settings.deliveryZones.title")}</Text>
          <Text style={styles.subtitle}>{t("admin.settings.deliveryZones.subtitle")}</Text>
        </View>
        <View style={styles.headerActions}>
          <AdminMoreTrigger />
          <Pressable style={styles.addButton} onPress={() => onEdit("zone")}>
            <Plus size={18} color="#FFFFFF" />
            <Text style={styles.addButtonText}>{t("admin.settings.deliveryZones.add")}</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.summaryIcon}>
          <MapPin size={24} color="#FE8C00" />
        </View>
        <View style={styles.summaryContent}>
          <Text style={styles.summaryLabel}>{t("admin.settings.deliveryZones.total")}</Text>
          <Text style={styles.summaryValue}>{dataLength}</Text>
        </View>
      </View>
    </>
  );
}

interface DeliveryZonesSectionProps {
  onRefresh: (refetch: () => void) => void;
  onEdit: (type: "hour" | "zone" | "contact", item?: any) => void;
  onDelete: (type: "hour" | "zone" | "contact", id: string, refetch: () => void, title: string, confirm: string) => void;
}
function DeliveryZonesSection({ onRefresh, onEdit, onDelete }: DeliveryZonesSectionProps) {
  const { t } = useTranslation();
  const { data, refetch } = useSupabaseQuery({
    fn: getAllDeliveryZones,
    skip: false,
  });

  const handleDeleteZone = (id: string) => {
    onDelete("zone", id, refetch, t("admin.settings.deliveryZones.deleteTitle"), t("admin.settings.deliveryZones.deleteConfirm"));
  };

  const renderItem = ({ item }: { item: AdminDeliveryZone }) => (
    <Pressable
      style={styles.row}
      onPress={() => onEdit("zone", item)}
    >
      <View style={styles.rowContent}>
        <Text style={styles.rowTitle}>{item.name_en || item.name_fr || item.name_ar || item.name}</Text>
        <View style={styles.rowMeta}>
          <Text style={styles.rowValue}>{item.price} {t("common.currency")}</Text>
          <View style={[styles.statusBadge, item.is_active ? styles.statusActive : styles.statusInactive]}>
            <View style={[styles.statusDot, item.is_active ? styles.statusDotActive : styles.statusDotInactive]} />
            <Text style={[styles.statusText, item.is_active ? styles.statusTextActive : styles.statusTextInactive]}>
              {item.is_active ? t("admin.coupons.active") : t("admin.coupons.inactive")}
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.actions}>
        <Pressable style={styles.iconButton} onPress={() => onEdit("zone", item)}>
          <Pencil size={16} color="#FE8C00" />
        </Pressable>
        <Pressable style={styles.iconButton} onPress={() => handleDeleteZone(item.id)}>
          <Trash2 size={16} color="#EF4444" />
        </Pressable>
      </View>
    </Pressable>
  );

  return (
    <View>
      <DeliveryZonesHeader dataLength={data?.length ?? 0} t={t} onEdit={onEdit} />
      <FlatList
        data={data ?? []}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{t("admin.settings.deliveryZones.empty")}</Text>
          </View>
        )}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

// =========================================
// Language Section
// =========================================
interface LanguageSectionProps {
  onRefresh: (refetch: () => void) => void;
}
function LanguageSection({ onRefresh }: LanguageSectionProps) {
  const { t } = useTranslation();
  const { data, refetch } = useSupabaseQuery({
    fn: () => getAppSetting<string>("app_language"),
    skip: false,
  });

  const [selectedLanguage, setSelectedLanguage] = React.useState(data ?? "en");

  React.useEffect(() => {
    if (data) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedLanguage(data);
    }
  }, [data]);

  const handleLanguageChange = async (language: string) => {
    try {
      await changeAppLanguage(language);
      setSelectedLanguage(language);
      onRefresh(refetch);
      Alert.alert(t("common.saved"));
    } catch (error: any) {
      Alert.alert(t("common.somethingWentWrong"), error?.message);
    }
  };

  const LANGUAGE_OPTIONS = [
    { code: "en", name: "English" },
    { code: "fr", name: "Français" },
    { code: "ar", name: "العربية" },
  ];

  return (
    <View>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{t("admin.settings.language.title")}</Text>
          <Text style={styles.subtitle}>{t("admin.settings.language.subtitle")}</Text>
        </View>
        <View style={styles.headerActions}>
          <AdminMoreTrigger />
        </View>
      </View>

      <View style={styles.formContainer}>
        {LANGUAGE_OPTIONS.map((option, index) => (
          <Pressable
            key={option.code}
            style={[
              styles.languageItem,
              selectedLanguage === option.code ? styles.languageItemActive : null,
              index === LANGUAGE_OPTIONS.length - 1 ? styles.languageItemLast : null,
            ]}
            onPress={() => handleLanguageChange(option.code)}
          >
            <Text style={styles.languageText}>{option.name}</Text>
            <Text style={[styles.statusText, selectedLanguage === option.code ? styles.statusTextActive : styles.statusTextInactive]}>
              {selectedLanguage === option.code ? t("admin.settings.language.selected") : ""}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

// =========================================
// Support Contacts Section
// =========================================
interface SupportContactsSectionProps {
  onRefresh: (refetch: () => void) => void;
  onEdit: (type: "hour" | "zone" | "contact", item?: any) => void;
  onDelete: (type: "hour" | "zone" | "contact", id: string, refetch: () => void, title: string, confirm: string) => void;
}
function SupportContactsSection({ onRefresh, onEdit, onDelete }: SupportContactsSectionProps) {
  const { t } = useTranslation();
  const { data, refetch } = useSupabaseQuery({
    fn: getAllSupportContacts,
    skip: false,
  });

  const handleDeleteContact = (id: string) => {
    onDelete("contact", id, refetch, t("admin.settings.supportContacts.deleteTitle"), t("admin.settings.supportContacts.deleteConfirm"));
  };

  // eslint-disable-next-line react-hooks/static-components
  const Header = React.useCallback(() => (
    <>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{t("admin.settings.supportContacts.title")}</Text>
          <Text style={styles.subtitle}>{t("admin.settings.supportContacts.subtitle")}</Text>
        </View>
        <View style={styles.headerActions}>
          <AdminMoreTrigger />
          <Pressable style={styles.addButton} onPress={() => onEdit("contact")}>
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
          <Text style={styles.summaryValue}>{data?.length ?? 0}</Text>
        </View>
      </View>
    </>
  ), [data?.length, t, onEdit]);

  const renderItem = ({ item }: { item: AdminSupportContact }) => (
    <Pressable
      style={styles.row}
      onPress={() => onEdit("contact", item)}
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
        <Pressable style={styles.iconButton} onPress={() => onEdit("contact", item)}>
          <Pencil size={16} color="#FE8C00" />
        </Pressable>
        <Pressable style={styles.iconButton} onPress={() => handleDeleteContact(item.id)}>
          <Trash2 size={16} color="#EF4444" />
        </Pressable>
      </View>
    </Pressable>
  );

  return (
    <View>
      {/* eslint-disable-next-line react-hooks/static-components */}
      <Header />
      <FlatList
        data={data ?? []}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{t("admin.settings.supportContacts.empty")}</Text>
          </View>
        )}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

// =========================================
// Settings Modal
// =========================================
interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
  type: "hour" | "zone" | "contact" | null;
  id: string | null;
}
function SettingsModal({ visible, onClose, type, id }: SettingsModalProps) {
  const { t } = useTranslation();

  const [day, setDay] = React.useState<number>(0);
  const [openTime, setOpenTime] = React.useState<string>("09:00");
  const [closeTime, setCloseTime] = React.useState<string>("18:00");
  const [isOpen, setIsOpen] = React.useState<boolean>(true);
  const [zoneName, setZoneName] = React.useState<string>("");
  const [zoneNameEn, setZoneNameEn] = React.useState<string>("");
  const [zoneNameFr, setZoneNameFr] = React.useState<string>("");
  const [zoneNameAr, setZoneNameAr] = React.useState<string>("");
  const [zonePrice, setZonePrice] = React.useState<string>("");
  const [zoneActive, setZoneActive] = React.useState<boolean>(true);
  const [contactPhone, setContactPhone] = React.useState<string>("");
  const [contactLabel, setContactLabel] = React.useState<string | null>(null);
  const [contactPrimary, setContactPrimary] = React.useState<boolean>(false);

  const { data: storeHours } = useSupabaseQuery({ fn: getAllStoreHours, skip: false });
  const { data: deliveryZones } = useSupabaseQuery({ fn: getAllDeliveryZones, skip: false });
  const { data: supportContacts } = useSupabaseQuery({ fn: getAllSupportContacts, skip: false });

  React.useEffect(() => {
    if (type === "hour" && id) {
      const item = storeHours?.find((h) => h.id === id);
      if (item) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setDay(item.day_of_week);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setOpenTime(item.open_time);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCloseTime(item.close_time);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsOpen(item.is_open);
      }
    } else if (type === "zone" && id) {
      const item = deliveryZones?.find((z) => z.id === id);
      if (item) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setZoneName(item.name);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setZoneNameEn(item.name_en ?? "");
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setZoneNameFr(item.name_fr ?? "");
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setZoneNameAr(item.name_ar ?? "");
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setZonePrice(item.price.toString());
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setZoneActive(item.is_active);
      }
    } else if (type === "contact" && id) {
      const item = supportContacts?.find((c) => c.id === id);
      if (item) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setContactPhone(item.phone);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setContactLabel(item.label);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setContactPrimary(item.is_primary);
      }
    }
  }, [type, id, storeHours, deliveryZones, supportContacts]);

  const handleSave = async () => {
    try {
      if (type === "hour") {
        if (id) await updateStoreHour(id, { day_of_week: day, open_time: openTime, close_time: closeTime, is_open: isOpen });
        else await createStoreHour({ day_of_week: day, open_time: openTime, close_time: closeTime, is_open: isOpen });
      } else if (type === "zone") {
        if (id) await updateDeliveryZone(id, {
          name: zoneName,
          name_en: zoneNameEn || null,
          name_fr: zoneNameFr || null,
          name_ar: zoneNameAr || null,
          price: parseFloat(zonePrice),
          is_active: zoneActive,
        });
        else await createDeliveryZone({
          name: zoneName,
          name_en: zoneNameEn || null,
          name_fr: zoneNameFr || null,
          name_ar: zoneNameAr || null,
          price: parseFloat(zonePrice),
          is_active: zoneActive,
        });
      } else if (type === "contact") {
        if (id) await updateSupportContact(id, { phone: contactPhone, label: contactLabel, is_primary: contactPrimary });
        else await createSupportContact({ phone: contactPhone, label: contactLabel, is_primary: contactPrimary });
      }
      useAdminStore.getState().refresh();
      onClose();
    } catch (error: any) {
      Alert.alert(t("common.somethingWentWrong"), error?.message);
    }
  };

  const title =
    type === "hour"
      ? id
        ? t("admin.settings.storeHours.edit")
        : t("admin.settings.storeHours.add")
      : type === "zone"
        ? id
          ? t("admin.settings.deliveryZones.edit")
          : t("admin.settings.deliveryZones.add")
        : id
          ? t("admin.settings.supportContacts.edit")
          : t("admin.settings.supportContacts.add");

  if (!type) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <Pressable style={styles.modalClose} onPress={onClose}>
              <Text style={styles.modalCloseText}>✕</Text>
            </Pressable>
          </View>
          <View style={styles.modalContent}>
            {type === "hour" && (
              <>
                <Text style={styles.formLabel}>{t("admin.settings.storeHours.day")}</Text>
                <View style={styles.pickerContainer}>
                  {DAY_NAMES.map((dayKey, index) => (
                    <Pressable
                      key={dayKey}
                      style={[styles.dayButton, day === index ? styles.dayButtonActive : null]}
                      onPress={() => setDay(index)}
                    >
                      <Text style={styles.dayButtonText}>{t(dayKey)}</Text>
                    </Pressable>
                  ))}
                </View>
                <Text style={styles.formLabel}>{t("admin.settings.storeHours.openTime")}</Text>
                <TextInput placeholder={t("admin.settings.storeHours.openTime")} value={openTime} onChangeText={setOpenTime} style={styles.input} />
                <Text style={styles.formLabel}>{t("admin.settings.storeHours.closeTime")}</Text>
                <TextInput placeholder={t("admin.settings.storeHours.closeTime")} value={closeTime} onChangeText={setCloseTime} style={styles.input} />
                <View style={styles.switchContainer}>
                  <Text style={styles.switchLabel}>{t("admin.settings.storeHours.isOpen")}</Text>
                  <Switch value={isOpen} onValueChange={setIsOpen} thumbColor={isOpen ? "#FE8C00" : "#F5F5F5"} trackColor={{ false: "#F5F5F5", true: "#FFF4E5" }} />
                </View>
              </>
            )}
            {type === "zone" && (
              <>
                <Text style={styles.formLabel}>{t("admin.settings.deliveryZones.name")}</Text>
                <TextInput placeholder={t("admin.settings.deliveryZones.name")} value={zoneName} onChangeText={setZoneName} style={styles.input} />
                <Text style={styles.formLabel}>{t("admin.settings.deliveryZones.nameEn")}</Text>
                <TextInput placeholder={t("admin.settings.deliveryZones.nameEn")} value={zoneNameEn} onChangeText={setZoneNameEn} style={styles.input} />
                <Text style={styles.formLabel}>{t("admin.settings.deliveryZones.nameFr")}</Text>
                <TextInput placeholder={t("admin.settings.deliveryZones.nameFr")} value={zoneNameFr} onChangeText={setZoneNameFr} style={styles.input} />
                <Text style={styles.formLabel}>{t("admin.settings.deliveryZones.nameAr")}</Text>
                <TextInput placeholder={t("admin.settings.deliveryZones.nameAr")} value={zoneNameAr} onChangeText={setZoneNameAr} style={styles.input} />
                <Text style={styles.formLabel}>{t("admin.settings.deliveryZones.price")}</Text>
                <TextInput placeholder={t("admin.settings.deliveryZones.price")} value={zonePrice} onChangeText={setZonePrice} keyboardType="numeric" style={styles.input} />
                <View style={styles.switchContainer}>
                  <Text style={styles.switchLabel}>{t("admin.coupons.active")}</Text>
                  <Switch value={zoneActive} onValueChange={setZoneActive} thumbColor={zoneActive ? "#FE8C00" : "#F5F5F5"} trackColor={{ false: "#F5F5F5", true: "#FFF4E5" }} />
                </View>
              </>
            )}
            {type === "contact" && (
              <>
                <Text style={styles.formLabel}>{t("admin.settings.supportContacts.phone")}</Text>
                <TextInput placeholder={t("admin.settings.supportContacts.phone")} value={contactPhone} onChangeText={setContactPhone} keyboardType="phone-pad" style={styles.input} />
                <Text style={styles.formLabel}>{t("admin.settings.supportContacts.label")}</Text>
                <TextInput placeholder={t("admin.settings.supportContacts.label")} value={contactLabel ?? ""} onChangeText={setContactLabel} style={styles.input} />
                <View style={styles.switchContainer}>
                  <Text style={styles.switchLabel}>{t("admin.settings.supportContacts.primary")}</Text>
                  <Switch value={contactPrimary} onValueChange={setContactPrimary} thumbColor={contactPrimary ? "#FE8C00" : "#F5F5F5"} trackColor={{ false: "#F5F5F5", true: "#FFF4E5" }} />
                </View>
              </>
            )}
            <Pressable style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>{t("common.save")}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// =========================================
// Styles
// =========================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FDF8F3",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionContainer: {
    marginBottom: 24,
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
  listContent: {
    paddingBottom: 16,
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
  formContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  formLabel: {
    fontSize: 14,
    fontFamily: "Quicksand-Medium",
    color: "#878787",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 14,
    fontFamily: "Quicksand-Regular",
  },
  pickerContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  dayButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
  },
  dayButtonActive: {
    backgroundColor: "#FE8C00",
  },
  dayButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontFamily: "Quicksand-Medium",
  },
  switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },
  switchLabel: {
    fontSize: 14,
    fontFamily: "Quicksand-Medium",
    color: "#878787",
  },
  saveButton: {
    backgroundColor: "#FE8C00",
    borderRadius: 8,
    padding: 12,
    marginTop: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: "Quicksand-Bold",
  },
  languageItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  languageItemActive: {
    backgroundColor: "#FE8C0015",
  },
  languageItemLast: {
    borderBottomWidth: 0,
  },
  languageText: {
    fontSize: 14,
    fontFamily: "Quicksand-Regular",
    color: "#181C2E",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    width: "90%",
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: "Quicksand-Bold",
    color: "#181C2E",
  },
  modalClose: {
    padding: 8,
  },
  modalCloseText: {
    fontSize: 18,
    color: "#9CA3AF",
  },
  modalContent: {
    padding: 20,
  },
});
