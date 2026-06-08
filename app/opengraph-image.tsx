import { ImageResponse } from "next/og";
import { SITE } from "./site.config";

// Imagen Open Graph / Twitter generada dinámicamente (1200×630).
// Aplica como imagen por defecto para compartir en redes sociales.
export const alt =
  "CuentIA — Descarga tus XML del SAT y conviértelos en Excel listos para declarar";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#312e81",
          backgroundImage:
            "linear-gradient(135deg, #1e1b4b 0%, #4338ca 55%, #4f46e5 100%)",
          padding: "80px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Wordmark */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            color: "#c7d2fe",
            fontSize: 36,
            letterSpacing: -1,
          }}
        >
          <div
            style={{
              display: "flex",
              width: 48,
              height: 48,
              borderRadius: 14,
              backgroundColor: "#6366f1",
              marginRight: 20,
            }}
          />
          {SITE.name}
        </div>

        {/* Titular + subtítulo */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              color: "#ffffff",
              fontSize: 76,
              lineHeight: 1.05,
              letterSpacing: -2,
              maxWidth: 1000,
            }}
          >
            De XMLs del SAT a Excel listos para declarar.
          </div>
          <div
            style={{
              display: "flex",
              color: "#a5b4fc",
              fontSize: 34,
              marginTop: 28,
              maxWidth: 980,
            }}
          >
            CFDI con IVA por tasa, DIOT lista, papel de trabajo y auditoría —
            más específicos y más baratos.
          </div>
        </div>

        {/* Pie */}
        <div style={{ display: "flex", color: "#e0e7ff", fontSize: 28 }}>
          cuentia.mx · Descarga de CFDI gratis
        </div>
      </div>
    ),
    { ...size },
  );
}
