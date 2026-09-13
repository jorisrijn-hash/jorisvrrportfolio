/**
 * Type roles. Components reference these, never raw numeric weights — 1955
 * has no 400/700, so a stray `font-bold` would trigger synthetic bolding.
 */
export const WEIGHT = {
  thin: 100,
  light: 300,
  medium: 500,
  black: 900,
} as const;

export type WeightName = keyof typeof WEIGHT;
export type WeightValue = (typeof WEIGHT)[WeightName];

/** Ordered stops, used by WeightText to interpolate between real faces. */
export const WEIGHT_STOPS: WeightValue[] = [100, 300, 500, 900];
