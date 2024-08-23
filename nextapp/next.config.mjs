import { hostname } from "os";

/** @type {import('next').NextConfig} */
const nextConfig = {
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
};

export default nextConfig;
