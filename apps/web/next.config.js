/** @type {import('next').NextConfig} */
const apiOrigin = process.env.NEXT_PUBLIC_API_URL || '';

const nextConfig = {
  experimental: {
    typedRoutes: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
      },
    ],
  },
  // Same-origin proxy so auth cookies are first-party on every browser
  // (Safari ITP, mobile Chrome, incognito) — the browser only ever talks to
  // the web origin; rewrites forward /api/* and /socket.io/* to the API
  // service server-side.
  async rewrites() {
    if (!apiOrigin) return [];
    return [
      { source: '/api/:path*', destination: `${apiOrigin}/api/:path*` },
      { source: '/socket.io/:path*', destination: `${apiOrigin}/socket.io/:path*` },
    ];
  },
};

export default nextConfig;
