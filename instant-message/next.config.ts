/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,  // 启用 appDir 功能
  },
  output: 'standalone',
  reactStrictMode: false,
  swcMinify: true,  // 可选，启用 swc 压缩
  async rewrites() {
    return [{
        source: "/api/:path*",
        // TODO Start: [Student] Change to standard backend URL
        //destination: "http://127.0.0.1:8080/:path*",
        destination: "https://backend-sepi.app.spring25b.secoder.net/:path*", // 重写到后端
        // TODO End
    }];
}
};

module.exports = nextConfig;