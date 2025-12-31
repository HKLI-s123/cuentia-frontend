"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

import {
  approveManualPayment,
  getManualPayments,
  rejectManualPayment,
} from "@/app/services/billingService";

/* ======================================================
   Types
====================================================== */
interface ManualPayment {
  id: number;
  userId: number;

  code: string; // cuentia_plan_individual | cuentia_bot_gastos
  kind: "plan" | "bot";
  role: "plan" | "addon";

  amount: number;

  reference: string | null;

  status: "pending" | "approved" | "rejected";

  periodStart?: string | null;
  periodEnd?: string | null;

  createdAt: string;
  approvedAt?: string | null;
}

/* ======================================================
   Component
====================================================== */
export default function ManualPaymentsAdmin() {
  const [records, setRecords] = useState<ManualPayment[]>([]);
  const router = useRouter();

  /* ======================================================
     Load data
  ====================================================== */
  const load = async () => {
    const result = await getManualPayments();

    if (!result.ok && result.status === 403) {
      router.push("/dashboard/overview");
      return;
    }

    setRecords(result.data ?? []);
  };

  useEffect(() => {
    load();
  }, []);

  /* ======================================================
     Actions
  ====================================================== */
  const approve = async (id: number) => {
    const res = await approveManualPayment(id);

    if (res.ok) {
      toast.success("Pago aprobado correctamente");
      load();
      return;
    }

    if (res.status === 409) {
      toast.error(res.message || "Conflicto con el estado actual del usuario");
    } else if (res.status === 400) {
      toast.error(res.message || "Solicitud inválida");
    } else {
      toast.error("Error inesperado");
    }
  };

  const reject = async (id: number) => {
    const res = await rejectManualPayment(id);

    if (res.ok) {
      toast.success("Pago rechazado");
      load();
      return;
    }

    toast.error(res.message || "Error al rechazar");
  };

  /* ======================================================
     Helpers
  ====================================================== */
  const formatPeriod = (r: ManualPayment) => {
    if (!r.periodStart || !r.periodEnd) return "—";
    return `${r.periodStart} → ${r.periodEnd}`;
  };

  /* ======================================================
     Render
  ====================================================== */
  return (
    <div className="min-h-screen p-6 md:p-10 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl md:text-4xl font-bold mb-8"
      >
        Pagos manuales
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="backdrop-blur-xl bg-slate-900/60 border border-slate-700/50
                   rounded-2xl shadow-xl shadow-black/40 p-4 md:p-6"
      >
        {/* =========================
           MOBILE – CARDS
        ========================== */}
        <div className="md:hidden space-y-4">
          {records.length === 0 ? (
            <div className="text-center text-slate-400 py-8">
              No hay pagos registrados.
            </div>
          ) : (
            records.map((r) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-800/40 border border-slate-700/40 rounded-xl p-4 space-y-2"
              >
                <div className="flex justify-between">
                  <span className="text-slate-400 text-sm">Usuario</span>
                  <span className="font-semibold">{r.userId}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-400 text-sm">Código</span>
                  <span className="font-semibold text-indigo-300">{r.code}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-400 text-sm">Tipo</span>
                  <div className="flex gap-2">
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                      {r.kind === "plan" ? "Plan" : "Bot"}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      {r.role === "plan" ? "Principal" : "Addon"}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-400 text-sm">Periodo</span>
                  <span className="text-sm">{formatPeriod(r)}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm">Estado</span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold
                      ${
                        r.status === "pending"
                          ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/40"
                          : r.status === "approved"
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                          : "bg-red-500/20 text-red-300 border border-red-500/40"
                      }`}
                  >
                    {r.status}
                  </span>
                </div>

                {r.status === "pending" && (
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => approve(r.id)}
                      className="flex-1 py-2 rounded-lg bg-emerald-500/20 border border-emerald-500/40 
                                 text-emerald-300 font-semibold text-sm hover:bg-emerald-500/30 transition"
                    >
                      Aprobar
                    </button>
                    <button
                      onClick={() => reject(r.id)}
                      className="flex-1 py-2 rounded-lg bg-red-500/20 border border-red-500/40 
                                 text-red-300 font-semibold text-sm hover:bg-red-500/30 transition"
                    >
                      Rechazar
                    </button>
                  </div>
                )}
              </motion.div>
            ))
          )}
        </div>

        {/* =========================
           DESKTOP – TABLE
        ========================== */}
        <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-800/50 mt-6">
          <table className="w-full text-left">
            <thead className="bg-slate-800/60 text-slate-300 text-sm">
              <tr>
                <th className="p-4">Usuario</th>
                <th className="p-4">Código</th>
                <th className="p-4">Tipo</th>
                <th className="p-4">Periodo</th>
                <th className="p-4">Estado</th>
                <th className="p-4">Acciones</th>
              </tr>
            </thead>

            <tbody>
              <AnimatePresence>
                {records.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="p-6 text-center text-slate-500 bg-slate-900/30"
                    >
                      No hay pagos registrados.
                    </td>
                  </tr>
                ) : (
                  records.map((r) => (
                    <motion.tr
                      key={r.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="border-t border-slate-800/50 hover:bg-slate-800/40 transition"
                    >
                      <td className="p-4">{r.userId}</td>
                      <td className="p-4 font-medium text-indigo-300">{r.code}</td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                            {r.kind === "plan" ? "Plan" : "Bot"}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            {r.role === "plan" ? "Principal" : "Addon"}
                          </span>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-slate-400">
                        {formatPeriod(r)}
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold
                            ${
                              r.status === "pending"
                                ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/40"
                                : r.status === "approved"
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                                : "bg-red-500/20 text-red-300 border border-red-500/40"
                            }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="p-4">
                        {r.status === "pending" && (
                          <div className="flex gap-3">
                            <button
                              onClick={() => approve(r.id)}
                              className="px-4 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/40 
                                         text-emerald-300 hover:bg-emerald-500/30 transition font-semibold"
                            >
                              Aprobar
                            </button>
                            <button
                              onClick={() => reject(r.id)}
                              className="px-4 py-1 rounded-lg bg-red-500/20 border border-red-500/40 
                                         text-red-300 hover:bg-red-500/30 transition font-semibold"
                            >
                              Rechazar
                            </button>
                          </div>
                        )}
                      </td>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
