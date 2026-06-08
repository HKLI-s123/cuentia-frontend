import type { MetadataRoute } from "next";
import { SITE } from "./site.config";

/**
 * robots.txt — permite indexar el sitio público y bloquea las áreas
 * privadas / de aplicación que no aportan valor SEO.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/dashboard",
          "/chat",
          "/configuracion",
          "/onboarding",
          "/billing",
          "/admin",
          "/api",
          "/login",
          "/recuperar",
          "/restablecer",
          "/validar-cuenta",
          "/verificado",
          "/google",
          "/bots",
          "/services",
        ],
      },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}
