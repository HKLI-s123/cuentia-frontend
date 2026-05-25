"use client";

import { useState } from "react";
import {
  X,
  Download,
  BarChart2,
  FileSpreadsheet,
  Users,
  Settings,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";

type TipoCuenta = "individual" | "empresarial";

interface Step {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: { label: string; href: string };
}

const STEPS_INDIVIDUAL: Step[] = [
  {
    icon: <CheckCircle2 className="h-8 w-8 text-indigo-400" />,
    title: "¡Bienvenido a CuentIA!",
    description:
      "Tu plataforma fiscal inteligente está lista. En unos pasos te mostramos cómo sacarle el máximo provecho.",
  },
  {
    icon: <Download className="h-8 w-8 text-indigo-400" />,
    title: "Descarga tus XMLs del SAT",
    description:
      "Entra al portal del SAT y descarga tus facturas en formato XML. CuentIA los procesará automáticamente para darte una visión clara de tus ingresos y egresos.",
    action: { label: "Ir al portal del SAT", href: "https://www.sat.gob.mx" },
  },
  {
    icon: <BarChart2 className="h-8 w-8 text-indigo-400" />,
    title: "Consulta tus facturas",
    description:
      "Explora tus ingresos y egresos en el dashboard. Filtra por fecha, proveedor o tipo de comprobante para tener siempre el control de tus finanzas.",
    action: { label: "Ver facturas", href: "/dashboard/facturas" },
  },
  {
    icon: <FileSpreadsheet className="h-8 w-8 text-indigo-400" />,
    title: "Exporta en Excel",
    description:
      "Genera reportes detallados de Ingresos, Egresos y Nómina en Excel o PDF con un solo clic. Ideales para tu contador o para tus propios registros.",
    action: { label: "Ver reportes", href: "/dashboard/reporte-gastos" },
  },
];

const STEPS_EMPRESARIAL: Step[] = [
  {
    icon: <CheckCircle2 className="h-8 w-8 text-indigo-400" />,
    title: "¡Bienvenido a CuentIA!",
    description:
      "Tu plataforma fiscal inteligente está lista. En unos pasos te mostramos cómo administrar tus clientes y sus facturas.",
  },
  {
    icon: <Users className="h-8 w-8 text-indigo-400" />,
    title: "Registra tus clientes (RFCs)",
    description:
      "En la sección Clientes puedes agregar los RFCs de tus empresas o clientes. CuentIA descargará y procesará automáticamente sus CFDIs.",
    action: { label: "Ir a Clientes", href: "/dashboard/clientes" },
  },
  {
    icon: <BarChart2 className="h-8 w-8 text-indigo-400" />,
    title: "Consulta sus facturas",
    description:
      "Revisa ingresos, egresos y nómina de cada RFC desde el dashboard. Filtra por cliente, fecha o tipo de comprobante.",
    action: { label: "Ver facturas", href: "/dashboard/facturas" },
  },
  {
    icon: <FileSpreadsheet className="h-8 w-8 text-indigo-400" />,
    title: "Exporta reportes en Excel",
    description:
      "Genera reportes detallados por cliente en Excel o PDF. Perfectos para auditorías, presentaciones o entrega a tu equipo contable.",
    action: { label: "Ver reportes", href: "/dashboard/reporte-gastos" },
  },
  {
    icon: <Settings className="h-8 w-8 text-indigo-400" />,
    title: "Agrega colaboradores",
    description:
      "Invita a tu equipo desde Configuración → Colaboradores. Asigna roles y define a qué RFCs puede acceder cada uno.",
    action: { label: "Ir a Configuración", href: "/configuracion" },
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
      <div className="relative w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl shadow-black/60 p-6 sm:p-8">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Step indicators */}
        <div className="flex gap-1.5 mb-6">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                i <= current ? "bg-indigo-500" : "bg-slate-700"
              }`}
            />
          ))}
        </div>

        {/* Icon + content */}
        <div className="flex flex-col items-center text-center gap-4 min-h-[160px]">
          <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/30">
            {step.icon}
          </div>

          <div>
            <h2 className="text-xl font-bold text-white mb-2">{step.title}</h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              {step.description}
            </p>
          </div>

          {step.action && (
            <a
              href={step.action.href}
              target={step.action.href.startsWith("http") ? "_blank" : undefined}
              rel={step.action.href.startsWith("http") ? "noopener noreferrer" : undefined}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-300 hover:text-indigo-200 border border-indigo-500/40 rounded-full px-3 py-1.5 transition"
            >
              {step.action.label}
              <ChevronRight className="h-3 w-3" />
            </a>
          )}
        </div>

        {/* Navigation */}
        <div className="mt-8 flex items-center justify-between gap-3">
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
  );
}
