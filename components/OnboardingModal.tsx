"use client";

import { useState } from "react";
import {
  X,
  Download,
  BarChart2,
  FileSpreadsheet,
  Users,
  Settings,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  UploadCloud,
} from "lucide-react";

type TipoCuenta = "individual" | "empresarial";

interface Step {
  icon: React.ReactNode;
  title: string;
  description: string;
  // Pasos con detalle visual: se muestran como una guía numerada.
  bullets?: string[];
  action?: { label: string; href: string };
}

const STEPS_INDIVIDUAL: Step[] = [
  {
    icon: <CheckCircle2 className="h-9 w-9 text-white" />,
    title: "¡Bienvenido a CuentIA!",
    description:
      "Tu plataforma fiscal inteligente está lista. En unos pasos te mostramos cómo sacarle el máximo provecho.",
  },
  {
    icon: <Download className="h-9 w-9 text-white" />,
    title: "CuentIA descarga tus facturas automáticamente",
    description:
      "CuentIA se conecta al SAT y obtiene todos tus CFDIs de forma automática, manteniéndolos siempre actualizados.",
  },
  {
    icon: <BarChart2 className="h-9 w-9 text-white" />,
    title: "Tu resumen fiscal",
    description:
      "En el dashboard verás de un vistazo: ingresos y egresos del periodo, utilidad estimada, ISR e IVA estimados, y tus principales fuentes de ingreso y gasto.",
    action: { label: "Ver dashboard", href: "/dashboard" },
  },
  {
    icon: <FileSpreadsheet className="h-9 w-9 text-white" />,
    title: "Facturas y reportes en Excel",
    description:
      "En Facturas consulta el detalle completo de tus CFDIs: facturas de ingreso y egreso, complementos de pago y notas de crédito. Exporta cualquier vista en Excel con un clic.",
    action: { label: "Ver facturas", href: "/dashboard/facturas" },
  },
];

const STEPS_EMPRESARIAL: Step[] = [
  {
    icon: <CheckCircle2 className="h-9 w-9 text-white" />,
    title: "¡Bienvenido a CuentIA!",
    description:
      "Tu plataforma fiscal inteligente está lista. En unos pasos te mostramos cómo administrar tus clientes y sus facturas.",
  },
  {
    icon: <Users className="h-9 w-9 text-white" />,
    title: "Registra tus clientes (RFCs)",
    description:
      "En la sección Clientes agrega el RFC de cada cliente. CuentIA se conecta al SAT y descarga sus facturas de forma automática, manteniéndolas siempre al día.",
    action: { label: "Ir a Clientes", href: "/dashboard/clientes" },
  },
  {
    icon: <UploadCloud className="h-9 w-9 text-white" />,
    title: "Agregar un cliente, paso a paso",
    description:
      "Registrar un cliente toma menos de un minuto. Solo necesitas su e.firma (FIEL):",
    bullets: [
      'Pulsa "Registrar Cliente" y escribe el nombre.',
      "Sube el archivo .cer: el RFC se detecta y se llena solo (puedes corregirlo).",
      "Sube el archivo .key de la misma e.firma.",
      "Escribe la contraseña de la FIEL; usa el ícono del ojo para verla y evitar errores.",
      'Guarda: si algo no coincide, CuentIA te dirá exactamente qué corregir.',
    ],
    action: { label: "Ir a Clientes", href: "/dashboard/clientes" },
  },
  {
    icon: <BarChart2 className="h-9 w-9 text-white" />,
    title: "Tu resumen fiscal por cliente",
    description:
      "En el dashboard verás el resumen de cada cliente: ingresos y egresos del periodo, utilidad estimada, ISR e IVA estimados y sus principales movimientos.",
    action: { label: "Ver dashboard", href: "/dashboard" },
  },
  {
    icon: <FileSpreadsheet className="h-9 w-9 text-white" />,
    title: "Facturas y reportes en Excel",
    description:
      "En Facturas consulta el detalle de cada cliente: facturas de ingreso y egreso, complementos de pago y notas de crédito. Exporta todo en Excel con un clic.",
    action: { label: "Ver facturas", href: "/dashboard/facturas" },
  },
  {
    icon: <ShieldCheck className="h-9 w-9 text-white" />,
    title: "Constancia de Situación Fiscal y Opinión de Cumplimiento",
    description:
      "Desde Clientes puedes activar o desactivar, por cada RFC, la descarga automática de la Constancia de Situación Fiscal (CSF) y la Opinión de Cumplimiento. En la tabla verás el estado de cada Opinión y te la marcamos en rojo cuando resulta negativa, para que actúes a tiempo.",
    action: { label: "Ir a Clientes", href: "/dashboard/clientes" },
  },
  {
    icon: <Settings className="h-9 w-9 text-white" />,
    title: "Agrega colaboradores",
    description:
      "Invita a tu equipo desde Configuración → Colaboradores. Asigna roles y define a qué RFCs puede acceder cada uno.",
    action: { label: "Ir a Configuración", href: "/configuracion/equipo" },
  },
];

