import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import { supabase } from "../../../lib/supabase";
import {
  ArchiveRestore,
  MinusCircle,
  Package,
  PlusCircle,
  RefreshCw,
  Search,
} from "lucide-react-native";
import { useCartStore } from "../../../store/cart.store";
import { getCategories } from "../../../lib/queries";

type Product = {
  id: string;
  name: string;
  price: number;
  image_url?: string | null;
  is_active?: boolean;
  stock_quantity?: number;
  category_id?: string | null;
};

type CartItem = Product & { quantity: number };

export default function CashierProducts() {
  const [categories, setCategories] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [filtered, setFiltered] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Fetch categories from Supabase
  useEffect(() => {
    async function fetchCategories() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("categories")
          .select("name")
          .eq("is_active", true);

        if (error) {
          console.error("Error fetching categories:", error);
          Alert.alert("Error", error.message);
          return;
        }

        if (data && data.length > 0) {
          const catNames = data.map((c: any) => c.name);
          setCategories(catNames);
          setSelectedCategory(catNames[0]); // Select first category by default
        }
      } catch (err) {
        console.error("Error fetching categories:", err);
        Alert.alert("Error", "Failed to fetch categories");
      } finally {
        setLoading(false);
      }
    }

    fetchCategories();
  }, []);

  // Fetch products from Supabase
  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      try {
        let request = supabase
          .from("products")
          .select("*")
          .eq("is_active", true)
          .order("name");

        if (selectedCategory) {
          request = request.eq("category_id", selectedCategory);
        }

        const { data, error } = await request;

        if (error) {
          console.error("Error fetching products:", error);
          Alert.alert("Error", error.message);
          return;
        }

        setProducts(data ?? []);
        applyFilter();
      } catch (err) {
        console.error("Error fetching products:", err);
        Alert.alert("Error", "Failed to fetch products");
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [selectedCategory]);

  // Apply search and category filter
  const applyFilter = () => {
    if (search.trim()) {
      const term = search.toLowerCase();
      const categoryFilter = selectedCategory
        ? products.filter((p) => p.category_id === selectedCategory)
        : products;
      const results = categoryFilter.filter((p) =>
        p.name.toLowerCase().includes(term),
      );
      setFiltered(results);
    } else {
      setFiltered([...products]);
    }
  };

  // Add product to cart
  const addToCart = (product: Product) => {
    const newItem = {
      ...product,
      quantity: 1,
      image_url: product.image_url ?? "",
    };
    useCartStore.getState().addItem(newItem as any);
    // Could show a toast here
  };

  // Toggle product active/inactive
  const handleToggleActive = async (product: Product) => {
    const newActiveState = !product.is_active;
    setTogglingId(product.id);
    try {
      // Import toggleProductActive from queries
      const { toggleProductActive } = await import("../../../lib/queries");
      await toggleProductActive(product.id, newActiveState);

      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id ? { ...p, is_active: newActiveState } : p,
        ),
      );
    } catch (error: any) {
      Alert.alert("Error", error.message ?? "Failed to update product");
    } finally {
      setTogglingId(null);
    }
  };

  // Re-apply filter when search or selectedCategory changes
  useEffect(() => {
    applyFilter();
  }, [search, selectedCategory]);

  if (loading && products.length === 0 && categories.length === 0) {
    return (
      <SafeAreaView style={{ backgroundColor: "#FFFBF2", flex: 1 }}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" />
          <Text className="mt-4 text-dark-100">جاري التحميل...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ backgroundColor: "#FFFBF2", flex: 1 }}>
      <View style={{ padding: 20 }}>
        <View className="flex-row items-center justify-between mb-4">
          <Text className="h3-bold text-dark-100">المنتجات</Text>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search..."
            placeholderTextColor="#9ca3af"
            className="border border-gray-200 rounded-full px-4 py-2 paragraph-regular text-dark-100 w-40"
          />
        </View>

        {/* Category tabs */}
        {categories.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 16 }}
            contentContainerStyle={{ paddingHorizontal: 16 }}
          >
            {categories.map((category, index) => (
              <Pressable
                key={category}
                onPress={() => setSelectedCategory(category)}
                style={[
                  { marginRight: 12 },
                  selectedCategory === category
                    ? {
                        backgroundColor: "#C9A86A",
                        borderRadius: 20,
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                      }
                    : {
                        backgroundColor: "#ffffff",
                        borderRadius: 20,
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        borderWidth: 1,
                        borderColor: "#e5e7eb",
                      },
                ]}
              >
                <Text className="text-white text-bold">
                  {category}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          numColumns={3}
          horizontal={false}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          renderItem={({ item }) => {
            const isInactive = !item.is_active;
            return (
              <View
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: 20,
                  padding: 12,
                  minWidth: "33.333%",
                  justifyContent: "center",
                  alignItems: "center",
                  shadowColor: "#000",
                  shadowOpacity: isInactive ? 0 : 0.05,
                  shadowRadius: 8,
                  elevation: isInactive ? 0 : 2,
                  opacity: isInactive ? 0.4 : 1,
                  borderWidth: isInactive ? 1 : 0,
                  borderColor: "#e5e7eb",
                }}
              >
                {isInactive && (
                  <View className="absolute top-2 right-2">
                    <Package size={14} color="#C0392B" />
                  </View>
                )}

                <Text className="h4-bold text-dark-100 mt-2">
                  {item.name}
                </Text>
                <Text className="h5-bold text-primary mt-2">
                  {item.price} ج.م
                </Text>

                <View className="flex-row items-center gap-x-1 mt-2">
                  <Pressable
                    onPress={() => addToCart(item)}
                    disabled={isInactive || togglingId === item.id}
                    style={{
                      marginTop: 8,
                      backgroundColor: isInactive ? "#9CA3AF" : "#C9A86A",
                      borderRadius: 12,
                      paddingVertical: 6,
                      paddingHorizontal: 12,
                      opacity: isInactive ? 0.5 : 1,
                    }}
                  >
                    <Text className="paragraph-bold text-white">
                      +
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => handleToggleActive(item)}
                    disabled={togglingId === item.id}
                    style={{
                      marginTop: 8,
                      marginLeft: 4,
                      padding: 6,
                      borderRadius: 8,
                      backgroundColor: isInactive ? "#7A9E7E" : "#F3F4F6",
                    }}
                  >
                    {togglingId === item.id ? (
                      <ActivityIndicator size={14} color="#6B7280" />
                    ) : isInactive ? (
                      <ArchiveRestore size={14} color="#ffffff" />
                    ) : (
                      <RefreshCw size={14} color="#6B7280" />
                    )}
                  </Pressable>
                </View>
              </View>
            );
          }}
        />
      </View>
    </SafeAreaView>
  );
}