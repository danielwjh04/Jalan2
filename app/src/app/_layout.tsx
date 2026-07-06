import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ShareIntentGate } from '@/components/ShareIntentGate';
import { colors } from '@/lib/theme';

export default function RootLayout(): React.ReactElement {
  return (
    <>
      <StatusBar style="light" />
      <ShareIntentGate />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'Jalan2' }} />
        <Stack.Screen name="itinerary/[id]" options={{ title: 'Your trip' }} />
        <Stack.Screen name="directory" options={{ title: 'Operator directory' }} />
      </Stack>
    </>
  );
}
