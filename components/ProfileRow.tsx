import { ChevronRight } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

type ProfileRowProps = {
  icon: React.ReactNode;
  label: string;
  subtitle?: string;
  badge?: number;
  onPress: () => void;
};

const ProfileRow = ({
  icon,
  label,
  subtitle,
  badge,
  onPress,
}: ProfileRowProps) => {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center justify-between border-b border-gray-100 py-4"
    >
      <View className="flex-row items-center gap-x-3 flex-1">
        <View className="size-10 rounded-full bg-primary/10 items-center justify-center">
          {icon}
        </View>

        <View className="flex-1">
          <Text className="paragraph-bold text-dark-100">{label}</Text>
          {subtitle && (
            <Text className="small-regular text-gray-100 mt-0.5">
              {subtitle}
            </Text>
          )}
        </View>
      </View>

      <View className="flex-row items-center gap-x-2">
        {badge !== undefined && badge > 0 && (
          <View className="bg-primary/10 rounded-full min-w-[24px] h-6 items-center justify-center px-2">
            <Text className="small-bold text-primary">{badge}</Text>
          </View>
        )}
        <ChevronRight size={18} color="#9CA3AF" />
      </View>
    </Pressable>
  );
};

export default ProfileRow;
