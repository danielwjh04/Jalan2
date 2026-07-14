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
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home", headerShown: false }} />
      <Tabs.Screen name="discover" options={{ title: "Discover", headerShown: false }} />
      <Tabs.Screen name="trips" options={{ title: "Trips", headerShown: false }} />
      <Tabs.Screen name="you" options={{ title: "You", headerShown: false }} />
      <Tabs.Screen name="directory" options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="trip/[id]" options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="itinerary/[id]" options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="menu/[id]" options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="experience/[id]" options={{ href: null, headerShown: false }} />
    </Tabs>
  );
}
