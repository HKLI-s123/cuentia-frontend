"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import logoImg from "../assets/images/logo.png";
import StructuredData from "./StructuredData";
import { LANDING_FAQS } from "./site.config";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Download,
  FileSpreadsheet,
  MessageCircle,
  ShieldCheck,
  Receipt,
  BarChart3,
  TrendingUp,
  Sparkles,
  Zap,
  X,
  Menu,
  Bot,
  Share2,
  FileMinus2,
  Linkedin,
  Facebook,
  Instagram,
} from "lucide-react";


const BRAND = {
  name: "CuentIA",
  contactEmail: "contacto@cuentia.mx",
  domain: "cuentia.mx",
  ctaPrimary: { label: "Crear cuenta gratis", href: "/register" },
  ctaSecondary: { label: "Ver planes", href: "/plans" },
};

type FAQ = { q: string; a: string };

type ReportType = {
  icon: React.ReactNode;
  title: string;
  tag: string;
  desc: string;
  columns: string[];
  accent: "emerald" | "blue" | "violet" | "amber";
  filename: string;
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

// ─── Guard de descargas de demo ────────────────────────────────────────────────
// Mitigación client-side contra descargas masivas/spam-click: ventana deslizante
// en localStorage (límite por navegador) + cooldown entre clics. No reemplaza el
// rate-limiting de borde/CDN, pero corta el abuso casual y el clic en ráfaga.
const DEMO_DL_KEY = "cuentia_demo_dl";
const DEMO_DL_LIMIT = 6; // máx. descargas por ventana
const DEMO_DL_WINDOW_MS = 10 * 60 * 1000; // ventana de 10 min
const DEMO_DL_COOLDOWN_MS = 1500; // tiempo mínimo entre descargas

function useDownloadGuard() {
  return useCallback((e: React.MouseEvent) => {
    if (typeof window === "undefined") return;
    const now = Date.now();

    let times: number[] = [];
    try {
      const raw = window.localStorage.getItem(DEMO_DL_KEY);
      if (raw) times = (JSON.parse(raw) as number[]).filter((t) => typeof t === "number");
    } catch {
      times = [];
    }
    times = times.filter((t) => now - t < DEMO_DL_WINDOW_MS);

    // Cooldown anti spam-click (también frena descargas automatizadas en ráfaga).
    const last = times[times.length - 1] ?? 0;
    if (now - last < DEMO_DL_COOLDOWN_MS) {
      e.preventDefault();
      return;
    }

    // Límite por ventana de tiempo.
    if (times.length >= DEMO_DL_LIMIT) {
      e.preventDefault();
      const waitMin = Math.max(1, Math.ceil((DEMO_DL_WINDOW_MS - (now - times[0])) / 60000));
      toast.error("Límite de descargas de demo alcanzado", {
        description: `Espera ~${waitMin} min o crea tu cuenta gratis para acceso completo.`,
      });
      return;
    }

    times.push(now);
    try {
      window.localStorage.setItem(DEMO_DL_KEY, JSON.stringify(times));
    } catch {
      /* sin localStorage: dejamos pasar la descarga */
    }
  }, []);
}

function useScrollSpy(ids: string[], offset = 120) {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY + offset;
      let current = "";

      for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;
        const top = el.getBoundingClientRect().top + window.scrollY;
        if (top <= y) current = id;
      }
      setActiveId(current);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [ids, offset]);

  return activeId;
}

function Section({
  id,
  eyebrow,
  title,
  subtitle,
  children,
  alt = false,
}: {
  id: string;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  alt?: boolean;
}) {
  return (
    <section id={id} className={cn("py-16 md:py-24", alt && "bg-slate-50")}>
      <div className="mx-auto w-full max-w-6xl px-4">
        <div className="max-w-3xl">
          {eyebrow && (
            <div className="flex items-center gap-3 text-sm italic font-display text-indigo-600">
              <span className="h-px w-8 flex-shrink-0 bg-indigo-200" />
              {eyebrow}
            </div>
          )}
          <h2 className="mt-3 text-2xl md:text-4xl font-bold tracking-tight text-slate-900">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-3 text-base md:text-lg text-slate-500 leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
        <div className="mt-10">{children}</div>
      </div>
    </section>
  );
}

function Button({
  href,
  children,
  variant = "primary",
  rightIcon,
  className,
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "emerald" | "outline-white";
  rightIcon?: React.ReactNode;
  className?: string;
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500";

  const styles = {
    primary:
      "bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[0.98] shadow-sm",
    secondary:
      "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 shadow-sm",
    ghost: "text-slate-600 hover:text-slate-900 hover:bg-slate-100",
    emerald:
      "bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.98] shadow-sm",
    "outline-white":
      "border border-white/20 text-white hover:bg-white/10",
  } as const;

  return (
    <a href={href} className={cn(base, styles[variant], className)}>
      {children}
      {rightIcon && <span className="opacity-80">{rightIcon}</span>}
    </a>
  );
}

function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-white border border-slate-200 shadow-sm",
        className
      )}
    >
      {children}
    </div>
  );
}

function Divider({ dark = false }: { dark?: boolean }) {
  return (
    <div
      className={cn(
        "h-px w-full",
        dark ? "bg-slate-800" : "bg-slate-200"
      )}
    />
  );
}

function CheckItem({
  children,
  dark = false,
}: {
  children: React.ReactNode;
  dark?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <div
        className={cn(
          "mt-0.5 rounded-full p-1 flex-shrink-0",
          dark ? "bg-emerald-900/50" : "bg-emerald-100"
        )}
      >
        <Check
          className={cn("h-3.5 w-3.5", dark ? "text-emerald-400" : "text-emerald-600")}
        />
      </div>
      <div
        className={cn(
          "text-sm leading-relaxed",
          dark ? "text-slate-300" : "text-slate-600"
        )}
      >
        {children}
      </div>
    </div>
  );
}

