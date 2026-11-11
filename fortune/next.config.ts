import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 静态导出：产物直接是纯静态 HTML，可部署到任意静态托管
  output: "export",
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
