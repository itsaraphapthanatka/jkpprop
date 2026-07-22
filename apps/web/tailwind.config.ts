import type { Config } from 'tailwindcss';
// Green-first canonical preset (colors, type, spacing, radius, shadow, motion, z).
import preset from '@jkp/tokens/tailwind';

export default {
  presets: [preset as Config],
  content: [
    './src/**/*.{ts,tsx,mdx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
  ],
} satisfies Config;
