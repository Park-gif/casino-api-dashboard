/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',  // Statik export modu
  distDir: 'build',  // Build dizini
  
  // Statik export için gelişmiş ayarlar
  trailingSlash: true,
  
  // Görüntü optimizasyonu
  images: {
    unoptimized: true,
    remotePatterns: [{ protocol: "https", hostname: "**" }]
  },

  // Performans ve uyumluluk ayarları
  reactStrictMode: true,
  swcMinify: true,

  // App Router için statik export ayarları
  experimental: {
    // Statik export için gerekli ayarlar
    staticPageGenerationTimeout: 60
  }
};

export default nextConfig;