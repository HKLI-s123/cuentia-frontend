"use client";

import { apiFetch } from "@/app/services/apiClient";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle } from "lucide-react";
import { API_URL } from "@/utils/env";

export default function Success() {
  const [plan, setPlan] = useState<string | null>(null);

  useEffect(() => {
    apiFetch(`${API_URL}/billing/me-plan`, {})
      .then((r) => r?.json())
      .then((data) => setPlan(data.plan))
      .catch(() => setPlan("error"));
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 relative overflow-hidden">

      {/* Confetti minimalista */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: -20 }}
            animate={{
              opacity: [0, 1, 1, 0],
              y: [0, 300, 500],
              x: Math.sin(i) * 80,
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              delay: i * 0.1,
              repeat: Infinity,
              repeatDelay: 5,
            }}
            className="absolute top-0 w-2 h-2 rounded-full"
            style={{
              left: `${5 + Math.random() * 90}%`,
              backgroundColor:
                i % 3 === 0
                  ? "#4f46e5"
                  : i % 3 === 1
                  ? "#06b6d4"
                  : "#a78bfa",
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-lg bg-slate-900/60 backdrop-blur-xl border border-slate-700/60 p-10 rounded-2xl shadow-2xl shadow-black/50 text-center relative"
      >
        {/* Ícono grande */}
        <CheckCircle className="w-20 h-20 text-emerald-400 mx-auto mb-6 animate-[pulse_2s_ease-in-out_infinite]" />

        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-300 to-cyan-300 bg-clip-text text-transparent mb-2">
          ¡Pago exitoso! 🎉
        </h1>

        <p className="text-slate-300 max-w-md mx-auto mb-8">
          Gracias por confiar en <b>CuentIA</b>.  
          Tu suscripción ha sido aplicada correctamente.
        </p>

        <AnimatePresence mode="wait">
          {!plan ? (
            <motion.p
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-indigo-200"
            >
              Verificando suscripción...
            </motion.p>
          ) : plan === "error" ? (
            <motion.p
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-400 font-semibold"
            >
              Hubo un problema al obtener tu plan.
            </motion.p>
          ) : (
            <motion.p
              key="plan"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-lg"
            >
              Tu plan activo ahora es:{" "}
              <span className="font-semibold text-indigo-300">{plan}</span>
            </motion.p>
          )}
        </AnimatePresence>

        {/* Botón volver */}
        <motion.a
          href="/dashboard/dashboard"
          whileTap={{ scale: 0.96 }}
          className="mt-10 inline-block bg-gradient-to-r from-indigo-500 to-cyan-400 text-slate-900 
          font-semibold py-3 px-6 rounded-xl shadow-lg shadow-black/40 hover:opacity-90 transition"
        >
          Ir al dashboard
        </motion.a>
      </motion.div>
    </div>
  );
}
