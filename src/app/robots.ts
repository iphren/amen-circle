import type { MetadataRoute } from "next";

const BASE_URL = "https://amencircle.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/dashboard",
        "/rooms/",
        "/settings",
        "/my-prayers",
        "/auth/recover",
        "/auth/email-login",
        "/dev/",
      ],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
