/**
 * Industrial Property Platform — Typed theme object (green-first)
 * Source of truth: 08_design_tokens_normalized_green_revision_full.md
 * Mirrors green-brand-tokens.json 1:1 — keep in sync when tokens change.
 *
 * - `tokens`   : typed, tree-shakeable token object for use in TS/React.
 * - `ThemeProvider` : minimal provider that sets data-theme + exposes tokens via context.
 * - Semantic surface/text/border/action colors are exposed as CSS variable
 *   references (var(--...)) so they follow the active light/dark theme defined
 *   in green-brand.css. Raw scale colors are literal hex.
 */

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

/* ------------------------------------------------------------------ */
/* Raw tokens (literal — theme-independent)                            */
/* ------------------------------------------------------------------ */

export const brand = {
  50: '#C3FED5',
  100: '#2DFB91',
  200: '#25D87C',
  300: '#1EBA6A',
  400: '#189E59',
  500: '#128449',
  600: '#0D6C3B',
  700: '#09582F',
  800: '#043F20',
  900: '#022310',
  950: '#011507',
  primary: '#0D6C3B',
  primaryHover: '#09582F',
  primaryActive: '#043F20',
  primarySoft: '#C3FED5',
  secondary: '#128449',
  emphasis: '#2DFB91',
} as const;

export const status = {
  success: { solid: '#0D6C3B', textOn: '#FFFFFF', subtle: '#DCFAE6', text: '#09582F', border: '#0D6C3B' },
  warning: { solid: '#B45309', textOn: '#FFFFFF', subtle: '#FDF0D5', text: '#7C4210', border: '#B45309' },
  error:   { solid: '#C02626', textOn: '#FFFFFF', subtle: '#FCE4E4', text: '#8F1D1D', border: '#C02626' },
  info:    { solid: '#1C5FB8', textOn: '#FFFFFF', subtle: '#DCEAFB', text: '#17457F', border: '#1C5FB8' },
} as const;

/** Semantic colors resolve to CSS vars → follow light/dark automatically */
export const semantic = {
  surface: {
    base: 'var(--color-surface-base)',
    alt: 'var(--color-surface-alt)',
    card: 'var(--color-surface-card)',
    muted: 'var(--color-surface-muted)',
    brandSubtle: 'var(--color-surface-brand-subtle)',
    brandSoft: 'var(--color-surface-brand-soft)',
    brandStrong: 'var(--color-surface-brand-strong)',
  },
  text: {
    primary: 'var(--color-text-primary)',
    secondary: 'var(--color-text-secondary)',
    muted: 'var(--color-text-muted)',
    inverse: 'var(--color-text-inverse)',
    brand: 'var(--color-text-brand)',
  },
  border: {
    subtle: 'var(--color-border-subtle)',
    default: 'var(--color-border-default)',
    brand: 'var(--color-border-brand)',
  },
  action: {
    primaryBg: 'var(--action-primary-bg)',
    primaryBgHover: 'var(--action-primary-bg-hover)',
    primaryText: 'var(--action-primary-text)',
    secondaryBg: 'var(--action-secondary-bg)',
    tertiaryText: 'var(--action-tertiary-text)',
    disabledBg: 'var(--action-disabled-bg)',
    disabledText: 'var(--action-disabled-text)',
  },
} as const;

export const font = {
  family: {
    primary: "'Noto Sans Thai', 'Inter', 'Segoe UI', sans-serif",
    mono: "'JetBrains Mono', 'SFMono-Regular', 'Menlo', monospace",
  },
  weight: { regular: 400, medium: 500, semibold: 600, bold: 700 },
  size: {
    xs: '12px', sm: '14px', md: '16px', lg: '18px', xl: '20px',
    '2xl': '24px', '3xl': '30px', '4xl': '36px', '5xl': '48px',
  },
  lineHeight: { tight: 1.2, snug: 1.35, normal: 1.5, relaxed: 1.65 },
} as const;

export const space = {
  0: '0px', 1: '4px', 2: '8px', 3: '12px', 4: '16px', 5: '20px', 6: '24px',
  8: '32px', 10: '40px', 12: '48px', 16: '64px', 20: '80px', 24: '96px', 32: '128px',
} as const;

export const radius = {
  none: '0px', xs: '4px', sm: '6px', md: '8px', lg: '12px', xl: '16px', '2xl': '20px', full: '9999px',
} as const;

export const shadow = {
  xs: '0 1px 2px rgba(0,0,0,0.04)',
  sm: '0 2px 6px rgba(0,0,0,0.06)',
  md: '0 6px 16px rgba(0,0,0,0.08)',
  lg: '0 12px 28px rgba(0,0,0,0.10)',
  xl: '0 20px 44px rgba(0,0,0,0.14)',
} as const;

