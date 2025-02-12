import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  basePath: isProd ? "/justinthelaw.github.io" : "",
  assetPrefix: isProd ? "/justinthelaw.github.io/" : "",
};

export default nextConfig;
