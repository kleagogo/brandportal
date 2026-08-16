import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The dev-only route indicator floated over the hub sidebar's footer, on top
  // of the theme toggle. Compile and runtime errors still surface without it.
  devIndicators: false,
};

export default nextConfig;
