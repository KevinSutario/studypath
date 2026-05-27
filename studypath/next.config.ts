import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Strict mode for catching subtle React bugs early
  reactStrictMode: true,

  // Allow images from common avatar/asset CDNs if needed later
  images: {
    remotePatterns: [],
  },

  // Ensure Prisma client generates correctly in Edge/serverless environments
  serverExternalPackages: ['@prisma/client', 'bcryptjs'],
};

export default nextConfig;
