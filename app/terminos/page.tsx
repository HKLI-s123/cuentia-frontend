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

export default function TerminosPage() {
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
            <h2 className="fw-bold text-primary mb-3">Términos y Condiciones de Uso</h2>
            <p className="text-secondary lead">
              Al registrarte y utilizar <strong>CuentIA</strong>, aceptas los siguientes
              términos que regulan el uso de nuestra plataforma.
            </p>

            <hr className="opacity-25 mt-4" />
          </div>

          {/* ===== SECCIONES ===== */}

          <Section title="1. Aceptación del servicio">
            <p>
              Al crear una cuenta, declaras ser mayor de edad y estar legalmente autorizado
              para utilizar nuestra plataforma, así como para manejar la información fiscal
              y contable que ingresas.
            </p>
          </Section>

          <Section title="2. Uso permitido">
            <p>Te comprometes a utilizar la plataforma únicamente para fines legales, tales como:</p>
            <ul className="list-group list-group-flush bg-white">
              <li className="list-group-item">Consulta y análisis de CFDI.</li>
              <li className="list-group-item">Automatización contable y generación de reportes.</li>
              <li className="list-group-item">Uso de herramientas dentro del alcance de tu suscripción.</li>
            </ul>
          </Section>

          <Section title="3. Responsabilidad del usuario">
            <p>
              Eres responsable de la veracidad de la información proporcionada y del
              resguardo de tus credenciales. Toda actividad realizada bajo tu cuenta
              se considerará como efectuada por ti.
            </p>
          </Section>

          <Section title="4. Disponibilidad del servicio">
            <p>
              Trabajamos para mantener la plataforma disponible en todo momento, pero pueden
              ocurrir interrupciones por mantenimiento, actualizaciones o factores externos.
            </p>
          </Section>

          <Section title="5. Suscripciones y pagos">
            <p>
              Algunos módulos requieren una suscripción activa. Los pagos no son
              reembolsables una vez procesados, salvo obligación legal aplicable.
            </p>
          </Section>

          <Section title="6. Limitación de responsabilidad">
            <p>
              CuentIA no se responsabiliza por daños derivados del mal uso de la plataforma,
              errores presentes en CFDI generados por terceros o información incompleta del
              contribuyente.
            </p>
          </Section>

          <Section title="7. Cancelación de cuenta">
            <p>
              Puedes solicitar la cancelación de tu cuenta en cualquier momento. También
              podremos suspender cuentas que incumplan estos términos.
            </p>
          </Section>

          <Section title="8. Modificaciones">
            <p>
              Podemos actualizar estos términos en cualquier momento. Las modificaciones
              serán publicadas en esta misma página.
            </p>
          </Section>

          <Section title="9. Contacto">
            <p>
              Para dudas o comentarios, escríbenos a:
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
