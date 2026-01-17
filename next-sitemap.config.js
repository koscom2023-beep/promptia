/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://your-domain.com",
  generateRobotsTxt: true,
  generateIndexSitemap: false,
  exclude: ["/admin/*", "/api/*"],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin/"],
      },
    ],
    additionalSitemaps: [
      `${process.env.NEXT_PUBLIC_SITE_URL || "https://your-domain.com"}/sitemap.xml`,
    ],
  },
  // 동적 경로는 sitemap.ts에서 처리
  // next-sitemap은 정적 페이지와 기본 설정만 처리
};