const STORAGE_KEY = "cuentia_onboarding_dismissed";

interface Props {
  tipoCuenta: TipoCuenta;
  onClose: () => void;
}

export default function OnboardingModal({ tipoCuenta, onClose }: Props) {
  const steps =
    tipoCuenta === "individual" ? STEPS_INDIVIDUAL : STEPS_EMPRESARIAL;

  const [current, setCurrent] = useState(0);
  const [neverShow, setNeverShow] = useState(false);

  const isLast = current === steps.length - 1;
  const isFirst = current === 0;
  const step = steps[current];

  const handleClose = () => {
    if (neverShow) {
      localStorage.setItem(STORAGE_KEY, "true");
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl shadow-black/60">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 text-slate-300 hover:text-white transition"
          aria-label="Cerrar"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Hero gráfico con degradado */}
        <div className="relative flex flex-col items-center gap-4 bg-gradient-to-br from-indigo-600 via-indigo-500 to-cyan-500 px-6 pt-9 pb-8">
          {/* Textura sutil de puntos */}
          <div
            className="pointer-events-none absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.6) 1px, transparent 0)",
              backgroundSize: "18px 18px",
            }}
          />
          <span className="relative text-[11px] font-semibold uppercase tracking-widest text-white/80">
            Paso {current + 1} de {steps.length}
          </span>
          <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-white/15 border border-white/30 shadow-lg backdrop-blur-sm">
            {step.icon}
          </div>
          <h2 className="relative text-center text-xl font-bold text-white">
            {step.title}
          </h2>
        </div>

        {/* Contenido */}
        <div className="px-6 sm:px-8 pt-6 pb-6">
          {/* Step indicators */}
          <div className="flex gap-1.5 mb-5">
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                aria-label={`Ir al paso ${i + 1}`}
                className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                  i <= current ? "bg-indigo-500" : "bg-slate-700 hover:bg-slate-600"
                }`}
              />
            ))}
          </div>

          <div className="min-h-[168px]">
            <p className="text-slate-300 text-sm leading-relaxed text-center">
              {step.description}
            </p>

            {/* Guía numerada para pasos detallados */}
            {step.bullets && (
              <ol className="mt-4 space-y-2.5">
                {step.bullets.map((b, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-indigo-500/15 border border-indigo-500/40 text-xs font-bold text-indigo-300">
                      {i + 1}
                    </span>
                    <span className="text-slate-300 text-sm leading-relaxed">
                      {b}
                    </span>
                  </li>
                ))}
              </ol>
            )}

            {step.action && (
              <div className="mt-5 flex justify-center">
                <a
                  href={step.action.href}
                  target={step.action.href.startsWith("http") ? "_blank" : undefined}
                  rel={step.action.href.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-300 hover:text-indigo-200 border border-indigo-500/40 rounded-full px-3 py-1.5 transition"
                >
                  {step.action.label}
                  <ChevronRight className="h-3 w-3" />
                </a>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="mt-6 flex items-center justify-between gap-3">
            <button
              onClick={() => setCurrent((p) => p - 1)}
              disabled={isFirst}
              className="flex items-center gap-1 text-sm text-slate-400 hover:text-white disabled:opacity-0 transition"
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </button>

            {isLast ? (
              <button
                onClick={handleClose}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-400 text-slate-950 font-semibold text-sm hover:opacity-90 transition"
              >
                ¡Listo, empecemos!
              </button>
            ) : (
              <button
                onClick={() => setCurrent((p) => p + 1)}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition"
              >
                Siguiente
              </button>
            )}
          </div>

          {/* Never show again */}
          <div className="mt-4 flex items-center justify-center gap-2">
            <input
              type="checkbox"
              id="neverShow"
              checked={neverShow}
              onChange={(e) => setNeverShow(e.target.checked)}
              className="h-3.5 w-3.5 accent-indigo-500 cursor-pointer"
            />
            <label
              htmlFor="neverShow"
              className="text-xs text-slate-500 cursor-pointer select-none"
            >
              No volver a mostrar
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
