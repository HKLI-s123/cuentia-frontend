"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Fragment, useEffect, useState } from "react";
import {
  User, Building2, Settings, Bot, CreditCard,
  Users, AlertTriangle, Bell,
  ArrowLeft
} from "lucide-react";
import { getSessionInfo } from "@/app/services/authService";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [tipoCuenta, setTipoCuenta] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // 🔥 Cargar sesión
  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const s = await getSessionInfo();
        if (!mounted) return;

        if (s.tipoCuenta === "empleado") {
          router.replace("/dashboard/overview");
          return;
        }

        setTipoCuenta(s.tipoCuenta);
      } catch {
        setTipoCuenta(null);
      }
    };
    load();

    return () => {
      mounted = false;
    };
  }, [router]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);


  if (tipoCuenta === null) {
    return <div className="p-10">Cargando configuración...</div>;
  }


  // LINKS BASE
  const links = [
    { href: "/configuracion/profile", label: "Perfil", icon: <User size={18} /> },
    { href: "/configuracion/bot", label: "Bot de WhatsApp", icon: <Bot size={18} /> },
    { href: "/configuracion/billing", label: "Facturación", icon: <CreditCard size={18} /> },
    { href: "/configuracion/equipo", label: "Equipo & Roles", icon: <Users size={18} /> },
    { href: "/configuracion/notificaciones", label: "Notificaciones", icon: <Bell size={18} /> },
    { href: "/configuracion/danger", label: "Zona de peligro", icon: <AlertTriangle size={18} /> },
  ];

  // ➕ Agregar “Sincronización SAT” SOLO si es INVITADO
  if (tipoCuenta === "invitado") {
    links.splice(2, 0, { 
      href: "/configuracion/sincronizacion", 
      label: "Sincronización SAT", 
      icon: <Settings size={18} /> 
    });
  }

  // 🟢 NO-invitado → agregar Configuración fiscal
  if (tipoCuenta !== "invitado") {
    links.splice(1, 0, {
      href: "/configuracion/fiscal",
      label: "Configuración fiscal",
      icon: <Building2 size={18} />,
    });
  }

  return (
   <Fragment key={pathname}>
    <div className="flex min-h-screen bg-gray-50">

      {/* 🌑 Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-50
          w-64 bg-white shadow-lg border-r p-6
          transform transition-transform duration-300
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
        `}
      >
        {/* 🔙 REGRESAR AL DASHBOARD */}
        <Link
          href="/dashboard/overview"
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft size={16} />
          Regresar al dashboard
        </Link>
        <h2 className="text-xl font-bold mb-6">Configuración</h2>
        <nav className="space-y-2">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 p-2 rounded-lg transition ${
                pathname.startsWith(l.href)
                  ? "bg-indigo-600 text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              {l.icon}
              {l.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1">
        {/* Header mobile */}
        <div className="md:hidden sticky top-0 z-30 bg-white border-b px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-md border text-gray-600"
            aria-label="Abrir menú de configuración"
          >
            ☰
          </button>
      
          <h1 className="text-base font-semibold">
            Configuración
          </h1>
        </div>
      
        {/* Contenido */}
        <div className="p-4 md:p-10">
          {children}
        </div>
      </main>
    </div>
   </Fragment>
  );
}
