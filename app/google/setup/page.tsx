"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchMe, googleSetupAccount } from "@/app/services/authService";
import { CheckCircle } from "lucide-react";
import { toast } from "sonner";

const tipos = [
  { id: "individual", title: "Individual", desc: "Un solo RFC. Ideal para profesionales y autónomos." },
  { id: "empresarial", title: "Empresarial", desc: "Multi-RFC. Para empresas y despachos contables." },
  { id: "invitado", title: "Invitado", desc: "No requiere RFC. Acceso limitado." }
];

export default function GoogleSetupPage() {
  const [step, setStep] = useState(1);
  const [tipoCuenta, setTipoCuenta] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [errors, setErrors] = useState<{ empresa?: string }>({});
  const [loading, setLoading] = useState(true);
  const [accepted, setAccepted] = useState(false);

  const router = useRouter();

  // 🔍 VALIDACIÓN antes de mostrar UI
  useEffect(() => {
    const load = async () => {
      try {
        const me = await fetchMe();

        if (me?.provider === undefined) {
          // Aún no cargó user → no hacer nada
          return;
        }

        // ❗ Si el provider NO es google → salida inmediata
        if (me.provider !== "google") {
          router.push("/dashboard/overview");
          return;
        }

        // ❗ Si ya tiene tipo_cuenta diferente del default
        if (me.tipo_cuenta !== null) {
          router.push("/dashboard/overview");
          return;
        }

        // Todo OK → cargar setup
        setLoading(false);

      } catch (err) {
        console.error("Error:", err);
        router.push("/dashboard/overview");
      }
    };

    load();
  }, []);

  const validateEmpresa = () => {
    const e: any = {};

    if (tipoCuenta === "empresarial" && empresa.trim().length > 0 && empresa.trim().length < 2) {
      e.empresa = "El nombre de la empresa debe tener mínimo 2 caracteres";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleContinue = () => {
    if (!tipoCuenta) {
      toast.error("Selecciona un tipo de cuenta");
      return;
    }

    if (!accepted) {
      toast.error("Debes aceptar los términos y condiciones");
      return;
    }

    // Si es empresarial, pasar a step 2
    if (tipoCuenta === "empresarial") {
      setStep(2);
      return;
    }

    // Individual o invitado → guardar directo
    saveData();
  };

  const saveData = async () => {
    if (tipoCuenta === "empresarial" && !validateEmpresa()) return;

    try {
      await googleSetupAccount(
        tipoCuenta,
        tipoCuenta === "empresarial" ? empresa : null,
        accepted // <-- NUEVO
      );

      toast.success("Cuenta configurada correctamente");

      // Empresarial → onboarding
      // Individual / invitado → dashboard
      if (tipoCuenta === "empresarial" || tipoCuenta === "individual") {
        router.push("/onboarding");
      } else {
        router.push("/dashboard/overview");
      }

    } catch (err: any) {
      toast.error(err.message || "Error guardando datos");
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* PANEL IZQUIERDO */}
      <div className="hidden lg:flex w-1/2 bg-indigo-900 text-white flex-col justify-center items-center p-12">
        <img
          src="/logo_cuentia.png"
          alt="Logo de CuentIA"
          className="max-w-[350px] w-full h-auto object-contain"
        />
      </div>

      {/* PANEL DERECHO */}
      <div className="flex w-full lg:w-1/2 justify-center items-center bg-gray-50 px-4">
        <div className="bg-white p-10 rounded-2xl shadow-2xl w-full max-w-md">

          {/* STEP 1 */}
          {step === 1 && (
            <>
              <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">
                Selecciona tu tipo de cuenta
              </h2>

              <div className="space-y-4">
                {tipos.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => setTipoCuenta(t.id)}
                    className={`p-4 rounded-xl border cursor-pointer transition
                      ${tipoCuenta === t.id ? "border-indigo-600 bg-indigo-50" : "border-gray-300"}
                    `}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold">{t.title}</p>
                        <p className="text-gray-500 text-sm">{t.desc}</p>
                      </div>
                      {tipoCuenta === t.id && <CheckCircle className="text-green-500" />}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={accepted}
                  onChange={() => setAccepted(!accepted)}
                  className="mt-1 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                />
              
                <p className="text-sm text-gray-700">
                  Acepto los 
                  <a href="/terminos" target="_blank" className="text-indigo-600 underline ml-1">
                    Términos y Condiciones&nbsp;
                  </a> 
                  y la 
                  <a href="/privacidad" target="_blank" className="text-indigo-600 underline ml-1">
                    Política de Privacidad
                  </a>.
                </p>
              </div>
              <button
                disabled={!tipoCuenta}
                onClick={handleContinue}
                className={`mt-6 w-full py-3 rounded-lg font-semibold transition
                  ${tipoCuenta ? "bg-indigo-600 text-white hover:bg-indigo-700" : "bg-gray-300 text-gray-500"}
                `}
              >
                Continuar
              </button>
            </>
          )}

          {/* STEP 2 — SOLO EMPRESARIAL */}
          {step === 2 && (
            <>
              <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">
                Datos de tu empresa
              </h2>

              <div className="space-y-5">
                <input
                  placeholder="Nombre de la empresa (opcional)"
                  className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={empresa}
                  onChange={(e) => setEmpresa(e.target.value)}
                />
                {errors.empresa && (
                  <p className="text-red-500 text-sm mt-1">{errors.empresa}</p>
                )}
              </div>

              <button
                onClick={saveData}
                className="mt-6 w-full py-3 rounded-lg font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition"
              >
                Guardar y continuar
              </button>

              <button
                onClick={() => setStep(1)}
                className="mt-4 w-full text-sm text-indigo-600 hover:underline"
              >
                ← Regresar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
