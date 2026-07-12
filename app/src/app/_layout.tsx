import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ShareIntentGate } from '@/components/ShareIntentGate';
import { colors } from '@/lib/theme';

export default function RootLayout(): React.ReactElement {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="dark" />
      <ShareIntentGate />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.canvas },
          headerShadowVisible: false,
          headerTintColor: colors.ink,
          headerTitleStyle: { fontWeight: '800' },
          contentStyle: { backgroundColor: colors.canvas },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="itinerary/[id]" options={{ title: 'Your trip' }} />
        <Stack.Screen name="menu/[id]" options={{ title: 'Menu swipe' }} />
        <Stack.Screen name="directory" options={{ title: 'Operator directory' }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
