/**
 * Configuración central del sitio para SEO.
 * Fuente única de verdad usada por metadata, sitemap, robots,
 * la imagen Open Graph y los datos estructurados (JSON-LD).
 */

export const SITE = {
  url: "https://cuentia.mx",
  name: "CuentIA",
  legalName: "CuentIA",
  email: "contacto@cuentia.mx",
  whatsapp: "+526568330819",
  locale: "es_MX",
  // Propuesta de valor larga — para JSON-LD / Open Graph.
  description:
    "Descarga gratis tus CFDI (XML) del SAT y conviértelos en Excel ultraespecíficos: IVA desglosado por tasa, DIOT lista, papel de trabajo, conciliación y auditoría. Más completos y más baratos que cualquier alternativa.",
  // Versión corta (~155 caracteres) — para la meta description.
  descriptionShort:
    "Descarga gratis tus CFDI (XML) del SAT y conviértelos en Excel listos para declaraciones, DIOT, papel de trabajo y auditoría. Más específicos y más baratos.",
  // Título base para <title> y Open Graph.
  title: "CuentIA — Descarga XML del SAT y conviértelos a Excel",
  socials: [
    "https://linkedin.com/company/cuentia",
    "https://facebook.com/cuentia",
    "https://instagram.com/cuentia",
  ],
  keywords: [
    "descargar XML del SAT",
    "descargar CFDI del SAT",
    "CFDI a Excel",
    "XML del SAT a Excel",
    "descarga masiva de CFDI",
    "reportes fiscales en Excel",
    "DIOT lista",
    "papel de trabajo IVA",
    "conciliación fiscal",
    "declaraciones SAT",
    "auditoría fiscal",
    "contabilidad electrónica",
    "reporte de CFDI para contador",
    "IVA por tasa",
    "flujo de efectivo CFDI",
  ],
} as const;

export type LandingFAQ = { q: string; a: string };

/**
 * FAQs de la landing. Se renderizan en la página Y se exponen como
 * datos estructurados FAQPage para resultados enriquecidos en Google.
 */
export const LANDING_FAQS: LandingFAQ[] = [
  {
    q: "¿La descarga de XMLs realmente es gratis?",
    a: "Sí, totalmente. Crear una cuenta y descargar tus CFDI del SAT no tiene ningún costo. Lo que lleva precio son los reportes en Excel: esa es la herramienta que CuentIA procesa, estructura y personaliza para que sea útil de inmediato.",
  },
  {
    q: "¿Qué hace diferentes a los reportes Excel de CuentIA?",
    a: "El nivel de especificidad. Mientras otras plataformas te dan un listado básico con RFC y montos, CuentIA incluye la tasa exacta de IVA por fila, el DIOT listo para entregar, el estado de cada CFDI en el SAT, y la razón social completa. Es el reporte que un contador puede usar sin necesidad de editarlo.",
  },
  {
    q: "¿Los reportes se generan automáticamente o tengo que configurarlos?",
    a: "Automáticamente. CuentIA descarga tus CFDI del SAT, los procesa y estructura los reportes. Tú solo das clic en exportar. No hay fórmulas que ajustar ni columnas que agregar.",
  },
  {
    q: "¿Puedo pasar estos reportes directamente a mi contador?",
    a: "Ese es exactamente el caso de uso principal. Los reportes están diseñados con las columnas que un contador reconoce: UUID, RFC, tasas, bases, DIOT. Sin traducción de por medio.",
  },
  {
    q: "¿Qué diferencia hay con descargar mis CFDI del SAT directamente?",
    a: "El portal del SAT te da XML. CuentIA los procesa, clasifica por tipo, calcula IVA por tasa, detecta cancelados y los convierte en tablas listas para usar. Son horas de trabajo manual condensadas en segundos.",
  },
  {
    q: "¿CuentIA reemplaza a mi contador?",
    a: "No. CuentIA hace el trabajo de datos: descarga, clasifica y estructura. Tu contador hace el trabajo interpretativo y fiscal. Los dos ganan tiempo.",
  },
];
