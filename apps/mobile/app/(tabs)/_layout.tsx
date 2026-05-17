import { Tabs } from "expo-router";
import { Colors, FontFamily, FontWeight } from "../../constants/theme";
import { Text } from "../../components/Text";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: Colors.primary },
        headerTintColor: Colors.surface,
        headerTitleStyle: {
          fontFamily: FontFamily.base,
          fontWeight: FontWeight.bold,
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.onSurfaceVariant,
        tabBarLabelStyle: {
          fontFamily: FontFamily.base,
          fontSize: 12,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "바디맵",
          headerShown: false,
          // tabBarIcon: ({ color, size }) => (
          //   <Text style={{ color, fontSize: size }}>🏠</Text>
          // ),
        }}
      />
      <Tabs.Screen
        name="records"
        options={{
          title: "기록",
          // tabBarIcon: ({ color, size }) => (
          //   <Text style={{ color, fontSize: size }}>📋</Text>
          // ),
        }}
      />
    </Tabs>
  );
}
