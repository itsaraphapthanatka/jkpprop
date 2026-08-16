/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  /* The build runs on a 2-core, 3.9 GB VPS that also serves eighteen other
     containers. Next spreads page compilation across every core it finds and
     each worker holds its own heap; two of them is what this machine can lend
     without the rest of it stalling. */
  experimental: { cpus: 2 },
  // Ships a self-contained server with only the files actually imported, so
  // the deploy artifact is tens of megabytes instead of the ~750MB
  // node_modules tree. Required by the Docker image.
  output: 'standalone',
  images: {
    // next/image refuses any host that is not listed here. Unsplash covers the
    // placeholder photography in the ported design; the media route serves our
    // own (watermarked) uploads and is same-origin, so it needs no entry.
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
};

export default nextConfig;
