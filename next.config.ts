import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  basePath: isProd ? "/justinthelaw.github.io" : "",
  assetPrefix: isProd ? "/justinthelaw.github.io/" : "",
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
