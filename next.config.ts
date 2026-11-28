import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      { source: '/', destination: '/index.html' },
      { source: '/datenschutz', destination: '/datenschutz.html' },
      { source: '/connector', destination: '/connector.html' },
      { source: '/preise', destination: '/preise.html' },
      { source: '/impressum', destination: '/impressum.html' },
      { source: '/agb', destination: '/bibliotheksordnung.html' },
      // Connector-Adresse für Claude und ChatGPT
      { source: '/mcp', destination: '/api/mcp' },
    ];
  },
  async redirects() {
    return [
      // Kanonisch ist www.selfpublishbot.de
      ...['selfpublishbot.com', 'www.selfpublishbot.com', 'selfpublishbot.de'].map((value) => ({
        source: '/:path*', has: [{ type: 'host' as const, value }], destination: 'https://www.selfpublishbot.de/:path*', permanent: true,
      })),
    ];
  },
  async headers() {
    return [{
      source: '/:path*',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(self), geolocation=()' },
      ],
    }];
  },
};

export default nextConfig;
