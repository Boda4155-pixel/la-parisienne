import { router } from "expo-router";
import { ShoppingBag } from "lucide-react-native";
import { Pressable, Text, View } from "react-native";

import { useCartStore } from "../store/cart.store";

const CartButton = () => {
  const totalItems = useCartStore((state) => state.getTotalItems());

  return (
    <Pressable className="cart-btn" onPress={() => router.push("/cart")}>
      <ShoppingBag size={22} color="#ffffff" />

      {totalItems > 0 && (
        <View className="cart-badge">
          <Text className="small-bold text-white">{totalItems}</Text>
        </View>
      )}
    </Pressable>
  );
};

export default CartButton;
