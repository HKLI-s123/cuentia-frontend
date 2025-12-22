"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Cpu,
  ShieldCheck,
  Sparkles,
  Receipt,
  FileSpreadsheet,
  MessageCircle,
  BarChart3,
  Layers,
  Lock,
} from "lucide-react";

/**
 * CuentIA Landing Page
 * - Next.js (App Router) Client Component
 * - TailwindCSS
 * - Framer Motion animations
 *
 * Notes:
 * - Replace CTA hrefs with your real routes.
 * - Replace contact email/domain as needed.
 */

const BRAND = {
  name: "CuentIA",
  tagline: "Inteligencia artificial para tu ",
  subTagline:
    "Automatiza CFDI, IVA, DIOT y reportes en una sola plataforma. Menos errores, más control, más claridad.",
  ctaPrimary: { label: "Crear cuenta gratis", href: "/register" },
  ctaSecondary: { label: "Ver planes", href: "/plans" },
  contactEmail: "contacto@cuentia.mx",
  domain: "cuentia.mx",
};

type FAQ = { q: string; a: string };

type Feature = {
  icon: React.ReactNode;
  title: string;
  desc: string;
  bullets: string[];
};

type Plan = {
  name: string;
  forWho: string;
  highlight?: string;
  cta: { label: string; href: string };
  features: string[];
  accent?: "primary" | "neutral";
};

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function useScrollSpy(ids: string[], offset = 120) {
  const [activeId, setActiveId] = useState<string>(ids[0] ?? "");

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY + offset;
      let current = ids[0] ?? "";

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
}: {
  id: string;
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="py-16 md:py-24">
      <div className="mx-auto w-full max-w-6xl px-4">
        <div className="max-w-3xl">
          {eyebrow ? (
            <div className="text-xs md:text-sm uppercase tracking-widest text-slate-300/80">
              {eyebrow}
            </div>
          ) : null}
          <h2 className="mt-2 text-2xl md:text-4xl font-semibold tracking-tight text-white">
            {title}
          </h2>
          {subtitle ? (
            <p className="mt-3 text-base md:text-lg text-slate-300 leading-relaxed">
              {subtitle}
            </p>
          ) : null}
        </div>
        <div className="mt-10">{children}</div>
      </div>
    </section>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200">
      {children}
    </span>
  );
}

function Button({
  href,
  children,
  variant = "primary",
  rightIcon,
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  rightIcon?: React.ReactNode;
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-2xl px-4 md:px-5 py-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-white/20";

  const styles = {
    primary:
      "bg-indigo-600 text-white hover:bg-indigo-500 active:scale-[0.98] transition-transform shadow-lg shadow-indigo-900/40",
    secondary:
      "bg-indigo-900/40 text-white hover:bg-indigo-900/60 border border-indigo-700/40",
    ghost: "text-white/90 hover:text-white",
  } as const;

  return (
    <a href={href} className={cn(base, styles[variant])}>
      {children}
      {rightIcon ? <span className="opacity-80">{rightIcon}</span> : null}
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
        "rounded-3xl bg-indigo-950/70 border border-indigo-800/40 shadow-lg shadow-black/30",
        className
      )}
    >
      {children}
    </div>
  );
}

function Divider() {
  return <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
      <div className="text-xs text-slate-300">{label}</div>
      <div className="mt-1 text-base font-semibold text-white">{value}</div>
    </div>
  );
}

function CheckItem({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 rounded-full bg-white/10 p-1">
        <Check className="h-4 w-4 text-white" />
      </div>
      <div className="text-sm text-slate-200 leading-relaxed">{children}</div>
    </div>
  );
}

