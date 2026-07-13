import type { TextStyle, ViewStyle } from 'react-native';

export const colors = {
  canvas: '#050505',
  card: '#1B1B1B',
  ink: '#F7F7F2',
  inkSoft: '#9A9A96',
  tide: '#F2FF1A',
  tideSoft: '#2B2D12',
  sun: '#F2FF1A',
  confirm: '#A8EE63',
  confirmSoft: '#1E2B17',
  pending: '#FFD166',
  pendingSoft: '#342A13',
  danger: '#FF7168',
  dangerSoft: '#351A19',
  mist: '#303030',
  white: '#FFFFFF',
  black: '#050505',
};

export const gradients = {
  ocean: ['#050505', '#0A0A0A', '#111111'] as const,
  cta: ['#F5FF25', '#DFFF2E'] as const,
  scrim: ['rgba(5,5,5,0.02)', 'rgba(5,5,5,0.94)'] as const,
};

// DM Sans is loaded in app/_layout.tsx. Regular is the default, medium
// identifies compact UI, and semibold is reserved for primary hierarchy.
export const fonts = {
  regular: 'DMSans_400Regular',
  medium: 'DMSans_500Medium',
  semibold: 'DMSans_600SemiBold',
} as const;

export const type: Record<
  'display' | 'title' | 'heading' | 'body' | 'label' | 'button' | 'caption',
  TextStyle
> = {
  display: { fontFamily: fonts.semibold, fontSize: 28, lineHeight: 35, letterSpacing: -0.6 },
  title: { fontFamily: fonts.semibold, fontSize: 20, lineHeight: 27, letterSpacing: -0.3 },
  heading: { fontFamily: fonts.medium, fontSize: 16, lineHeight: 23 },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22 },
  label: { fontFamily: fonts.medium, fontSize: 13, lineHeight: 18 },
  button: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 20 },
  caption: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 17 },
};

export function spacing(units: number): number {
  return units * 4;
}

export const radius = {
  card: 28,
  control: 18,
  pill: 999,
};

export const cardShadow: ViewStyle = {
  shadowColor: colors.black,
  shadowOpacity: 0.32,
  shadowRadius: 18,
  shadowOffset: { width: 0, height: 10 },
  elevation: 5,
};

export const eyebrow: TextStyle = {
  color: colors.inkSoft,
  fontFamily: fonts.medium,
  fontSize: 11,
  letterSpacing: 1.2,
  textTransform: 'uppercase',
};
