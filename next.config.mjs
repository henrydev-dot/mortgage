/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { unoptimized: true },
  async redirects() {
    return [
      // Airdrop moved into the dapp — old referral links keep working
      // (query strings are preserved automatically)
      { source: "/airdrop", destination: "/app/airdrop", permanent: false },
    ];
  },
};

export default nextConfig;
