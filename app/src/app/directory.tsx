import { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import type { DirectoryEntry } from '@shared/api';
import { getDirectory } from '@/lib/api';
import { colors, radius, spacing } from '@/lib/theme';

export default function DirectoryScreen(): React.ReactElement {
  const [entries, setEntries] = useState<DirectoryEntry[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(() => {
    setRefreshing(true);
    getDirectory()
      .then(setEntries)
      .catch(() => setEntries([]))
      .finally(() => setRefreshing(false));
  }, []);

  useFocusEffect(load);

  return (
    <FlatList
      contentContainerStyle={styles.container}
      data={entries}
      keyExtractor={(entry) => entry.operatorName}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={load} tintColor={colors.accent} />
      }
      ListEmptyComponent={
        <Text style={styles.empty}>
          No operators yet. Every extracted video adds its operator here, ranked by tourist
          demand.
        </Text>
      }
      renderItem={({ item }) => (
        <View style={styles.row}>
          <View style={styles.info}>
            <Text style={styles.name}>{item.operatorName}</Text>
            <Text style={styles.activity}>{item.activity}</Text>
            <Text style={styles.meta}>
              {item.demandCount} booking {item.demandCount === 1 ? 'signal' : 'signals'} · {item.meetingPointName}
            </Text>
          </View>
          <View style={[styles.badge, item.optedIn ? styles.badgeIn : styles.badgeOut]}>
            <Text style={[styles.badgeText, { color: item.optedIn ? colors.confirm : colors.textDim }]}>
              {item.optedIn ? 'On Jalan2' : 'Not yet invited'}
            </Text>
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing(4), gap: spacing(3), flexGrow: 1 },
  empty: { color: colors.textDim, fontSize: 14, textAlign: 'center', marginTop: spacing(10) },
  row: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing(4),
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(3),
  },
  info: { flex: 1, gap: spacing(1) },
  name: { color: colors.text, fontWeight: '700', fontSize: 16 },
  activity: { color: colors.accent, fontSize: 13 },
  meta: { color: colors.textDim, fontSize: 12 },
  badge: {
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(1.5),
  },
  badgeIn: { borderColor: colors.confirm },
  badgeOut: { borderColor: colors.border },
  badgeText: { fontSize: 12, fontWeight: '600' },
});
