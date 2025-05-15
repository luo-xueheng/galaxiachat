/** @type {import('next').NextConfig} */
const nextConfig = {
    // TODO Start: [Student] Enable standalone build
    output: 'standalone',
    // TODO End
    reactStrictMode: true, /* @note: To prevent duplicated call of useEffect */
    // swcMinify: true,

    async rewrites() {
        return [
            {
                source: "/api/:path*",
                destination: "https://2025-backend-galaxia-galaxia.app.spring25b.secoder.net/:path*/"
            },
            {
                source: "/mainpage/api/:path*",
                destination: "https://2025-backend-galaxia-galaxia.app.spring25b.secoder.net/:path*/"
            },
            {
                source: "/mainpage/chat/api/:path*",
                destination: "https://2025-backend-galaxia-galaxia.app.spring25b.secoder.net/:path*/"
            },
            {
                source: "/mainpage/friends/api/:path*",
                destination: "https://2025-backend-galaxia-galaxia.app.spring25b.secoder.net/:path*/"
            },
            {
                source: "/mainpage/searchuser/api/:path*",
                destination: "https://2025-backend-galaxia-galaxia.app.spring25b.secoder.net/:path*/"
            }
        ];
    }
};

// eslint-disable-next-line no-undef
module.exports = nextConfig;
