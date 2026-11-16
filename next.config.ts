import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  experimental: {
    serverActions: { bodySizeLimit: "2mb" },
    // Caché del router en el navegador: volver a una página visitada hace poco es instantáneo.
    staleTimes: { dynamic: 30, static: 180 },
  },
};

export default nextConfig;
