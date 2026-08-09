/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
