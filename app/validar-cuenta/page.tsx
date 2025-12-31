"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { logoutUser } from "../services/authService";
import { useSession } from "@/hooks/useSession";
import { redirect } from "next/navigation";
import { motion } from "framer-motion";
import { LogOut } from "lucide-react";
import Spinner from "@/components/Spinner";

export default function ValidarCuentaPage() {
  const router = useRouter();
  const { user, loading } = useSession();

  if (loading) return <Spinner />;

  // ❌ No autenticado → no puede estar aquí
  if (!user) redirect("/login");

  // 🔒 Usuario autenticado PERO ya verificado → lo sacamos
  if(user.tipo_cuenta !== 'invitado'){
    if (user.verified) redirect("/onboarding");
  }else{
    if (user.verified) redirect("/dashboard/overview");
  }

  const handleLogout = async () => {
    const success = await logoutUser();
    if (success) {
      toast.success("Sesión cerrada");
      router.push("/login");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="bg-white shadow-2xl rounded-3xl p-10 max-w-lg w-full text-center border border-gray-200"
      >
        {/* TÍTULO */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-3xl font-bold text-gray-800 mb-3"
        >
          Verifica tu correo
        </motion.h1>

        {/* DESCRIPCIÓN */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-gray-600 mb-6 leading-relaxed"
        >
          Te enviamos un enlace de verificación a tu correo electrónico.
          Una vez que lo confirmes, podrás continuar al dashboard.
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.9 }}
          transition={{ delay: 0.25 }}
          className="text-sm text-gray-500 mb-8"
        >
          Si no lo encuentras revisa tu carpeta de spam o <a href = '/verificado' className="text-blue-500 underline">solicita uno nuevo </a>
          desde la página del enlace.
        </motion.p>

        {/* BOTÓN DE CERRAR SESIÓN */}
        <motion.button
          onClick={handleLogout}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
          className="
            w-full py-3 rounded-xl font-semibold
            text-red-600 border border-red-300
            hover:bg-red-50 transition flex items-center justify-center gap-2
          "
        >
          <LogOut size={20} />
          Cerrar sesión
        </motion.button>

        {/* FOOTER */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.4 }}
          transition={{ delay: 0.6 }}
          className="text-sm text-gray-400 mt-6"
        >
          CuentIA © {new Date().getFullYear()} — Inteligencia fiscal para todos.
        </motion.p>
      </motion.div>
    </div>
  );
}
