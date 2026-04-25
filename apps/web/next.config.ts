import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable React StrictMode in dev so the SSE EventSource isn't opened
  // twice (which would replay the demo). Production has it off by default.
  reactStrictMode: false,
};

export default nextConfig;
