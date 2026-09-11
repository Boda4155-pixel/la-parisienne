import { Tabs } from "expo-router";
import {
  ClipboardList,
  Heart,
  Home,
  LayoutGrid,
  User,
} from "lucide-react-native";
import TabBarIcon from "../../../components/TabBarIcon";
export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          borderTopLeftRadius: 50,
          borderTopRightRadius: 50,
          borderBottomLeftRadius: 50,
          borderBottomRightRadius: 50,
          marginHorizontal: 20,
          height: 80,
          position: "absolute",
          bottom: 40,
          backgroundColor: "white",
          shadowColor: "#1a1a1a",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 5,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ focused }) => (
            <TabBarIcon title="Home" icon={Home} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: "categories",
          tabBarIcon: ({ focused }) => (
            <TabBarIcon
              title="Categories"
              icon={LayoutGrid}
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="favorite"
        options={{
          title: "favorite",
          tabBarIcon: ({ focused }) => (
            <TabBarIcon title="favorite" icon={Heart} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: "Orders",
          tabBarIcon: ({ focused }) => (
            <TabBarIcon title="Orders" icon={ClipboardList} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ focused }) => (
            <TabBarIcon title="profile" icon={User} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
