import type { NextConfig } from "next";
import { validateEnv } from "./src/config/environment";

validateEnv();

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default nextConfig;
