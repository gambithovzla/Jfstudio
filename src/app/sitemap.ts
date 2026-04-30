import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const now = new Date();

  return [
    { url: `${base}/`, lastModified: now, priority: 1 },
    { url: `${base}/reservar`, lastModified: now, priority: 0.9 }
  ];
}
