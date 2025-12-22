"use client";

import { useEffect, useState } from "react";
import { getSessionInfo } from "@/app/services/authService";
import { getBillingInfo, updateBillingInfo, getInvoices, openBillingPortal } from "@/app/services/billingService";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import MetodoPagoModal from "./components/MetodoPagoModal";
import { apiFetch } from "@/app/services/apiClient";
import { API_URL } from "@/utils/env";


export default function FacturacionPage() {
  const [session, setSession] = useState<any>(null);
  const [billing, setBilling] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const router = useRouter();

  type PlanInfo = {
    plan: string | null;
    status: "active" | "expired" | "canceled" | "none" | "trialing";
    currentPeriodEnd: string | null;
    paymentMethod: string | null; // 👈 AQUI
    trialEndsAt: string | null;
  };

  const formatPlanName = (plan: string | null) => {
  if (!plan) return "Free";

  return plan
    .replace(/_/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());
  };
  
  const formatStatus = (status?: string | null) => {
    if (!status) return "N/A";
    return status.charAt(0).toUpperCase() + status.slice(1);
  };
  
  const getDaysRemaining = (date?: string | null) => {
    if (!date) return null;
    const end = new Date(date).getTime();
    const now = Date.now();
    const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  };
  
  const [planInfo, setPlanInfo] = useState<PlanInfo | null>(null);
  
  useEffect(() => {
    const loadPlan = async () => {
      try {
        const res = await apiFetch(`${API_URL}/billing/me-plan`);
        const data = await res?.json();

        const normalizedPlan = {
          plan: data?.plan ?? null,
          status: data?.status ?? "none", // active | canceled | expired | none
          currentPeriodEnd: data?.currentPeriodEnd ?? null,
          paymentMethod: data?.paymentMethod ?? null,
          trialEndsAt: data?.trialEndsAt ?? null,
        };
  
        setPlanInfo(normalizedPlan);
  
      } catch (err) {
        console.error("Error cargando plan:", err);
  
        // 🚑 Fallback seguro
        setPlanInfo({
          plan: null,
          status: "none",
          currentPeriodEnd: null,
          paymentMethod: null,
          trialEndsAt: null,
        });
      }
    };
  
    loadPlan();
  }, []);

  
  console.log(planInfo?.status);

  const trialDaysRemaining =
  planInfo?.plan === "cuentia_trial" && planInfo?.trialEndsAt
    ? Math.max(
        0,
        Math.ceil(
          (new Date(planInfo.trialEndsAt).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24)
        )
      )
    : null;

    console.log("pruebaaa",trialDaysRemaining);
    
    const hasActivePlan =
      planInfo?.status !== "canceled";
      
    console.log("payment method",planInfo?.paymentMethod);
  
    const isFreePlan = !planInfo?.plan;
    const daysRemaining = getDaysRemaining(planInfo?.currentPeriodEnd);
    
    const planStyles = isFreePlan
    ? {
        card: "border-gray-200 bg-gray-50",
        badge: "bg-gray-400",
        title: "text-gray-700",
      }
    : planInfo?.plan?.includes("empresa")
    ? {
        card: "border-green-300 bg-green-50",
        badge: "bg-green-600",
        title: "text-green-700",
      }
    : {
        card: "border-indigo-300 bg-indigo-50",
        badge: "bg-indigo-600",
        title: "text-indigo-700",
      };
  
  const statusBadge =
    planInfo?.status === "active"
      ? "bg-green-100 text-green-700"
      : planInfo?.status === "canceled"
      ? "bg-red-100 text-red-700"
      : planInfo?.status === "expired"
      ? "bg-yellow-100 text-yellow-700"
      : "bg-gray-100 text-gray-600";

  const regimenes = [
    { value: "601", label: "601 - Régimen General de Ley Personas Morales" },
    { value: "602", label: "602 - Régimen Simplificado de Ley Personas Morales" },
    { value: "603", label: "603 - Personas Morales con Fines no Lucrativos" },
    { value: "604", label: "604 - Régimen de Pequeños Contribuyentes" },
    { value: "605", label: "605 - Sueldos y Salarios e Ingresos Asimilados a Salarios" },
    { value: "606", label: "606 - Régimen de Arrendamiento" },
    { value: "607", label: "607 - Régimen de Enajenación o Adquisición de Bienes" },
    { value: "608", label: "608 - Régimen de los Demás Ingresos" },
    { value: "609", label: "609 - Régimen de Consolidación" },
    { value: "610", label: "610 - Residentes en el Extranjero sin Establecimiento Permanente en México" },
    { value: "611", label: "611 - Régimen de Ingresos por Dividendos (Socios y Accionistas)" },
    { value: "612", label: "612 - Personas Físicas con Actividades Empresariales y Profesionales" },
    { value: "613", label: "613 - Régimen Intermedio de Personas Físicas con Actividades Empresariales" },
    { value: "614", label: "614 - Régimen de Ingresos por Intereses" },
    { value: "615", label: "615 - Régimen de los Ingresos por Obtención de Premios" },
    { value: "616", label: "616 - Sin Obligaciones Fiscales" },
    { value: "617", label: "617 - PEMEX" },
    { value: "618", label: "618 - Régimen Simplificado de Confianza Personas Físicas" },
    { value: "619", label: "619 - Ingresos por la Obtención de Préstamos" },
    { value: "620", label: "620 - Sociedades Cooperativas de Producción que Optan por Diferir sus Ingresos" },
    { value: "621", label: "621 - Régimen de Incorporación Fiscal" },
    { value: "622", label: "622 - Actividades Agrícolas, Ganaderas, Silvícolas y Pesqueras PM" },
    { value: "623", label: "623 - Régimen Opcional para Grupos de Sociedades" },
    { value: "624", label: "624 - Coordinados" },
    { value: "625", label: "625 - Actividades Empresariales con Ingresos a través de Plataformas Tecnológicas" },
    { value: "626", label: "626 - Régimen Simplificado de Confianza" },
  ];

  const usoCfdiList = [
    { value: "G01", label: "G01 - Adquisición de mercancías" },
    { value: "G02", label: "G02 - Devoluciones, descuentos o bonificaciones" },
    { value: "G03", label: "G03 - Gastos en general" },
  
    { value: "I01", label: "I01 - Construcciones" },
    { value: "I02", label: "I02 - Mobiliario y equipo de oficina" },
    { value: "I03", label: "I03 - Equipo de transporte" },
    { value: "I04", label: "I04 - Equipo de cómputo y accesorios" },
    { value: "I05", label: "I05 - Dados, troqueles, moldes, matrices y herramental" },
    { value: "I06", label: "I06 - Comunicaciones telefónicas" },
    { value: "I07", label: "I07 - Comunicaciones satelitales" },
    { value: "I08", label: "I08 - Otra maquinaria y equipo" },
  
    { value: "D01", label: "D01 - Honorarios médicos, dentales y hospitalarios" },
    { value: "D02", label: "D02 - Gastos médicos por incapacidad o discapacidad" },
    { value: "D03", label: "D03 - Gastos funerales" },
    { value: "D04", label: "D04 - Donativos" },
    { value: "D05", label: "D05 - Intereses reales por créditos hipotecarios" },
    { value: "D06", label: "D06 - Aportaciones voluntarias al SAR" },
    { value: "D07", label: "D07 - Primas por seguros de gastos médicos" },
    { value: "D08", label: "D08 - Gastos de transportación escolar obligatoria" },
    { value: "D09", label: "D09 - Depósitos para el ahorro / primas de pensión" },
    { value: "D10", label: "D10 - Colegiaturas (servicios educativos)" },
  
    { value: "S01", label: "S01 - Sin efectos fiscales" },
    { value: "CP01", label: "CP01 - Pagos" },
    { value: "CN01", label: "CN01 - Nómina" },
  
    // ⚠️ Muy importante: debe incluirse P01 aunque “desapareció” en 4.0,
    // aún muchos PAC lo piden para compatibilidad
    { value: "P01", label: "P01 - Por definir" }
  ];

  const estados = [
  "Aguascalientes",
  "Baja California",
  "Baja California Sur",
  "Campeche",
  "Chiapas",
  "Chihuahua",
  "Ciudad de México",
  "Coahuila",
  "Colima",
  "Durango",
  "Estado de México",
  "Guanajuato",
  "Guerrero",
  "Hidalgo",
  "Jalisco",
  "Michoacán",
  "Morelos",
  "Nayarit",
  "Nuevo León",
  "Oaxaca",
  "Puebla",
  "Querétaro",
  "Quintana Roo",
  "San Luis Potosí",
  "Sinaloa",
  "Sonora",
  "Tabasco",
  "Tamaulipas",
  "Tlaxcala",
  "Veracruz",
  "Yucatán",
  "Zacatecas"
];

  const [form, setForm] = useState({
    rfc: "",
    razonSocial: "",
    regimenFiscal: "612",
    usoCfdi: "G03",
    telefono: "",
    calle: "",
    numero: "",
    cp: "",
    estado: "",
    municipio: "",
    pais: "México"
  });

  const updateField = (f: string, v: string) =>
    setForm((p) => ({ ...p, [f]: v }));

  useEffect(() => {
    const load = async () => {
      try {
        const s = await getSessionInfo();
        setSession(s);

        const info = await getBillingInfo();
        setBilling(info);

        const inv = await getInvoices();
        setInvoices(inv || []);

        if (info) {
          setForm({
            rfc: info.rfc || "",
            razonSocial: info.razonSocial || "",
            regimenFiscal: info.regimenFiscal || "612",
            usoCfdi: info.usoCfdi || "G03",
            telefono: info.telefono || "",
            calle: info.calle || "",
            numero: info.numero || "",
            cp: info.cp || "",
            estado: info.estado || "",
            municipio: info.municipio || "",
            pais: info.pais || "México"
          });
        }
      } catch (err) {
        toast.info("Aun no completas tu onboarding");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  console.log("fin",planInfo);

  const rawPaymentMethod = planInfo?.paymentMethod;
  
  const paymentMethod: "card" | "transfer" | null =
    rawPaymentMethod === "manual_payment" ||
    rawPaymentMethod === "transfer" ||
    rawPaymentMethod === "bank_transfer"
      ? "transfer"
      : rawPaymentMethod === "stripe" ||
        rawPaymentMethod === "card" ||
        rawPaymentMethod?.startsWith("price_") // Stripe priceId
      ? "card"
      : null;


  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh] text-gray-600">
        Cargando facturación...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6 bg-white shadow rounded-2xl border">

      <h1 className="text-2xl font-bold text-gray-800 mb-8">
        Facturación y Pagos
      </h1>

      {/* 1️⃣ PLAN ACTUAL */}
      <div className={`p-5 rounded-2xl border mb-8 ${planStyles.card}`}>
        <div className="flex items-center justify-between">
          <p className={`font-semibold text-lg ${planStyles.title}`}>
             Plan Actual
          </p>
      
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold ${statusBadge}`}
          >
            {formatStatus(planInfo?.status)}
          </span>
        </div>
      
        <div
          onClick={() => router.push("/plans")}
          className={`inline-flex items-center gap-2 px-4 py-1 mt-3 rounded-full text-white cursor-pointer hover:opacity-90 transition ${planStyles.badge}`}
        >
          {formatPlanName(planInfo?.plan || "")}
        </div>
      
        <div className="mt-4 space-y-1 text-sm text-gray-700">
          <p>
            Renovación:&nbsp;
            <strong>
              {planInfo?.currentPeriodEnd
                ? new Date(planInfo.currentPeriodEnd).toLocaleDateString()
                : "N/A"}
            </strong>
          </p>
            {/* 🔹 TRIAL */}
            {trialDaysRemaining !== null && (
              <p className="text-indigo-700">
                Días restantes de prueba:&nbsp;
                <strong>{trialDaysRemaining}</strong>
              </p>
            )}
            
            {/* 🔹 PLAN ACTIVO NORMAL */}
            {daysRemaining !== null && planInfo?.status === "active" && (
              <p className="text-gray-600">
                Días restantes:&nbsp;
                <strong>{daysRemaining}</strong>
              </p>
            )}
        </div>
      
        {/* ⚠️ ALERTA EXPIRA PRONTO */}
        {daysRemaining !== null && daysRemaining <= 5 && planInfo?.status === "active" && (
          <div className="mt-4 rounded-lg bg-yellow-100 border border-yellow-300 p-3 text-sm text-yellow-800">
             Tu plan está por expirar en <strong>{daysRemaining} días</strong>.
            Te recomendamos renovarlo para evitar interrupciones.
          </div>
        )}

        {/* ⚠️ ALERTA FIN DE TRIAL */}
        {trialDaysRemaining !== null && trialDaysRemaining <= 30 && (
          <div className="mt-4 rounded-lg bg-indigo-100 border border-indigo-300 p-3 text-sm text-indigo-800">
             Tu período de prueba finaliza en{" "}
            <strong>{trialDaysRemaining} días</strong>.  
            Elige un plan para continuar usando CuentIA sin interrupciones.
          </div>
        )}
      </div>

      {/* 2️⃣ DATOS FISCALES */}
      <div className="p-5 rounded-xl border mb-8">
        <h2 className="text-lg font-semibold mb-4 text-gray-800">
          Datos Fiscales
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <input className="border p-3 rounded-lg" placeholder="RFC" value={form.rfc}
            onChange={(e) => updateField("rfc", e.target.value.toUpperCase())} />

          <input className="border p-3 rounded-lg" placeholder="Razón Social"
            value={form.razonSocial} onChange={(e) => updateField("razonSocial", e.target.value)} />

          <select className="border p-3 rounded-lg" value={form.regimenFiscal}
            onChange={(e) => updateField("regimenFiscal", e.target.value)}>
            {regimenes.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>

          <select className="border p-3 rounded-lg" value={form.usoCfdi}
            onChange={(e) => updateField("usoCfdi", e.target.value)}>
            {usoCfdiList.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
          </select>

          <div className="flex items-center border rounded-lg overflow-hidden">
            <span className="bg-gray-100 px-3 py-3 text-gray-600 font-medium">+52</span>
            <input
              className="flex-1 p-3 outline-none"
              placeholder="Teléfono de contacto"
              value={form.telefono}
              onChange={(e) => updateField("telefono", e.target.value.replace(/\D/g, ""))}
            />
          </div>

          <input className="border p-3 rounded-lg" placeholder="Calle"
            value={form.calle} onChange={(e) => updateField("calle", e.target.value)} />

          <input className="border p-3 rounded-lg" placeholder="Número"
            value={form.numero} onChange={(e) => updateField("numero", e.target.value)} />

          <input className="border p-3 rounded-lg" placeholder="Código Postal"
            value={form.cp} onChange={(e) => updateField("cp", e.target.value)} />

          <select
            className="border p-3 rounded-lg"
            value={form.estado}
            onChange={(e) => updateField("estado", e.target.value)}
          >
            <option value="">Selecciona un estado</option>
          
            {estados.map((estado) => (
              <option key={estado} value={estado}>
                {estado}
              </option>
            ))}
          </select>

          <input className="border p-3 rounded-lg" placeholder="Municipio"
            value={form.municipio} onChange={(e) => updateField("municipio", e.target.value)} />

        </div>

        <button
          className="mt-4 px-4 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition"
          onClick={async () => {
            try {
              await updateBillingInfo(form);
              toast.success("Datos fiscales actualizados");
            } catch {
              toast.error("No se pudo actualizar");
            }
          }}
        >
          Guardar cambios
        </button>
      </div>

      {/* 3️⃣ HISTORIAL */}
      <div className="p-5 rounded-xl border mb-8">
        <h2 className="text-lg font-semibold mb-4 text-gray-800">
          Historial de facturas
        </h2>

        {invoices.length === 0 ? (
          <p className="text-gray-500">No has generado facturas aún.</p>
        ) : (
          <div className="max-h-80 overflow-y-auto pr-2 space-y-3">
            {invoices.map((i, idx) => (
              <div key={idx} className="border p-4 rounded-lg flex justify-between">
                <div>
                  <p className="font-semibold text-gray-700">Factura {i.folio}</p>
                  <p className="text-gray-600 text-sm">{new Date(i.fecha).toLocaleDateString()}</p>
                  <p className="text-gray-600 text-sm">Total: ${i.total}</p>
                  <p className="text-gray-800 text-sm">UUID SAT: {i.uuid}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* 4️⃣ MÉTODO DE PAGO */}
      <div className="p-5 rounded-xl border">
        <h2 className="text-lg font-semibold mb-2 text-gray-800">
          Método de pago
        </h2>
      
        {/* Estado actual */}
        <p className="text-sm text-gray-600 mb-4">
          Método actual:&nbsp;
          <strong>
            {paymentMethod === "card"
              ? "Tarjeta bancaria"
              : paymentMethod === "transfer"
              ? "Transferencia bancaria"
              : "No configurado"}
          </strong>
        </p>
      
        {/* Avisos */}
        {paymentMethod === "card" && hasActivePlan && (
          <div className="mb-4 rounded-lg border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-800">
            Para cambiar a transferencia, primero debes cancelar tu suscripción
            actual para evitar pagos duplicados.
          </div>
        )}
      
        {paymentMethod === "transfer" && hasActivePlan && (
          <div className="mb-4 rounded-lg border border-blue-300 bg-blue-50 p-3 text-sm text-blue-800">
            Tu plan fue activado mediante transferencia.  
            Para habilitar pagos automáticos (bots y addons), cambia tu método de
            pago a tarjeta.
          </div>
        )}
      
        <div className="flex flex-col sm:flex-row gap-3">
          {/* 🔄 Cambiar método */}
          <button
            disabled={paymentMethod === "card" && hasActivePlan}
            onClick={() => setPaymentOpen(true)}
            className={`px-4 py-3 rounded-lg font-semibold transition ${
              paymentMethod === "card" && hasActivePlan
                ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                : "bg-indigo-600 text-white hover:bg-indigo-700"
            }`}
          >
            {!planInfo?.plan
              ? "Configurar método de pago"
              : paymentMethod === "transfer"
              ? "Cambiar a tarjeta"
              : "Cambiar método de pago"}
          </button>
      
          {/* 💳 Editar tarjeta */}
          {paymentMethod === "card" && hasActivePlan && (
            <button
              onClick={async () => {
                try {
                  await openBillingPortal();
                } catch {
                  toast.error("No se pudo abrir el portal de Stripe");
                }
              }}
              className="px-4 py-3 rounded-lg border border-gray-300 font-semibold text-gray-700 hover:bg-gray-100 transition"
            >
              Editar datos de tarjeta
            </button>
          )}
        </div>
      
        {/* Modal */}
        <MetodoPagoModal
          open={paymentOpen}
          onClose={() => setPaymentOpen(false)}
          paymentMethod={paymentMethod}
          sessionId={session.userId}
        />
      </div>
     </div>
  );
}
