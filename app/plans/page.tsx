"use client";

import { useEffect, useState } from "react";
import { motion, LayoutGroup, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import { apiFetch, publicApiFetch } from "../services/apiClient";
import PaymentMethodModal from "./PaymentMethodModal"; // o la ruta donde lo guardaste
import { openBillingPortal, upgradePlan } from "../services/billingService";
import { toast } from "sonner";
import { getSessionOptional } from "../services/authService";
import { API_URL } from "@/utils/env";

type PlanStatus = "none" | "active" | "canceled" | "expired" | "past_due";

type ActiveBot = {
  code: string;
  priceId: string;
  stripeItemId: string;
};

type TipoCuenta = "invitado" | "individual" | "empresarial";

const PLANS = [
  {
    name: "Inicial",
    code: "cuentia_plan_individual",
    monthlyPriceId: "price_1TZHlBKg1JUMkNoEhUi663pN",
    annualPriceId: "price_1TZHlsKg1JUMkNoEEuQfmvG8",
    monthlyText: "$199 MXN/mes",
    annualText: "$159 MXN/mes (facturado anualmente)",
    tag: "Ideal para freelancers",
    popular: false,
    features: [
      "RFCs ilimitados",
      "Hasta 10,000 XMLs/facturas al mes",
      "Motor CFDI",
      "Dashboard",
      "IA contable (límite diario incluido)",
      "Análisis individual de CFDI con IA (cuota diaria por plan)",
      "Exportación Excel/PDF (Ingresos, Egresos, Nomina)",
    ],
  },
  {
    name: "Profesional",
    code: "cuentia_plan_profesional",
    monthlyPriceId: "price_1TZHmrKg1JUMkNoEeHnuCKOt",
    annualPriceId: "price_1TZHnVKg1JUMkNoEh7DSh5K5",
    monthlyText: "$349 MXN/mes",
    annualText: "$279 MXN/mes (facturado anualmente)",
    tag: "Mejor balance",
    popular: true,
    features: [
      "RFCs ilimitados",
      "Hasta 50,000 XMLs/facturas al mes",
      "Dashboard multi-RFC",
      "Usuarios y roles",
      "Bot Fiscal WhatsApp",
      "IA contable multi-RFC (límite diario incluido)",
      "Análisis individual de CFDI con IA (cuota diaria por plan)",
      "Exportación Excel/PDF (Ingresos, Egresos y Nómina)",
    ],
  },
  {
    name: "Empresarial",
    code: "cuentia_plan_empresarial",
    monthlyPriceId: "price_1TZHoJKg1JUMkNoEJfKMtQa1",
    annualPriceId: "price_1TZHpUKg1JUMkNoEX13M1ATt",
    monthlyText: "$649 MXN/mes",
    annualText: "$519 MXN/mes (facturado anualmente)",
    tag: "Ideal para PyMEs",
    popular: false,
    features: [
      "RFCs ilimitados",
      "Hasta 100,000 XMLs/facturas al mes",
      "Dashboard corporativo multi-RFC",
      "Usuarios ilimitados",
      "Bot Fiscal Avanzado",
      "Asistente contable con IA (uso diario ampliado)",
      "Análisis avanzado de CFDI con IA (límite diario por plan)",
      "Exportación Excel/PDF (Ingresos, Egresos y Nómina)",
    ],
  },
  {
    name: "Despacho",
    code: "cuentia_plan_despacho",
    monthlyPriceId: "price_1TalTYKg1JUMkNoEqgqbpQTT",
    annualPriceId: "price_1TalUkKg1JUMkNoEPiPE2Rs8",
    monthlyText: "$999 MXN/mes",
    annualText: "$799 MXN/mes (facturado anualmente)",
    tag: "Para despachos contables",
    popular: false,
    features: [
      "RFCs ilimitados",
      "Hasta 300,000 XMLs/facturas al mes",
      "Dashboard corporativo multi-RFC",
      "Colaboradores ilimitados",
      "Control por cliente",
      "Bot Fiscal Avanzado",
      "Asistente contable con IA (uso intensivo diario)",
      "Análisis masivo de CFDI con IA (cuotas diarias elevadas)",
      "Exportación Excel/PDF (Ingresos, Egresos y Nómina)",
    ],
  },
];

const BOTS = [
  {
    name: "Bot de Comprobantes",
    priceId: "price_1Sfp92Kg1JUMkNoEx3TnaGkO",
    priceText: "$49 MXN/mes",
    description:
      "Captura una foto de tu comprobante o transferencia y obtén todos los datos listos para registrar ingresos. Olvídate de teclear: procesa y factura más rápido.",
  },
  {
    name: "Bot de Gastos",
    priceId: "price_1Sfp9AKg1JUMkNoEqeudW1zj",
    priceText: "$49 MXN/mes",
    description:
      "Escanea tus tickets con una foto. El OCR extrae automáticamente los datos, clasifica el gasto y lo deja listo para tu contabilidad. Rápido, preciso y sin esfuerzo.",
  },
];

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [activePlan, setActivePlan] = useState<string | null>(null);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">(
    "monthly"
  );
  const [showModal, setShowModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [selectedPriceId, setSelectedPriceId] = useState<string | null>(null);
  const [planCode, setPlanCode] = useState<string | null>(null);
  const [billingMode, setBillingMode] = useState<string | null>(null);
  const [planStatus, setPlanStatus] = useState<PlanStatus>("none");
  const [session, setSession] = useState<any>(null);
  const [activeBots, setActiveBots] = useState<ActiveBot[]>([]);
  const [sessionLoaded, setSessionLoaded] = useState(false);

  const redirectToLogin = () => {
    const next = encodeURIComponent("/plans");
    window.location.href = `/login?next=${next}`;
  };

  let tipo_cuenta = "";

  useEffect(() => {
    publicApiFetch(`${API_URL}/billing/me-plan`)
      .then(r => r?.json())
    .then(data => {
        setPlanCode(data.plan); // string | null
  
        // 🔑 fuente única de verdad
        const status: PlanStatus = data.status ?? "none";
        setPlanStatus(status);
        setBillingMode(data.billingMode);
        setActiveBots(Array.isArray(data.bots) ? data.bots : []);
      
      });

      const load = async () => {
            try {
              const data = await getSessionOptional();
              setSession(data);
            } catch (err: any) {
              console.error("Error cargando sesión:", err);
        
              // Si el backend devuelve 401 → no hay sesión → login
              if (err?.status === 401 || err?.status === 403) {
                localStorage.removeItem("accessToken"); 
               // window.location.href = "/login";
              }
        
              // fallback por si otro error raro ocurre
              //window.location.href = "/login";
            } finally {
                setSessionLoaded(true);
            }
          };
      load();
  }, []);

  tipo_cuenta = session?.tipoCuenta;
  const planActual = planCode;

  const canSeePlans: Record<TipoCuenta, boolean> = {
    invitado: false,
    individual: true,
    empresarial: true,
  };
  
  const canSeeBotPack = tipo_cuenta === "invitado";
  
  const allowedPlanCodesByAccount: Record<TipoCuenta, string[]> =  {
    individual: ["cuentia_plan_individual"],
    empresarial: [
      "cuentia_plan_profesional",
      "cuentia_plan_empresarial",
      "cuentia_plan_despacho",
    ],
    invitado: [],
  };


  const INVITADO_BOT_PLAN_TO_PRICE: Record<string, string> = {
    cuentia_bot_comprobantes: "price_1ScxiyKWIz2QT93c6K8sc0Cl",
    cuentia_bot_gastos: "price_1ScxhdKWIz2QT93cIt58WcIg",
  };

  const isBotActive = (priceId: string) => {
    if (tipo_cuenta === "invitado") {
      if (planStatus !== "active") return false;
  
      // Paquete: ambos bots
      if (planCode === "cuentia_start_bots_2") return true;
  
      // Bot individual: solo el que coincida con su priceId
      return INVITADO_BOT_PLAN_TO_PRICE[planCode ?? ""] === priceId;
    }
    return activeBots.some(bot => bot.priceId === priceId);
  };

  const isInvitado = tipo_cuenta === "invitado";

  /**
   * Invitado: paquete de 2 bots
   */
  const hasStartBotsPack =
    isInvitado &&
    planStatus === "active" &&
    planCode === "cuentia_start_bots_2";
  
  /**
   * Bots individuales
   * - Invitado → por plan
   * - Otros → por addons
   */
  const hasIndividualBots = isInvitado
    ? (
        planStatus === "active" &&
        (planCode === "cuentia_bot_comprobantes" ||
         planCode === "cuentia_bot_gastos")
      )
    : activeBots.length > 0;

  const handleSubscribe = async (priceId: string, planCode: string) => {
    if (isPublic) {
      redirectToLogin();
      return;
    }
    // Usuario YA tiene plan activo → hacemos upgrade/downgrade
    if (planStatus === "canceled") {
      setSelectedPriceId(priceId);
      setSelectedPlan(planCode);
      setShowModal(true);
      return;
    }

    if(planStatus === "expired"){
       try {
         await openBillingPortal();
       } catch {
         toast.error("No se pudo abrir el portal de Stripe");
       }
      return;
    }

    if (planStatus === "active" && planActual !== "cuentia_trial") {
      toast.message("Confirmar cambio de plan", {
        description:
          "Estás a punto de cambiar tu plan. El ajuste de cobro se hará automáticamente.",
        action: {
          label: "Continuar",
          onClick: async () => {
            try {
              setLoading(priceId);
    
              await upgradePlan(priceId);
    
              toast.success("Tu plan fue actualizado correctamente");
              setTimeout(() => window.location.reload(), 1200);
            } catch (err) {
              console.error(err);
              toast.error("No se pudo cambiar el plan.");
            } finally {
              setLoading(null);
            }
          },
        },
      });
    
      return; // ⛔ Importante: detener flujo aquí
    }
  
    // Si NO tiene plan (o está expirado) → usar Checkout
    setSelectedPriceId(priceId);
    setSelectedPlan(planCode);
    setShowModal(true);
  };

  const handleBotSubscribe = async (priceId: string) => {
    if (isPublic) {
      redirectToLogin();
      return;
    }
    // 🟡 Ya tiene un bot activo (individual o paquete)
    if (planStatus === "active" && planCode !== "cuentia_trial" && tipo_cuenta === "invitado") {
      toast.message("Confirmar cambio de bot", {
        description:
          "Solo puedes tener un bot activo a la vez. El cambio se reflejará automáticamente en tu facturación.",
        action: {
          label: "Continuar",
          onClick: async () => {
            try {
              setLoading(priceId);

              await upgradePlan(priceId);

              toast.success("Bot actualizado correctamente");
              setTimeout(() => window.location.reload(), 1200);
            } catch (err) {
              console.error(err);
              toast.error("No se pudo cambiar el bot.");
            } finally {
              setLoading(null);
            }
          },
        },
      });

      return; // ⛔ IMPORTANTE
    }

    setSelectedPriceId(priceId);
    setSelectedPlan(tipo_cuenta === "invitado" ? "plan" : "bot");
    setShowModal(true);
  };

  const canBuyBot = (tipo_cuenta === "invitado") || (planStatus === "active" && planCode !== "cuentia_trial" && billingMode === 'stripe');

  const tipoCuenta = session?.tipoCuenta as TipoCuenta | undefined;

  const isPublic = !tipoCuenta;

  const renderDespachoAsGridCard = tipoCuenta === "empresarial";
  
  const visiblePlans = (() => {
    if (isPublic) return PLANS;

    if (!canSeePlans[tipoCuenta]) return [];
  
    const allowed = allowedPlanCodesByAccount[tipoCuenta];
    return PLANS.filter(p => allowed.includes(p.code));
  })();

  const isSinglePlan =
    !isPublic &&
    tipoCuenta === "individual" &&
    visiblePlans.length === 1;


  const canSeeCustomPlan =
  isPublic || tipoCuenta === "empresarial";

  const planGridCols =
  visiblePlans.length === 1
    ? "md:grid-cols-1"
    : visiblePlans.length === 2
    ? "md:grid-cols-2"
    : "md:grid-cols-3";


  if (!sessionLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-slate-900">
        <span className="animate-pulse text-slate-500">
          Cargando planes…
        </span>
      </div>
    );
  }

  return (
   <>
    <PaymentMethodModal
        open={showModal}
        onClose={() => setShowModal(false)}
        plan={selectedPlan}
        priceId={selectedPriceId}
    />
    <div className="landing-cuentia min-h-screen overflow-x-clip bg-white text-slate-900">
      {/* Retícula fina tipo papel contable — coherente con la landing */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
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

      <div className="relative max-w-6xl mx-auto px-6 py-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <p className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 mb-4">
            CuentIA Billing
          </p>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900">
            Planes y precios para{" "}
            <span className="text-indigo-600">
              automatizar tu contabilidad
            </span>
          </h1>
          <p className="mt-4 text-slate-500 max-w-2xl mx-auto leading-relaxed">
            Elige el plan que se adapta a tu operación. Actualiza o agrega bots
            cuando tu negocio crezca.
          </p>
        </motion.div>

        {/* Toggle Mensual / Anual */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="flex justify-center mb-12"
        >
          <LayoutGroup>
            <div className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1">
              {(["monthly", "annual"] as const).map((cycle) => (
                <button
                  key={cycle}
                  onClick={() => setBillingCycle(cycle)}
                  className="relative px-5 py-2 text-sm font-medium rounded-lg"
                >
                  {billingCycle === cycle && (
                    <motion.span
                      layoutId="pill"
                      className="absolute inset-0 rounded-lg bg-white shadow-sm"
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 30,
                      }}
                    />
                  )}
                  <span
                    className={`relative z-10 inline-flex items-center gap-2 ${
                      billingCycle === cycle
                        ? "text-slate-900"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {cycle === "monthly" ? "Mensual" : "Anual"}
                    {cycle === "annual" && (
                      <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                        -20%
                      </span>
                    )}
                  </span>
                </button>
              ))}
            </div>
          </LayoutGroup>
        </motion.div>

        {/* PLANES */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.08 } },
          }}
          className={`grid ${planGridCols} gap-6 mb-14 ${
            isSinglePlan ? "max-w-md mx-auto" : ""
          }`}        
        >
         {visiblePlans
            .filter(p =>
              renderDespachoAsGridCard
                ? true
                : p.code !== "cuentia_plan_despacho"
            )          .map((plan) => {
            const priceText =
              billingCycle === "monthly"
                ? plan.monthlyText
                : plan.annualText;

            const priceId =
              billingCycle === "monthly"
                ? plan.monthlyPriceId
                : plan.annualPriceId;

            const isCurrentPlan = planCode === plan.code;
            const isPopular = plan.popular;

            return (
              <motion.div
                key={plan.code}
                variants={{
                  hidden: { opacity: 0, y: 20, scale: 0.97 },
                  visible: { opacity: 1, y: 0, scale: 1 },
                }}
                whileHover={{ y: -4, scale: 1.01 }}
                transition={{ type: "spring", stiffness: 260, damping: 25 }}
                className={`relative rounded-2xl border bg-white p-6 shadow-sm ${
                  isPopular
                    ? "border-indigo-300 ring-1 ring-indigo-200 shadow-lg shadow-indigo-100/60 md:-mt-4"
                    : "border-slate-200"
                }`}
              >
                {/* Badge "Más popular" */}
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <div className="rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white shadow-sm">
                      Más popular
                    </div>
                  </div>
                )}

                {/* Encabezado */}
                <div className="mb-4">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-xl font-bold text-slate-900">
                      {plan.name}
                    </h2>
                    <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                      {plan.tag}
                    </span>
                  </div>

                  <div className="mt-3">
                    <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
                      {priceText}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {billingCycle === "monthly"
                        ? "Facturación mensual"
                        : "Cobro anual adelantado"}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">Precios incluyen IVA e impuestos</div>
                  </div>
                    {isCurrentPlan && planStatus === "active" && (
                      <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                        <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        Plan actualmente contratado
                      </div>
                    )}

                    {isCurrentPlan && planStatus === "past_due" && (
                      <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                        <span className="inline-block h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                        Pago pendiente · Actualiza tu método de pago
                      </div>
                    )}
                    
                    {isCurrentPlan && planStatus === "expired" && (
                      <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                        <span className="inline-block h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                        Plan caducado · Renueva para continuar
                      </div>
                    )}
                    
                    {isCurrentPlan && planStatus === "canceled" && (
                      <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">
                        <span className="inline-block h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
                        Plan cancelado · contratalo nuevamente
                      </div>
                    )}
                </div>

                {/* Features */}
                <ul className="mt-4 space-y-2 text-sm text-slate-600">
                  {plan.features.map((f, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2 hover:text-slate-900 transition-colors"
                    >
                      <Check className="mt-[2px] h-4 w-4 text-emerald-600 flex-shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                {/* Button */}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleSubscribe(priceId, plan.code)}
                  disabled={isCurrentPlan && planStatus === "active"} 
                  className={`mt-6 w-full py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-colors ${
                    isCurrentPlan && planStatus === "active"
                      ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                      : isPopular
                      ? "bg-indigo-600 text-white hover:bg-indigo-700"
                      : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                  }`}
                >
                {loading === priceId
                  ? "Redirigiendo..."
                  : isPublic
                  ? "Inicia sesión para contratar"
                  : isCurrentPlan && planStatus === "past_due"
                  ? "Regularizar pago"
                  : isCurrentPlan && planStatus === "expired"
                  ? "Renovar"
                  : isCurrentPlan && planStatus === "canceled"
                  ? "Contratar nuevamente"
                  : isCurrentPlan && planStatus === "active"
                  ? "Plan activo"
                  : "Contratar"}
                </motion.button>
              </motion.div>
            );
          })}
        </motion.div>

      {/* Plan Despacho abajo (Enterprise-like) */}
      {!renderDespachoAsGridCard &&
        visiblePlans.some(p => p.code === "cuentia_plan_despacho") && (
      <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ duration: 0.4 }}
            className="mb-16"
          >
            {(() => {
              const plan = PLANS[3]; // Despacho
              const priceText =
                billingCycle === "monthly"
                  ? plan.monthlyText
                  : plan.annualText;
              const priceId =
                billingCycle === "monthly"
                  ? plan.monthlyPriceId
                  : plan.annualPriceId;
              const isCurrentPlan = planCode === plan.code;

              return (
                <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
                  <div className="absolute right-0 top-0 h-32 w-32 bg-indigo-100/60 blur-2xl" />
                  <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        {plan.name}
                        <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                          Alto volumen
                        </span>
                      </h2>
                      <p className="mt-2 text-slate-500 max-w-xl leading-relaxed">
                        Diseñado para despachos contables que administran
                        cientos de RFCs, múltiples colaboradores y requieren
                        control total por cliente y automatización avanzada.
                      </p>
                      <div className="mt-4 text-2xl font-bold text-slate-900 font-mono tabular-nums">
                        {priceText}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        {billingCycle === "monthly"
                          ? "Facturación mensual"
                          : "Cobro anual adelantado"}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">Precios incluyen IVA e impuestos</div>
                        {isCurrentPlan && planStatus === "active" && (
                          <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            Plan actualmente contratado
                          </div>
                        )}
                        {isCurrentPlan && planStatus === "past_due" && (
                          <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                            <span className="inline-block h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                            Pago pendiente · Actualiza tu método de pago
                          </div>
                        )}                        
                        {isCurrentPlan && planStatus === "expired" && (
                          <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                            <span className="inline-block h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                            Plan caducado · Renueva para continuar
                          </div>
                        )}
                        
                        {isCurrentPlan && planStatus === "canceled" && (
                          <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700">
                            <span className="inline-block h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
                            Plan cancelado · Puedes contratarlo nuevamente
                          </div>
                        )}
                    </div>

                    <div className="md:w-72">
                      <ul className="space-y-2 text-sm text-slate-600">
                        {plan.features.map((f, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-2 hover:text-slate-900 transition-colors"
                          >
                            <Check className="mt-[2px] h-4 w-4 text-emerald-600 flex-shrink-0" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>

                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={() => handleSubscribe(priceId, plan.code)}
                        disabled={isCurrentPlan && planStatus === "active"} 
                        className={`mt-6 w-full py-2.5 rounded-xl text-sm font-semibold shadow-sm transition-colors ${
                          isCurrentPlan && planStatus === "active"
                            ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                            : "bg-indigo-600 text-white hover:bg-indigo-700"
                        }`}
                      >
                        {loading === priceId
                          ? "Redirigiendo..."
                          : isPublic
                          ? "Inicia sesión para contratar"
                          : isCurrentPlan && planStatus === "past_due"
                          ? "Regularizar pago"
                          : isCurrentPlan && planStatus === "expired"
                          ? "Renovar"
                          : isCurrentPlan && planStatus === "canceled"
                          ? "Contratar nuevamente"
                          : isCurrentPlan && planStatus === "active"
                          ? "Plan activo"
                          : "Contratar"}
                      </motion.button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </motion.div>
        </AnimatePresence>
        )}
        {canSeeCustomPlan && (
        <motion.div
          whileHover={{ y: -3, scale: 1.01 }}
          transition={{ type: "spring", stiffness: 260, damping: 22 }}
          className="rounded-2xl border border-purple-200 bg-purple-50 p-8 shadow-sm mt-10 mb-16"
        >
          <h2 className="text-3xl font-bold text-purple-900 mb-2">
            Plan Personalizado
          </h2>
          <p className="text-purple-700 mb-4 max-w-xl leading-relaxed">
            Ideal para empresas que requieren mayor capacidad de procesamiento que la ofrecida en nuestros planes estándar.
            Ajustamos el volumen de XMLs/facturas mensuales, procesos operativos y necesidades de integración,
            brindando una solución a la medida.
          </p>
        
          <ul className="space-y-2 text-purple-800 text-sm mb-6">
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-purple-500" /> Volumen de XMLs/facturas personalizado
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-purple-500" /> Usuarios y roles avanzados
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-purple-500" /> Bots personalizados
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-purple-500" /> IA contable ampliada
            </li>
            <li className="flex items-center gap-2">
              <Check className="h-4 w-4 text-purple-500" /> Integraciones API
            </li>
          </ul>
        
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => window.location.href = "/plans/custom"}
            className="w-full py-3 rounded-xl bg-purple-600
            text-white font-semibold text-sm shadow-sm hover:bg-purple-700
            transition"
          >
            Solicitar cotización
          </motion.button>
        </motion.div>
        )}

        {tipo_cuenta === "invitado" && canSeeBotPack && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 25 }}
            className="mb-20"
          >
            <div className="relative rounded-2xl border border-indigo-200 bg-white p-6 md:p-8 shadow-sm">

              {/* Badge */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <div className="rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white shadow-sm">
                  Ideal para invitados
                </div>
              </div>

              {/* Header */}
              <div className="text-center mb-6">
                <h2 className="text-2xl md:text-3xl font-bold text-slate-900">
                  CuentIA Start Bots
                </h2>
                <p className="text-slate-500 mt-2 max-w-xl mx-auto leading-relaxed">
                  Empieza a registrar gastos e ingresos desde WhatsApp, reduce tiempo en facturacion y
                  captura de datos.
                </p>
              </div>
        
              {/* Features */}
              <ul className="max-w-md mx-auto space-y-3 text-sm text-slate-600 mb-8">
                <li className="flex items-start gap-2">
                  <Check className="mt-[2px] h-4 w-4 text-emerald-600 flex-shrink-0" />
                  <span>Bot de Gastos (OCR automático)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="mt-[2px] h-4 w-4 text-emerald-600 flex-shrink-0" />
                  <span>Bot de Comprobantes (ingresos y transferencias)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="mt-[2px] h-4 w-4 text-emerald-600 flex-shrink-0" />
                  <span>No requiere plan contable</span>
                </li>
              </ul>
        
              {/* Actions */}
              <div className="grid md:grid-cols-1 gap-2 max-w-lg mx-auto">
                {/* 2 BOTS */}
                  <motion.button
                    whileTap={
                      !hasStartBotsPack && !hasIndividualBots ? { scale: 0.97 } : undefined
                    }
                    disabled={hasStartBotsPack || hasIndividualBots}
                    onClick={() => {
                      setSelectedPriceId("price_1Sfp8TKg1JUMkNoEMfEgWzZ0");
                      setSelectedPlan("cuentia_start_bots");
                      setShowModal(true);
                    }}
                    className={`w-full py-3 rounded-xl font-semibold text-sm transition
                      shadow-sm
                      ${
                        hasStartBotsPack || hasIndividualBots
                          ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                          : "bg-emerald-600 text-white hover:bg-emerald-700"
                      }
                    `}
                  >
                    {hasStartBotsPack
                      ? "Paquete activo"
                      : "2 Bots · $79 MXN / mes"}
                  </motion.button>
              </div>
              {hasStartBotsPack && (
                <p className="mt-4 text-sm text-emerald-600 text-center">
                  Ya tienes activo el paquete de 2 bots.
                </p>
              )}
              {/* Footer note */}
              {hasIndividualBots && (
                <p className="mt-4 text-sm text-amber-600 text-center">
                  Debes cancelar tus bots individuales antes de contratar el paquete completo.
                </p>
              )}
              <p className="text-xs text-slate-500 mt-6 text-center">
                Podrás cancelar este paquete en cualquier momento.
              </p>
            </div>
          </motion.div>
        )}

        {/* BOTS */}
        <motion.div
          id="bots"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mt-24 scroll-mt-24"
        >
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4">
            Bots de WhatsApp
          </h2>
          <p className="text-slate-500 mb-6 max-w-2xl leading-relaxed">
            Puedes contratar bots aunque aún no tengas RFC. Ideales para
            empezar a ordenar tus gastos e ingresos desde el día uno.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
          {BOTS.map((bot) => {
            const active = isBotActive(bot.priceId);
          
            const blockedByPack = hasStartBotsPack;

            return (
              <motion.div
                key={bot.priceId}
                whileHover={{ y: -3, scale: 1.01 }}
                transition={{ type: "spring", stiffness: 260, damping: 22 }}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <h3 className="text-xl font-bold text-slate-900">
                  {bot.name}
                </h3>

                <p className="text-indigo-600 font-bold mt-1">
                  {bot.priceText}
                </p>

                <p className="text-slate-500 mt-2 leading-relaxed">
                  {bot.description}
                </p>
                 <motion.button
                   whileTap={
                     !active && canBuyBot && !blockedByPack ? { scale: 0.97 } : undefined
                   }
                   disabled={active || !canBuyBot || blockedByPack}
                   onClick={() => {
                     if (!active && canBuyBot && !blockedByPack) {
                       handleBotSubscribe(bot.priceId);
                     }
                   }}
                   className={`
                     mt-4 w-full py-2.5 rounded-xl font-semibold text-sm transition-all
                     shadow-sm
                     ${
                       active
                         ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                         : blockedByPack
                         ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                         : canBuyBot
                         ? "bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                         : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                     }
                   `}
                 >
                   {active
                     ? "Bot activo"
                     : blockedByPack
                     ? "Incluido en paquete"
                     : isPublic
                     ? "Inicia sesión para activar"
                     : canBuyBot
                     ? "Activar Bot"
                     : "Requiere plan activo"}
                 </motion.button>
                {active && (
                  <p className="text-xs text-emerald-600 mt-2">
                    Este bot ya está activo en tu suscripción.
                  </p>
                )}

                {!canBuyBot && !active && billingMode !== "manual" && !isPublic &&(
                  <p className="text-xs text-amber-600 mt-2">
                    Los bots requieren un plan activo en cuentas empresariales o individuales.
                  </p>
                )}
                {hasStartBotsPack && !active && (
                  <p className="text-xs text-amber-600 mt-2">
                    Para contratar bots individuales debes cancelar el paquete primero.
                  </p>
                )}
                {billingMode === 'manual' && (
                  <p className="text-xs text-amber-600 mt-2">
                    Los bots requieren un plan con pago automático (tarjeta).{" "}
                    <a
                      href="/configuracion/billing"
                      className="underline font-medium text-amber-700 hover:text-amber-800 transition"
                    >
                      Cambia tu método de pago
                    </a>
                  </p>
                )}
              </motion.div>
            );
          })}
          </div>
        </motion.div>
      </div>
    </div>
   </>
  );
 }
