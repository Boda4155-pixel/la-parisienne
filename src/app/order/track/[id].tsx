import { router, useLocalSearchParams } from "expo-router";
import { ChevronLeft, MessageCircle, Phone } from "lucide-react-native";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  Text,
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSupabaseQuery } from "../../../../hooks/useSupabaseQuery";
import {
  getOrderById,
  subscribeToDriverLocation,
  subscribeToOrderStatus,
} from "../../../../lib/queries";
import { useAuthStore } from "../../../../store/auth.store";

const STATUS_STEPS = [
  "confirmed",
  "preparing",
  "out_for_delivery",
  "delivered",
];

export default function OrderTracking() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useAuthStore((state) => state.user);

  const { data, loading } = useSupabaseQuery({
    fn: getOrderById,
    params: { id: id!, userId: user?.id ?? "" },
    skip: !id || !user,
  });

  const [status, setStatus] = useState<string | null>(null);
  const [driverLocation, setDriverLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  useEffect(() => {
    if (data?.order.status) {
      setStatus(data.order.status);
    }
  }, [data?.order.status]);

  useEffect(() => {
    if (!id) return;
    const unsubscribe = subscribeToOrderStatus(id, setStatus);
    return unsubscribe;
  }, [id]);

  useEffect(() => {
    const driverId = data?.order?.driver_id;
    if (!driverId) return;

    const unsubscribe = subscribeToDriverLocation(driverId, setDriverLocation);
    return unsubscribe;
  }, [data?.order?.driver_id]);

  if (loading || !data) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator color="#FE8C00" />
      </SafeAreaView>
    );
  }

  const currentStepIndex = STATUS_STEPS.indexOf(status ?? "confirmed");

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center px-5 py-3 gap-x-4">
        <Pressable onPress={() => router.back()}>
          <ChevronLeft size={24} color="#1a1a1a" />
        </Pressable>

        <View>
          <Text className="h2-bold text-dark-100">{t("tracking.title")}</Text>
          <Text className="paragraph-regular text-gray-100">
            #{data.order.id.slice(0, 8).toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Status Stepper */}
      <View className="flex-row items-center justify-between px-8 py-4">
        {STATUS_STEPS.map((s, index) => {
          const isCompleted = index <= currentStepIndex;

          return (
            <View key={s} className="items-center flex-1">
              <View
                className={
                  isCompleted
                    ? "size-3 rounded-full bg-primary"
                    : "size-3 rounded-full bg-gray-200"
                }
              />
              <Text
                className="small-bold text-gray-100 text-center mt-1"
                numberOfLines={1}
              >
                {t(`orders.status.${s}`)}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Map */}
      <View className="flex-1 mx-5 rounded-3xl overflow-hidden">
        {driverLocation ? (
          <MapView
            style={{ flex: 1 }}
            initialRegion={{
              latitude: driverLocation.latitude,
              longitude: driverLocation.longitude,
              latitudeDelta: 0.02,
              longitudeDelta: 0.02,
            }}
            region={{
              latitude: driverLocation.latitude,
              longitude: driverLocation.longitude,
              latitudeDelta: 0.02,
              longitudeDelta: 0.02,
            }}
          >
            <Marker
              coordinate={driverLocation}
              title={t("tracking.driverLocation")}
            />
          </MapView>
        ) : (
          <View className="flex-1 bg-gray-50 items-center justify-center">
            <Text className="paragraph-regular text-gray-100">
              {t("tracking.waitingForDriver")}
            </Text>
          </View>
        )}
      </View>

      {/* Driver Info */}
      {data.order.driver_id && (
        <View className="flex-row items-center justify-between px-5 py-4 border-t border-gray-100 mt-4">
          <View className="flex-row items-center gap-x-3">
            <View className="size-12 rounded-full bg-gray-100 items-center justify-center">
              <Text className="paragraph-bold text-gray-400">👤</Text>
            </View>

            <View>
              <Text className="small-regular text-gray-100">
                {t("tracking.driver")}
              </Text>
              <Text className="paragraph-bold text-dark-100">
                {t("tracking.driverName")}
              </Text>
            </View>
          </View>

          <View className="flex-row gap-x-3">
            <Pressable
              onPress={() => Linking.openURL("tel:+201001234567")}
              className="size-11 rounded-full bg-gray-100 items-center justify-center"
            >
              <Phone size={18} color="#1a1a1a" />
            </Pressable>

            <Pressable className="size-11 rounded-full bg-gray-100 items-center justify-center">
              <MessageCircle size={18} color="#1a1a1a" />
            </Pressable>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}
