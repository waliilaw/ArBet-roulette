/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost', 'arweave.net'],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Fixes npm packages that depend on `fs` module
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        path: false,
        os: false,
        crypto: false,
        stream: false,
        constants: false,
        buffer: false,
      };
    }

    // Add polyfills
    config.plugins = [
      ...config.plugins,
    ];

    return config;
  },
};

export default nextConfig; 