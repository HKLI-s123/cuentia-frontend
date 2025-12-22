"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { requestPasswordReset } from "../services/authService";
import RecaptchaLoader from "@/components/RecaptchaLoader";
import { useGuestRedirect } from "@/hooks/useGuestRedirect";

export default function RecuperarPage() {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);

  const { user, loading } = useGuestRedirect();
  if (loading || user) return null;

  const handleSend = async (e: any) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Ingresa un correo válido");
      return;
    }

    setSending(true);
    try {
      const result = await requestPasswordReset(email);

      toast.success(result.message || "Si la cuenta existe, enviamos un correo.");

    } catch {
      toast.error("No se pudo enviar el enlace. Intenta más tarde.");
    } finally {
      setSending(false);
    }
  };

  return (
   <>
    <RecaptchaLoader />
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white shadow-xl p-10 rounded-3xl max-w-md w-full text-center border border-gray-200"
      >

        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="flex justify-center mb-6"
        >
          <Mail size={72} className="text-indigo-600" />
        </motion.div>

        <h1 className="text-3xl font-bold text-gray-800 mb-3">
          Recuperar contraseña
        </h1>

        <p className="text-gray-600 mb-6">
          Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
        </p>

        <form onSubmit={handleSend} className="space-y-5">
          <input
            type="email"
            placeholder="tu-correo@ejemplo.com"
            className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <button
            type="submit"
            disabled={sending}
            className="w-full py-3 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition disabled:opacity-50"
          >
            {sending ? "Enviando..." : "Enviar enlace"}
          </button>
        </form>

        <a
          href="/login"
          className="flex items-center justify-center gap-2 mt-6 text-sm text-indigo-600 hover:underline"
        >
          <ArrowLeft size={18} /> Regresar al login
        </a>
          <p className="mt-4 text-xs text-gray-500">
            ¿Necesitas ayuda? Escríbenos a{" "}
            <a 
              href="mailto:soporte@cuentia.mx" 
              className="text-indigo-600 hover:underline font-medium"
            >
              soporte@cuentia.mx
            </a>
          </p>
      </motion.div>
    </div>
  </>
  );
}