export const breakpoint = {
  xs: '360px', sm: '640px', md: '768px', lg: '1024px', xl: '1280px', '2xl': '1440px',
} as const;

export const layout = {
  container: { narrow: '640px', content: '960px', wide: '1200px', full: '1440px' },
  gutter: { mobile: '16px', tablet: '24px', desktop: '32px' },
  gridGap: { sm: '12px', md: '16px', lg: '24px', xl: '32px' },
  section: { compact: '48px', default: '64px', relaxed: '80px', hero: '96px' },
} as const;

export const motion = {
  duration: { fast: '120ms', base: '180ms', slow: '260ms' },
  easing: { standard: 'ease', emphasis: 'cubic-bezier(0.2, 0, 0, 1)' },
} as const;

export const focus = {
  ringColor: '#09582F',
  ring: '0 0 0 3px rgba(9,88,47,0.45)',
  ringContrast: '0 0 0 2px #FFFFFF, 0 0 0 4px #09582F',
  ringError: '0 0 0 3px rgba(192,38,38,0.28)',
} as const;

export const z = {
  base: 0, raised: 10, sticky: 100, header: 200, dropdown: 300,
  drawer: 400, modal: 500, popover: 600, toast: 700, tooltip: 800,
} as const;

export const icon = {
  library: 'lucide-react',
  size: { xs: 14, sm: 16, md: 20, lg: 24, xl: 32 },
  stroke: { default: 1.5, bold: 2 },
} as const;

export const scrim = 'rgba(2,35,16,0.48)';

/**
 * Data-viz palette. Categorical order is FIXED — never cycle (a 9th series folds
 * into "Other" / small multiples). Validated for CVD + contrast, light & dark.
 * See 08_full §17. Pick light vs dark set by the active theme mode.
 */
export const chart = {
  categorical: {
    light: ['#157F43', '#2A6FB8', '#C68400', '#C8433B', '#8A3DA0', '#0E9AA8', '#E0692A', '#D14FA0'],
    dark:  ['#22A45C', '#4E8FD8', '#BC8810', '#E26B62', '#B072D6', '#159FAD', '#D26C34', '#D663A6'],
  },
  sequential: {
    hue: 'green',
    steps: ['#E6F6EC', '#C4E9D0', '#97D6AE', '#5FBB84', '#2E9C61', '#157F43', '#0D6C3B', '#09582F'],
    ordinalLightStartIndex: 2, // start at #97D6AE for ordinal on light surface (≥2:1)
  },
  diverging: {
    poles: 'red-green' as const,
    neg: ['#A32C28', '#C8433B', '#E39A93'],
    mid: { light: '#ECEBE7', dark: '#333F37' },
    pos: ['#93CFAB', '#45A56E', '#0D6C3B'],
  },
  status: { good: '#0D6C3B', warning: '#B45309', serious: '#C2410C', critical: '#C02626' },
  chrome: {
    surface:  { light: '#FFFFFF', dark: '#022310' },
    gridline: { light: '#E7E4DD', dark: 'rgba(255,255,255,0.10)' },
    axis:     { light: '#C9C5BD', dark: 'rgba(255,255,255,0.20)' },
    inkPrimary:   { light: '#28251D', dark: '#F9F8F5' },
    inkSecondary: { light: '#5F5A52', dark: '#C9C5BD' },
    inkMuted:     { light: '#7A7974', dark: '#8E8B84' },
  },
} as const;

/** Convenience: resolve the categorical set for a mode. */
export const chartCategorical = (mode: ThemeMode) => chart.categorical[mode];

export const tokens = {
  brand, status, semantic, font, space, radius, shadow,
  breakpoint, layout, motion, focus, z, icon, scrim, chart,
} as const;

export type Tokens = typeof tokens;
export type ThemeMode = 'light' | 'dark';

/* ------------------------------------------------------------------ */
/* Theme provider (data-theme switch + context)                        */
/* ------------------------------------------------------------------ */

interface ThemeContextValue {
  mode: ThemeMode;
  setMode: (m: ThemeMode) => void;
  toggle: () => void;
  tokens: Tokens;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({
  children,
  defaultMode = 'light',
}: {
  children: React.ReactNode;
  defaultMode?: ThemeMode;
}) {
  const [mode, setMode] = useState<ThemeMode>(defaultMode);

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', mode);
  }, [mode]);

  const value = useMemo<ThemeContextValue>(
    () => ({ mode, setMode, toggle: () => setMode((m) => (m === 'light' ? 'dark' : 'light')), tokens }),
    [mode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within <ThemeProvider>');
  return ctx;
}

export default tokens;
