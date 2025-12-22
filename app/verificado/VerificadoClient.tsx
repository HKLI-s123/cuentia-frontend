"use client";

import { motion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { CheckCircle, XCircle, Clock, Mail, LogIn } from "lucide-react";
import { useState } from "react";
import { secureResendVerification } from "../services/authService";
import { useSession } from "@/hooks/useSession";
import Spinner from "@/components/Spinner";
import { toast } from "sonner";

export default function VerificadoPage() {
  const params = useSearchParams();
  const statusParam = params.get("status") || "error";

  const allowedStatuses = ["success", "expired", "error"] as const;
  type StatusType = typeof allowedStatuses[number];

  const status = allowedStatuses.includes(statusParam as StatusType)
    ? (statusParam as StatusType)
    : "error";

  const [isSending, setIsSending] = useState(false);

  const { user, loading } = useSession();

  if (loading) return <Spinner />;

  const isLoggedIn = !!user;
  const userEmail = user?.email;


  const handleResend = async () => {
    if (!isLoggedIn) {
      toast.error("Debes iniciar sesión para reenviar el correo.");
      return;
    }
  
    setIsSending(true);
  
    try {
      const result = await secureResendVerification();
  
      // Si secureResendVerification devuelve un mensaje especial
      if (result?.message === "Sesión expirada. Inicia sesión de nuevo.") {
        toast.error("Tu sesión ha expirado. Por favor inicia sesión nuevamente.");
        return;
      }
  
      // El backend siempre devuelve { message: "..."}
      if (result?.message) {
        // Mensaje exitoso
        if (result.message.includes("Nuevo enlace enviado")) {
          toast.success(result.message);
        } else {
          // Mensajes como “tu cuenta ya está verificada”
          toast.info(result.message);
        }
      } else {
        toast.error("No se pudo reenviar el enlace. Intenta más tarde.");
      }
  
    } catch (error) {
      console.error(error);
      toast.error("Error al conectar con el servidor.");
    } finally {
      setIsSending(false);
    }
  };

  // Configuración visual
  const states = {
    success: {
      icon: <CheckCircle className="text-green-600" size={88} />,
      title: "¡Cuenta verificada!",
      desc: "Tu correo ha sido confirmado exitosamente. Ya puedes iniciar sesión.",
      showLogin: true,
      showResendForm: false,
      showSupport: false,
    },
    expired: {
      icon: <Clock className="text-yellow-600" size={88} />,
      title: "El enlace ha expirado",
      desc: "Puedes solicitar un nuevo correo de verificación.",
      showLogin: !isLoggedIn,
      showResendForm: isLoggedIn,
      showSupport: true,
    },
    error: {
      icon: <XCircle className="text-red-600" size={88} />,
      title: "Enlace inválido",
      desc: "Si lo necesitas, solicita un nuevo correo.",
      showLogin: !isLoggedIn,
      showResendForm: isLoggedIn,
      showSupport: true,
    },
  };

  const current = states[status];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="bg-white shadow-2xl rounded-3xl p-10 max-w-md w-full text-center border border-gray-200"
      >
        {/* Ícono */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: loading ? 0 : 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 140 }}
          className="flex justify-center mb-6"
        >
          {current.icon}
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: loading ? 0 : 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-3xl font-bold text-gray-800 mb-3"
        >
          {current.title}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: loading ? 0 : 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-gray-600 mb-8 leading-relaxed"
        >
          {current.desc}
        </motion.p>

        {/* Botón de iniciar sesión si NO está logueado */}
        {!isLoggedIn && current.showLogin && (
          <motion.a
            href="/login"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="
              inline-flex items-center justify-center gap-2
              w-full py-3 rounded-xl font-semibold text-white
              bg-indigo-600 hover:bg-indigo-700 transition
            "
          >
            <LogIn size={20} /> Iniciar sesión
          </motion.a>
        )}

        {/* Botón reenviar si está logueado */}
        {isLoggedIn && current.showResendForm && (
          <motion.button
            onClick={handleResend}
            disabled={isSending}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="
              mt-4 w-full py-3 rounded-xl font-semibold text-indigo-700
              border border-indigo-300 hover:bg-indigo-50 transition
              disabled:opacity-50 flex items-center justify-center gap-2
            "
          >
            <Mail size={20} />
            {isSending ? "Enviando..." : "Reenviar verificación"}
          </motion.button>
        )}
        {current.showSupport && (
          <motion.a
            href="/soporte"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="
              mt-4 w-full py-3 rounded-xl font-semibold
              text-indigo-700 border border-indigo-300
              hover:bg-indigo-50 transition
              flex items-center justify-center
            "
          >
            <Mail size={20} />
            Ir a soporte
          </motion.a>
        )}

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ delay: 0.8 }}
          className="text-sm text-gray-400 mt-6"
        >
          CuentIA © {new Date().getFullYear()} — Inteligencia fiscal para todos.
        </motion.p>
      </motion.div>
    </div>
  );
}