function FAQItem({ faq }: { faq: FAQ }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      <button
        onClick={() => setOpen((s) => !s)}
        className="w-full text-left px-5 py-4 flex items-center justify-between gap-4"
      >
        <div className="text-slate-900 font-semibold text-sm">{faq.q}</div>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-slate-400 transition-transform flex-shrink-0",
            open && "rotate-180"
          )}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-1 text-slate-500 text-sm leading-relaxed border-t border-slate-100">
              {faq.a}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const SPREADSHEET_TABS = [
  {
    id: "emitidos",
    label: "CFDI Emitidos",
    filename: "cfdi-emitidos-mayo-2025.xlsx",
    headerClass: "bg-emerald-600 text-white border-emerald-700",
    cols: ["#", "UUID", "RFC Receptor", "Fecha", "SubTotal", "IVA 16%", "Total", "Estatus"],
    rows: [
      ["1", "5F3A-8B2C-…", "GARE850312MX5", "01/05/25", "$8,620.69", "$1,379.31", "$10,000.00", "Vigente"],
      ["2", "9D1E-4F7A-…", "XAXX010101000", "03/05/25", "$4,310.34", "$689.66", "$5,000.00", "Vigente"],
      ["3", "2C8B-6E3D-…", "SACO230115XZ8", "07/05/25", "$25,862.07", "$4,137.93", "$30,000.00", "Cancelado"],
    ] as string[][],
    footer: "87 registros · Mayo 2025 · Generado por CuentIA",
    downloadFile: "/demo/cfdi-emitidos-demo.xlsx",
    statusCol: 7,
    monoUUID: true,
  },
  {
    id: "complementos",
    label: "Complementos de pago",
    filename: "complementos-pago-mayo-2025.xlsx",
    headerClass: "bg-blue-600 text-white border-blue-700",
    cols: ["#", "UUID Pago", "UUID Doc.", "Fecha Pago", "Monto Pagado", "Método", "Parcialidad", "Saldo Ins."],
    rows: [
      ["1", "A1B2-C3D4-…", "5F3A-8B2C-…", "12/05/25", "$5,000.00", "03 - Trans.", "1 de 2", "$5,000.00"],
      ["2", "E5F6-G7H8-…", "9D1E-4F7A-…", "15/05/25", "$5,000.00", "03 - Trans.", "2 de 2", "$0.00"],
      ["3", "I9J0-K1L2-…", "2C8B-6E3D-…", "20/05/25", "$15,000.00", "02 - Cheque", "1 de 2", "$15,000.00"],
    ] as string[][],
    footer: "34 complementos · Mayo 2025 · Generado por CuentIA",
    downloadFile: "/demo/cfdi-emitidos-demo.xlsx",
    statusCol: -1,
    monoUUID: true,
  },
  {
    id: "notas",
    label: "Notas de crédito",
    filename: "notas-credito-mayo-2025.xlsx",
    headerClass: "bg-violet-600 text-white border-violet-700",
    cols: ["#", "UUID NC", "UUID Relacionado", "Fecha", "Motivo", "SubTotal", "IVA", "Total"],
    rows: [
      ["1", "M3N4-O5P6-…", "5F3A-8B2C-…", "05/05/25", "Devolución parcial", "$1,724.14", "$275.86", "$2,000.00"],
      ["2", "Q7R8-S9T0-…", "9D1E-4F7A-…", "18/05/25", "Descuento acordado", "$862.07", "$137.93", "$1,000.00"],
      ["3", "U1V2-W3X4-…", "3A7C-1D2E-…", "22/05/25", "Error en precio", "$3,448.28", "$551.72", "$4,000.00"],
    ] as string[][],
    footer: "12 notas de crédito · Mayo 2025 · Generado por CuentIA",
    downloadFile: "/demo/cfdi-emitidos-demo.xlsx",
    statusCol: -1,
    monoUUID: true,
  },
  {
    id: "flujo",
    label: "Flujo de efectivo",
    filename: "flujo-efectivo-2025.xlsx",
    headerClass: "bg-amber-500 text-white border-amber-600",
    cols: ["Mes", "Ingresos", "Egresos", "IVA Cobrado", "IVA Pagado", "IVA Neto", "Utilidad", "Saldo Acum."],
    rows: [
      ["Ene 25", "$82,500.00", "$61,200.00", "$13,200.00", "$9,792.00", "$3,408.00", "$21,300.00", "$21,300.00"],
      ["Feb 25", "$94,000.00", "$67,800.00", "$15,040.00", "$10,848.00", "$4,192.00", "$26,200.00", "$47,500.00"],
      ["Mar 25", "$78,600.00", "$59,400.00", "$12,576.00", "$9,504.00", "$3,072.00", "$19,200.00", "$66,700.00"],
    ] as string[][],
    footer: "Ene — Dic 2025 · Generado por CuentIA",
    downloadFile: "/demo/flujo-mensual-demo.csv",
    statusCol: -1,
    monoUUID: false,
  },
];

