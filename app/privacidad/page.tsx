"use client";

import Link  from "next/link";
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

export default function PoliticaPrivacidadPage() {
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
            <h2 className="fw-bold text-primary mb-3">Política de Privacidad</h2>
            <p className="text-secondary lead">
              En <strong>CuentIA</strong>, valoramos tu confianza. Esta política describe
              cómo protegemos y gestionamos tu información personal cuando utilizas
              nuestros servicios.
            </p>

            <hr className="opacity-25 mt-4" />
          </div>

          {/* ===== SECCIÓN 1 ===== */}
          <Section title="1. Información que recopilamos">
            <p>Podemos recopilar los siguientes datos cuando utilizas CuentIA:</p>
            <ul className="list-group list-group-flush bg-white">
              <li className="list-group-item">Datos de identificación: nombre, correo, contraseña cifrada.</li>
              <li className="list-group-item">Información fiscal: RFC, CFDI cargados, configuraciones contables.</li>
              <li className="list-group-item">Datos de uso de la plataforma.</li>
              <li className="list-group-item">Comunicaciones: solicitudes de soporte y mensajes enviados.</li>
            </ul>
          </Section>

          {/* ===== SECCIÓN 2 ===== */}
          <Section title="2. Cómo utilizamos tu información">
            <p>La información recopilada se usa para:</p>
            <ul className="list-group list-group-flush bg-white">
              <li className="list-group-item">Proveer y optimizar nuestros servicios.</li>
              <li className="list-group-item">Validar identidad y proteger tu cuenta.</li>
              <li className="list-group-item">Mejorar tu experiencia de usuario.</li>
              <li className="list-group-item">Enviar notificaciones importantes.</li>
              <li className="list-group-item">Brindar soporte técnico eficiente.</li>
            </ul>
          </Section>

          {/* ===== SECCIÓN 3 ===== */}
          <Section title="3. Conservación de los datos">
            <p>
              Conservamos tu información únicamente el tiempo necesario para los fines
              establecidos o para cumplir con obligaciones legales aplicables.
            </p>
          </Section>

          {/* ===== SECCIÓN 4 ===== */}
          <Section title="4. Seguridad de la información">
            <p>
              Aplicamos medidas técnicas, administrativas y organizativas para garantizar
              la protección de tus datos: cifrado, controles de acceso, monitoreo y
              auditorías periódicas.
            </p>
          </Section>

          {/* ===== SECCIÓN 5 ===== */}
          <Section title="5. Compartición de datos">
            <p>
              Tu información <strong>no será vendida ni cedida comercialmente</strong>.
              Solo podremos compartirla con:
            </p>
            <ul className="list-group list-group-flush bg-white">
              <li className="list-group-item">Proveedores esenciales para operar la plataforma.</li>
              <li className="list-group-item">Autoridades cuando la ley lo requiera.</li>
            </ul>
          </Section>

          {/* ===== SECCIÓN 6 ===== */}
          <Section title="6. Tus derechos">
            <p>Puedes ejercer en cualquier momento tus derechos de:</p>
            <ul className="list-group list-group-flush bg-white">
              <li className="list-group-item">Acceso a tus datos.</li>
              <li className="list-group-item">Rectificación o actualización.</li>
              <li className="list-group-item">Eliminación definitiva de tu cuenta.</li>
              <li className="list-group-item">Limitación del tratamiento de tu información.</li>
            </ul>
          </Section>

          {/* ===== SECCIÓN 7 ===== */}
          <Section title="7. Cambios a esta política">
            <p>
              Esta política puede actualizarse en cualquier momento. Publicaremos las
              modificaciones directamente en esta página.
            </p>
          </Section>

          {/* ===== SECCIÓN 8 ===== */}
          <Section title="8. Contacto">
            <p>
              Si tienes dudas sobre esta Política de Privacidad, contáctanos en:  
              <strong className="text-primary ms-1">soporte@cuentia.mx</strong>
            </p>
          </Section>

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
