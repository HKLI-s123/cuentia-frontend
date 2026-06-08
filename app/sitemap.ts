import type { MetadataRoute } from "next";
import { SITE } from "./site.config";

/**
 * Sitemap con las rutas públicas e indexables.
 * Las rutas privadas (dashboard, chat, configuración, etc.) se excluyen
 * aquí y se bloquean en robots.ts.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const routes: Array<{
    path: string;
    priority: number;
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  }> = [
    { path: "", priority: 1.0, changeFrequency: "weekly" },
    { path: "/plans", priority: 0.9, changeFrequency: "weekly" },
    { path: "/faqs", priority: 0.7, changeFrequency: "monthly" },
    { path: "/nosotros", priority: 0.6, changeFrequency: "monthly" },
    { path: "/novedades", priority: 0.6, changeFrequency: "weekly" },
    { path: "/soporte", priority: 0.5, changeFrequency: "monthly" },
    { path: "/terminos", priority: 0.3, changeFrequency: "yearly" },
    { path: "/privacidad", priority: 0.3, changeFrequency: "yearly" },
    { path: "/aviso", priority: 0.3, changeFrequency: "yearly" },
    { path: "/cookies", priority: 0.3, changeFrequency: "yearly" },
  ];

  return routes.map(({ path, priority, changeFrequency }) => ({
    url: `${SITE.url}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  }));
}
