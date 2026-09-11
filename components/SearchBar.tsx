import { router, useLocalSearchParams } from "expo-router";
import { Search } from "lucide-react-native";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, TextInput, View } from "react-native";

const Searchbar = () => {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ query?: string }>();
  const [query, setQuery] = useState(params.query ?? "");

  const handleSearch = (text: string) => {
    setQuery(text);

    if (!text) {
      router.setParams({ query: undefined });
    }
  };

  const handleSubmit = () => {
    if (query.trim()) {
      router.setParams({ query });
    }
  };

  return (
    <View className="searchbar">
      <TextInput
        className="flex-1 p-5"
        placeholder={t("search.placeholder")}
        value={query}
        onChangeText={handleSearch}
        onSubmitEditing={handleSubmit}
        placeholderTextColor="#A0A0A0"
        returnKeyType="search"
      />

      <Pressable className="pr-5" onPress={handleSubmit}>
        <Search size={22} color="#5D5F6D" />
      </Pressable>
    </View>
  );
};

export default Searchbar;
