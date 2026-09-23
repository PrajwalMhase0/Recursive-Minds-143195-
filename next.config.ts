import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.31.31", "localhost", "127.0.0.1"],
  serverExternalPackages: ["better-sqlite3"],
};

export default nextConfig;
