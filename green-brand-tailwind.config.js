/**
 * Industrial Property Platform — Tailwind theme extension (green-first)
 * Source of truth: 08_design_tokens_normalized_green_revision_full.md
 * Generated 1:1 from green-brand-tokens.json — keep in sync when tokens change.
 *
 * Usage (tailwind.config.js):
 *   const brand = require('./green-brand-tailwind.config.js');
 *   module.exports = { presets: [brand], content: [...] };
 *
 * Dark mode is class/attribute-based: darkMode: ['class', '[data-theme="dark"]'].
 * Semantic surface/text/border/action colors resolve to CSS variables defined in
 * green-brand.css so that light/dark switch automatically. Raw scale colors are
 * literal hex for utilities like bg-brand-600.
 */

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    screens: {
      xs: '360px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1440px',
    },
    extend: {
      colors: {
        brand: {
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
          DEFAULT: '#0D6C3B',
        },
        // Semantic tokens → CSS variables (theme-aware: light/dark)
        surface: {
          base: 'var(--color-surface-base)',
          alt: 'var(--color-surface-alt)',
          card: 'var(--color-surface-card)',
          muted: 'var(--color-surface-muted)',
          'brand-subtle': 'var(--color-surface-brand-subtle)',
          'brand-soft': 'var(--color-surface-brand-soft)',
          'brand-strong': 'var(--color-surface-brand-strong)',
        },
        content: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          muted: 'var(--color-text-muted)',
          inverse: 'var(--color-text-inverse)',
          brand: 'var(--color-text-brand)',
        },
        line: {
          subtle: 'var(--color-border-subtle)',
          DEFAULT: 'var(--color-border-default)',
          brand: 'var(--color-border-brand)',
        },
        // Status (semantic) — literal, stable across themes
        success: { DEFAULT: '#0D6C3B', subtle: '#DCFAE6', text: '#09582F' },
        warning: { DEFAULT: '#B45309', subtle: '#FDF0D5', text: '#7C4210' },
        danger: { DEFAULT: '#C02626', subtle: '#FCE4E4', text: '#8F1D1D' },
        info: { DEFAULT: '#1C5FB8', subtle: '#DCEAFB', text: '#17457F' },
        // Chart / data-viz — theme-aware via CSS vars (see green-brand.css §chart).
        // Categorical order is FIXED — never cycle.
        chart: {
          1: 'var(--chart-cat-1)', 2: 'var(--chart-cat-2)', 3: 'var(--chart-cat-3)', 4: 'var(--chart-cat-4)',
          5: 'var(--chart-cat-5)', 6: 'var(--chart-cat-6)', 7: 'var(--chart-cat-7)', 8: 'var(--chart-cat-8)',
          surface: 'var(--chart-surface)', grid: 'var(--chart-gridline)', axis: 'var(--chart-axis)',
        },
        'chart-status': {
          good: '#0D6C3B', warning: '#B45309', serious: '#C2410C', critical: '#C02626',
        },
      },
      fontFamily: {
        sans: ['Noto Sans Thai', 'Inter', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      fontSize: {
        xs: '12px',
        sm: '14px',
        base: '16px',
        lg: '18px',
        xl: '20px',
        '2xl': '24px',
        '3xl': '30px',
        '4xl': '36px',
        '5xl': '48px',
      },
      lineHeight: {
        tight: '1.2',
        snug: '1.35',
        normal: '1.5',
        relaxed: '1.65',
      },
      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
      },
      spacing: {
        0: '0px',
        1: '4px',
        2: '8px',
        3: '12px',
        4: '16px',
        5: '20px',
        6: '24px',
        8: '32px',
        10: '40px',
        12: '48px',
        16: '64px',
        20: '80px',
        24: '96px',
        32: '128px',
      },
      borderRadius: {
        none: '0px',
        xs: '4px',
        sm: '6px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '20px',
        full: '9999px',
      },
      boxShadow: {
        xs: '0 1px 2px rgba(0,0,0,0.04)',
        sm: '0 2px 6px rgba(0,0,0,0.06)',
        md: '0 6px 16px rgba(0,0,0,0.08)',
        lg: '0 12px 28px rgba(0,0,0,0.10)',
        xl: '0 20px 44px rgba(0,0,0,0.14)',
        // Accessible focus rings (see §9 of token doc)
        focus: '0 0 0 3px rgba(9,88,47,0.45)',
        'focus-contrast': '0 0 0 2px #FFFFFF, 0 0 0 4px #09582F',
        'focus-error': '0 0 0 3px rgba(192,38,38,0.28)',
      },
      maxWidth: {
        narrow: '640px',
        content: '960px',
        wide: '1200px',
        full: '1440px',
      },
      zIndex: {
        base: '0',
        raised: '10',
        sticky: '100',
        header: '200',
        dropdown: '300',
        drawer: '400',
        modal: '500',
        popover: '600',
        toast: '700',
        tooltip: '800',
      },
      transitionDuration: {
        fast: '120ms',
        base: '180ms',
        slow: '260ms',
      },
      transitionTimingFunction: {
        standard: 'ease',
        emphasis: 'cubic-bezier(0.2, 0, 0, 1)',
      },
    },
  },
  plugins: [],
};
