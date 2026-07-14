import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  useFonts,
} from "@expo-google-fonts/dm-sans";
import { Fraunces_600SemiBold } from "@expo-google-fonts/fraunces";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ShareIntentGate } from "@/components/ShareIntentGate";
import { colors, fonts } from "@/lib/theme";

export default function RootLayout(): React.ReactElement | null {
  const [fontsLoaded] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    Fraunces_600SemiBold,
  });
  // The splash screen stays up until fonts resolve, so text never flashes
  // through in the platform default face.
  if (!fontsLoaded) return null;
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="dark" />
      <ShareIntentGate />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.canvas },
          headerShadowVisible: false,
          headerTintColor: colors.ink,
          headerTitleStyle: { fontFamily: fonts.semibold, fontSize: 17 },
          contentStyle: { backgroundColor: colors.canvas },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
