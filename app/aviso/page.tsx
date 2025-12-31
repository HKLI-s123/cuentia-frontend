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

export default function AvisoLegalPage() {
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
            <h2 className="fw-bold text-primary mb-3">Aviso Legal</h2>
            <p className="text-secondary lead">
              Este Aviso Legal regula el acceso y uso de la plataforma <strong>CuentIA</strong>,
              operada por su titular y responsable jurídico en México.
            </p>

            <hr className="opacity-25 mt-4" />
          </div>

          {/* ===== SECCIONES ===== */}

          <Section title="1. Titularidad del sitio">
            <p>
              El presente sitio web y plataforma tecnológica <strong>CuentIA</strong> es operado por:
            </p>

            <ul className="list-group list-group-flush bg-white mb-3">
              <li className="list-group-item">
                <strong>Nombre:</strong> Sergio Ivanovich Rosales Márquez
              </li>
              <li className="list-group-item">
                <strong>Régimen fiscal:</strong> Persona Física con Actividad Empresarial
              </li>
              <li className="list-group-item">
                <strong>Marca registrada:</strong> CuentIA (IMPI, México)
              </li>
              <li class-name="list-group-item">
                <strong>Correo de contacto:</strong> soporte@cuentia.mx
              </li>
            </ul>

            <p>
              En adelante, el responsable será referido como <strong>"el Titular"</strong>.
            </p>
          </Section>

          <Section title="2. Objeto del Aviso Legal">
            <p>
              El presente documento regula el acceso, navegación y uso del sitio web y de la
              plataforma CuentIA, así como las responsabilidades derivadas de su utilización.
            </p>
          </Section>

          <Section title="3. Propiedad intelectual">
            <p>
              Todo el contenido disponible en CuentIA, incluyendo nombre comercial, marca,
              diseño, código fuente, algoritmos, textos, interfaces, logotipos y documentación,
              es propiedad exclusiva del Titular y está protegido por la legislación mexicana
              e internacional.
            </p>

            <p className="mb-0">
              Queda prohibida su reproducción, distribución, modificación o explotación sin
              autorización expresa y por escrito del Titular.
            </p>
          </Section>

          <Section title="4. Uso permitido de la plataforma">
            <p>
              El usuario se compromete a utilizar CuentIA de forma legal y conforme a las
              disposiciones de este Aviso Legal, evitando actividades como:
            </p>

            <ul className="list-group list-group-flush bg-white">
              <li className="list-group-item">Intentar acceder sin permiso a módulos privados o restringidos.</li>
              <li className="list-group-item">Copiar, descompilar o manipular el código del sistema.</li>
              <li className="list-group-item">Utilizar la plataforma para fines ilícitos o fraudulentos.</li>
              <li className="list-group-item">Alterar o destruir información almacenada en el sistema.</li>
            </ul>
          </Section>

          <Section title="5. Responsabilidad del titular">
            <p>
              El Titular realiza esfuerzos razonables para asegurar el correcto funcionamiento
              de la plataforma. Sin embargo, no garantiza:
            </p>

            <ul className="list-group list-group-flush bg-white mb-3">
              <li className="list-group-item">La disponibilidad continua del servicio en todo momento.</li>
              <li className="list-group-item">La ausencia de errores técnicos por causas externas.</li>
              <li className="list-group-item">La precisión absoluta de información obtenida de terceros (ej. SAT, proveedores externos).</li>
            </ul>

            <p>
              El Titular no será responsable por daños derivados del uso inadecuado de la plataforma
              o del incumplimiento de las obligaciones del usuario.
            </p>
          </Section>

          <Section title="6. Enlaces externos">
            <p>
              CuentIA puede incluir enlaces hacia sitios de terceros. El Titular no se hace
              responsable del contenido, políticas, seguridad o funcionamiento de dichos sitios.
            </p>
          </Section>

          <Section title="7. Jurisdicción aplicable">
            <p>
              Este Aviso Legal se rige por las leyes de los Estados Unidos Mexicanos.
            </p>
            <p className="mb-0">
              Para cualquier disputa, el usuario y el Titular aceptan someterse a los tribunales
              competentes del estado de Chihuahua, México.
            </p>
          </Section>

          <Section title="8. Contacto">
            <p>
              Para cualquier consulta relacionada con este Aviso Legal, puedes comunicarte al correo:
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
