"use client";

import Link from "next/link";
import React from "react";

type SectionProps = {
  title: string;
  children: React.ReactNode;
};

function Section({ title, children }: SectionProps) {
  return (
    <div className="mb-5">
      <h4 className="fw-semibold text-dark mb-3 border-start border-3 border-primary ps-3">
        {title}
      </h4>
      <div className="text-secondary">{children}</div>
    </div>
  );
}

export default function CookiesPage() {
  return (
    <div className="bg-light py-5">
      <div className="container">
        <div
          className="bg-white shadow p-4 p-md-5 rounded-4 border"
          style={{ maxWidth: "900px", margin: "0 auto" }}
        >

          {/* ===== Botón Regresar ===== */}
          <div className="mb-4">
            <Link href="/dashboard/overview" className="btn btn-outline-primary">
              ← Regresar al Dashboard
            </Link>
          </div>

          {/* ===== ENCABEZADO ===== */}
          <div className="text-center mb-5">
            <h2 className="fw-bold text-primary mb-3">Política de Cookies</h2>
            <p className="text-secondary lead">
              Esta Política de Cookies explica cómo <strong>CuentIA</strong> utiliza cookies y
              tecnologías similares para mejorar tu experiencia dentro de la plataforma.
            </p>

            <hr className="opacity-25 mt-4" />
          </div>

          {/* ===== SECCIONES ===== */}

          <Section title="1. ¿Qué son las cookies?">
            <p>
              Las cookies son pequeños archivos almacenados en tu dispositivo que permiten
              reconocer tu navegador, recordar preferencias y mejorar tu experiencia de uso.
            </p>
          </Section>

          <Section title="2. Tipos de cookies que utilizamos">
            <ul className="list-group list-group-flush bg-white">
              <li className="list-group-item">
                <strong>Cookies esenciales:</strong> permiten iniciar sesión y mantener tu sesión activa.
              </li>
              <li className="list-group-item">
                <strong>Cookies de preferencia:</strong> guardan configuraciones como idioma y modo oscuro.
              </li>
              <li className="list-group-item">
                <strong>Cookies analíticas:</strong> nos ayudan a comprender cómo interactúas con la plataforma.
              </li>
            </ul>
          </Section>

          <Section title="3. Cómo administrar las cookies">
            <p>
              Puedes bloquear, limitar o eliminar cookies desde la configuración de tu navegador.
              Sin embargo, deshabilitar cookies esenciales podría afectar el funcionamiento adecuado
              de algunos módulos y funcionalidades de CuentIA.
            </p>
          </Section>

          <Section title="4. Consentimiento">
            <p>
              Al utilizar la plataforma, aceptas el uso de cookies según esta política.
              Mostraremos un banner de consentimiento en tu primer acceso para confirmar tu autorización.
            </p>
          </Section>

          <Section title="5. Contacto">
            <p>
              Si tienes dudas sobre esta política, contáctanos en:
              <strong className="text-primary ms-1">soporte@cuentia.mx</strong>
            </p>
          </Section>

          {/* FOOTER */}
          <div className="text-center mt-4">
            <small className="text-muted">
              © {new Date().getFullYear()} CuentIA — Todos los derechos reservados.
            </small>
          </div>

        </div>
      </div>
    </div>
  );
}
