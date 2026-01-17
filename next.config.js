const withNextIntl = require('next-intl/plugin')();

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true, // Vercel 이미지 최적화 비용 절감
    remotePatterns: [
      { protocol: 'https', hostname: '**.imgur.com' },
      { protocol: 'https', hostname: '**.discordapp.com' },
      { protocol: 'https', hostname: '**.discord.com' },
      { protocol: 'https', hostname: '**.discord.gg' },
      { protocol: 'https', hostname: '**.blogger.com' },
      { protocol: 'https', hostname: '**.blogspot.com' },
      { protocol: 'https', hostname: '**.tistory.com' },
      { protocol: 'https', hostname: '**.naver.com' },
      { protocol: 'https', hostname: '**.daum.net' },
      { protocol: 'https', hostname: '**.github.io' },
      { protocol: 'https', hostname: '**.githubusercontent.com' },
      { protocol: 'https', hostname: '**.cloudinary.com' },
      { protocol: 'https', hostname: '**.amazonaws.com' },
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'via.placeholder.com' },
      { protocol: 'https', hostname: '**.unsplash.com' },
      { protocol: 'https', hostname: '**.r2.dev' },
      { protocol: 'https', hostname: '**.r2.cloudflarestorage.com' },
    ],
  },
};

module.exports = withNextIntl(nextConfig);