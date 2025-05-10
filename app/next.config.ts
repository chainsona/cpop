import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
  eslint: {
    // Ignore directories during `next lint`
    ignoreDuringBuilds: true,
    dirs: ['pages', 'components', 'lib', 'src', 'app'].filter(dir => dir !== 'src/generated'),
  },
};

export default nextConfig;
