"use client";

import Link from "next/link";
import React from "react";

type BlockProps = {
  title: string;
  children: React.ReactNode;
};

function Block({ title, children }: BlockProps) {
  return (
    <div className="mb-5">
      <h4 className="fw-semibold text-dark mb-3 border-start border-3 border-primary ps-3">
        {title}
      </h4>
      <div className="text-secondary">{children}</div>
    </div>
  );
}

export default function NosotrosPage() {
  return (
    <div className="bg-light py-5">
      <div className="container">
        <div
          className="bg-white shadow p-4 p-md-5 rounded-4 border"
          style={{ maxWidth: "900px", margin: "0 auto" }}
        >
          {/* ===== Botón Regresar ===== */}
          <div className="mb-4">
            <Link href="/dashboard/dashboard" className="btn btn-outline-primary">
              ← Regresar al Dashboard
            </Link>
          </div>

          {/* ===== ENCABEZADO ===== */}
          <div className="text-center mb-5">
            <h2 className="fw-bold text-primary mb-3">Sobre Nosotros</h2>
            <p className="text-secondary lead">
              Conoce la historia, misión, visión y valores detrás de <strong>CuentIA</strong>,
              una plataforma mexicana diseñada para transformar la gestión contable a través
              de la automatización y la inteligencia artificial.
            </p>

            <hr className="opacity-25 mt-4" />
          </div>

          {/* ===== QUIÉNES SOMOS ===== */}
          <Block title="¿Quiénes somos?">
            <p>
              <strong>CuentIA</strong> es una plataforma de automatización contable creada en México,
              diseñada para simplificar la gestión fiscal de individuos, empresas y profesionales.
              Nuestro enfoque combina tecnología, inteligencia artificial y una profunda comprensión
              del sistema fiscal mexicano para ofrecer herramientas modernas, rápidas y seguras.
            </p>
            <p className="mb-0">
              CuentIA surge como una solución a procesos contables repetitivos, lentos y vulnerables
              a errores, con el objetivo de mejorar la eficiencia y claridad de la información financiera.
            </p>
          </Block>

          {/* ===== MISIÓN ===== */}
          <Block title="Nuestra misión">
            <p>
              Facilitar la vida de contribuyentes, empresas y contadores mediante herramientas
              inteligentes que automaticen procesos fiscales, reduzcan errores y ahorren tiempo.
            </p>
          </Block>

          {/* ===== VISIÓN ===== */}
          <Block title="Nuestra visión">
            <p>
              Convertirnos en la plataforma líder de automatización contable en México, impulsada por IA,
              accesible para todos y capaz de transformar la manera en que los contribuyentes gestionan sus
              obligaciones fiscales.
            </p>
          </Block>

          {/* ===== VALORES ===== */}
          <Block title="Nuestros valores">
            <ul className="list-group list-group-flush bg-white">
              <li className="list-group-item"><strong>Innovación:</strong> evolución constante de nuestras herramientas tecnológicas.</li>
              <li className="list-group-item"><strong>Transparencia:</strong> claridad en procesos, datos y comunicaciones.</li>
              <li className="list-group-item"><strong>Seguridad:</strong> protección estricta de la información fiscal de nuestros usuarios.</li>
              <li className="list-group-item"><strong>Simplicidad:</strong> interfaces intuitivas y fáciles de usar para todos.</li>
              <li className="list-group-item"><strong>Accesibilidad:</strong> herramientas profesionales al alcance de individuos y empresas.</li>
            </ul>
          </Block>

          {/* ===== HISTORIA ===== */}
          <Block title="Nuestra historia">
            <p>
              CuentIA fue fundada por <strong>Sergio Ivanovich Rosales Márquez</strong>, un desarrollador y
              emprendedor mexicano que identificó la necesidad de automatizar procesos contables que
              históricamente se realizaban de forma manual.
            </p>
            <p className="mb-0">
              Con experiencia en sistemas fiscales, automatización y tecnología aplicada a negocios,
              CuentIA nació como una marca registrada ante el IMPI y se convirtió en un proyecto
              sólido para apoyar a miles de contribuyentes en México.
            </p>
          </Block>

          {/* ===== QUIÉN ESTÁ DETRÁS ===== */}
          <Block title="Quién está detrás de CuentIA">
            <p>
              La plataforma es desarrollada y operada por <strong>Sergio Ivanovich Rosales Márquez</strong>,
              Persona Física con Actividad Empresarial y titular de la marca registrada <strong>CuentIA</strong>.
            </p>
            <p>
              Su enfoque combina experiencia en desarrollo web, automatización, análisis fiscal y diseño de
              sistemas inteligentes que simplifican la vida de los usuarios.
            </p>
          </Block>

          {/* ===== TECNOLOGÍA ===== */}
          <Block title="Tecnología que impulsa CuentIA">
            <p>
              Nuestra plataforma integra tecnologías modernas como:
            </p>
            <ul className="list-group list-group-flush bg-white">
              <li className="list-group-item">Inteligencia artificial aplicada a la clasificación y análisis fiscal.</li>
              <li className="list-group-item">Automatización de descarga, lectura y análisis de CFDI.</li>
              <li className="list-group-item">Bots de WhatsApp para comprobación, consultas y asistencia inteligente.</li>
              <li className="list-group-item">Paneles administrativos modernos con estadísticas en tiempo real.</li>
              <li className="list-group-item">Arquitectura segura y encriptación para proteger datos sensibles.</li>
            </ul>
          </Block>

          {/* ===== SEGURIDAD ===== */}
          <Block title="Nuestro compromiso con la seguridad">
            <p>
              La protección de la información es fundamental. Implementamos medidas como:
            </p>
            <ul className="list-group list-group-flush bg-white">
              <li className="list-group-item">Cifrado de información sensible.</li>
              <li className="list-group-item">Control de acceso y gestión de sesiones seguras.</li>
              <li className="list-group-item">Auditorías y monitoreo continuo.</li>
              <li className="list-group-item">Buenas prácticas basadas en normativas mexicanas.</li>
            </ul>
          </Block>

          {/* ===== CONTACTO ===== */}
          <Block title="Contacto">
            <p>
              Si deseas conocer más sobre CuentIA o colaborar con nosotros, puedes escribirnos a:
              <strong className="text-primary ms-1">soporte@cuentia.mx</strong>
            </p>
          </Block>

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
