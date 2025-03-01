/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { webpack }) => {
    config.ignoreWarnings = [
      { module: /node_modules/, message: /\[DEP0040\]/ }
    ];
    return config;
  },
}

module.exports = nextConfig