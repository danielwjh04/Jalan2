import { useCallback, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import type { DirectoryEntry } from '@shared/api';
import { getDirectory } from '@/lib/api';
import { cardShadow, colors, radius, spacing } from '@/lib/theme';

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? '')
    .join('');
}

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
        <RefreshControl refreshing={refreshing} onRefresh={load} tintColor={colors.tide} />
      }
      ListEmptyComponent={
        <Text style={styles.empty}>
          No operators yet. Every extracted video adds its operator here, ranked by tourist
          demand.
        </Text>
      }
      renderItem={({ item }) => (
        <View style={styles.row}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials(item.operatorName)}</Text>
          </View>
          <View style={styles.info}>
            <Text style={styles.name}>{item.operatorName}</Text>
            <Text style={styles.activity}>{item.activity}</Text>
            <Text style={styles.meta}>
              {item.demandCount} booking {item.demandCount === 1 ? 'signal' : 'signals'} ·{' '}
              {item.meetingPointName}
            </Text>
          </View>
          <View style={[styles.badge, item.optedIn ? styles.badgeIn : styles.badgeOut]}>
            <Text
              style={[styles.badgeText, { color: item.optedIn ? colors.confirm : colors.inkSoft }]}
            >
              {item.optedIn ? 'On Jalan2' : 'Invited on booking'}
            </Text>
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing(4), gap: spacing(3), flexGrow: 1 },
  empty: { color: colors.inkSoft, fontSize: 14, textAlign: 'center', marginTop: spacing(12) },
  row: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    padding: spacing(4),
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing(3),
    ...cardShadow,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: radius.pill,
    backgroundColor: colors.tideSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.tide, fontWeight: '800', fontSize: 15 },
  info: { flex: 1, gap: spacing(0.5) },
  name: { color: colors.ink, fontWeight: '700', fontSize: 16 },
  activity: { color: colors.tide, fontSize: 13, fontWeight: '600' },
  meta: { color: colors.inkSoft, fontSize: 12 },
  badge: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing(3),
    paddingVertical: spacing(1.5),
  },
  badgeIn: { backgroundColor: colors.confirmSoft },
  badgeOut: { backgroundColor: colors.canvas },
  badgeText: { fontSize: 11.5, fontWeight: '700' },
});
