import { Minus, Plus, Trash2 } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { Image, Pressable, Text, View } from "react-native";

import { useCartStore } from "../store/cart.store";
import { CartItemType } from "../type";

const CartItem = ({ item }: { item: CartItemType }) => {
  const { t } = useTranslation();
  const increaseQty = useCartStore((state) => state.increaseQty);
  const decreaseQty = useCartStore((state) => state.decreaseQty);
  const removeItem = useCartStore((state) => state.removeItem);

  return (
    <View className="cart-item">
      <View className="flex flex-row items-center gap-x-3">
        <View className="cart-item__image">
          <Image
            source={{ uri: item.image_url }}
            className="size-4/5 rounded-lg"
            resizeMode="cover"
          />
        </View>

        <View>
          <Text className="base-bold text-dark-100">{item.name}</Text>
          <Text className="paragraph-bold text-primary mt-1">
            {item.price} {t("common.currency")}
          </Text>

          <View className="flex flex-row items-center gap-x-4 mt-2">
            <Pressable
              onPress={() => decreaseQty(item.id, item.customizations ?? [])}
              className="cart-item__actions"
            >
              <Minus size={16} color="#FF9C01" />
            </Pressable>

            <Text className="base-bold text-dark-100">{item.quantity}</Text>

            <Pressable
              onPress={() => increaseQty(item.id, item.customizations ?? [])}
              className="cart-item__actions"
            >
              <Plus size={16} color="#FF9C01" />
            </Pressable>
          </View>
        </View>
      </View>

      <Pressable
        onPress={() => removeItem(item.id, item.customizations ?? [])}
        className="flex-center"
      >
        <Trash2 size={20} color="#1a1a1a" />
      </Pressable>
    </View>
  );
};

export default CartItem;
