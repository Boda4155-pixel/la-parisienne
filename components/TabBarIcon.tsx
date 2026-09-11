import cn from "clsx";
import { Text, View } from "react-native";
import type { LucideIcon } from "lucide-react-native";

type TabBarIconProps = {
  focused: boolean;
  icon: LucideIcon;
  title: string;
};

const TabBarIcon = ({ focused, icon: Icon, title }: TabBarIconProps) => {
  return (
    <View className="tab-icon">
      <Icon size={28} color={focused ? "#FE8C00" : "#5D5F6D"} strokeWidth={2} />

      <Text
        className={cn(
          "text-sm font-bold",
          focused ? "text-primary" : "text-gray-200",
        )}
      >
        {title}
      </Text>
    </View>
  );
};

export default TabBarIcon;
