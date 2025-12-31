"use client";

import { useState } from "react";
import { CheckCircle, Eye, EyeOff } from "lucide-react";
import {registerUser, fetchMe} from "../services/authService"; 
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import RecaptchaLoader from "@/components/RecaptchaLoader";
import { useGuestRedirect } from "@/hooks/useGuestRedirect";
import Spinner from "@/components/Spinner";

const tipos = [
  { id: "individual", title: "Individual", desc: "Un solo RFC. Ideal para profesionales y autónomos." },
  { id: "empresarial", title: "Empresarial", desc: "Multi-RFC. Para empresas y despachos contables." },
  { id: "invitado", title: "Invitado",   desc: "No requiere RFC. Bots de WhatsApp incluidos."}
];

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [tipoCuenta, setTipoCuenta] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loadingR, setLoading] = useState(false);
  const router = useRouter();

  const [errors, setErrors] = useState({
    nombre: "",
    telefono: "",
    username: "",
    email: "",
    empresa: "",
    password: "",
    accepted: "", 
  });

  const [form, setForm] = useState({
    nombre: "",
    telefono: "",
    username: "",
    email: "",
    password: "",
    empresa: "",
    fielPass: "",
    accepted: false,
  });

  
  const { user, loading } = useGuestRedirect();
  
  if (loading || user) return <Spinner />;

  const validateFields = () => {
    let newErrors: any = {};
  
    // Nombre
    if (!/^[A-Za-zÁÉÍÓÚÑáéíóúñ ]{3,}$/.test(form.nombre)) {
      newErrors.nombre = "Ingresa un nombre válido (solo letras, mínimo 3 caracteres)";
    }
  
    if (tipoCuenta === "individual" || tipoCuenta === "empresarial") {
      // Teléfono
      if (!/^[0-9]{10}$/.test(form.telefono)) {
        newErrors.telefono = "El teléfono debe contener 10 dígitos";
      }
    }
  
    // Username (solo si no es invitado)
    if (tipoCuenta === "individual") {
      if (!/^[A-Za-z0-9_.-]{4,}$/.test(form.username)) {
        newErrors.username = "El usuario debe tener mínimo 4 caracteres y sin espacios";
      }
    }
  
    // Email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Ingresa un correo válido";
    }
  
    // Empresa (solo empresarial)
    if (tipoCuenta === "empresarial") {
      if (form.empresa.trim().length > 0 && form.empresa.trim().length < 2) {
        newErrors.empresa = "El nombre de la empresa debe tener mínimo 2 caracteres";
      }
    }


    // Password obligatoria y fuerte
    if (!form.password.trim()) {
      newErrors.password = "La contraseña es obligatoria";
    } else {
      const strongPasswordRegex =
        /^(?=.*[a-z])(?=.*\d)(?=.*[\W_]).{8,}$/;
  
      if (!strongPasswordRegex.test(form.password)) {
        newErrors.password =
          "La contraseña es débil (usa mayúsculas, minúsculas, números y símbolos)";
      }
  
      // También validamos contra tu medidor visual
      if (strength < 2) {
        newErrors.password = "La contraseña es demasiado débil";
      }

      if (!form.accepted) {
        newErrors.accepted = "Debes aceptar los términos y la política de privacidad.";
    }
    }
  
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const updateField = <T extends string | boolean>(field: string, value: T) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  // PASSWORD STRENGTH
  const getPasswordStrength = () => {
    const p = form.password;
    let score = 0;

    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;

    return score;
  };

  const strength = getPasswordStrength();
  const strengthLabel = ["Muy débil", "Débil", "Regular", "Fuerte", "Excelente"][strength];
  const strengthColors = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-green-500", "bg-green-600"];

  // FINAL REGISTER (STEP 3)
  const handleRegister = async (e: any) => {
    e.preventDefault();

    if (!validateFields()) return;

    if (loadingR) return;
    setLoading(true);
  
    try {
      const payload = {
        nombre: form.nombre,
        telefono: tipoCuenta === "individual" ? form.telefono : null,
        username: tipoCuenta === "individual" ? form.username : null,
        email: form.email,
        password: form.password,
        empresa: tipoCuenta === "empresarial" ? form.empresa : null,
        tipo_cuenta: tipoCuenta,
        accepted: form.accepted,
      };
  
      const res = await registerUser(payload);

      toast.success("Tu cuenta fue creada con éxito. Hemos enviado un correo para completar tu verificación.");

      window.__accessToken = res.accessToken;
      

      const profile = await fetchMe();
      
      if (!profile.verified) {
        router.push("/validar-cuenta");
        return;
      }

    } catch (e: any) {
      toast.error("No se pudo completar el registro", {
        description: e.message || "Ocurrió un error inesperado. Intenta nuevamente.",
      });
    }
  };


  return (
   <>
    <RecaptchaLoader />
    <div className="flex min-h-screen">
      
      {/* PANEL IZQUIERDO */}
      <div className="hidden lg:flex w-1/2 bg-indigo-900 text-white flex-col justify-center items-center p-12">
        <img src="/logo_cuentia.png" alt="Logo de CuentIA" className="max-w-[350px] w-full h-auto object-contain" />
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
              <button
                disabled={!tipoCuenta}
                onClick={() => setStep(2)}
                className={`mt-6 w-full py-3 rounded-lg font-semibold transition
                  ${tipoCuenta ? "bg-indigo-600 text-white hover:bg-indigo-700" : "bg-gray-300 text-gray-500"}
                `}
              >
                Continuar
              </button>
            </>
          )}

          {/* STEP 2 — FORMULARIO */}
          {step === 2 && (
            <>
              <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">
                Completa tus datos
              </h2>

              <form className="space-y-5">
                <input
                  placeholder="Nombre completo"
                  className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={form.nombre}
                  onChange={(e) => updateField("nombre", e.target.value)}
                  required
                />
                {errors.nombre && <p className="text-red-500 text-sm mt-1">{errors.nombre}</p>}

                {tipoCuenta !== "invitado" &&  (
                 <>
                   <input
                     placeholder="Teléfono"
                     className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                     value={form.telefono}
                     onChange={(e) => updateField("telefono", e.target.value)}
                     required
                   />
                    {errors.telefono && <p className="text-red-500 text-sm mt-1">{errors.telefono}</p>}
                 </>
                )}

                {tipoCuenta !== "invitado" && tipoCuenta !== "empresarial" &&  (
                  <>
                  <input
                    placeholder="Usuario"
                    className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={form.username}
                    onChange={(e) => updateField("username", e.target.value)}
                    required
                  />
                  {errors.username && <p className="text-red-500 text-sm mt-1">{errors.username}</p>}
                  </>            
                )}

                <input
                  type="email"
                  placeholder="Correo electrónico"
                  className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  required
                />
                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}

                {/* Password + indicador */}
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Contraseña"
                    className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={form.password}
                    onChange={(e) => updateField("password", e.target.value)}
                    required
                  />

                  {errors.password && (
                    <p className="text-red-500 text-sm mt-1">{errors.password}</p>
                  )}

                  <div
                    className="absolute right-3 top-3 cursor-pointer text-gray-600"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff /> : <Eye />}
                  </div>

                  {form.password.length > 0 && (
                    <div className="mt-2">
                      <div className="h-2 rounded bg-gray-200">
                        <div
                          className={`h-2 rounded ${strengthColors[strength]}`}
                          style={{ width: `${(strength + 1) * 20}%` }}
                        ></div>
                      </div>
                      <p className="text-sm mt-1 text-gray-700 font-medium">{strengthLabel}</p>
                    </div>
                  )}
                </div>

                {tipoCuenta === "empresarial" && (
                  <>
                  <input
                    placeholder="Nombre de la empresa (opcional)"
                    className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={form.empresa}
                    onChange={(e) => updateField("empresa", e.target.value)}
                  />
                   {errors.empresa && (
                     <p className="text-red-500 text-sm mt-1">
                       {errors.empresa}
                     </p>
                   )}
                  </>
                )}
                  <div className="mt-4 flex items-start gap-3">
                   <input
                     type="checkbox"
                     id="terms"
                     className="mt-1 h-5 w-5 text-indigo-600"
                     checked={form.accepted}
                     onChange={(e) => updateField("accepted", e.target.checked)}
                   />
                 
                   <label htmlFor="terms" className="text-sm text-gray-700 leading-tight">
                     Acepto los{" "}
                     <a href="/terminos" target="_blank" className="text-indigo-600 hover:underline">
                       Términos y Condiciones
                     </a>{" "}
                     y la{" "}
                     <a href="/privacidad" target="_blank" className="text-indigo-600 hover:underline">
                       Política de Privacidad
                     </a>
                     .
                   </label>
                 </div>
                   {errors.accepted && (
                     <p className="text-red-500 text-sm mt-1">{errors.accepted}</p>
                   )}
                  <button
                    type="button"
                    onClick={() => {
                      if (!validateFields()) return;                  
                      // Invitado o Individual → registrar directo
                      handleRegister({ preventDefault: () => {} });
                      return;                                      
                    }}
                    className="w-full py-3 rounded-lg font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition"
                  >
                    Continuar
                  </button>
              </form>
              <button onClick={() => setStep(1)} className="mt-4 w-full text-sm text-indigo-600 hover:underline">
                ← Regresar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
   </>
  );
}
