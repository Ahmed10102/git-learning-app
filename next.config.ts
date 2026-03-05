import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack config (Next.js 16 default bundler)
  turbopack: {
    // isomorphic-git and LightningFS are browser-only (dynamic imports with 'use client').
    // Turbopack handles Node.js built-in stubs automatically for client bundles,
    // so no explicit resolve.alias needed here.
  },
};

export default nextConfig;