function FAQItem({ faq }: { faq: FAQ }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5">
      <button
        onClick={() => setOpen((s) => !s)}
        className="w-full text-left px-5 py-4 flex items-center justify-between gap-4"
      >
        <div className="text-white font-semibold">{faq.q}</div>
        <ChevronDown
          className={cn(
            "h-5 w-5 text-white/80 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 text-slate-300 leading-relaxed">
              {faq.a}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

export default function CuentIALandingPage() {
  const prefersReducedMotion = useReducedMotion();

  const nav = useMemo(
    () => [
      { id: "top", label: "Inicio" },
      { id: "features", label: "Módulos" },
      { id: "accounts", label: "Cuentas" },
      { id: "how", label: "Cómo funciona" },
      { id: "pricing", label: "Planes" },
      { id: "faq", label: "FAQ" },
      { id: "contact", label: "Contacto" },
    ],
    []
  );

  const activeId = useScrollSpy(nav.map((n) => n.id), 140);

  const features: Feature[] = useMemo(
    () => [
      {
        icon: <Receipt className="h-5 w-5 text-white" />,
        title: "Motor CFDI",
        desc: "Descarga, organiza y detecta cambios en tus CFDI emitidos y recibidos.",
        bullets: [
          "Descarga automática por periodos",
          "Clasificación por tipo, RFC y estatus",
          "Detección de cancelaciones y duplicados",
        ],
      },
      {
        icon: <FileSpreadsheet className="h-5 w-5 text-white" />,
        title: "IVA & DIOT automáticos",
        desc: "Cálculos precisos (16%, 8%, 0% y Exento) y generación de DIOT lista para enviar.",
        bullets: [
          "Bases y tasas correctas por CFDI",
          "Soporte para IVA 0% y Exento",
          "Exportación de archivo DIOT",
        ],
      },
      {
        icon: <MessageCircle className="h-5 w-5 text-white" />,
        title: "Bots de WhatsApp",
        desc: "Registra gastos e ingresos desde WhatsApp con OCR inteligente.",
        bullets: [
          "Envía tickets y comprobantes",
          "Extracción automática de datos",
          "Ideal para empezar incluso sin RFC",
        ],
      },
      {
        icon: <BarChart3 className="h-5 w-5 text-white" />,
        title: "Dashboards inteligentes",
        desc: "Visualiza ingresos vs egresos y toma decisiones con claridad.",
        bullets: [
          "Vista mensual/anual",
          "Análisis por RFC y categorías",
          "Alertas y recomendaciones",
        ],
      },
      {
        icon: <ShieldCheck className="h-5 w-5 text-white" />,
        title: "Seguridad & cumplimiento",
        desc: "Control por roles y protección de información fiscal.",
        bullets: [
          "Roles: dueño, empleado, consulta",
          "Cifrado y buenas prácticas",
          "Actualizaciones por cambios fiscales",
        ],
      },
    ],
    []
  );

  const accounts = useMemo(
    () => [
      {
        title: "Invitado",
        desc: "Empieza sin RFC. Ordena tus gastos y flujos desde el día uno.",
        icon: <Sparkles className="h-5 w-5 text-white" />,
        bullets: ["Ideal para probar", "Bots de WhatsApp", "Agrega RFC después"],
      },
      {
        title: "Individual",
        desc: "Personas físicas que quieren control fiscal y financiero sin complicaciones.",
        icon: <Cpu className="h-5 w-5 text-white" />,
        bullets: ["CFDI", "IVA/DIOT", "Reportes"],
      },
      {
        title: "Empresarial",
        desc: "PYMES y empresas que necesitan orden, compliance y visión en tiempo real.",
        icon: <Layers className="h-5 w-5 text-white" />,
        bullets: ["Multi-RFC opcional", "Roles y permisos", "Dashboards"],
      },
      {
        title: "Despacho",
        desc: "Gestiona múltiples clientes, RFC y periodos desde un solo panel.",
        icon: <Lock className="h-5 w-5 text-white" />,
        bullets: ["Multi-cliente", "Multi-RFC", "Flujos escalables"],
      },
    ],
    []
  );

  const plans: Plan[] = useMemo(
    () => [
      {
        name: "Free / Invitado",
        forWho: "Para empezar sin RFC",
        highlight: "Empieza en minutos",
        cta: { label: "Crear cuenta", href: BRAND.ctaPrimary.href },
        features: [
          "Acceso básico al panel",
          "Registro de gastos con bots (add-on)",
          "Explora CuentIA sin compromiso",
        ],
        accent: "neutral",
      },
      {
        name: "Individual",
        forWho: "Personas físicas",
        highlight: "Más popular",
        cta: { label: "Ver planes", href: BRAND.ctaSecondary.href },
        features: [
          "CFDI emitidos y recibidos",
          "IVA & DIOT automáticos",
          "Dashboards y exportaciones",
        ],
        accent: "primary",
      },
      {
        name: "Empresarial",
        forWho: "PYMES y equipos",
        highlight: "Listo para crecer",
        cta: { label: "Ver planes", href: BRAND.ctaSecondary.href },
        features: [
          "Roles y permisos",
          "Add-ons por módulo",
          "Soporte para operación continua",
        ],
        accent: "neutral",
      },
    ],
    []
  );

  const faqs: FAQ[] = useMemo(
    () => [
      {
        q: "¿Necesito RFC para empezar?",
        a: "No. Puedes iniciar como invitado y después agregar tu RFC cuando estés listo con una cuenta individual.",
      },
      {
        q: "¿CuentIA sustituye a un contador?",
        a: "No. CuentIA es una herramienta que potencia el trabajo contable: automatiza tareas repetitivas, reduce errores y facilita el cumplimiento.",
      },
      {
        q: "¿Es compatible con CONTPAQi u otros sistemas?",
        a: "CuentIA está diseñada para generar información consistente y exportable. Puedes integrarla a tu flujo contable mediante exportaciones y procesos del despacho.",
      },
      {
        q: "¿Qué tan segura es mi información?",
        a: "Aplicamos buenas prácticas de seguridad, control por roles y almacenamiento en nube con protección de datos. La seguridad es parte del diseño.",
      },
    ],
    []
  );

  const fadeUp = {
    initial: prefersReducedMotion ? {} : { opacity: 0, y: 12 },
    animate: prefersReducedMotion ? {} : { opacity: 1, y: 0 },
    transition: { duration: 0.5 },
  };

  return (
  <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-[#050714] to-indigo-950 text-white">
      {/* Background glow */}
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
     <div className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-indigo-700/20 blur-[140px]" />
     <div className="absolute top-[25%] right-[-140px] h-[420px] w-[420px] rounded-full bg-indigo-800/15 blur-[140px]" />
     <div className="absolute bottom-[-180px] left-[-140px] h-[480px] w-[480px] rounded-full bg-indigo-900/20 blur-[160px]" />
    </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-indigo-950/70 backdrop-blur-xl border-b border-indigo-800/40">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <a href="#top" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-2xl bg-white/10 border border-white/10 grid place-items-center">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="font-semibold leading-none">{BRAND.name}</div>
              <div className="text-[11px] text-slate-300">CuentIA Suite</div>
            </div>
          </a>

          <nav className="hidden md:flex items-center gap-1">
            {nav.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className={cn(
                  "rounded-xl px-3 py-2 text-sm transition",
                  activeId === item.id
                  ? "bg-indigo-700/30 text-white"
                  : "text-slate-300 hover:text-white"
                )}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Button href={BRAND.ctaSecondary.href} variant="secondary">
              {BRAND.ctaSecondary.label}
            </Button>
            <Button
              href={BRAND.ctaPrimary.href}
              variant="primary"
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              {BRAND.ctaPrimary.label}
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main id="top" className="relative">
        <div className="mx-auto w-full max-w-6xl px-4 pt-14 md:pt-20 pb-10 md:pb-14">
          <div className="grid gap-10 md:grid-cols-12 md:items-center">
            <motion.div
              {...fadeUp}
              className="md:col-span-7"
            >
              <div className="flex flex-wrap gap-2">
                <Badge>Diseñada para México</Badge>
                <Badge>CFDI • IVA • DIOT</Badge>
                <Badge>IA + Automatización</Badge>
              </div>
              <h1 className="mt-4 text-4xl md:text-6xl font-semibold tracking-tight">
                {BRAND.tagline}
                  <span className="text-indigo-400">contabilidad</span>,{" "}
                  <span className="text-indigo-300">impuestos</span> y{" "}
                  <span className="text-indigo-200">finanzas</span>
              </h1>
              <p className="mt-4 text-base md:text-lg text-slate-300 leading-relaxed max-w-2xl">
                {BRAND.subTagline}
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Button
                  href={BRAND.ctaPrimary.href}
                  variant="primary"
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                >
                  {BRAND.ctaPrimary.label}
                </Button>
                <Button href={BRAND.ctaSecondary.href} variant="secondary">
                  {BRAND.ctaSecondary.label}
                </Button>
                  <p className="text-xs text-slate-400 mt-1">
                    Prueba 1 mes sin costo • No solicitamos tarjeta
                  </p>
                <a
                  href="#how"
                  className="text-sm text-slate-300 hover:text-white transition inline-flex items-center gap-2"
                >
                  Ver cómo funciona <ArrowRight className="h-4 w-4" />
                </a>
              </div>

              <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3">
                <Stat label="Enfoque" value="SAT / México" />
                <Stat label="Ahorro" value="Horas por mes" />
                <Stat label="Riesgo" value="Menos errores" />
                <Stat label="Modelo" value="Modular" />
              </div>
            </motion.div>

            <motion.div
              initial={prefersReducedMotion ? {} : { opacity: 0, y: 12 }}
              animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.05 }}
              className="md:col-span-5"
            >
              <Card className="p-5 md:p-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-slate-300">Vista general</div>
                  <Badge>Demo UI</Badge>
                </div>

                <div className="mt-4 grid gap-3">
                  <div className="rounded-2xl bg-indigo-900/40 border border-indigo-800/30 p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold">Panel fiscal</div>
                      <div className="text-xs text-slate-300">Última sync: hoy</div>
                    </div>
                      <div className="mt-3 grid grid-cols-2 gap-3">
                        <div className="rounded-3xl border border-indigo-700/30 bg-indigo-900/40 shadow-lg shadow-black/30 p-4">
                          <div className="text-xs text-slate-400 uppercase tracking-wide">
                            CFDI
                          </div>
                          <div className="mt-1 text-lg font-semibold text-white">
                            Listos
                          </div>
                        </div>
                      
                        <div className="rounded-3xl border border-indigo-700/30 bg-indigo-900/40 shadow-lg shadow-black/30 p-4">
                          <div className="text-xs text-slate-400 uppercase tracking-wide">
                            IVA / DIOT
                          </div>
                          <div className="mt-1 text-lg font-semibold text-white">
                            Calculado
                          </div>
                        </div>
                      </div>
                  </div>
                  <div className="rounded-2xl bg-indigo-900/40 border border-indigo-800/30 p-4">
                    <div className="flex items-start gap-3">
                      <div className="rounded-2xl bg-white/10 p-2 border border-white/10">
                        <ShieldCheck className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-semibold">Control por roles</div>
                        <div className="mt-1 text-sm text-slate-300 leading-relaxed">
                          Dueño, empleado y consulta. Cada quien ve lo que debe.
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-indigo-900/40 border border-indigo-800/30 p-4">
                    <div className="flex items-start gap-3">
                      <div className="rounded-2xl bg-white/10 p-2 border border-white/10">
                        <MessageCircle className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-semibold">Bots listos para operar</div>
                        <div className="mt-1 text-sm text-slate-300 leading-relaxed">
                          Registra gastos desde WhatsApp con OCR. Ideal para iniciar como invitado.
                        </div>
                      </div>
                    </div>
                  </div>

                  <Divider />

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-slate-300">¿Listo para empezar?</div>
                    <Button href={BRAND.ctaPrimary.href} variant="secondary">
                      Crear cuenta
                    </Button>
                  </div>
                </div>
              </Card>

              <div className="mt-4 text-xs text-slate-400">
                * Este bloque es una representación visual. Puedes reemplazarlo por capturas reales.
              </div>
            </motion.div>
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-4">
          <Divider />
        </div>

        {/* Features */}
        <Section
          id="features"
          eyebrow="Módulos"
          title="Todo lo que necesitas para operar con orden"
          subtitle="CuentIA centraliza la descarga y el análisis de CFDI, automatiza IVA/DIOT y te da una vista clara para decidir mejor."
        >
          <div className="grid gap-5 md:grid-cols-2">
            {features.map((f, idx) => (
              <motion.div
                key={f.title}
                initial={prefersReducedMotion ? {} : { opacity: 0, y: 14 }}
                whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.45, delay: idx * 0.03 }}
              >
                <Card className="p-5 md:p-6">
                  <div className="flex items-start gap-3">
                    <div className="rounded-2xl bg-white/10 p-2 border border-white/10">
                      {f.icon}
                    </div>
                    <div>
                      <div className="text-lg font-semibold">{f.title}</div>
                      <div className="mt-1 text-sm text-slate-300 leading-relaxed">
                        {f.desc}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3">
                    {f.bullets.map((b) => (
                      <CheckItem key={b}>{b}</CheckItem>
                    ))}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Badge>
              <ShieldCheck className="h-3.5 w-3.5 mr-2" /> Seguridad por diseño
            </Badge>
            <Badge>
              <Cpu className="h-3.5 w-3.5 mr-2" /> Automatización inteligente
            </Badge>
            <Badge>
              <Sparkles className="h-3.5 w-3.5 mr-2" /> Pagas solo lo que usas
            </Badge>
          </div>
        </Section>

        <div className="mx-auto max-w-6xl px-4">
          <Divider />
        </div>

        {/* Accounts */}
        <Section
          id="accounts"
          eyebrow="Tipos de cuenta"
          title="Una experiencia para cada perfil"
          subtitle="Empieza como invitado o conecta tu RFC. CuentIA se adapta a tu operación: individual, empresarial o despacho."
        >
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {accounts.map((a, idx) => (
              <motion.div
                key={a.title}
                initial={prefersReducedMotion ? {} : { opacity: 0, y: 14 }}
                whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.45, delay: idx * 0.04 }}
                whileHover={prefersReducedMotion ? {} : { y: -4 }}
              >
                <Card className="p-5 md:p-6 h-full">
                  <div className="flex items-center justify-between">
                    <div className="text-lg font-semibold">{a.title}</div>
                    <div className="rounded-2xl bg-white/10 p-2 border border-white/10">
                      {a.icon}
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-slate-300 leading-relaxed">
                    {a.desc}
                  </div>

                  <div className="mt-5 grid gap-3">
                    {a.bullets.map((b) => (
                      <CheckItem key={b}>{b}</CheckItem>
                    ))}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </Section>

        <div className="mx-auto max-w-6xl px-4">
          <Divider />
        </div>

        {/* How it works */}
        <Section
          id="how"
          eyebrow="Flujo"
          title="Cómo funciona"
          subtitle="Un proceso simple que reduce trabajo manual y te da claridad desde el primer día."
        >
          <div className="grid gap-6 md:grid-cols-12">
            <motion.div
              initial={prefersReducedMotion ? {} : { opacity: 0, y: 14 }}
              whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.5 }}
              className="md:col-span-7"
            >
              <Card className="p-6">
                <ol className="grid gap-5">
                  {[
                    {
                      t: "Crea tu cuenta",
                      d: "Empieza como invitado o con tu RFC. Configura roles si tienes equipo.",
                    },
                    {
                      t: "Conecta y sincroniza",
                      d: "CuentIA descarga, organiza y valida CFDI emitidos y recibidos por periodos.",
                    },
                    {
                      t: "Automatiza IVA y DIOT",
                      d: "Calcula bases y tasas, genera reportes y exporta la DIOT con consistencia.",
                    },
                    {
                      t: "Consulta dashboards",
                      d: "Visualiza ingresos/egresos, tendencias y alertas para operar con control.",
                    },
                  ].map((s, i) => (
                    <li key={s.t} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="h-9 w-9 rounded-2xl bg-white/10 border border-white/10 grid place-items-center font-semibold">
                          {i + 1}
                        </div>
                        {i < 3 ? (
                          <div className="mt-2 h-full w-px bg-white/10" />
                        ) : null}
                      </div>
                      <div>
                        <div className="font-semibold">{s.t}</div>
                        <div className="mt-1 text-sm text-slate-300 leading-relaxed">
                          {s.d}
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              </Card>
            </motion.div>

            <motion.div
              initial={prefersReducedMotion ? {} : { opacity: 0, y: 14 }}
              whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="md:col-span-5"
            >
              <Card className="p-6">
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl bg-white/10 p-2 border border-white/10">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-lg font-semibold">Diseñada para operar</div>
                    <div className="mt-1 text-sm text-slate-300 leading-relaxed">
                      CuentIA se integra a tu flujo: menos reprocesos, más consistencia y control por roles.
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid gap-3">
                  <CheckItem>Automatización enfocada en SAT</CheckItem>
                  <CheckItem>Arquitectura modular (add-ons)</CheckItem>
                  <CheckItem>Escalable para despachos</CheckItem>
                </div>

                <div className="mt-7 rounded-3xl bg-indigo-900/40 border border-indigo-800/30 p-4">
                  <div className="text-sm font-semibold">Listo para crecer contigo</div>
                  <div className="mt-2 text-sm text-slate-300 leading-relaxed">
                    Empieza simple y activa módulos conforme los necesites.
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button href={BRAND.ctaSecondary.href} variant="secondary">
                      Ver planes
                    </Button>
                    <Button href={BRAND.ctaPrimary.href} variant="primary">
                      Crear cuenta
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        </Section>

        <div className="mx-auto max-w-6xl px-4">
          <Divider />
        </div>

        {/* Pricing */}
        <Section
          id="pricing"
          eyebrow="Planes"
          title="Planes flexibles, sin letras pequeñas"
          subtitle="CuentIA es modular: elige un plan base y agrega bots o multi-RFC cuando lo necesites."
        >
          <div className="grid gap-5 md:grid-cols-3">
            {plans.map((p, idx) => {
              const primary = p.accent === "primary";
              return (
                <motion.div
                  key={p.name}
                  initial={prefersReducedMotion ? {} : { opacity: 0, y: 14 }}
                  whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.25 }}
                  transition={{ duration: 0.45, delay: idx * 0.05 }}
                >
                  <Card
                    className={cn(
                      "p-6 h-full",
                      primary && "bg-white/10 border-white/15"
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-lg font-semibold">{p.name}</div>
                        <div className="mt-1 text-sm text-slate-300">{p.forWho}</div>
                      </div>
                      {p.highlight ? (
                        <Badge>{p.highlight}</Badge>
                      ) : null}
                    </div>

                    <div className="mt-5 grid gap-3">
                      {p.features.map((f) => (
                        <CheckItem key={f}>{f}</CheckItem>
                      ))}
                    </div>

                    <div className="mt-6">
                      <Button
                        href={p.cta.href}
                        variant={primary ? "primary" : "secondary"}
                        rightIcon={<ArrowRight className="h-4 w-4" />}
                      >
                        {p.cta.label}
                      </Button>
                    </div>

                    <div className="mt-5 text-xs text-slate-400">
                      * Precios y límites pueden variar por módulos (bots, multi-RFC, etc.).
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </Section>

        <div className="mx-auto max-w-6xl px-4">
          <Divider />
        </div>

        {/* FAQ */}
        <Section
          id="faq"
          eyebrow="FAQ"
          title="Resolvemos las dudas comunes"
          subtitle="Si quieres una demo o tienes un caso específico (despacho, multi-RFC, bots), contáctanos."
        >
          <div className="grid gap-4 md:grid-cols-2">
            {faqs.map((f) => (
              <FAQItem key={f.q} faq={f} />
            ))}
          </div>
        </Section>

        <div className="mx-auto max-w-6xl px-4">
          <Divider />
        </div>

        {/* Contact */}
        <Section
          id="contact"
          eyebrow="Contacto"
          title="¿Quieres una demo?"
          subtitle="Cuéntanos tu escenario (individual, empresa o despacho) y te ayudamos a activar el mejor flujo."
        >
          <div className="grid gap-6 md:grid-cols-12">
            <motion.div
              initial={prefersReducedMotion ? {} : { opacity: 0, y: 14 }}
              whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.5 }}
              className="md:col-span-7"
            >
              <Card className="p-6">
                <div className="text-lg font-semibold">Contacto directo</div>
                <div className="mt-2 text-sm text-slate-300 leading-relaxed">
                  Escríbenos y te compartimos una demo y recomendaciones según tu operación.
                </div>

                <div className="mt-6 grid gap-3">
                  <div className="rounded-2xl bg-indigo-900/40 border border-indigo-800/30 p-4">
                    <div className="text-xs text-slate-300">Email</div>
                    <div className="mt-1 font-semibold">{BRAND.contactEmail}</div>
                  </div>
                  <div className="rounded-2xl bg-indigo-900/40 border border-indigo-800/30 p-4">
                    <div className="text-xs text-slate-300">Sitio</div>
                    <div className="mt-1 font-semibold">{BRAND.domain}</div>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Button href={BRAND.ctaPrimary.href} variant="primary">
                    Crear cuenta
                  </Button>
                  <Button href={BRAND.ctaSecondary.href} variant="secondary">
                    Ver planes
                  </Button>
                </div>
              </Card>
            </motion.div>

            <motion.div
              initial={prefersReducedMotion ? {} : { opacity: 0, y: 14 }}
              whileInView={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="md:col-span-5"
            >
              <Card className="p-6">
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl bg-white/10 p-2 border border-white/10">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-lg font-semibold">Confianza</div>
                    <div className="mt-1 text-sm text-slate-300 leading-relaxed">
                      Seguridad, control y consistencia fiscal. Construida para operar con información sensible.
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid gap-3">
                  <CheckItem>Control por roles y permisos</CheckItem>
                  <CheckItem>Buenas prácticas de protección de datos</CheckItem>
                  <CheckItem>Actualizaciones por cambios fiscales</CheckItem>
                </div>

                <div className="mt-7 rounded-3xl bg-indigo-900/40 border border-indigo-800/30 p-4">
                  <div className="text-sm font-semibold">Implementación modular</div>
                  <div className="mt-2 text-sm text-slate-300 leading-relaxed">
                    Activa módulos y add-ons según tu necesidad: bots, multi-RFC y más.
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        </Section>
        <section className="py-16">
          <div className="mx-auto max-w-4xl px-4 text-center">
            <h3 className="text-2xl md:text-3xl font-semibold">
              Empieza a operar con claridad fiscal
            </h3>
            <p className="mt-3 text-slate-300">
              Menos reprocesos. Menos errores. Más control desde el primer día.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Button href={BRAND.ctaPrimary.href} variant="primary">
                Crear cuenta gratis
              </Button>
              <Button href={BRAND.ctaSecondary.href} variant="secondary">
                Ver planes
              </Button>
            </div>
          </div>
        </section>
        {/* Footer */}
        <footer className="py-10">
          <div className="mx-auto max-w-6xl px-4">
            <Divider />
            <div className="mt-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="font-semibold">© {new Date().getFullYear()} {BRAND.name}</div>
                <div className="text-sm text-slate-400">Inteligencia fiscal y financiera</div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <a
                  href="#top"
                  className="rounded-xl px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition"
                >
                  Volver arriba
                </a>
                <a
                  href="/privacidad"
                  className="rounded-xl px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition"
                >
                  Privacidad
                </a>
                <a
                  href="/terminos"
                  className="rounded-xl px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition"
                >
                  Términos
                </a>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
