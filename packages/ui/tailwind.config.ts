import type { Config } from 'tailwindcss';
// Handoff design tokens preset (source of truth: JKP_Property_Handoff.md).
import preset from '@jkp/tokens/tailwind';

export default {
  presets: [preset as Config],
  content: ['./src/**/*.{ts,tsx}', './.storybook/**/*.{ts,tsx}'],
} satisfies Config;
