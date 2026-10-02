import cn from "clsx";
import { useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import { FlatList, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import CartButton from "../../../components/CartButton";
import Filter from "../../../components/Filter";
import MenuCard from "../../../components/MenuCard";
import Searchbar from "../../../components/SearchBar";
import { useSupabaseQuery } from "../../../hooks/useSupabaseQuery";
import { getCategoriesWithCount, getProducts } from "../../../lib/queries";
import { Product } from "../../../type";

const Search = () => {
  const { category, query } = useLocalSearchParams<{
    query: string;
    category: string;
  }>();

  const { data, refetch, loading } = useSupabaseQuery({
    fn: getProducts,
    params: { category, query, limit: 6 },
  });

  const { data: categories } = useSupabaseQuery({ fn: getCategoriesWithCount });

  useEffect(() => {
    refetch({ category, query, limit: 6 });
  }, [category, query]);

  return (
    <SafeAreaView className="bg-white h-full">
      <FlatList
        data={data}
        renderItem={({ item, index }) => {
          const isFirstRightColItem = index % 2 === 0;

          return (
            <View
              className={cn(
                "flex-1 max-w-[48%]",
                !isFirstRightColItem ? "mt-10" : "mt-0",
              )}
            >
              <MenuCard item={item as Product} />
            </View>
          );
        }}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperClassName="gap-7"
        contentContainerClassName="gap-7 px-5 pb-32"
        ListHeaderComponent={() => (
          <View className="my-5 gap-5">
            <View className="flex-between flex-row w-full">
              <View className="flex-start">
                <Text className="small-bold uppercase text-primary">
                  Search
                </Text>
                <View className="flex-start flex-row gap-x-1 mt-0.5">
                  <Text className="paragraph-semibold text-dark-100">
                    Find your favorite food
                  </Text>
                </View>
              </View>

              <CartButton />
            </View>

            <Searchbar />

            <Filter categories={categories ?? []} />
          </View>
        )}
        ListEmptyComponent={() => !loading && <Text>No results</Text>}
      />
    </SafeAreaView>
  );
};

export default Search;
