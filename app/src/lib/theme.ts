import type { TextStyle, ViewStyle } from 'react-native';

export const colors = {
  canvas: '#F5F7FA',
  card: '#FFFFFF',
  ink: '#12263A',
  inkSoft: '#5E718A',
  tide: '#1B5FD0',
  tideSoft: '#E7EEFB',
  sun: '#F08C33',
  confirm: '#199D6C',
  confirmSoft: '#E5F5EE',
  pending: '#B97F14',
  pendingSoft: '#FBF1DC',
  danger: '#D6493F',
  dangerSoft: '#FBEAE8',
  mist: '#E3E9F2',
};

export const gradients = {
  ocean: ['#0B3A8C', '#1B5FD0', '#2E86D9'] as const,
  cta: ['#1B5FD0', '#3D7FE8'] as const,
  scrim: ['rgba(9,20,38,0)', 'rgba(9,20,38,0.82)'] as const,
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
  card: 20,
  control: 14,
  pill: 999,
};

export const cardShadow: ViewStyle = {
  shadowColor: colors.ink,
  shadowOpacity: 0.06,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 6 },
  elevation: 2,
};

export const eyebrow: TextStyle = {
  color: colors.inkSoft,
  fontFamily: fonts.medium,
  fontSize: 11,
  letterSpacing: 1.2,
  textTransform: 'uppercase',
};
