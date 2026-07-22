// Side-effect CSS imports (globals.css) and the tokens CSS package.
declare module '*.css';
declare module '@jkp/tokens/css';
// Tailwind preset is JS with no bundled types; only imported in tailwind.config.ts.
declare module '@jkp/tokens/tailwind' {
  const preset: unknown;
  export default preset;
}
