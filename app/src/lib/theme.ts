import type { ViewStyle } from 'react-native';

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

export const eyebrow = {
  color: colors.inkSoft,
  fontSize: 11,
  fontWeight: '700' as const,
  letterSpacing: 1.4,
  textTransform: 'uppercase' as const,
};
