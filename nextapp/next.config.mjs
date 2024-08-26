/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ipfs.io",
      },
      {
        protocol: "https",
        hostname: "pink-rapid-clownfish-409.mypinata.cloud",
      },
    ],
  },
  webpack: (config, { isServer }) => {
    config.module.rules.push({
      test: /\.json$/,
      type: "json",
    });

    return config;
  },
};

export default nextConfig;
