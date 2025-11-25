import type { NextConfig } from "next";
import { DERIVED_CONFIG } from "./src/config/site";

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  basePath: DERIVED_CONFIG.basePath,
  assetPrefix: DERIVED_CONFIG.assetPrefix,
  turbopack: {},
  webpack: (config, { isServer }) => {
    // Don't process worker files on the server
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        sharp$: false,
        "onnxruntime-node$": false,
      };
      
      // Add worker-loader for .worker.ts files
      config.module.rules.push({
        test: /\.worker\.ts$/,
        use: { loader: "worker-loader" },
      });
    }
    return config;
  },
};

export default nextConfig;
