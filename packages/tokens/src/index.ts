/**
 * @jkp/tokens — public entry for the typed token object.
 * SOURCE OF TRUTH: JKP_Property_Handoff.md (handoff design system only).
 *
 * CSS variables → `@jkp/tokens/css`; Tailwind preset → `@jkp/tokens/tailwind`.
 */
export {
  tokens,
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
  ThemeProvider,
  useTheme,
} from './theme';

export type { Tokens, ThemeMode } from './theme';

export { default } from './theme';
