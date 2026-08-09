/* Flat config. eslint-config-next 16 exports flat configs directly, so no
   FlatCompat bridge is needed (and the bridge crashes on the react plugin). */
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';

export default [
  { ignores: ['.next/**', 'node_modules/**', 'next-env.d.ts'] },
  ...(Array.isArray(nextCoreWebVitals) ? nextCoreWebVitals : [nextCoreWebVitals]),
  ...(Array.isArray(nextTypescript) ? nextTypescript : [nextTypescript]),
  {
    rules: {
      // The .dc.html port uses raw <img> for Unsplash placeholders and for
      // uploads served from /api/media; next/image needs a remotePatterns
      // entry per host, so this stays a warning until the asset bundle lands.
      '@next/next/no-img-element': 'warn',

      // FRONTEND_API_SPEC §2.1 REQUIRES this shape: render a default that the
      // server and the first client render agree on, then narrow it in an
      // effect. React would rather we fetched in a Server Component, but these
      // are ported client components reading per-tenant config — the mismatch
      // this prevents (React #418) already happened once in this project.
      'react-hooks/set-state-in-effect': 'warn',

      // Ports of the design's logic classes keep a mutable ref in sync during
      // render (MapPicker's leaflet handlers, Steps' observer). Worth revisiting
      // when those components are rewritten, not worth destabilising now.
      'react-hooks/refs': 'warn',
      'react-hooks/purity': 'warn',

      // The font <link> in the root layout is deliberate: next/font would
      // change the emitted CSS and the port is pixel-matched to the design.
      '@next/next/no-page-custom-font': 'warn',

      // A full reload is what we want after logout — it drops every cached
      // client store along with the session.
      '@next/next/no-location-assign-relative-destination': 'warn',

      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
];
