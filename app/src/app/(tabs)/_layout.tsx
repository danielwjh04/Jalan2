import { Tabs } from "expo-router";
import { GlassTabBar } from "@/components/GlassTabBar";
import { colors, fonts } from "@/lib/theme";

export default function TabsLayout(): React.ReactElement {
  return (
    <Tabs
      tabBar={(props) => <GlassTabBar {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: colors.canvas },
        headerShadowVisible: false,
        headerTintColor: colors.ink,
        headerTitleStyle: { fontFamily: fonts.semibold, fontSize: 17 },
        sceneStyle: { backgroundColor: colors.canvas },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home", headerShown: false }} />
      <Tabs.Screen name="directory" options={{ title: "Operators" }} />
    </Tabs>
  );
}
