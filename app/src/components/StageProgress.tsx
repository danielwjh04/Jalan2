import { StyleSheet, Text, View } from 'react-native';
import type { PipelineStage } from '@shared/status';
import { cardShadow, colors, fonts, radius, spacing } from '@/lib/theme';
import { AgentProgress, type AgentProgressStep } from './AgentProgress';

const STEPS: Array<{ stage: PipelineStage } & AgentProgressStep> = [
  { stage: 'EXTRACTING', label: 'Scout agents open every post', detail: 'Collecting captions, slides, video frames and creator evidence.' },
  { stage: 'TRANSCRIBING', label: 'Language agent listens', detail: 'Transcribing Malay, English and Chinese speech without guessing venue names.' },
  { stage: 'READING_FRAMES', label: 'Vision + place agents ground stops', detail: 'Reading on-screen text and matching real Malaysian places and photos.' },
  { stage: 'FUSING', label: 'Route agent builds the journey', detail: 'Ordering stops, transport handoffs, opening windows and realistic day groups.' },
  { stage: 'READY', label: 'Critic agent checks end to end', detail: 'Flagging missing operators, impossible timing and claims that still need confirmation.' },
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
  const activeIndex = Math.max(0, STEPS.findIndex((step) => step.stage === stage));
  return <AgentProgress title="Turning posts into one usable trip" intro="Specialist agents work in sequence and pass evidence forward instead of letting one prompt invent the whole itinerary." steps={STEPS} activeIndex={activeIndex} />;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    padding: spacing(5),
    gap: spacing(3.5),
    ...cardShadow,
  },
  errorTitle: { color: colors.danger, fontFamily: fonts.semibold, fontSize: 16 },
  errorText: { color: colors.inkSoft, fontFamily: fonts.regular, fontSize: 13 },
});
