import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Workspace packages ship raw TS/TSX — Next transpiles them.
  transpilePackages: ['@jkp/tokens', '@jkp/ui', '@jkp/domain', '@jkp/api-client'],

  // ESLint wiring lands in FE-1; don't block FE-0 builds on it.
  eslint: { ignoreDuringBuilds: true },

  // Type errors SHOULD fail the build (NFR-12).
  typescript: { ignoreBuildErrors: false },

  // Placeholder imagery (swap for client CDN later). Public images are always
  // watermarked server-side per FR-ADM-09 when the real pipeline lands.
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'picsum.photos' }],
  },

  // D1 (locked): canonical detail route is /[locale]/listing/[slug].
  // 301 legacy patterns to it.
  async redirects() {
    return [
      {
        source: '/:locale(th|en|zh)/property/:slug*',
        destination: '/:locale/listing/:slug*',
        permanent: true,
      },
      {
        source: '/:locale(th|en|zh)/listing-single/:slug*',
        destination: '/:locale/listing/:slug*',
        permanent: true,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
