"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { KeyRound, Lock, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { resetPassword } from "../services/authService";
import { useGuestRedirect } from "@/hooks/useGuestRedirect";

export default function RestablecerPage() {
  const params = useSearchParams();
  const router = useRouter();

  const { user, loading } = useGuestRedirect();

  const token = params.get("token");

  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

    // 🟣 Mostrar solo cuando ya se verificó user/loading
  if (loading) return null;
  if (user) return null;

  // 🛑 Ahora SÍ puedes validar el token aquí
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-600 font-semibold">Enlace inválido o expirado.</p>
      </div>
    );
  }

  // Fuerza visual
  const getStrength = () => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  };

  const strength = getStrength();
  const strengthLabel = ["Muy débil", "Débil", "Regular", "Fuerte", "Excelente"][strength];
  const strengthColors = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-green-500", "bg-green-600"];

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    if (password !== confirm) {
      toast.error("Las contraseñas no coinciden");
      return;
    }

    if (strength < 2) {
      toast.error("La contraseña es demasiado débil");
      return;
    }

    setSaving(true);
    
    try {
      const result = await resetPassword(token!, password);

      toast.success(result.message || "Contraseña actualizada");
      router.push("/login");
    } catch (err: any) {
      toast.error(err.message || "No se pudo restablecer la contraseña");
    } finally {
      setSaving(false);
    }
  };

  return (
   <> 
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white shadow-xl p-10 rounded-3xl max-w-md w-full text-center border border-gray-200"
      >

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="flex justify-center mb-6"
        >
          <KeyRound size={72} className="text-indigo-600" />
        </motion.div>

        <h1 className="text-3xl font-bold text-gray-800 mb-3">
          Restablecer contraseña
        </h1>

        <p className="text-gray-600 mb-6">
          Ingresa una nueva contraseña segura para tu cuenta.
        </p>
            <form onSubmit={handleSubmit} className="space-y-5">
            
              {/* Password */}
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
            
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Nueva contraseña"
                  className="w-full pl-10 pr-12 border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
            
                {/* Toggle mostrar/ocultar */}
                <button
                  type="button"
                  className="absolute right-3 top-3 text-gray-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
            
                {password.length > 0 && (
                  <>
                    <div className="h-2 rounded bg-gray-200 mt-2">
                      <div
                        className={`h-2 rounded ${strengthColors[strength]}`}
                        style={{ width: `${(strength + 1) * 20}%` }}
                      />
                    </div>
                    <p className="text-sm text-gray-700 font-medium mt-1">
                      {strengthLabel}
                    </p>
                  </>
                )}
              </div>
            
              {/* Confirm Password */}
              <div className="relative">
                <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
            
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Confirmar contraseña"
                  className="w-full pl-10 pr-12 border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
            
                {/* Toggle igual para confirm */}
                <button
                  type="button"
                  className="absolute right-3 top-3 text-gray-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
            
              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition disabled:opacity-50"
              >
                {saving ? "Guardando..." : "Actualizar contraseña"}
              </button>
            </form>
      </motion.div>
    </div>
   </>
  );
}
