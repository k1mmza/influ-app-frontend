import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Self-contained build output for Docker (minimal runtime, no full node_modules).
  output: "standalone"
};

export default nextConfig;
