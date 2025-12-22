"use client";

import { useEffect, useState } from "react";
import { getSessionInfo } from "@/app/services/authService";
import { getBotStatus } from "@/app/services/botService";
import { toast } from "sonner";
import {
  Smartphone,
  User,
  CalendarClock,
  Wifi,
  WifiOff,
  Info,
  MonitorSmartphone,
} from "lucide-react";
import { apiFetch } from "@/app/services/apiClient";

type ActiveBot = {
  code: string;
  priceId: string;
  stripeItemId: string;
};

export default function BotConfigPage() {
  const [session, setSession] = useState<any>(null);
  const [bots, setBots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeBots, setActiveBots] = useState<ActiveBot[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const s = await getSessionInfo();
        setSession(s);

        const status = await getBotStatus();
        setBots(status.bots || []);

        // 🔹 Estado comercial (Billing)
        const res = await apiFetch("http://localhost:3001/billing/me-plan", {
        });
        const billing = await res?.json();
        setActiveBots(Array.isArray(billing.bots) ? billing.bots : []);
      } catch (err) {
        toast.error("Error cargando configuración de bots");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const hasActiveBots = activeBots.length > 0;

  const confirmCancelBot = (bot: ActiveBot) => {
    toast.message("Cancelar bot", {
      description: `¿Deseas cancelar el ${
        BOT_LABELS[bot.code] ?? bot.code
      }?`,
      action: {
        label: "Sí, cancelar",
        onClick: async () => {
          try {
            await apiFetch(
              `http://localhost:3001/billing/addon/${bot.stripeItemId}`,
              { method: "DELETE" }
            );
  
            toast.success("Bot cancelado correctamente");
  
            setActiveBots(prev =>
              prev.filter(b => b.code !== bot.code)
            );
          } catch {
            toast.error("No se pudo cancelar el bot");
          }
        },
      },
    });
  };

  const BOT_LABELS: Record<string, string> = {
    prod_bot_gastos: "Bot de Gastos",
    prod_bot_comprobantes: "Bot de Comprobantes",
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh] text-gray-600">
        Cargando bot...
      </div>
    );
  }

  if (bots.length === 0) {
    return (
      <div className="max-w-2xl mx-auto mt-10 p-6 bg-white rounded-xl shadow border">
        <h1 className="text-2xl font-bold mb-4">Bot de WhatsApp</h1>
        <p className="text-gray-600">
          No tienes ningún bot configurado actualmente.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto mt-10 p-6 bg-white shadow rounded-2xl border">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        Configuración del Bot de WhatsApp
      </h1>

      <p className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 mb-6 text-sm">
        <Info size={18} />
        Para cerrar sesión completamente, debes hacerlo desde tu aplicación de WhatsApp.
      </p>

      {hasActiveBots && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            Bots contratados
          </h2>
      
          <div className="space-y-3">

          {activeBots.length > 0 && (
            <div className="mb-10">
              <h2 className="text-lg font-semibold text-gray-800 mb-3">
                Bots contratados
              </h2>
          
              <div className="space-y-3">
                {activeBots.map((bot) => (
                  <div
                    key={bot.code} // ✅ key única y estable
                    className="flex items-center justify-between gap-4 p-3
                      rounded-lg border border-emerald-300 bg-emerald-50"
                  >
                    {/* Badge */}
                    <div className="flex items-center gap-2">
                      <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                      <span className="text-sm font-semibold text-emerald-700">
                        {BOT_LABELS[bot.code] ?? bot.code}
                      </span>
                    </div>
          
                    {/* Cancelar */}
                    <button
                      onClick={() => confirmCancelBot(bot)}
                      className="text-sm font-semibold text-red-600
                        hover:text-red-700 hover:underline"
                    >
                      Cancelar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          </div>
        </div>
      )}

      {bots.map((b) => {
        const isConnected = b.connected;
        const color = isConnected ? "text-green-600" : "text-red-600";
        const statusText = isConnected ? "Conectado" : "Desconectado";

        return (
          <div
            key={b.botType}
            className="p-6 mb-6 border rounded-xl bg-gray-50 shadow-sm hover:shadow transition"
          >
            <h2 className="text-xl font-bold mb-4 capitalize text-gray-800">
              Bot: {b.botType}
            </h2>

            <div className="space-y-3 text-gray-700 text-sm">
              {/* Estado */}
              <div className="flex items-center gap-3">
                {isConnected ? (
                  <Wifi size={20} className="text-green-600" />
                ) : (
                  <WifiOff size={20} className="text-red-600" />
                )}
                <span className={`font-semibold ${color}`}>{statusText}</span>
              </div>

              {/* Nombre del dispositivo o usuario */}
              <div className="flex items-center gap-3">
                <User size={20} className="text-gray-500" />
                <span>
                  <strong>Nombre:</strong>{" "}
                  {b.name || "No disponible"}
                </span>
              </div>

              {/* Número de WhatsApp */}
              <div className="flex items-center gap-3">
                <Smartphone size={20} className="text-gray-500" />
                <span>
                  <strong>Número:</strong>{" "}
                  {b.whatsappnumber || "No disponible"}
                </span>
              </div>

              {/* Plataforma */}
              <div className="flex items-center gap-3">
                <MonitorSmartphone size={20} className="text-gray-500" />
                <span>
                  <strong>Plataforma:</strong>{" "}
                  {b.platform || "No disponible"}
                </span>
              </div>

              {/* Fecha creación */}
              <div className="flex items-center gap-3">
                <CalendarClock size={20} className="text-gray-500" />
                <span>
                  <strong>Sesión creada:</strong>{" "}
                  {b.createdAt
                    ? new Date(b.createdAt).toLocaleString()
                    : "No disponible"}
                </span>
              </div>

              {/* Última actualización / conexión */}
              <div className="flex items-center gap-3">
                <CalendarClock size={20} className="text-gray-500" />
                <span>
                  <strong>Última conexión:</strong>{" "}
                  {b.updatedAt
                    ? new Date(b.updatedAt).toLocaleString()
                    : "No disponible"}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
