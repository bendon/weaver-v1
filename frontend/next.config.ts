import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Proxy API requests to the backend
  // Note: /api/chat/message is handled by a custom route handler for better error handling
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

  // Increase timeout for long-running requests (like AI chat)
  serverRuntimeConfig: {
    // Increase timeout for API routes
  },
  
  // Configure headers for proxied requests
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, PATCH, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
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
