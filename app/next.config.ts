import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // Ignore directories during `next lint`
    ignoreDuringBuilds: true,
    dirs: ['pages', 'components', 'lib', 'src', 'app'].filter(dir => dir !== 'src/generated'),
  },
};

export default nextConfig;
