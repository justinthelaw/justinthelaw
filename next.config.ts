import type { NextConfig } from "next";
import { DERIVED_CONFIG } from "./src/config/site";

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  basePath: DERIVED_CONFIG.basePath,
  assetPrefix: DERIVED_CONFIG.assetPrefix,
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        sharp$: false,
        "onnxruntime-node$": false,
      };
    }
    return config;
  },
};

export default nextConfig;