function SpreadsheetPreview() {
  const [activeTab, setActiveTab] = useState(0);
  const tab = SPREADSHEET_TABS[activeTab];

  return (
    <div className="w-full rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60 overflow-hidden">
      {/* Window chrome */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-200 bg-slate-50/80">
        <div className="h-2.5 w-2.5 rounded-full bg-red-400 flex-shrink-0" />
        <div className="h-2.5 w-2.5 rounded-full bg-amber-400 flex-shrink-0" />
        <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 flex-shrink-0" />
        <div className="ml-2 min-w-0 truncate text-xs text-slate-500 font-mono">{tab.filename}</div>
        <div className="ml-auto flex flex-shrink-0 items-center gap-1 text-xs text-emerald-600 font-bold">
          <FileSpreadsheet className="h-3 w-3" /> Excel
        </div>
      </div>
      {/* Sheet tabs */}
      <div className="flex overflow-x-auto border-b border-slate-200 bg-slate-50/60">
        {SPREADSHEET_TABS.map((t, i) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(i)}
            className={cn(
              "flex-shrink-0 whitespace-nowrap border-r border-slate-200 px-3.5 py-2 text-[11px] font-medium transition",
              i === activeTab
                ? "-mb-px border-b-2 border-b-indigo-500 bg-white text-slate-900 font-semibold"
                : "text-slate-400 hover:bg-white/60 hover:text-slate-700"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      {/* Table with right fade */}
      <div className="relative">
        <div className="overflow-x-auto overscroll-x-contain">
          <table className="w-full min-w-[660px] text-xs border-collapse">
            <thead>
              <tr>
                {tab.cols.map((h, i) => (
                  <th
                    key={h}
                    className={cn(
                      "px-3 py-2 text-left font-semibold border-b whitespace-nowrap",
                      i === 0
                        ? "w-8 text-center text-slate-400 bg-slate-50 border-slate-200"
                        : tab.headerClass
                    )}
                  >
                    {h}
                  </th>
                ))}
                <th className="w-10 border-b border-slate-200 bg-slate-100 px-3 py-2 text-center text-slate-400">…</th>
              </tr>
            </thead>
            <tbody>
              {tab.rows.map((row, ri) => (
                <tr key={ri} className={ri % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
                  {row.map((cell, ci) => (
                    <td
                      key={ci}
                      className={cn(
                        "whitespace-nowrap border-b border-slate-100 px-3 py-2.5",
                        ci === 0 && "bg-slate-50 text-center text-slate-400",
                        tab.statusCol === ci && cell === "Cancelado" && "font-semibold text-red-500",
                        tab.statusCol === ci && cell === "Vigente" && "font-semibold text-emerald-600",
                        ci !== 0 && tab.statusCol !== ci && "text-slate-700",
                        ci !== 0 && tab.monoUUID && (ci === 1 || ci === 2) && "font-mono text-[11px]"
                      )}
                    >
                      {cell}
                    </td>
                  ))}
                  <td className="border-b border-slate-100 px-3 py-2.5 text-center text-base text-slate-300">…</td>
                </tr>
              ))}
              <tr>
                <td colSpan={tab.cols.length + 1} className="bg-slate-50/80 px-3 py-2 text-right font-mono text-xs text-slate-400">
                  {tab.footer}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-white to-transparent" />
      </div>
      {/* Footer CTA */}
      <div className="flex items-center justify-between border-t border-slate-100 bg-white px-4 py-2.5">
        <span className="text-xs text-slate-400">Columnas adicionales en el reporte completo</span>
        <a
          href="#demo"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-600 shadow-sm transition hover:border-indigo-300 hover:shadow"
        >
          <Download className="h-3 w-3" />
          Ver completo
        </a>
      </div>
    </div>
  );
}

function StatsBar() {
  const stats = [
    { num: "< 3 min", label: "De tus XMLs del SAT a reporte listo para declarar o auditar", highlight: true },
    { num: "4", label: "Reportes para declaraciones, DIOT, auditorías y flujo mensual" },
    { num: "1 clic", label: "Para generar cualquier reporte" },
    { num: "$0", label: "Costo de descarga de todos tus XMLs del SAT" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      {stats.map((s, i) => (
        <div
          key={i}
          className={cn(
            "px-6 py-5 border-b border-r border-slate-200",
            i % 2 === 1 && "border-r-0 md:border-r",
            i >= 2 && "border-b-0",
            i === 3 && "border-r-0",
            s.highlight && "bg-emerald-50/70"
          )}
        >
          <div
            className={cn(
              "text-2xl md:text-3xl font-bold tracking-tight font-mono tabular-nums",
              s.highlight ? "text-emerald-600" : "text-slate-900"
            )}
          >
            {s.num}
          </div>
          <div className="mt-1 text-xs text-slate-500 leading-snug">{s.label}</div>
        </div>
      ))}
    </div>
  );
}

function ComparisonTable() {
  const rows: {
    feature: string;
    sat: boolean | string | null;
    others: boolean | string | null;
    cuentia: boolean | string;
    highlight?: boolean;
  }[] = [
    {
      feature: "Descarga masiva de XMLs del SAT",
      sat: null,
      others: "De pago",
      cuentia: "Gratis",
      highlight: true,
    },
    { feature: "UUID completo en cada fila", sat: false, others: false, cuentia: true },
    { feature: "RFC emisor/receptor + razón social", sat: false, others: "Básico", cuentia: true },
    { feature: "Tasa IVA desglosada por fila (16%, 0%, Exento)", sat: false, others: false, cuentia: true },
    { feature: "DIOT completamente listo", sat: false, others: false, cuentia: true },
    { feature: "Estado por CFDI (Vigente / Cancelado)", sat: false, others: false, cuentia: true },
    { feature: "Reporte listo para entregar al contador", sat: false, others: "Parcial", cuentia: true },
  ];

  function CellVal({ val }: { val: boolean | string | null }) {
    if (val === null) return <span className="text-slate-300 font-mono text-xs">—</span>;
    if (val === false) return <X className="h-4 w-4 text-slate-300 mx-auto" />;
    if (val === true) return <Check className="h-4 w-4 text-emerald-500 mx-auto" />;
    return <span className="text-xs font-semibold text-amber-600">{val}</span>;
  }

  return (
    <div className="overflow-x-auto overscroll-x-contain rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full min-w-[540px] text-sm border-collapse">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="px-5 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wide bg-slate-50">Funcionalidad</th>
            <th className="px-4 py-3.5 text-center text-xs font-bold text-slate-500 uppercase tracking-wide bg-slate-50 w-28">Portal SAT</th>
            <th className="px-4 py-3.5 text-center text-xs font-bold text-slate-500 uppercase tracking-wide bg-slate-50 w-36">Otras plataformas</th>
            <th className="px-4 py-3.5 text-center text-xs font-bold text-white uppercase tracking-wide bg-indigo-600 w-36">CuentIA</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className={cn("border-b border-slate-100 last:border-none transition-colors hover:bg-slate-50/50", row.highlight && "bg-emerald-50/40")}>
              <td className="px-5 py-3 text-slate-700 font-medium">
                {row.feature}
                {row.highlight && (
                  <span className="ml-2 inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 uppercase tracking-wide">Gratis</span>
                )}
              </td>
              <td className="px-4 py-3 text-center"><CellVal val={row.sat} /></td>
              <td className="px-4 py-3 text-center"><CellVal val={row.others} /></td>
              <td className="px-4 py-3 text-center bg-indigo-50/40">
                {row.cuentia === "Gratis" ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
                    <Check className="h-3.5 w-3.5" />Gratis
                  </span>
                ) : (
                  <CellVal val={row.cuentia} />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const accentMap = {
  emerald: {
    tag: "border-emerald-200 bg-emerald-50 text-emerald-700",
    icon: "bg-emerald-100 border-emerald-200 text-emerald-600",
    dl: "text-emerald-600 hover:text-emerald-700",
    th: "bg-emerald-50 text-emerald-700 border-b border-emerald-100",
  },
  blue: {
    tag: "border-blue-200 bg-blue-50 text-blue-700",
    icon: "bg-blue-100 border-blue-200 text-blue-600",
    dl: "text-blue-600 hover:text-blue-700",
    th: "bg-blue-50 text-blue-700 border-b border-blue-100",
  },
  violet: {
    tag: "border-violet-200 bg-violet-50 text-violet-700",
    icon: "bg-violet-100 border-violet-200 text-violet-600",
    dl: "text-violet-600 hover:text-violet-700",
    th: "bg-violet-50 text-violet-700 border-b border-violet-100",
  },
  amber: {
    tag: "border-amber-200 bg-amber-50 text-amber-700",
    icon: "bg-amber-100 border-amber-200 text-amber-600",
    dl: "text-amber-600 hover:text-amber-700",
    th: "bg-amber-50 text-amber-700 border-b border-amber-100",
  },
};

function ReportCard({ report }: { report: ReportType }) {
  const s = accentMap[report.accent];
  const downloadGuard = useDownloadGuard();
  return (
    <Card className="p-5 md:p-6 h-full flex flex-col gap-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className={cn("rounded-xl p-2.5 border w-fit", s.icon)}>{report.icon}</div>
        <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold", s.tag)}>{report.tag}</span>
      </div>
      <div>
        <div className="text-base font-bold text-slate-900">{report.title}</div>
        <div className="mt-1 text-sm text-slate-500 leading-relaxed">{report.desc}</div>
      </div>
      <div className="overflow-x-auto overscroll-x-contain rounded-xl border border-slate-200">
        <table className="w-full min-w-[360px] text-xs border-collapse">
          <thead>
            <tr>
              {report.columns.map((col) => (
                <th key={col} className={cn("px-2.5 py-1.5 text-left font-semibold whitespace-nowrap", s.th)}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={report.columns.length} className="px-2.5 py-2.5 text-center text-slate-400 bg-slate-50 italic text-xs">datos reales al descargar tu reporte</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="mt-auto">
        <a href={`/demo/${report.filename}`} download onClick={downloadGuard} className={cn("inline-flex items-center gap-2 text-sm font-semibold transition", s.dl)}>
          <Download className="h-4 w-4" />Descargar demo · {report.filename}
        </a>
      </div>
    </Card>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function CuentIALandingPage() {
  const prefersReducedMotion = useReducedMotion();

  const nav = useMemo(() => [
    { id: "how", label: "Cómo funciona" },
    { id: "reportes", label: "Reportes" },
    { id: "ia", label: "IA" },
    { id: "pricing", label: "Planes" },
  ], []);

  const activeId = useScrollSpy(nav.map((n) => n.id), 140);
  const [menuOpen, setMenuOpen] = useState(false);
  const downloadGuard = useDownloadGuard();

  const reports: ReportType[] = useMemo(() => [
    {
      icon: <Receipt className="h-5 w-5" />,
      title: "CFDIs",
      tag: "Ingresos · Egresos · Nómina",
      desc: "Todos tus CFDI clasificados por tipo: ingresos, egresos, nómina y retenidos. UUID íntegro, RFC y razón social, IVA desglosado, total y estatus de cancelación en el SAT.",
      columns: ["Fecha", "UUID", "RFC", "Nombre", "SubTotal", "IVA", "Total", "Método Pago", "Estatus"],
      accent: "emerald",
      filename: "cfdi-emitidos-demo.xlsx",
    },
    {
      icon: <FileSpreadsheet className="h-5 w-5" />,
      title: "Complementos de pago",
      tag: "REP · Parcialidades",
      desc: "Cada complemento (REP) ligado a su factura: monto pagado, forma de pago, número de parcialidad y saldo insoluto. La trazabilidad de tus PPD sin armarla a mano.",
      columns: ["Fecha Pago", "UUID Pago", "UUID Factura", "RFC", "Monto", "Forma Pago", "Parcialidad", "Saldo Insoluto"],
      accent: "blue",
      filename: "complementos-pago-demo.xlsx",
    },
    {
      icon: <FileMinus2 className="h-5 w-5" />,
      title: "Notas de crédito",
      tag: "Emitidas · Recibidas",
      desc: "Devoluciones, descuentos y correcciones —emitidas y recibidas— con su factura relacionada. Separadas en egreso, ajuste y diferencia neta para conciliar sin dudas.",
      columns: ["Fecha", "UUID", "RFC Emisor", "RFC Receptor", "UUID Relacionado", "SubTotal", "IVA", "Total"],
      accent: "violet",
      filename: "notas-credito-demo.xlsx",
    },
    {
      icon: <TrendingUp className="h-5 w-5" />,
      title: "Flujo de efectivo",
      tag: "Liquidez",
      desc: "Ingresos contra egresos a partir de facturas PUE y complementos de pago, con liquidez neta. Lo que realmente entró y salió —no lo que facturaste, lo que cobraste—.",
      columns: ["Tipo factura", "Fecha", "Contraparte", "RFC", "Total", "Forma Pago", "Estatus"],
      accent: "amber",
      filename: "flujo-efectivo-demo.xlsx",
    },
  ], []);

  const faqs: FAQ[] = useMemo(() => LANDING_FAQS, []);

  const [billing, setBilling] = useState<"monthly" | "annual">("annual");

  const fadeUp = {
    initial: prefersReducedMotion ? {} : { opacity: 0, y: 12 },
    animate: prefersReducedMotion ? {} : { opacity: 1, y: 0 },
    transition: { duration: 0.5 },
  };

  return (
    <div className="landing-cuentia min-h-screen overflow-x-clip bg-white text-slate-900">
      <StructuredData />
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        {/* Retícula fina tipo papel contable — sutil y propia, sin blobs difuminados genéricos */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(27,27,52,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(27,27,52,0.05) 1px, transparent 1px)",
            backgroundSize: "34px 34px",
            maskImage: "radial-gradient(ellipse 75% 55% at 50% -5%, #000 35%, transparent 100%)",
            WebkitMaskImage: "radial-gradient(ellipse 75% 55% at 50% -5%, #000 35%, transparent 100%)",
          }}
        />
      </div>

      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-200">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <a href="#top" className="flex flex-shrink-0 items-center" onClick={() => setMenuOpen(false)}>
            <Image src={logoImg} alt={BRAND.name} height={26} className="h-[26px] w-auto" />
          </a>
          <nav className="hidden lg:flex items-center gap-0.5">
            {nav.map((item) => (
              <a key={item.id} href={`#${item.id}`}
                className={cn("rounded-lg px-3 py-2 text-sm transition",
                  activeId === item.id ? "bg-slate-100 text-slate-900 font-semibold" : "text-slate-500 hover:text-slate-900 hover:bg-slate-50")}>
                {item.label}
              </a>
            ))}
          </nav>
          <div className="hidden lg:flex items-center gap-2">
            <a href="/login" className="text-sm text-slate-500 hover:text-slate-900 transition px-3 py-2">Iniciar sesión</a>
            <div className="relative">
              <span
                className="pointer-events-none absolute inset-0 rounded-xl bg-emerald-400/30 animate-ping"
                style={{ animationDuration: "2s" }}
              />
              <Button href="#demo" variant="emerald" rightIcon={<Download className="h-4 w-4" />}>Ver demo</Button>
            </div>
            <Button href={BRAND.ctaPrimary.href} variant="primary" rightIcon={<ArrowRight className="h-4 w-4" />}>{BRAND.ctaPrimary.label}</Button>
          </div>
          <button
            type="button"
            onClick={() => setMenuOpen((s) => !s)}
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={menuOpen}
            className="lg:hidden inline-flex flex-shrink-0 items-center justify-center rounded-lg p-2 text-slate-600 hover:bg-slate-100 transition"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        <AnimatePresence initial={false}>
          {menuOpen && (
            <motion.div
              key="mobile-menu"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden overflow-hidden border-t border-slate-200 bg-white"
            >
              <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3">
                {nav.map((item) => (
                  <a key={item.id} href={`#${item.id}`} onClick={() => setMenuOpen(false)}
                    className={cn("rounded-lg px-3 py-2.5 text-sm transition",
                      activeId === item.id ? "bg-slate-100 text-slate-900 font-semibold" : "text-slate-600 hover:bg-slate-50")}>
                    {item.label}
                  </a>
                ))}
                <div className="my-2 h-px bg-slate-200" />
                <a href="/login" onClick={() => setMenuOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-50 transition">
                  Iniciar sesión
                </a>
                <a href="#demo" onClick={() => setMenuOpen(false)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700">
                  <Download className="h-4 w-4" /> Ver demo
                </a>
                <a href={BRAND.ctaPrimary.href} onClick={() => setMenuOpen(false)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700">
                  {BRAND.ctaPrimary.label} <ArrowRight className="h-4 w-4" />
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main id="top">
        <div className="mx-auto w-full max-w-6xl px-4 pt-5 md:pt-8 pb-12 md:pb-16">
          <div className="grid gap-12 md:grid-cols-12 md:items-start">
            <motion.div {...fadeUp} className="md:col-span-5">
              <h1 className="mt-4 text-4xl md:text-5xl font-bold tracking-tight leading-[1.08] text-slate-900">
                De XMLs del SAT<br />
                <span className="text-indigo-600">a trabajo casi terminado.</span>
              </h1>
              <p className="mt-3 text-lg text-slate-400 font-medium leading-snug">
                Sin limpiar datos. Sin tablas dinámicas. Sin cruzar nada a mano.
              </p>
              <p className="mt-4 text-base text-slate-500 leading-relaxed">
                Miles de XMLs procesados, clasificados y convertidos en reportes listos para declaraciones, auditorías y análisis financiero. Descargar tus CFDIs del SAT{" "}
                <span className="text-slate-900 font-semibold">no tiene ningún costo</span> — el trabajo casi terminado sí tiene precio, y vale cada peso.
              </p>
              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-indigo-500 mb-1.5">El resultado</div>
                  <div className="text-sm font-bold text-indigo-900">Listo para declarar y auditar</div>
                  <div className="text-xs text-indigo-600 mt-0.5">Clasificado · Conciliado · Exportable</div>
                </div>
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-500 mb-1.5">El punto de partida</div>
                  <div className="text-sm font-bold text-emerald-900">Descarga de XMLs gratis</div>
                  <div className="text-xs text-emerald-600 mt-0.5">Sin tarjeta · Sin límite · Sin costo</div>
                </div>
              </div>
              <div className="mt-6">
                <Button href={BRAND.ctaPrimary.href} variant="primary" rightIcon={<ArrowRight className="h-4 w-4" />} className="w-full sm:w-auto">Crear cuenta gratis</Button>
              </div>
              <div className="mt-3 flex flex-col items-start gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-5 sm:gap-y-1.5">
                <p className="text-xs text-slate-500">Desde <span className="font-bold text-slate-800">$199/mes</span> · 1 mes sin costo · Sin tarjeta</p>
                <a href="#demo" className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 font-semibold transition">
                  <Download className="h-3 w-3" />Ver reporte de muestra
                </a>
              </div>
            </motion.div>
            <motion.div
              initial={prefersReducedMotion ? {} : { opacity: 0, y: 12 }}
              animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.05 }}
              className="md:col-span-7 min-w-0"
            >
              <SpreadsheetPreview />
              <p className="mt-3 text-center text-xs text-slate-400">Vista previa del reporte Excel de CFDI emitidos · Datos simulados</p>
            </motion.div>
          </div>
          <motion.div
            initial={prefersReducedMotion ? {} : { opacity: 0, y: 12 }}
            animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mt-10"
          >
            <StatsBar />
          </motion.div>
        </div>

        <section id="demo" className="border-t border-slate-200 bg-slate-50">
          <div className="mx-auto w-full max-w-6xl px-4 py-10 md:py-14">
            <div className="mb-6">
              <div className="flex items-center gap-2 text-sm italic font-display text-indigo-600">
                <span className="h-px w-6 flex-shrink-0 bg-indigo-200" />
                Pruébalo antes de crear tu cuenta
              </div>
              <p className="mt-1.5 text-sm text-slate-500">
                El mismo formato que generamos con tus datos reales. Sin email. Sin cuenta. Ábrelo en Excel y decide tú mismo.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {([
                {
                  title: "CFDIs",
                  desc: "Ingresos · Egresos · Nómina · Retenidos",
                  file: "/demo/cfdi-emitidos-demo.xlsx",
                  ext: ".xlsx",
                  accent: "emerald",
                  available: true,
                },
                {
                  title: "Complementos de pago",
                  desc: "Ingresos · Egresos · Parcialidades",
                  file: "/demo/complementos-pago-demo.xlsx",
                  ext: ".xlsx",
                  accent: "blue",
                  available: true,
                },
                {
                  title: "Notas de crédito",
                  desc: "Emitidas · Recibidas · Factura relacionada",
                  file: "/demo/notas-credito-demo.xlsx",
                  ext: ".xlsx",
                  accent: "violet",
                  available: true,
                },
                {
                  title: "Flujo de efectivo",
                  desc: "Ingresos · Egresos · Liquidez neta",
                  file: "/demo/flujo-efectivo-demo.xlsx",
                  ext: ".xlsx",
                  accent: "amber",
                  available: true,
                },
              ] as const).map((d) => {
                const borderMap = {
                  emerald: "border-emerald-200 hover:border-emerald-400 bg-white text-emerald-600",
                  blue: "border-blue-200 bg-white text-blue-600",
                  violet: "border-violet-200 bg-white text-violet-600",
                  amber: "border-amber-200 bg-white text-amber-600",
                } as const;
                const disabledClass = !d.available ? "opacity-50 cursor-not-allowed" : "";
                return d.available ? (
                  <motion.a
                    key={d.title}
                    href={d.file as string}
                    download
                    onClick={downloadGuard}
                    whileHover={prefersReducedMotion ? {} : { y: -3 }}
                    className={cn("group rounded-2xl border p-5 flex flex-col gap-4 cursor-pointer transition-all shadow-sm hover:shadow-md", borderMap[d.accent])}
                  >
                    <div className="flex items-start justify-between">
                      <FileSpreadsheet className="h-7 w-7 opacity-70" />
                      <span className="text-xs text-slate-400">{d.ext}</span>
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">{d.title}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{d.desc}</div>
                    </div>
                    <div className="mt-auto flex items-center gap-2 text-sm font-semibold">
                      <Download className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" />
                      Descargar gratis
                    </div>
                  </motion.a>
                ) : (
                  <div
                    key={d.title}
                    className={cn("rounded-2xl border p-5 flex flex-col gap-4 shadow-sm", borderMap[d.accent], disabledClass)}
                  >
                    <div className="flex items-start justify-between">
                      <FileSpreadsheet className="h-7 w-7 opacity-40" />
                      <span className="text-xs text-slate-300">{d.ext}</span>
                    </div>
                    <div>
                      <div className="font-bold text-slate-400">{d.title}</div>
                      <div className="text-xs text-slate-300 mt-0.5">{d.desc}</div>
                    </div>
                    <div className="mt-auto flex items-center gap-2 text-sm font-semibold text-slate-300">
                      <Download className="h-4 w-4" />
                      Próximamente
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="mt-4 text-xs text-slate-400 text-center">
              Archivo .xlsx — se abre directamente en Excel. Datos completamente simulados.
            </p>
          </div>
        </section>

        <Divider />

        <Section id="how" eyebrow="Cómo funciona" title="Del SAT a tu reporte en minutos"
          subtitle="Conectas tu RFC y CuentIA hace el resto. En minutos tienes reportes listos para declarar, auditar y analizar." alt>
          <div className="grid gap-6 md:grid-cols-12">
            <motion.div
              initial={prefersReducedMotion ? {} : { opacity: 0, y: 14 }}
              whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5 }}
              className="md:col-span-7">
              <Card className="p-6">
                <ol className="grid gap-0">
                  {[
                    { t: "Crea tu cuenta — sin tarjeta", d: "Regístrate gratis. Si tienes equipo, configura roles. Sin RFC también puedes empezar.", badge: null },
                    { t: "Conecta tu RFC", d: "Ingresa tus credenciales del SAT. CuentIA descarga, clasifica y valida tus CFDI automáticamente.", badge: null },
                    { t: "XMLs descargados — gratis", d: "Todos tus comprobantes emitidos y recibidos, listos en tu panel. Sin costo alguno.", badge: "Gratis" },
                    { t: "El trabajo listo para usar", d: "Un clic. Reportes clasificados, conciliados y estructurados — listos para declaraciones, auditorías o análisis. Solo lo abres y empiezas.", badge: null },
                  ].map((s, i) => (
                    <li key={s.t} className={cn("flex gap-4 py-4", i < 3 && "border-b border-slate-100")}>
                      <div className="flex flex-col items-center flex-shrink-0">
                        <div className={cn("h-8 w-8 rounded-xl grid place-items-center font-bold text-xs flex-shrink-0 border",
                          i === 2 ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                          i === 3 ? "bg-indigo-50 text-indigo-700 border-indigo-200" :
                          "bg-slate-100 text-slate-600 border-slate-200")}>
                          {i + 1}
                        </div>
                        {i < 3 && <div className="mt-1 flex-1 w-px bg-slate-200 min-h-[16px]" />}
                      </div>
                      <div className="pb-1">
                        <div className="font-semibold text-slate-900 text-sm flex items-center flex-wrap gap-2">
                          {s.t}
                          {s.badge && <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 uppercase">{s.badge}</span>}
                        </div>
                        <div className="mt-1 text-sm text-slate-500 leading-relaxed">{s.d}</div>
                      </div>
                    </li>
                  ))}
                </ol>
              </Card>
            </motion.div>
            <motion.div
              initial={prefersReducedMotion ? {} : { opacity: 0, y: 14 }}
              whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, delay: 0.06 }}
              className="md:col-span-5 flex flex-col gap-4">
              <Card className="p-5">
                <div className="text-xs font-bold uppercase tracking-wider text-indigo-600 mb-3">¿Para quién es CuentIA?</div>
                <div className="grid gap-3">
                  <CheckItem>Despachos contables con múltiples clientes</CheckItem>
                  <CheckItem>Contadores cansados de armar reportes a mano</CheckItem>
                  <CheckItem>Personas físicas con actividad empresarial</CheckItem>
                  <CheckItem>PYMES que facturan y quieren orden real</CheckItem>
                </div>
              </Card>
              <Card className="p-5">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Ejemplo de proceso</div>
                <div className="font-mono text-xs divide-y divide-slate-100">
                  {[
                    { label: "RFC conectado", val: "VIME901231QJ8", ok: true },
                    { label: "CFDIs emitidos", val: "1,203 ✓", ok: true },
                    { label: "CFDIs recibidos", val: "892 ✓", ok: true },
                    { label: "XMLs descargados", val: "Gratis ✓", ok: true },
                    { label: "Reporte generado", val: "reporte_2025.xlsx", ok: true },
                    { label: "Tiempo total", val: "< 3 min", ok: true },
                  ].map((row, i) => (
                    <div key={i} className="flex items-center justify-between py-2.5">
                      <span className="text-slate-500">▸ {row.label}</span>
                      <span className={cn("font-semibold", row.ok ? "text-emerald-600" : "text-red-500")}>{row.val}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          </div>
        </Section>

        <Divider />

        <section id="diferenciador" className="bg-slate-900 py-16 md:py-24">
          <div className="mx-auto w-full max-w-6xl px-4">
            <div className="max-w-3xl">
              <div className="flex items-center gap-3 text-sm italic font-display text-emerald-400">
                <span className="h-px w-8 flex-shrink-0 bg-emerald-400/40" />
                El diferenciador
              </div>
              <h2 className="mt-3 text-2xl md:text-4xl font-bold tracking-tight text-white">
                La mayoría te entrega XMLs.<br />
                <span className="text-emerald-400">Nosotros entregamos el trabajo casi terminado.</span>
              </h2>
              <p className="mt-3 text-base md:text-lg text-slate-400 leading-relaxed">
                Mientras otros sistemas te entregan XMLs para que tú los trabajes, CuentIA los procesa, clasifica y estructura en reportes listos para usar. No somos otro descargador de XMLs — somos la plataforma que convierte esos archivos en información lista para declaraciones, auditorías y análisis.
              </p>
              <div className="mt-5 flex items-start gap-3 rounded-xl border border-slate-700 bg-slate-800/60 px-4 py-3.5">
                <div className="text-sm text-slate-300 leading-relaxed">
                  <span className="font-semibold text-white">Si eres dueño o socio:</span> mandas el reporte a tu contador y no hay más idas y venidas.{" "}
                  <span className="font-semibold text-white">Si eres contador:</span> lo abres y empiezas a trabajar. Sin reformatear, sin buscar columnas.
                </div>
              </div>
            </div>
            <div className="mt-10"><ComparisonTable /></div>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {[
                { num: "01", title: "El trabajo ya casi listo.", desc: "Miles de XMLs procesados, clasificados y estructurados en reportes listos para declarar, auditar o analizar. Sin que toques nada." },
                { num: "02", title: "Horas que dejan de existir.", desc: "Sin limpiar datos. Sin armar tablas dinámicas. Sin cruzar información a mano. Abre el reporte y empieza a trabajar de inmediato." },
                { num: "03", title: "La descarga de XMLs, sin costo.", desc: "El punto de entrada: conectas tu RFC y CuentIA baja todos tus CFDI del SAT. Emitidos, recibidos, el período que quieras. Gratis." },
              ].map((f, idx) => (
                <motion.div key={f.num}
                  initial={prefersReducedMotion ? {} : { opacity: 0, y: 14 }}
                  whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.45, delay: idx * 0.06 }}
                  className="rounded-2xl border border-slate-700/60 bg-slate-800/60 p-6 hover:bg-slate-800 transition-colors">
                  <div className="text-5xl font-bold text-slate-700 leading-none">{f.num}</div>
                  <div className="mt-4 font-bold text-white">{f.title}</div>
                  <div className="mt-2 text-sm text-slate-400 leading-relaxed">{f.desc}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <Divider dark />

        <section id="estructura" className="py-16 md:py-24">
          <div className="mx-auto w-full max-w-6xl px-4">
            <div className="max-w-3xl">
              <div className="flex items-center gap-3 text-sm italic font-display text-indigo-600">
                <span className="h-px w-8 flex-shrink-0 bg-indigo-200" />
                Por qué los contadores lo prefieren
              </div>
              <h2 className="mt-3 text-2xl md:text-4xl font-bold tracking-tight text-slate-900">
                Diseñado para trabajar durante horas,<br />
                <span className="text-indigo-600">no solo para verse bien.</span>
              </h2>
              <p className="mt-3 text-base md:text-lg text-slate-500 leading-relaxed">
                Lo primero que suelen decir los contadores no es sobre la automatización. Es sobre el Excel. Porque los reportes llegan ordenados, claros y listos para trabajar. Sin columnas desacomodadas, sin información duplicada y sin tener que invertir tiempo acomodando datos antes de analizarlos.
              </p>
            </div>
            <div className="mt-10 grid gap-4 md:grid-cols-2">
              {[
                {
                  icon: <FileSpreadsheet className="h-5 w-5 text-indigo-600" />,
                  title: "Columnas en posición fija, siempre",
                  desc: "El mismo encabezado y el mismo orden en todos los períodos y todos los RFC. Filtros, tablas dinámicas y referencias funcionan desde el primer día y siguen funcionando al año siguiente.",
                },
                {
                  icon: <ShieldCheck className="h-5 w-5 text-indigo-600" />,
                  title: "Sin campos vacíos ni valores ambiguos",
                  desc: "Cada fila tiene sus datos completos: UUID íntegro, razón social exacta, tasa de IVA aplicada y estado de validación en el SAT. Sin celdas que interpretar ni completar a mano.",
                },
                {
                  icon: <TrendingUp className="h-5 w-5 text-indigo-600" />,
                  title: "Escala sin reformatear",
                  desc: "El proceso es idéntico con 40 CFDIs que con 4,000. No hay ajuste manual cuando crece el volumen, cuando se agregan nuevos RFC ni cuando cambia el período.",
                },
                {
                  icon: <Zap className="h-5 w-5 text-indigo-600" />,
                  title: "Sale del sistema, entra al flujo de trabajo",
                  desc: "Sin fórmulas rotas, sin columnas en el orden equivocado, sin texto que limpiar antes de empezar. El reporte se abre y se trabaja. Sin preparación previa.",
                },
              ].map((f, idx) => (
                <motion.div key={f.title}
                  initial={prefersReducedMotion ? {} : { opacity: 0, y: 14 }}
                  whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.45, delay: idx * 0.05 }}>
                  <Card className="p-6 h-full flex gap-4">
                    <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-2.5 h-fit flex-shrink-0">
                      {f.icon}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">{f.title}</div>
                      <div className="mt-1.5 text-sm text-slate-500 leading-relaxed">{f.desc}</div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
            <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <div className="flex-1">
                <div className="font-bold text-slate-900 text-sm">&ldquo;El primer mes lo probé sin mucha expectativa. El segundo mes ya no concibo hacerlo diferente.&rdquo;</div>
                <div className="mt-1 text-sm text-slate-500">C.P. Ignacio Robledo · Guadalajara · 3 RFC activos</div>
              </div>
              <Button href="#demo" variant="secondary" rightIcon={<Download className="h-4 w-4" />} className="flex-shrink-0">Descargar reporte de muestra</Button>
            </div>
          </div>
        </section>

        <Divider />

        <section id="testimonios" className="py-16 md:py-24 bg-slate-50">
          <div className="mx-auto w-full max-w-6xl px-4">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3 text-sm italic font-display text-indigo-600">
                <span className="h-px w-8 flex-shrink-0 bg-indigo-200" />
                Quienes ya lo usan
              </div>
              <h2 className="mt-3 text-2xl md:text-3xl font-bold tracking-tight text-slate-900">
                Lo que dicen quienes trabajan con los reportes.
              </h2>
            </div>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {[
                {
                  quote: "Antes tardaba 3 horas armando el reporte de IVA cada mes. Ahora lo descargo, lo reviso en 20 minutos y se lo mando al cliente. El DIOT ya sale listo, no tengo que tocarlo.",
                  name: "C.P. Laura Menéndez",
                  role: "Contadora independiente · Monterrey · 14 clientes activos",
                  initials: "LM",
                  color: "bg-indigo-100 text-indigo-700",
                },
                {
                  quote: "Tengo actividad empresarial y nunca entendí bien mis CFDI. Con CuentIA descargué todo desde 2022 y por primera vez supe exactamente cuánto IVA pagué cada mes. En serio, nunca lo había podido ver tan claro.",
                  name: "Rodrigo Salcedo",
                  role: "Diseñador independiente · Persona física · CDMX",
                  initials: "RS",
                  color: "bg-emerald-100 text-emerald-700",
                },
                {
                  quote: "Manejamos 22 RFC en el despacho. El problema no era descargar — era que cada quien armaba el reporte diferente. Ahora todos salen igual y cualquier analista puede tomarlo sin preguntar.",
                  name: "C.P. Tomás Villanueva",
                  role: "Director de despacho · Puebla · 22 RFC activos",
                  initials: "TV",
                  color: "bg-violet-100 text-violet-700",
                },
              ].map((t, idx) => (
                <motion.div key={t.name}
                  initial={prefersReducedMotion ? {} : { opacity: 0, y: 14 }}
                  whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.45, delay: idx * 0.07 }}>
                  <Card className="p-6 h-full flex flex-col gap-5">
                    <p className="text-sm text-slate-600 leading-relaxed flex-1">&ldquo;{t.quote}&rdquo;</p>
                    <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                      <div className={cn("h-9 w-9 rounded-full grid place-items-center text-xs font-bold flex-shrink-0", t.color)}>
                        {t.initials}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-900">{t.name}</div>
                        <div className="text-xs text-slate-400">{t.role}</div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <Divider />

        <Section id="reportes" eyebrow="Lo que exportas" title="4 reportes. Cada uno diseñado para un caso de uso real."
          subtitle="No son exportaciones genéricas. Cada módulo tiene las columnas exactas que necesitas para trabajar con ese tipo de datos fiscales.">
          <div className="grid gap-5 md:grid-cols-2">
            {reports.map((report, idx) => (
              <motion.div key={report.title}
                initial={prefersReducedMotion ? {} : { opacity: 0, y: 14 }}
                whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.45, delay: idx * 0.04 }}
                className="min-w-0">
                <ReportCard report={report} />
              </motion.div>
            ))}
          </div>
          <div className="mt-6 rounded-2xl border border-indigo-100 bg-indigo-50 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="font-bold text-indigo-900 text-sm">Los reportes Excel son nuestro diferenciador real.</div>
              <div className="text-sm text-indigo-700 mt-0.5">La descarga de XMLs es gratis. Los reportes estructurados están en el plan de pago — y ahí es donde está el valor que te ahorra horas.</div>
            </div>
            <Button href={BRAND.ctaSecondary.href} variant="primary" rightIcon={<ArrowRight className="h-4 w-4" />}>Ver planes</Button>
          </div>
        </Section>

        <Divider />

        <Section id="features" eyebrow="Cómo lo hace posible" title="El motor detrás de los reportes"
          subtitle="No es una hoja de cálculo hecha a mano. CuentIA descarga, valida y procesa tus CFDI con lógica fiscal real.">
          <div className="grid border border-slate-200 rounded-2xl overflow-hidden md:grid-cols-3">
            {[
              { num: "01", icon: <Receipt className="h-5 w-5 text-indigo-600" />, title: "Motor CFDI", desc: "Descarga automática de comprobantes emitidos y recibidos por período. Detecta cancelaciones y duplicados sin revisarlos uno a uno." },
              { num: "02", icon: <BarChart3 className="h-5 w-5 text-indigo-600" />, title: "IVA & DIOT automáticos", desc: "Clasifica por tasa (16%, 8%, 0%, Exento), calcula bases, separa acreditable de trasladado y genera el archivo DIOT listo para el SAT." },
              { num: "03", icon: <MessageCircle className="h-5 w-5 text-indigo-600" />, title: "Bots de WhatsApp", desc: "Registra gastos desde WhatsApp con OCR. Para quienes aún no tienen RFC o quieren empezar a ordenar gastos desde el teléfono." },
              { num: "04", icon: <ShieldCheck className="h-5 w-5 text-indigo-600" />, title: "Roles y permisos", desc: "Dueño, empleado y consulta. Cada persona accede a lo que le corresponde. Nadie ve lo que no debe." },
              { num: "05", icon: <Sparkles className="h-5 w-5 text-indigo-600" />, title: "Multi-RFC", desc: "Para despachos y empresas con varias razones sociales. Gestiona múltiples clientes desde un solo panel sin perder el hilo." },
              { num: "06", icon: <FileSpreadsheet className="h-5 w-5 text-indigo-600" />, title: "Exportación bajo demanda", desc: "Exporta cualquier reporte cuando lo necesites: por período, por RFC o por categoría. Tus datos, cuando los necesitas." },
            ].map((f, idx) => (
              <motion.div key={f.num}
                initial={prefersReducedMotion ? {} : { opacity: 0, y: 14 }}
                whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.45, delay: idx * 0.03 }}
                className={cn("p-6 md:p-8 border-b border-r border-slate-200 hover:bg-slate-50/60 transition-colors",
                  idx % 3 === 2 && "border-r-0",
                  idx >= 3 && "border-b-0")}>
                <div className="text-4xl font-bold text-slate-100 leading-none">{f.num}</div>
                <div className="mt-4 flex items-center gap-2">
                  {f.icon}
                  <div className="font-bold text-slate-900 text-sm">{f.title}</div>
                </div>
                <div className="mt-2 text-sm text-slate-500 leading-relaxed">{f.desc}</div>
              </motion.div>
            ))}
          </div>
        </Section>

        <Divider />

        <Section id="ia" eyebrow="Inteligencia fiscal" title="IA que trabaja sobre tus propias facturas."
          subtitle="No es un chatbot genérico ni alertas de manual. CuentIA entiende tus CFDI, los analiza uno por uno y te avisa de riesgos antes de que el SAT lo haga." alt>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {([
              {
                icon: <Bot className="h-5 w-5" />,
                title: "Chatbot contable con IA",
                desc: "Pregúntale lo que sea sobre tu contabilidad. Toma tus facturas reales como contexto y responde con tus números —no con respuestas genéricas—.",
                badge: "IA",
                accent: "indigo",
                highlight: false,
              },
              {
                icon: <Sparkles className="h-5 w-5" />,
                title: "Análisis IA por factura",
                desc: "Cada CFDI revisado individualmente por IA: clasifica el gasto, detecta inconsistencias y te explica qué estás viendo, factura por factura.",
                badge: "IA",
                accent: "violet",
                highlight: false,
              },
              {
                icon: <ShieldCheck className="h-5 w-5" />,
                title: "13 alertas y predicciones fiscales",
                desc: "Tu antivirus fiscal: 13 alertas y predicciones con IA que detectan riesgos, vencimientos y anomalías antes de que se conviertan en un problema con el SAT.",
                badge: "Antivirus fiscal",
                accent: "emerald",
                highlight: true,
              },
              {
                icon: <Share2 className="h-5 w-5" />,
                title: "Comparte con tus clientes por token",
                desc: "Da acceso a datos y reportes mediante tokens seguros. Tus clientes ven solo lo que les corresponde —sin compartir contraseñas ni exponer todo tu panel—.",
                badge: "Despachos",
                accent: "blue",
                highlight: false,
              },
            ] as const).map((f, idx) => {
              const iconAccent = {
                indigo: "bg-indigo-50 border-indigo-100 text-indigo-600",
                violet: "bg-violet-50 border-violet-100 text-violet-600",
                emerald: "bg-emerald-50 border-emerald-100 text-emerald-600",
                blue: "bg-blue-50 border-blue-100 text-blue-600",
              }[f.accent];
              const badgeAccent = {
                indigo: "bg-indigo-100 text-indigo-700",
                violet: "bg-violet-100 text-violet-700",
                emerald: "bg-emerald-100 text-emerald-700",
                blue: "bg-blue-100 text-blue-700",
              }[f.accent];
              return (
                <motion.div key={f.title}
                  initial={prefersReducedMotion ? {} : { opacity: 0, y: 14 }}
                  whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.45, delay: idx * 0.05 }}
                  className="h-full">
                  <div className={cn("rounded-2xl border bg-white p-6 h-full flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow",
                    f.highlight ? "border-emerald-300 ring-1 ring-emerald-200" : "border-slate-200")}>
                    <div className="flex items-center justify-between gap-2">
                      <div className={cn("rounded-xl p-2.5 border w-fit", iconAccent)}>{f.icon}</div>
                      <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold", badgeAccent)}>{f.badge}</span>
                    </div>
                    <div className="font-bold text-slate-900">{f.title}</div>
                    <div className="text-sm text-slate-500 leading-relaxed">{f.desc}</div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </Section>

        <Divider />

        <Section id="pricing" eyebrow="Planes" title="Sin letras pequeñas. Sin sorpresas."
          subtitle="XMLs siempre gratis. Los reportes y herramientas están en los planes de pago.">

          {/* Billing toggle */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
              <button
                onClick={() => setBilling("monthly")}
                className={cn("rounded-lg px-5 py-2 text-sm font-medium transition",
                  billing === "monthly" ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700")}
              >
                Mensual
              </button>
              <button
                onClick={() => setBilling("annual")}
                className={cn("rounded-lg px-5 py-2 text-sm font-medium transition flex items-center gap-2",
                  billing === "annual" ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700")}
              >
                Anual
                <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">-20%</span>
              </button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {([
              {
                name: "Individual",
                forWho: "Freelancers y personas físicas",
                monthly: "$199", annual: "$159",
                highlight: null, popular: false,
                features: [
                  "Motor CFDI (emitidos y recibidos)",
                  "Dashboard fiscal",
                  "IA contable (límite diario)",
                  "Exportación Excel/PDF",
                ],
                cta: { label: "Empezar", href: BRAND.ctaSecondary.href },
              },
              {
                name: "Profesional",
                forWho: "El más completo del mercado",
                monthly: "$349", annual: "$279",
                highlight: "Más popular", popular: true,
                features: [
                  "RFCs ilimitados",
                  "Dashboard multi-RFC",
                  "Usuarios y roles",
                  "Bot Fiscal WhatsApp",
                  "IA contable multi-RFC",
                  "Exportación Excel/PDF",
                ],
                cta: { label: "Empezar", href: BRAND.ctaSecondary.href },
              },
              {
                name: "Empresarial",
                forWho: "PyMEs en crecimiento",
                monthly: "$649", annual: "$519",
                highlight: null, popular: false,
                features: [
                  "RFCs ilimitados",
                  "Dashboard corporativo multi-RFC",
                  "Usuarios ilimitados",
                  "Bot Fiscal Avanzado",
                  "IA contable (uso ampliado)",
                  "Exportación Excel/PDF",
                ],
                cta: { label: "Empezar", href: BRAND.ctaSecondary.href },
              },
              {
                name: "Despacho",
                forWho: "Despachos contables",
                monthly: "$999", annual: "$799",
                highlight: null, popular: false,
                features: [
                  "RFCs ilimitados",
                  "Dashboard corporativo multi-RFC",
                  "Colaboradores ilimitados",
                  "Control por cliente",
                  "Bot Fiscal Avanzado",
                  "IA masiva (uso intensivo)",
                  "Exportación Excel/PDF",
                ],
                cta: { label: "Contactar", href: `mailto:${BRAND.contactEmail}` },
              },
            ] as const).map((p, idx) => (
              <motion.div key={p.name}
                initial={prefersReducedMotion ? {} : { opacity: 0, y: 14 }}
                whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.45, delay: idx * 0.05 }}>
                <Card className={cn("p-5 h-full flex flex-col", p.popular && "border-indigo-300 shadow-lg shadow-indigo-100/60 ring-1 ring-indigo-200")}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-base font-bold text-slate-900">{p.name}</div>
                      <div className="mt-0.5 text-xs text-slate-500">{p.forWho}</div>
                    </div>
                    {p.highlight && (
                      <span className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-1 text-[11px] font-bold text-indigo-700 flex-shrink-0">{p.highlight}</span>
                    )}
                  </div>
                  <div className="mt-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold tracking-tight text-slate-900 font-mono tabular-nums">{billing === "monthly" ? p.monthly : p.annual}</span>
                      <span className="text-sm text-slate-500">MXN/mes</span>
                    </div>
                    {billing === "annual" && (
                      <div className="mt-0.5 text-xs text-emerald-600 font-medium">Facturado anualmente</div>
                    )}
                  </div>
                  <div className="mt-4 grid gap-2 flex-1">
                    {p.features.map((f) => (
                      <div key={f} className="flex items-start gap-2">
                        <div className="mt-0.5 rounded-full bg-emerald-100 p-1 flex-shrink-0">
                          <Check className="h-3 w-3 text-emerald-600" />
                        </div>
                        <div className="text-xs text-slate-600 leading-relaxed">{f}</div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5">
                    <Button href={p.cta.href} variant={p.popular ? "primary" : "secondary"} rightIcon={<ArrowRight className="h-4 w-4" />} className="w-full justify-center">{p.cta.label}</Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="rounded-xl bg-emerald-100 p-2 flex-shrink-0 border border-emerald-200">
              <Zap className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="flex-1">
              <span className="font-semibold text-slate-900 text-sm">La descarga de XMLs es gratis en todos los planes. </span>
              <span className="text-sm text-slate-500">Crea tu cuenta sin tarjeta, conecta tu RFC y empieza hoy. Puedes actualizar a un plan de pago cuando necesites los reportes.</span>
            </div>
            <Button href={BRAND.ctaPrimary.href} variant="secondary" rightIcon={<ArrowRight className="h-4 w-4" />} className="flex-shrink-0">Crear cuenta gratis</Button>
          </div>
        </Section>

        <Divider />

        <Section id="faq" eyebrow="FAQ" title="Preguntas frecuentes"
          subtitle="Dudas comunes sobre la plataforma. Para casos específicos (despacho, multi-RFC), escríbenos directo." alt>
          <div className="grid gap-3 md:grid-cols-2">
            {faqs.map((f) => <FAQItem key={f.q} faq={f} />)}
          </div>
        </Section>

        <Divider />

        <section className="py-16 md:py-20">
          <div className="mx-auto max-w-4xl px-4 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-600 uppercase tracking-wider mb-6">
              Empieza hoy · Sin tarjeta
            </div>
            <h3 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">Tus XMLs ya están en el SAT.</h3>
            <h3 className="text-3xl md:text-4xl font-bold tracking-tight text-indigo-600 mt-1">CuentIA los convierte en Excel.</h3>
            <p className="mt-5 text-slate-500 max-w-xl mx-auto leading-relaxed">
              La descarga de CFDIs es completamente gratuita. Los reportes Excel — los que nadie más genera con ese nivel de especificidad — son lo que hace que valga la pena.
            </p>
            <div className="mt-8 flex justify-center flex-wrap gap-3">
              <Button href={BRAND.ctaPrimary.href} variant="primary" rightIcon={<ArrowRight className="h-4 w-4" />}>Crear cuenta gratis</Button>
              <Button href="#demo" variant="emerald" rightIcon={<Download className="h-4 w-4" />}>Ver demo sin cuenta</Button>
              <a href="https://wa.me/526568330819?text=Hola%2C%20me%20interesa%20una%20demo%20de%20CuentIA."
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 hover:bg-slate-50 transition bg-white shadow-sm">
                <MessageCircle className="h-4 w-4" />Hablar por WhatsApp
              </a>
            </div>
          </div>
        </section>

        <footer className="bg-slate-900 py-12">
          <div className="mx-auto max-w-6xl px-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <Image src={logoImg} alt={BRAND.name} height={30} className="h-[30px] w-auto brightness-0 invert" />
                <div className="mt-2 text-sm text-slate-400">XMLs gratis · Reportes Excel que sí puedes usar</div>
                <div className="mt-1 text-xs text-slate-600">Un producto de <span className="font-medium text-slate-500">Aurenix™</span></div>
                <div className="mt-4 flex items-center gap-4">
                  <a href="https://linkedin.com/company/cuentiamx" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="text-slate-500 hover:text-white transition">
                    <Linkedin className="h-4 w-4" />
                  </a>
                  <a href="https://www.facebook.com/profile.php?id=61585586518013" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="text-slate-500 hover:text-white transition">
                    <Facebook className="h-4 w-4" />
                  </a>
                  <a href="https://www.instagram.com/cuentia.mx" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-slate-500 hover:text-white transition">
                    <Instagram className="h-4 w-4" />
                  </a>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-1">
                <a href="#top" className="rounded-lg px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-white/5 transition">Volver arriba</a>
                <a href="/privacidad" className="rounded-lg px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-white/5 transition">Privacidad</a>
                <a href="/terminos" className="rounded-lg px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-white/5 transition">Términos</a>
                <a href={`mailto:${BRAND.contactEmail}`} className="rounded-lg px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-white/5 transition">{BRAND.contactEmail}</a>
              </div>
            </div>
            <div className="mt-8 pt-6 border-t border-slate-800 text-xs text-slate-600 text-center">
              © {new Date().getFullYear()} {BRAND.name} · México
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
