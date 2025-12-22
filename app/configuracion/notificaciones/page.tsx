"use client";

import { getNotificationPreferences, updateNotificationPreferences } from "@/app/services/notificationService";
import { useState, useEffect } from "react";
//import { getSessionInfo, updateNotificationPreferences } from "@/app/services/authService";
import { toast } from "sonner";

type PrefKeys = "emailNotifications" | "internalAlerts" | "botAlerts";

export default function NotificacionesPage() {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);

  const [prefs, setPrefs] = useState({
    emailNotifications: true,
    internalAlerts: true,
    botAlerts: true,
  });

  useEffect(() => {
    const load = async () => {
      try {
        const prefsDB = await getNotificationPreferences();
  
        setPrefs({
          emailNotifications: prefsDB.emailNotifications,
          internalAlerts: prefsDB.internalAlerts,
          botAlerts: prefsDB.botAlerts,
        });
      } catch {
        toast.error("Error cargando notificaciones");
      } finally {
        setLoading(false);
      }
    };
  
    load();
  }, []);


  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh] text-gray-600">
        Cargando...
      </div>
    );
  }

  const handleToggle = (key: PrefKeys) => {
    setPrefs((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };


  const savePrefs = async () => {
    try {
      await updateNotificationPreferences(prefs);
      toast.success("Preferencias guardadas");
    } catch {
      toast.error("No se pudieron guardar las preferencias");
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-10 bg-white p-8 rounded-2xl shadow border">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        Notificaciones
      </h1>

      <p className="text-gray-600 mb-6">
        Administra cómo deseas recibir notificaciones de CuentIA.
      </p>

      {/* NOTIFICACIONES INTERNAS */}
      <div className="flex items-center justify-between p-4 rounded-xl border mb-4 bg-gray-50">
        <div>
          <h3 className="font-semibold text-gray-800">Avisos internos</h3>
          <p className="text-gray-500 text-sm">
            Mensajes dentro de la plataforma sobre mejoras, alertas y novedades.
          </p>
        </div>

        <input
          type="checkbox"
          className="w-5 h-5"
          checked={prefs.internalAlerts}
          onChange={() => handleToggle("internalAlerts")}
        />
      </div>

      {/* BOT DE WHATSAPP */}
      <div className="flex items-center justify-between p-4 rounded-xl border mb-6 bg-gray-50">
        <div>
          <h3 className="font-semibold text-gray-800">Descargas CFDI semanales</h3>
          <p className="text-gray-500 text-sm">
            Notificaciones sobre el total de tus descargas semanales.
          </p>
        </div>

        <input
          type="checkbox"
          className="w-5 h-5"
          checked={prefs.botAlerts}
          onChange={() => handleToggle("botAlerts")}
        />
      </div>

      <button
        className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
        onClick={savePrefs}
      >
        Guardar cambios
      </button>
    </div>
  );
}
