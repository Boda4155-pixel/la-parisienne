import type { LucideIcon } from "lucide-react-native";
import { Text, View } from "react-native";

type Props = {
  focused: boolean;
  icon: LucideIcon;
  title: string;
};

export default function TabBarIcon({ focused, icon: Icon, title }: Props) {
  if (!Icon) return null;
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', gap: 4, minWidth: 60 }}>
      <Icon size={24} color={focused ? "#FE8C00" : "#5D5F6D"} />
      <Text style={{ fontSize: 10, fontWeight: '700', color: focused ? "#FE8C00" : "#5D5F6D" }}>
        {title}
      </Text>
    </View>
  );
}