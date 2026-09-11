import { Image, Pressable, Text, View } from "react-native";

type CategoryCardProps = {
  title: string;
  itemsCount: number;
  image: any;
  onPress?: () => void;
};

const CategoryCard = ({
  title,
  itemsCount,
  image,
  onPress,
}: CategoryCardProps) => {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center justify-between bg-white rounded-3xl p-4 mb-4 border border-gray-100"
      style={{
        shadowColor: "#1a1a1a",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
      }}
    >
      <View className="gap-1">
        <Text className="h3-bold text-dark-100">{title}</Text>
        <Text className="paragraph-regular text-gray-100">
          {itemsCount} items
        </Text>
      </View>

      <Image
        source={image}
        className="size-20 rounded-2xl"
        resizeMode="cover"
      />
    </Pressable>
  );
};

export default CategoryCard;
