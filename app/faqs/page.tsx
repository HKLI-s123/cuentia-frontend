"use client";

import Link from "next/link";
import { useState } from "react";
import {
  HelpCircle,
  ShieldCheck,
  FileSearch,
  Bot,
  Building2,
  CreditCard,
  Mail,
  UserX,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function FaqPage() {
  const [search, setSearch] = useState("");
  const [openIndex, setOpenIndex] = useState<string | null>(null);

  const toggle = (i: string) => {
    setOpenIndex(openIndex === i ? null : i);
  };

  // ========================================
  // LISTA DE FAQS
  // ========================================
  const faqs = [
    {
      category: "General",
      icon: <HelpCircle size={20} className="text-primary me-2" />,
      q: "¿Qué es CuentIA?",
      a: "CuentIA es una plataforma mexicana de automatización contable que utiliza inteligencia artificial para analizar CFDI, generar reportes y automatizar procesos fiscales.",
    },
    {
      category: "General",
      icon: <HelpCircle size={20} className="text-primary me-2" />,
      q: "¿Necesito conocimientos contables?",
      a: "No. La plataforma está diseñada para ser usada por cualquier contribuyente, y los módulos avanzados son útiles para contadores pero no obligatorios.",
    },
    {
      category: "Seguridad",
      icon: <ShieldCheck size={20} className="text-primary me-2" />,
      q: "¿Mi información está segura?",
      a: "Sí. Usamos cifrado, aislamiento de datos, controles de acceso y buenas prácticas similares a software empresarial.",
    },
    {
      category: "Seguridad",
      icon: <ShieldCheck size={20} className="text-primary me-2" />,
      q: "¿Guardan mis contraseñas del SAT?",
      a: "No. La plataforma nunca almacena contraseñas del SAT. Los accesos se manejan mediante procedimientos seguros y cifrados.",
    },
    {
      category: "SAT / CFDI",
      icon: <FileSearch size={20} className="text-primary me-2" />,
      q: "¿Descarga automáticamente mis CFDI?",
      a: "Sí, según el módulo contratado. La plataforma puede descargar, procesar y clasificar CFDI automáticamente.",
    },
    {
      category: "SAT / CFDI",
      icon: <FileSearch size={20} className="text-primary me-2" />,
      q: "¿Qué tan exacto es el análisis de IVA y retenciones?",
      a: "El sistema toma los datos directamente del XML, interpreta tasas, complementos y escenarios fiscales para entregar resultados consistentes.",
    },
    {
      category: "Bot de WhatsApp",
      icon: <Bot size={20} className="text-primary me-2" />,
      q: "¿Cómo funciona el bot de WhatsApp?",
      a: "Puedes consultar gastos, ingresos, validar CFDI, leer imágenes de comprobantes, ver IVA acreditable y más. Usa IA para interpretar mensajes.",
    },
    {
      category: "Bot de WhatsApp",
      icon: <Bot size={20} className="text-primary me-2" />,
      q: "¿Puede leer imágenes de tickets y pagos?",
      a: "Sí. Usa tecnología OCR con IA para extraer datos de comprobantes como capturas de pago y transferencias.",
    },
    {
      category: "Multiempresa",
      icon: <Building2 size={20} className="text-primary me-2" />,
      q: "¿Puedo manejar varios RFC?",
      a: "Sí. La plataforma permite manejar múltiples RFC ya sean personales, empresariales o de clientes contables.",
    },
    {
      category: "Multiempresa",
      icon: <Building2 size={20} className="text-primary me-2" />,
      q: "¿Puedo invitar empleados o contadores?",
      a: "Sí. Hay roles de usuario como consulta, editor o administrador, con permisos específicos.",
    },
    {
      category: "Pagos",
      icon: <CreditCard size={20} className="text-primary me-2" />,
      q: "¿Los pagos son reembolsables?",
      a: "Los pagos no son reembolsables una vez procesados, salvo lo indicado por la ley.",
    },
    {
      category: "Pagos",
      icon: <CreditCard size={20} className="text-primary me-2" />,
      q: "¿Qué incluye cada plan?",
      a: "Dependiendo del plan puedes tener: dashboards IA, descarga SAT, reportes, multiusuario, bot, análisis avanzado y más.",
    },
    {
      category: "Soporte",
      icon: <Mail size={20} className="text-primary me-2" />,
      q: "¿Cómo recibo soporte?",
      a: "Puedes escribir a soporte@cuentia.mx o usar el bot de WhatsApp para asistencia automatizada.",
    },
    {
      category: "Cuenta",
      icon: <UserX size={20} className="text-primary me-2" />,
      q: "¿Cómo elimino mi cuenta?",
      a: "En tu perfil encontrarás la opción para eliminar tu cuenta de manera permanente. Esta acción no puede deshacerse.",
    },
  ];

  const filtered = faqs.filter(
    (f) =>
      f.q.toLowerCase().includes(search.toLowerCase()) ||
      f.a.toLowerCase().includes(search.toLowerCase()) ||
      f.category.toLowerCase().includes(search.toLowerCase())
  );

  const categories = [...new Set(filtered.map((f) => f.category))];

  return (
    <div className="bg-light py-5">
      <div className="container">
        <div
          className="bg-white shadow p-4 p-md-5 rounded-4 border"
          style={{ maxWidth: "900px", margin: "0 auto" }}
        >
          {/* Botón regresar */}
          <div className="mb-4">
            <Link href="/dashboard/overview" className="btn btn-outline-primary">
              ← Regresar al Dashboard
            </Link>
          </div>

          {/* Encabezado */}
          <div className="text-center mb-4">
            <h2 className="fw-bold text-primary">Preguntas Frecuentes</h2>
            <p className="lead text-secondary">
              Encuentra respuestas sobre funciones, seguridad, bots, CFDI y más.
            </p>
          </div>

          {/* Buscador */}
          <input
            type="text"
            placeholder="Buscar pregunta..."
            className="form-control form-control-lg mb-4"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {/* Categorías */}
          {categories.map((cat, i) => (
            <div key={i} className="mb-5">
              <h4 className="fw-bold border-bottom pb-2">{cat}</h4>

              {filtered
                .filter((f) => f.category === cat)
                .map((faq, index) => {
                  const idx = `${i}-${index}`;
                  const isOpen = openIndex === idx;

                  return (
                    <div key={idx} className="border rounded mb-3 overflow-hidden">
                      {/* Pregunta */}
                      <button
                        className="w-100 bg-white border-0 p-3 d-flex align-items-center justify-content-between"
                        onClick={() => toggle(idx)}
                        style={{ cursor: "pointer" }}
                      >
                        <div className="d-flex align-items-center fw-semibold">
                          {faq.icon}
                          {faq.q}
                        </div>

                        <motion.span
                          animate={{ rotate: isOpen ? 180 : 0 }}
                          transition={{ duration: 0.25 }}
                          style={{ display: "flex" }}
                        >
                          ▼
                        </motion.span>
                      </button>

                      {/* Respuesta con animación */}
                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div
                            key="content"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.25 }}
                            className="px-3 pb-3 text-secondary"
                          >
                            <div className="pt-2">{faq.a}</div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
            </div>
          ))}

          {/* Footer */}
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
