import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // This folder is the project root (ignore any package-lock.json in parent folders).
  outputFileTracingRoot: path.join(__dirname),
  poweredByHeader: false,
};

export default nextConfig;
