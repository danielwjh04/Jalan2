import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import type { PipelineStage } from '@shared/status';
import { colors, radius, spacing } from '@/lib/theme';

const STEPS: { stage: PipelineStage; label: string }[] = [
  { stage: 'EXTRACTING', label: 'Extracting video' },
  { stage: 'TRANSCRIBING', label: 'Transcribing speech' },
  { stage: 'READING_FRAMES', label: 'Reading on-screen text' },
  { stage: 'FUSING', label: 'Fusing into itinerary' },
];

interface Props {
  stage: PipelineStage;
  error: string | null;
}

export function StageProgress({ stage, error }: Props): React.ReactElement {
  if (stage === 'ERROR') {
    return (
      <View style={styles.card}>
        <Text style={styles.errorTitle}>Could not build the itinerary</Text>
        <Text style={styles.errorText}>{error ?? 'Unknown pipeline error'}</Text>
      </View>
    );
  }
  const activeIndex = STEPS.findIndex((step) => step.stage === stage);
  return (
    <View style={styles.card}>
      {STEPS.map((step, index) => {
        const state = index < activeIndex ? 'done' : index === activeIndex ? 'active' : 'todo';
        return (
          <View key={step.stage} style={styles.row}>
            {state === 'active' ? (
              <ActivityIndicator size="small" color={colors.accent} />
            ) : (
              <View style={[styles.dot, state === 'done' && styles.dotDone]} />
            )}
            <Text style={[styles.label, state !== 'todo' && styles.labelActive]}>
              {step.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: spacing(4),
    gap: spacing(3),
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing(3), minHeight: 24 },
  dot: {
    width: 10,
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
    marginHorizontal: 5,
  },
  dotDone: { backgroundColor: colors.confirm },
  label: { color: colors.textDim, fontSize: 15 },
  labelActive: { color: colors.text },
  errorTitle: { color: colors.danger, fontWeight: '700', fontSize: 16 },
  errorText: { color: colors.textDim, fontSize: 13 },
});
