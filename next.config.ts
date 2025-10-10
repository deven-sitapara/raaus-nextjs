import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["axios", "pdfkit"],
  webpack: (config) => {
    config.resolve.fallback = { fs: false, net: false, tls: false };
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
    };
    return config;
  },
};

export default nextConfig;
