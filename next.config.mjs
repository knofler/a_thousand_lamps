/** @type {import('next').NextConfig} */
const nextConfig = {
  // Required for Docker multi-stage build to produce a self-contained server
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'scontent.fbcdn.net' },
      { protocol: 'https', hostname: '*.fbcdn.net' },
    ],
  },
};

export default nextConfig;
