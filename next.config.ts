import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.CONDATY_NEXT_DIST_DIR || ".next",
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
