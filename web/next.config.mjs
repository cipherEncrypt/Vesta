/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@near-wallet-selector/core",
    "@near-wallet-selector/modal-ui",
    "@near-wallet-selector/my-near-wallet",
    "@near-wallet-selector/here-wallet",
  ],
};

export default nextConfig;