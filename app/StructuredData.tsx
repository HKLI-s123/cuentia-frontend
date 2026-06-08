import { SITE, LANDING_FAQS } from "./site.config";

/**
 * Datos estructurados JSON-LD (schema.org) para la landing.
 * Incluye Organization, WebSite, SoftwareApplication y FAQPage.
 * Google lee JSON-LD en cualquier parte del documento, así que es
 * seguro renderizarlo dentro del body.
 */
export default function StructuredData() {
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE.url}/#organization`,
        name: SITE.name,
        legalName: SITE.legalName,
        url: SITE.url,
        email: SITE.email,
        logo: `${SITE.url}/logo_cuentia.png`,
        image: `${SITE.url}/logo_cuentia.png`,
        description: SITE.description,
        sameAs: SITE.socials,
        areaServed: { "@type": "Country", name: "México" },
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "customer support",
          email: SITE.email,
          availableLanguage: ["es"],
        },
      },
      {
        "@type": "WebSite",
        "@id": `${SITE.url}/#website`,
        url: SITE.url,
        name: SITE.name,
        description: SITE.description,
        inLanguage: "es-MX",
        publisher: { "@id": `${SITE.url}/#organization` },
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${SITE.url}/#app`,
        name: SITE.name,
        applicationCategory: "FinanceApplication",
        operatingSystem: "Web",
        url: SITE.url,
        description: SITE.description,
        inLanguage: "es-MX",
        publisher: { "@id": `${SITE.url}/#organization` },
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "MXN",
          description: "Descarga de CFDI (XML) del SAT sin costo",
        },
        featureList: [
          "Descarga masiva de CFDI del SAT",
          "IVA desglosado por tasa (16%, 8%, 0%, Exento)",
          "DIOT lista para entregar",
          "Papel de trabajo y conciliación",
          "Reportes de auditoría",
          "Flujo de efectivo",
          "Estado de cada CFDI (Vigente / Cancelado)",
        ],
      },
      {
        "@type": "FAQPage",
        "@id": `${SITE.url}/#faq`,
        mainEntity: LANDING_FAQS.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      // El contenido es estático y propio; escapamos "<" por seguridad.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(graph).replace(/</g, "\\u003c"),
      }}
    />
  );
}
