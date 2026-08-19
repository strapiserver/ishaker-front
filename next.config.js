const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

module.exports = withBundleAnalyzer({
  reactStrictMode: true,
  // Keep local development output separate from production builds. Running
  // `next build` while the dev server is active must not replace its chunks.
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config, { dev }) => {
    if (dev) {
      // Avoid webpack pack-file corruption under repeated local restarts.
      config.cache = {
        type: "memory",
      };
    }

    return config;
  },
});
