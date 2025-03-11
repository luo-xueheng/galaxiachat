import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  output: "standalone", // 适用于 Docker 部署
  reactStrictMode: true, // 启用 React 严格模式
  swcMinify: true, // 使用 SWC 进行优化
  images: {
    domains: ["your-cdn.com"], // 允许的图片域名（如果有需要）
  },
  typescript: {
    ignoreBuildErrors: false, // 严格检查 TypeScript
  },
};

export default nextConfig;