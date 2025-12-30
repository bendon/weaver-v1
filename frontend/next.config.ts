import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Proxy API requests to the backend
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.NEXT_PUBLIC_API_URL
          ? `${process.env.NEXT_PUBLIC_API_URL}/api/:path*`
          : 'http://localhost:8000/api/:path*',
      },
    ];
  },

  // Webpack configuration for module aliases and CSS handling
  webpack: (config, { dev, isServer }) => {
    // Alias react-router-dom to our compatibility layer
    config.resolve.alias = {
      ...config.resolve.alias,
      'react-router-dom': path.resolve(__dirname, 'src/lib/router-compat.tsx'),
    };

    // Improve CSS hot reload in development
    if (dev && !isServer) {
      // Ensure CSS files are properly tracked for HMR
      // This helps with CSS hot module replacement
      config.optimization = {
        ...config.optimization,
        moduleIds: 'named',
      };
    }

    return config;
  },

  // Disable server components by default for pages that need client-side features
  experimental: {
    // Enable if needed
  },
};

export default nextConfig;
