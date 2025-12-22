"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Check,
  MessageCircle,
  Receipt,
  Sparkles,
  ShieldCheck,
} from "lucide-react";

/* =========================================
   Reutiliza helpers simples
========================================= */
function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function Button({
  href,
  children,
  variant = "primary",
  rightIcon,
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  rightIcon?: React.ReactNode;
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-white/20";

  const styles = {
    primary:
      "bg-indigo-600 text-white hover:bg-indigo-500 active:scale-[0.98] shadow-lg shadow-indigo-900/40",
    secondary:
      "bg-indigo-900/40 text-white hover:bg-indigo-900/60 border border-indigo-700/40",
  } as const;

  return (
    <a href={href} className={cn(base, styles[variant])}>
      {children}
      {rightIcon}
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

/* =========================================
   Landing Bots
========================================= */
export default function BotsLandingPage() {
  const prefersReducedMotion = useReducedMotion();

  const fadeUp = {
    initial: prefersReducedMotion ? {} : { opacity: 0, y: 14 },
    animate: prefersReducedMotion ? {} : { opacity: 1, y: 0 },
    transition: { duration: 0.5 },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-[#050714] to-indigo-950 text-white">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-indigo-700/20 blur-[140px]" />
        <div className="absolute bottom-[-180px] right-[-140px] h-[480px] w-[480px] rounded-full bg-indigo-900/20 blur-[160px]" />
      </div>

      {/* Header minimal */}
      <header className="relative z-10 border-b border-white/10 bg-indigo-950/70 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-2xl bg-white/10 border border-white/10 grid place-items-center">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="font-semibold">CuentIA</div>
          </a>

          <Button
            href="/register?from=bots"
            variant="primary"
            rightIcon={<ArrowRight className="h-4 w-4" />}
          >
            Activar bot
          </Button>
        </div>
      </header>

      {/* HERO */}
      <main className="relative z-10">
        <section className="pt-20 pb-16 text-center px-4">
          <motion.h1
            {...fadeUp}
            className="text-4xl md:text-6xl font-semibold tracking-tight"
          >
            Registra tus gastos desde{" "}
            <span className="text-indigo-400">WhatsApp</span> con IA
          </motion.h1>

          <motion.p
            {...fadeUp}
            transition={{ delay: 0.05 }}
            className="mt-4 text-base md:text-lg text-slate-300 max-w-2xl mx-auto"
          >
            Envía fotos de tus tickets y comprobantes.  
            CuentIA los organiza automáticamente. {" "}
              <span className="text-white font-medium">
                 Excel instantáneo.
               </span>{" "}
            Sin contabilidad. Sin estrés.
          </motion.p>

          <motion.div
            {...fadeUp}
            transition={{ delay: 0.1 }}
            className="mt-8"
          >
            <Button
              href="/register?from=bots"
              variant="primary"
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              Activar bot gratis
            </Button>
            <p className="mt-2 text-xs text-slate-400">
              1 mes sin costo · No tarjeta · Sin RFC
            </p>
          </motion.div>
        </section>

        {/* PROBLEMA */}
        <section className="pb-14 px-4">
          <div className="mx-auto max-w-4xl">
            <Card className="p-6 md:p-8">
              <div className="text-lg font-semibold">
                ¿Te suena familiar?
              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <CheckItem>Tickets perdidos en el celular</CheckItem>
                <CheckItem>Gastos desordenados</CheckItem>
                <CheckItem>IVA que no cuadra</CheckItem>
                <CheckItem>El contador pidiendo info cada mes</CheckItem>
              </div>
            </Card>
          </div>
        </section>

        {/* SOLUCIÓN */}
        <section className="pb-16 px-4">
          <div className="mx-auto max-w-6xl grid gap-6 md:grid-cols-3">
            {[
              {
                icon: <Receipt className="h-5 w-5" />,
                title: "Envía la foto",
                desc: "Manda tu ticket o comprobante por WhatsApp.",
              },
              {
                icon: <Sparkles className="h-5 w-5" />,
                title: "IA lo entiende",
                desc: "Extrae monto, fecha, IVA y concepto.",
              },
              {
                icon: <MessageCircle className="h-5 w-5" />,
                title: "Queda registrado",
                desc: "Tu gasto se guarda y clasifica automáticamente.",
              },
            ].map((s) => (
              <Card key={s.title} className="p-6">
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl bg-white/10 p-2 border border-white/10">
                    {s.icon}
                  </div>
                  <div>
                    <div className="font-semibold">{s.title}</div>
                    <div className="mt-1 text-sm text-slate-300">
                      {s.desc}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* PARA QUIÉN */}
        <section className="pb-16 px-4">
          <div className="mx-auto max-w-4xl">
            <Card className="p-6 md:p-8">
              <div className="text-lg font-semibold">
                ¿Para quién es este bot?
              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <CheckItem>Freelancers y emprendedores</CheckItem>
                <CheckItem>Personas físicas</CheckItem>
                <CheckItem>Negocios pequeños</CheckItem>
                <CheckItem>Quien quiere su Excel listo sin hacerlo</CheckItem>
              </div>

              <div className="mt-6 text-sm text-slate-300">
                No necesitas RFC ni conocimientos contables para empezar.
              </div>
            </Card>
          </div>
        </section>

        {/* CONFIANZA */}
        <section className="pb-20 px-4">
          <div className="mx-auto max-w-4xl text-center">
            <div className="flex justify-center mb-4">
              <div className="rounded-2xl bg-white/10 p-3 border border-white/10">
                <ShieldCheck className="h-6 w-6" />
              </div>
            </div>
            <p className="text-slate-300">
              Diseñado para México · Enfocado en reglas SAT ·  
              Parte del ecosistema <span className="text-white font-semibold">CuentIA</span>
            </p>

            <div className="mt-8">
              <Button
                href="/register?from=bots"
                variant="primary"
                rightIcon={<ArrowRight className="h-4 w-4" />}
              >
                Activar bot gratis
              </Button>
              <p className="mt-2 text-xs text-slate-400">
                Sin tarjeta · Sin RFC · Cancelas cuando quieras
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
