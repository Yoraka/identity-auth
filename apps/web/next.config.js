/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@vladmandic/face-api'],
  experimental: {
    serverActions: {
      allowedOrigins: ['172.26.203.52:3000'],
      bodySizeLimit: '2mb',
    },
    turbo: true,
  },
  webpack: (config, { dev, isServer }) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      encoding: false,
      'node-fetch': false,
    };

    if (dev) {
      config.watchOptions = {
        ignored: [
          '**/node_modules/**',
          '**/.git/**',
        ],
      };
    }

    if (!dev) {
      config.optimization = {
        ...config.optimization,
        minimize: true,
      };
    }

    return config;
  },
  output: 'standalone',
  poweredByHeader: false,
  compress: true,
};

module.exports = nextConfig; 