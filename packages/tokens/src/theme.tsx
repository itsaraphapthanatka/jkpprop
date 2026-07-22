'use client';
/**
 * JKP Property — Typed design tokens.
 * SOURCE OF TRUTH: JKP_Property_Handoff.md ("Design Tokens").
 * Per user directive (2026-07-22): HANDOFF design system ONLY.
 * Semantic colors are exposed as CSS var references (var(--...)) resolved by
 * handoff.css; brand/accent scales are literal hex. Values marked (derived)
 * are not in the handoff and are filled minimally in its spirit.
 */

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

/* ---- Brand colors (handoff) ---- */
export const brand = {
  neonGreen: '#2DFB91', // CTA on dark, active badge
  green600: '#0D6C3B', // PRIMARY action on light, success
  accent: '#034956', // deep teal — eyebrow, link, price, icon emphasis
  pine: '#273c33', // active, modal button, admin tab active
  gold: '#D9A62B', // phone, sort, warning/recommend
  purple: '#7A3FB0', // admin only
  danger: '#C0392B',
  emeraldGradient: ['#0B7A45', '#0A5C39', '#043F20'] as const,
  footer: '#04140C',
  sidebar: '#0A0E0C',
  primary: '#0D6C3B',
  primaryHover: '#0A5C39',
  primaryActive: '#043F20',
} as const;

export const status = {
  success: { solid: '#0D6C3B', textOn: '#FFFFFF', subtle: '#E6F4EC', text: '#0A5C39' },
  warning: { solid: '#D9A62B', textOn: '#28251D', subtle: '#FBF1D8', text: '#8A6410' },
  error: { solid: '#C0392B', textOn: '#FFFFFF', subtle: '#FBE7E4', text: '#8F251B' },
  info: { solid: '#034956', textOn: '#FFFFFF', subtle: '#E3F0F1', text: '#023741' }, // (derived)
} as const;

/** Semantic colors → CSS vars (handoff.css). */
export const semantic = {
  surface: {
    base: 'var(--color-surface-base)',
    alt: 'var(--color-surface-alt)',
    card: 'var(--color-surface-card)',
    tint: 'var(--color-surface-tint)',
    muted: 'var(--color-surface-muted)',
  },
  text: {
    primary: 'var(--color-text-primary)',
    secondary: 'var(--color-text-secondary)',
    muted: 'var(--color-text-muted)',
    muted3: 'var(--color-text-muted3)',
    inverse: 'var(--color-text-inverse)',
    brand: 'var(--color-text-brand)',
    accent: 'var(--color-text-accent)',
  },
  border: {
    subtle: 'var(--color-border-subtle)',
    default: 'var(--color-border-default)',
    brand: 'var(--color-border-brand)',
  },
  action: {
    primaryBg: 'var(--action-primary-bg)',
    primaryBgHover: 'var(--action-primary-bg-hover)',
    primaryBgActive: 'var(--action-primary-bg-active)',
    primaryText: 'var(--action-primary-text)',
    disabledBg: 'var(--action-disabled-bg)',
    disabledText: 'var(--action-disabled-text)',
  },
} as const;

export const font = {
  family: {
    primary: "'Noto Sans Thai', 'Inter', 'Segoe UI', sans-serif",
    mono: "'JetBrains Mono', 'SFMono-Regular', 'Menlo', monospace",
  },
  weight: { regular: 400, medium: 500, semibold: 600, bold: 700, extrabold: 800 },
  size: {
    eyebrow: '13px',
    bodySm: '15px',
    body: '16px',
    price: '21px',
    h3: '22px',
    h2: '34px',
    h1: '44px',
    h1Mobile: '34px',
  },
  letterSpacing: { eyebrow: '0.08em' },
} as const;

/** Handoff spacing rhythm. */
export const space = { 1: '4px', 2: '8px', 4: '16px', 6: '24px', 11: '44px', 22: '88px' } as const;

/** Handoff radius. Buttons/chips = full (pill). */
export const radius = {
  xs: '8px',
  sm: '12px',
  md: '16px',
  lg: '20px',
  xl: '24px',
  full: '9999px',
} as const;

/** (derived) — handoff describes "subtle utilitarian shadows" + card hover. */
export const shadow = {
  xs: '0 1px 2px rgba(0,0,0,0.04)',
  sm: '0 2px 8px rgba(0,0,0,0.06)',
  md: '0 8px 24px rgba(0,0,0,0.10)',
  lg: '0 16px 40px rgba(0,0,0,0.14)',
  glow: '0 6px 18px rgba(13,108,59,0.28)',
} as const;

export const breakpoint = {
  xs: '360px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1440px',
} as const;

export const layout = {
  container: { narrow: '640px', content: '960px', wide: '1200px', full: '1440px' },
} as const;

export const motion = {
  duration: { fast: '200ms', base: '300ms', slow: '350ms' },
  easing: { standard: 'ease', emphasis: 'cubic-bezier(0.2, 0.7, 0.3, 1)' },
  liftHover: '-2px',
  revealOffset: '28px',
} as const;

/** (derived) — focus ring built from brand green. */
export const focus = {
  ring: '0 0 0 3px rgba(13,108,59,0.40)',
  ringContrast: '0 0 0 2px #FFFFFF, 0 0 0 4px #0D6C3B',
  ringError: '0 0 0 3px rgba(192,57,43,0.28)',
} as const;

/** (derived) — structural z-index scale. */
export const z = {
  base: 0,
  raised: 10,
  sticky: 100,
  header: 200,
  dropdown: 300,
  drawer: 400,
  modal: 500,
  popover: 600,
  toast: 700,
  tooltip: 800,
} as const;

/** Handoff icons: iOS/SF-Symbols line style, stroke 1.7, 24px viewBox (lucide-react ok). */
export const icon = {
  library: 'lucide-react',
  size: { sm: 16, md: 20, lg: 24 },
  stroke: 1.7,
} as const;

export const scrim = 'rgba(2,14,8,0.55)';

export const tokens = {
  brand,
  status,
  semantic,
  font,
  space,
  radius,
  shadow,
  breakpoint,
  layout,
  motion,
  focus,
  z,
  icon,
  scrim,
} as const;

export type Tokens = typeof tokens;
export type ThemeMode = 'light' | 'dark';

/* ---- Theme provider (light-first; handoff defines no full dark theme) ---- */
interface ThemeContextValue {
  mode: ThemeMode;
  setMode: (m: ThemeMode) => void;
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
    document.documentElement.setAttribute('data-theme', mode);
  }, [mode]);

  const value = useMemo<ThemeContextValue>(() => ({ mode, setMode, tokens }), [mode]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within <ThemeProvider>');
  return ctx;
}

export default tokens;
