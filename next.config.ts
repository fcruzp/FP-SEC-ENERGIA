import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: false,
  async redirects() {
    // El panel vivía en /admin/observatorio; ahora es /admin
    return [{ source: '/admin/observatorio', destination: '/admin', permanent: true }]
  },
};

export default nextConfig;
