/** @type {import('next').NextConfig} */
const nextConfig = {
  // Transpile workspace packages
  transpilePackages: ["@repo/api", "@repo/database"],

  // Enable experimental features for better monorepo support
  experimental: {
    // Optimize imports from workspace packages
    optimizePackageImports: ["@repo/database"],
  },
};

export default nextConfig;
