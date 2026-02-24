import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Standalone izlaz za Docker optimizaciju */
  output: "standalone",
  serverExternalPackages: [],
};

export default nextConfig;
