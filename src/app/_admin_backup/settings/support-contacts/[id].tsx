import React from "react";
import { useLocalSearchParams } from "expo-router";
import SupportContactForm from "../../../../components/admin/SupportContactForm";

export default function SupportContactEdit() {
  const params = useLocalSearchParams();
  return <SupportContactForm id={params.id as string | undefined} />;
}