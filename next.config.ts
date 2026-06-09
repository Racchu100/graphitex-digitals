import type { NextConfig } from "next";
// @ts-ignore
import withBundleAnalyzer from "@next/bundle-analyzer";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/services",
        destination: "/directory",
        permanent: true,
      },
      {
        source: "/services/:id",
        destination: "/directory/:id",
        permanent: true,
      },
    ];
  },
};

export default withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
})(nextConfig);
