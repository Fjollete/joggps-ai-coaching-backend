/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  // Enable standalone output for Docker
  output: 'standalone',
  // Optimize for production
  swcMinify: true,
  // Configure headers for API routes
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*', // Configure this to your Android app's domain in production
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
    ]
  },
  // Environment variables that should be available on the client side
  env: {
    REDIS_URL: process.env.REDIS_URL,
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
  },
  // Disable x-powered-by header for security
  poweredByHeader: false,
  // Compress responses
  compress: true,
  // Production optimizations
  productionBrowserSourceMaps: false,
}

module.exports = nextConfig