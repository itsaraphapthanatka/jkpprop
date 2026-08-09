/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
