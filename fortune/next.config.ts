import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 不再静态导出：/api/interpret 是服务端 Route Handler（API key 必须留在服务端），
  // 与 output: "export" 互斥。静态页仍是构建期预渲染，按常规 Next 部署（含一个 serverless function）。
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
