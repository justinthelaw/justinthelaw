import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  basePath: isProd ? "/justinthelaw.github.io" : "",
  assetPrefix: isProd ? "/justinthelaw.github.io/" : "",
  turbopack: {},
  webpack: (config) => {
    // Fallback for webpack mode (if explicitly used with --webpack)
    config.resolve.alias = {
      ...config.resolve.alias,
      sharp$: false,
      "onnxruntime-node$": false,
    };
    return config;
  },
};

export default nextConfig;
