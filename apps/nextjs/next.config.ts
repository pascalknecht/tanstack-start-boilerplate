import type { NextConfig } from "next";

const shouldUsePollingWatcher = process.env.WATCHPACK_POLLING === "true";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  output: process.env.DOCKER === "1" ? "standalone" : undefined,
  watchOptions: shouldUsePollingWatcher
    ? {
        pollIntervalMs: 1000,
      }
    : undefined,

  images: {
    formats: ["image/avif", "image/webp"],
  },

  serverExternalPackages: ["@prisma/adapter-pg"],

  experimental: {
    typedEnv: true,
  },
};

export default nextConfig;
