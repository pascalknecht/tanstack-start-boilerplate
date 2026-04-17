import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const shouldUsePollingWatcher = process.env.WATCHPACK_POLLING === "true";
const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  poweredByHeader: false,
  output: process.env.DOCKER === "1" ? "standalone" : undefined,
  turbopack: {
    root: projectRoot,
  },
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
