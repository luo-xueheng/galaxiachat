/** @type {import('next').NextConfig} */
const nextConfig = {
    // TODO Start: [Student] Enable standalone build
    output: 'standalone',
    // TODO End
    reactStrictMode: false, /* @note: To prevent duplicated call of useEffect */
    // swcMinify: true,

    async rewrites() {
        return [{
            source: "/api/:path*",
            // TODO Start: [Student] Change to standard backend URL
            //destination: "http://127.0.0.1:8080/:path*",
            //destination: "http://127.0.0.1:8000/:path*", // 重写到后端
            destination:"https://2025-backend-galaxia-galaxia.app.spring25b.secoder.net/:path*", // 重写到后端
            // TODO End
        }];
    }
};

// eslint-disable-next-line no-undef
module.exports = nextConfig;
