"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { submitCustomPlanRequest } from "@/app/services/billingService";

export default function CustomPlanForm() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
  
    const formData = Object.fromEntries(new FormData(e.target));
  
    const result = await submitCustomPlanRequest(formData);
  
    setLoading(false);
  
    if (result.ok) {
      setSent(true);
    } else {
      toast.error(result.reason || "Hubo un error, intenta más tarde.");
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-slate-900/60 backdrop-blur-xl border border-slate-700 p-10 rounded-2xl shadow-xl max-w-lg text-center"
        >
          <h1 className="text-3xl font-bold mb-3 bg-gradient-to-r from-indigo-300 to-cyan-300 text-transparent bg-clip-text">
            ¡Solicitud enviada!
          </h1>
          <p className="text-slate-300">
            Gracias por tu interés en un plan personalizado de CuentIA.  
            Nuestro equipo te contactará muy pronto.
          </p>

          <button
            onClick={() => (window.location.href = "/plans")}
            className="mt-6 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold"
          >
            Volver
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white py-20 px-6">
      {/* GLOW BACKGROUND */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute bottom-0 right-10 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-3xl mx-auto bg-slate-900/60 backdrop-blur-xl border border-slate-700 p-10 rounded-2xl shadow-xl"
      >
        {/* HEADER */}
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-indigo-300 to-cyan-300 text-transparent bg-clip-text">
          Solicitud de Plan Personalizado
        </h1>

        <p className="text-slate-300 mb-10">
          Cuéntanos más sobre tu empresa y tus necesidades. Nuestro equipo te
          preparará una cotización personalizada con funciones y límites adaptados
          a tu operación.
        </p>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="space-y-10">

          {/* 🚀 Información de la Empresa */}
          <section>
            <h2 className="text-xl font-semibold mb-3 text-indigo-300">
              Información de la empresa
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <Input name="empresa" label="Nombre de la empresa" required />
              <Input name="rfc" label="RFC principal" required />
              <Input type="email" name="email" label="Correo de contacto" required />
              <Input name="telefono" label="Teléfono (opcional)" />
            </div>
          </section>

          {/* 📊 Necesidades técnicas */}
          <section>
            <h2 className="text-xl font-semibold mb-3 text-indigo-300">
              Necesidades técnicas
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <Input
                type="number"
                name="rfcs"
                label="Cantidad de RFCs a administrar"
                placeholder="Ej. 50"
                required
              />
              <Input
                type="number"
                name="cfdisMensuales"
                label="Promedio de CFDIs mensuales"
                placeholder="Ej. 2,000"
                required
              />
              <Input
                type="number"
                name="usuarios"
                label="Usuarios internos"
                placeholder="Ej. 10"
                required
              />
            </div>
          </section>

          {/* 🤖 Bots y automatizaciones */}
          <section>
            <h2 className="text-xl font-semibold mb-3 text-indigo-300">
              Bots y automatizaciones
            </h2>

            <div className="space-y-3">
              <Checkbox label="Bot de Gastos (Tickets / OCR)" name="botGastos" />
              <Checkbox label="Bot de Comprobantes (Ingresos)" name="botComprobantes" />
              <Checkbox label="Integraciones personalizadas (API / Webhooks)" name="integraciones" />
            </div>
          </section>

          {/* 🧠 Límites diarios de IA */}
          <section>
            <h2 className="text-xl font-semibold mb-3 text-indigo-300">
              Límites diarios de IA
            </h2>

            <p className="text-slate-400 text-sm mb-4">
              Define los límites diarios que necesitas para tu operación.
              Estos valores nos ayudarán a diseñar un plan a tu medida.
            </p>

            <div className="grid md:grid-cols-2 gap-6">
              <Input
                type="number"
                name="limiteAnalisisCfdiIA"
                label="Análisis diario de CFDI con IA"
                placeholder="Ej. 500"
                required
              />
              <Input
                type="number"
                name="limiteChatbotIA"
                label="Mensajes diarios al chatbot contable"
                placeholder="Ej. 2,000"
                required
              />
            </div>
          </section>

          {/* 📝 Especificaciones adicionales */}
          <section>
            <h2 className="text-xl font-semibold mb-3 text-indigo-300">
              Especificaciones o requerimientos adicionales
            </h2>

            <textarea
              name="detalles"
              rows={5}
              placeholder="Ejemplo: Necesitamos procesar CFDIs de 2 sucursales, incluir reportes mensuales, integrar con ERP interno, etc."
              className="w-full bg-slate-800 p-4 rounded-xl border border-slate-700 
              focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </section>

          {/* SUBMIT */}
          <button
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-indigo-500 to-cyan-400 text-slate-900 
            font-bold rounded-xl hover:opacity-90 transition shadow-lg shadow-indigo-500/20"
          >
            {loading ? "Enviando..." : "Enviar solicitud"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

/* =============================
   Componentes reutilizables
============================= */

function Input({
  label,
  name,
  type = "text",
  required = false,
  placeholder,
}: any) {
  return (
    <div>
      <label className="block text-sm mb-1 text-slate-300">{label}</label>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="w-full bg-slate-800 p-3 rounded-xl border border-slate-700 
        focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
    </div>
  );
}

function Checkbox({ label, name }: any) {
  return (
    <label className="flex items-center gap-3 text-slate-300">
      <input type="checkbox" name={name} className="h-4 w-4" />
      {label}
    </label>
  );
}
