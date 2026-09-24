import React from "react";
import { useLocalSearchParams } from "expo-router";
import StoreHourForm from "../../../../components/admin/StoreHourForm";

export default function StoreHourEdit() {
  const params = useLocalSearchParams();
  return <StoreHourForm id={params.id as string | undefined} />;
}