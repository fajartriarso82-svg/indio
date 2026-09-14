import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pastikan Turbopack memakai root project ini (bukan parent dir)
  turbopack: {
    root: process.cwd(),
  },
  // TypeScript errors wajib terdeteksi agar tidak ada bug tersembunyi di production
  typescript: {
    ignoreBuildErrors: false,
  },
  reactStrictMode: false,
  images: {
    remotePatterns: [
      {
        // Supabase Storage public URLs
        protocol: "https",
        hostname: "*.supabase.co",
      },
    ],
  },
};

export default nextConfig;
