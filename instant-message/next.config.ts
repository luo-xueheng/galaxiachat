/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,  // 启用 appDir 功能
  },
  output: "standalone",
  reactStrictMode: false,
  swcMinify: true,  // 可选，启用 swc 压缩
};

module.exports = nextConfig;