"use client";

import { motion } from "framer-motion";
import {
  Sparkles,
  CalendarClock,
  Smartphone,
  FolderArchive,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";

function Section({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4">
        <div className="max-w-3xl">
          <div className="text-xs uppercase tracking-widest text-slate-400">
            {eyebrow}
          </div>
          <h2 className="mt-2 text-3xl md:text-4xl font-semibold text-white">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-3 text-slate-300 text-lg leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>

        <div className="mt-10">{children}</div>
      </div>
    </section>
  );
}

function Card({
  icon,
  title,
  description,
  bullets,
  highlight,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  bullets: string[];
  highlight?: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl bg-indigo-950/70 border border-indigo-800/40 p-6 shadow-lg shadow-black/30">
      <div className="flex items-start gap-4">
        <div className="rounded-2xl bg-indigo-900/40 border border-indigo-800/30 p-3">
          {icon}
        </div>
        <div>
          <h3 className="text-xl font-semibold text-white">{title}</h3>
          <p className="mt-2 text-slate-300 leading-relaxed">
            {description}
          </p>
        </div>
      </div>

      <ul className="mt-6 grid gap-3 text-sm text-slate-300">
        {bullets.map((b) => (
          <li key={b} className="flex gap-2">
            <span className="text-indigo-400">•</span>
            {b}
          </li>
        ))}
      </ul>

      {highlight && (
        <div className="mt-6 rounded-2xl bg-indigo-900/40 border border-indigo-800/30 p-4">
          {highlight}
        </div>
      )}
    </div>
  );
}

export default function NovedadesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-[#050714] to-indigo-950 text-white">
      {/* HERO */}
      <section className="pt-20 pb-16">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-900/40 border border-indigo-800/30 px-4 py-1 text-sm text-slate-300">
              <Sparkles className="h-4 w-4" />
              Lo que viene en CuentIA
            </div>

            <h1 className="mt-5 text-4xl md:text-5xl font-semibold tracking-tight">
              Construyendo el futuro <br />
              <span className="text-indigo-400">financiero y fiscal</span> de tu negocio
            </h1>

            <p className="mt-4 text-slate-300 text-lg leading-relaxed">
              CuentIA evoluciona constantemente. Estas son las funcionalidades que estamos construyendo para llevar
              CuentIA al siguiente nivel.
            </p>
          </motion.div>
        </div>
      </section>
      {/* ASISTENTE FISCAL INTELIGENTE */}
      <Section
        eyebrow="En desarrollo"
        title="Asistente Fiscal Inteligente"
        subtitle="Monitoreo automático de tu operación fiscal, sin que tengas que pedirlo."
      >
        <Card
          icon={<Sparkles className="h-6 w-6 text-white" />}
          title="Alertas fiscales proactivas"
          description="Estamos construyendo un asistente que analiza tu información fiscal de forma continua para detectar riesgos, inconsistencias y oportunidades antes de que se conviertan en problemas."
          bullets={[
            "Detección automática de inconsistencias de IVA",
            "Alertas por CFDI duplicados o incompletos",
            "Identificación de usos de CFDI atípicos",
            "Notificaciones directas en tu buzón CuentIA",
            "Análisis independiente por RFC (ideal para empresas y despachos)",
          ]}
          highlight={
            <>
              <div className="text-sm font-semibold text-white">
                Beneficio para usuarios actuales
              </div>
              <p className="mt-1 text-sm text-slate-300">
                Este módulo se liberará primero para usuarios activos de CuentIA.
                Quienes ya cuenten con una suscripción tendrán{" "}
                <span className="text-indigo-400 font-semibold">
                  beneficios preferenciales y condiciones especiales
                </span>{" "}
                al activarlo.
              </p>
            </>
          }
        />
      </Section>
      {/* COBRANZA */}
      <Section
        eyebrow="Próximamente"
        title="CuentIA Cobranza"
        subtitle="Automatiza tu flujo de cobros y facturación recurrente desde un solo lugar."
      >
        <Card
          icon={<CalendarClock className="h-6 w-6 text-white" />}
          title="Cobranza inteligente y programada"
          description="Un módulo diseñado para negocios que necesitan controlar cobros, facturación recurrente y relación con clientes."
          bullets={[
            "Programación de facturas automáticas con fechas personalizadas",
            "Gestión de clientes y control de estatus de cobro",
            "Exportación rápida de comprobantes desde CuentIA",
            "Flujos similares a plataformas de cobranza profesional",
          ]}
          highlight={
            <>
              <div className="text-sm font-semibold text-white">
                Beneficio por adopción temprana
              </div>
              <p className="mt-1 text-sm text-slate-300">
                Si ya eres usuario de CuentIA, recibirás un{" "}
                <span className="text-indigo-400 font-semibold">
                  50% de descuento durante 12 meses
                </span>{" "}
                al activar CuentIA Cobranza en su lanzamiento.
              </p>
            </>
          }
        />
      </Section>

      {/* APP MÓVIL */}
      <Section
        eyebrow="En desarrollo"
        title="App móvil CuentIA"
        subtitle="Toda tu operación fiscal y financiera, ahora en tu bolsillo."
      >
        <Card
          icon={<Smartphone className="h-6 w-6 text-white" />}
          title="CuentIA para iOS y Android"
          description="Diseñada para consultar, registrar y monitorear tu información en tiempo real."
          bullets={[
            "Consulta de CFDI emitidos y recibidos",
            "Registro de gastos e ingresos desde el móvil",
            "Notificaciones importantes de tu operación",
            "Sincronización segura con tu cuenta CuentIA",
          ]}
        />
      </Section>

      {/* EXPORT ZIP */}
      <Section
        eyebrow="Nuevo módulo"
        title="Exportación masiva de XML"
        subtitle="Descarga tu información fiscal de forma ordenada y segura."
      >
        <Card
          icon={<FolderArchive className="h-6 w-6 text-white" />}
          title="Exporta todos tus CFDI en un solo ZIP"
          description="Ideal para respaldos, auditorías o trabajo con despachos."
          bullets={[
            "Descarga ZIP de todos tus XML",
            "Exportación por RFC o por cliente",
            "Estructura ordenada por periodos",
            "Compatible con flujos contables y fiscales",
          ]}
        />
      </Section>

      {/* CTA FINAL */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <div className="rounded-3xl bg-indigo-950/70 border border-indigo-800/40 p-8">
            <ShieldCheck className="mx-auto h-8 w-8 text-indigo-400" />
            <h3 className="mt-4 text-2xl font-semibold">
              Ser parte temprano tiene beneficios
            </h3>
            <p className="mt-3 text-slate-300">
              CuentIA está pensada para crecer contigo.  
              Las nuevas funcionalidades premiarán a quienes confían desde hoy.
            </p>

            <a
              href="/register"
              className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 px-6 py-3 font-semibold transition"
            >
              Crear cuenta en CuentIA
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
