/**
 * JKP Property — Tailwind preset
 * SOURCE OF TRUTH: JKP_Property_Handoff.md ("Design Tokens").
 * Per user directive (2026-07-22): HANDOFF design system ONLY — supersedes the
 * green-first canonical set. Semantic colors resolve to CSS vars in handoff.css
 * so values live in one place; raw brand/accent scales are literal hex.
 *
 * @type {import('tailwindcss').Config}
 */
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
        // Brand green (handoff): 600 = primary, neon = on-dark CTA/active badge,
        // 400/500/800 = emerald-gradient stops.
        brand: {
          50: '#E8F5EE', // (derived) soft tint
          100: '#2DFB91', // neon green
          300: '#1EBA6A', // (derived)
          400: '#0B7A45', // emerald light
          500: '#0A5C39', // emerald mid
          600: '#0D6C3B', // PRIMARY
          700: '#0A5C39', // hover
          800: '#043F20', // active / emerald deep
          900: '#022310',
          950: '#011507',
          neon: '#2DFB91',
          DEFAULT: '#0D6C3B',
        },
        accent: { DEFAULT: '#034956', teal: '#034956' }, // deep teal — eyebrow/link/price
        gold: { DEFAULT: '#D9A62B' }, // phone / sort / recommend
        pine: { DEFAULT: '#273c33' }, // active / modal / admin tab active
        purple: { DEFAULT: '#7A3FB0' }, // admin settings / field builder
        sidebar: '#0A0E0C', // admin sidebar
        footer: '#04140C', // footer background

        // Semantic surfaces / text / borders → CSS vars (handoff.css)
        surface: {
          base: 'var(--color-surface-base)',
          alt: 'var(--color-surface-alt)',
          card: 'var(--color-surface-card)',
          tint: 'var(--color-surface-tint)',
          muted: 'var(--color-surface-muted)',
        },
        content: {
          primary: 'var(--color-text-primary)',
          secondary: 'var(--color-text-secondary)',
          muted: 'var(--color-text-muted)',
          muted3: 'var(--color-text-muted3)',
          inverse: 'var(--color-text-inverse)',
          brand: 'var(--color-text-brand)',
          accent: 'var(--color-text-accent)',
        },
        line: {
          subtle: 'var(--color-border-subtle)',
          DEFAULT: 'var(--color-border-default)',
          brand: 'var(--color-border-brand)',
        },
        // Status (success/warning/danger from handoff; info derived from teal)
        success: { DEFAULT: '#0D6C3B', subtle: '#E6F4EC', text: '#0A5C39' },
        warning: { DEFAULT: '#D9A62B', subtle: '#FBF1D8', text: '#8A6410' },
        danger: { DEFAULT: '#C0392B', subtle: '#FBE7E4', text: '#8F251B' },
        info: { DEFAULT: '#034956', subtle: '#E3F0F1', text: '#023741' },
      },
      fontFamily: {
        sans: ['Noto Sans Thai', 'Inter', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      // Handoff type scale: eyebrow 13, body 15-16, price 21, H3 22, H2 34, H1 44
      fontSize: {
        xs: '13px',
        sm: '14px',
        base: '16px',
        lg: '18px',
        xl: '20px',
        price: '21px',
        '2xl': '22px',
        '3xl': '24px',
        '4xl': '34px',
        '5xl': '44px',
      },
      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        extrabold: '800',
      },
      letterSpacing: {
        eyebrow: '0.08em',
      },
      // Handoff spacing rhythm adds 44 (11, default) and 88 (22).
      spacing: {
        22: '88px',
      },
      // Handoff radius: sm 10-12, md 16-18, lg 20-24, full pill
      borderRadius: {
        none: '0px',
        xs: '8px',
        sm: '12px',
        md: '16px',
        lg: '20px',
        xl: '24px',
        '2xl': '24px',
        full: '9999px',
      },
      borderWidth: {
        card: '1.5px',
      },
      boxShadow: {
        xs: '0 1px 2px rgba(0,0,0,0.04)',
        sm: '0 2px 8px rgba(0,0,0,0.06)',
        md: '0 8px 24px rgba(0,0,0,0.10)',
        lg: '0 16px 40px rgba(0,0,0,0.14)',
        glow: '0 6px 18px rgba(13,108,59,0.28)',
        focus: '0 0 0 3px rgba(13,108,59,0.40)',
        'focus-contrast': '0 0 0 2px #FFFFFF, 0 0 0 4px #0D6C3B',
        'focus-error': '0 0 0 3px rgba(192,57,43,0.28)',
      },
      backgroundImage: {
        'gradient-emerald': 'linear-gradient(135deg, #0B7A45 0%, #0A5C39 50%, #043F20 100%)',
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
        fast: '200ms',
        base: '300ms',
        slow: '350ms',
      },
      transitionTimingFunction: {
        standard: 'ease',
        emphasis: 'cubic-bezier(0.2, 0.7, 0.3, 1)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
