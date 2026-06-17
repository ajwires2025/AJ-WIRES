import type { MetadataRoute } from "next";
import { company } from "@/lib/site-data";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "",
    "/about",
    "/products",
    "/infrastructure",
    "/quality",
    "/applications",
    "/gallery",
    "/quote",
    "/contact",
  ];

  return routes.map((route) => ({
    url: `${company.url}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : 0.7,
  }));
}
