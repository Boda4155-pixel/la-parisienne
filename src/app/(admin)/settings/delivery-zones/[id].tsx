import React from "react";
import { useLocalSearchParams } from "expo-router";
import DeliveryZoneForm from "../../../../components/admin/DeliveryZoneForm";

export default function DeliveryZoneEdit() {
  const params = useLocalSearchParams();
  return <DeliveryZoneForm id={params.id as string | undefined} />;
}