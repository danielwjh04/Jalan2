import { useEffect } from 'react';
import { Alert } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { ingestVideo } from '@/lib/ingest';

declare const require: (moduleName: string) => unknown;

interface ShareIntentHookResult {
  hasShareIntent: boolean;
  shareIntent: { webUrl: string | null; text: string | null } | null;
  resetShareIntent: () => void;
}

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// expo-share-intent's native module only exists in a dev build; requiring it
// inside Expo Go throws. In Expo Go the paste bar covers the same flow.
export function ShareIntentGate(): React.ReactElement | null {
  if (isExpoGo) return null;
  return <ShareIntentBridge />;
}

function ShareIntentBridge(): null {
  const { useShareIntent } = require('expo-share-intent') as {
    useShareIntent: () => ShareIntentHookResult;
  };
  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntent();

  useEffect(() => {
    if (!hasShareIntent) return;
    const raw = shareIntent?.webUrl ?? shareIntent?.text ?? '';
    resetShareIntent();
    if (raw) {
      void ingestVideo(raw).catch((cause: unknown) =>
        Alert.alert('Could not open shared video', String(cause)),
      );
    }
  }, [hasShareIntent, shareIntent, resetShareIntent]);

  return null;
}
