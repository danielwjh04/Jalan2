import type { TextStyle, ViewStyle } from 'react-native';

// Rainforest Kopitiam light system. Sage is fills and icons only; sageDeep
// carries accent text and primary buttons so small text stays WCAG AA.
// Kaya is the single warm action accent and always pairs with kopi text.
export const colors = {
  canvas: '#F8F7F1',
  card: '#FFFFFF',
  ink: '#1C2925',
  inkSoft: '#5E6B64',
  sage: '#67836F',
  sageDeep: '#46604F',
  halo: '#DDE9DD',
  kaya: '#F2B94B',
  kayaTint: '#FBEED0',
  kopi: '#3B2F1B',
  confirm: '#2E7D5B',
  confirmSoft: '#E2F1E6',
  pending: '#8A6100',
  pendingSoft: '#FCF0D6',
  danger: '#C2453A',
  dangerSoft: '#F9E3E0',
  mist: '#E7E4DA',
  white: '#FFFFFF',
};

export const gradients = {
  cta: ['#F6C45C', '#EFB03C'] as const,
  scrim: ['rgba(12,25,29,0.02)', 'rgba(12,25,29,0.62)'] as const,
};

// DM Sans is the interface face. Fraunces appears only in display type for
// greeting and celebration moments. Both load in app/_layout.tsx.
export const fonts = {
  regular: 'DMSans_400Regular',
  medium: 'DMSans_500Medium',
  semibold: 'DMSans_600SemiBold',
  display: 'Fraunces_600SemiBold',
} as const;

export const type: Record<
  'display' | 'title' | 'heading' | 'body' | 'label' | 'button' | 'caption',
  TextStyle
> = {
  display: { fontFamily: fonts.display, fontSize: 30, lineHeight: 36, letterSpacing: -0.4 },
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
  card: 24,
  control: 18,
  pill: 999,
};

export const cardShadow: ViewStyle = {
  shadowColor: '#2F3F40',
  shadowOpacity: 0.1,
  shadowRadius: 16,
  shadowOffset: { width: 0, height: 8 },
  elevation: 3,
};

export const hairline: ViewStyle = {
  borderWidth: 1,
  borderColor: colors.mist,
};

export const eyebrow: TextStyle = {
  color: colors.sageDeep,
  fontFamily: fonts.medium,
  fontSize: 11,
  letterSpacing: 1.2,
  textTransform: 'uppercase',
};
