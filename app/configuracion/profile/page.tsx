"use client";

import { useEffect, useState } from "react";
import { updateUserProfile, changePassword } from "@/app/services/profileService";
import { getSessionInfo } from "@/app/services/authService";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import ConfirmPasswordModal from "./components/ConfirmPasswordModal";

export default function ProfileSettingsPage() {
  const [profile, setProfile] = useState<any>(null);
  const [form, setForm] = useState({ nombre: "", telefono: "", email: "" });

  const [passwordOld, setPasswordOld] = useState("");
  const [passwordNew, setPasswordNew] = useState("");
  const [showPass, setShowPass] = useState(false);

  // modal
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<((password: string) => Promise<void>) | null>(null);

  // --- cargar datos ---
  useEffect(() => {
    const load = async () => {
      const data = await getSessionInfo();
      setProfile(data);

      setForm({
        nombre: data.nombre || "",
        telefono: data.telefono || "",
        email: data.email || "",
      });
    };
    load();
  }, []);

  // --- acción segura ---
  const requestPasswordConfirmation = (action: (password: string) => Promise<void>) => {
    setPendingAction(() => action);
    setModalOpen(true);
  };

  // --- guardar perfil ---
  const saveProfile = async (password: string) => {
    try {
      const res = await updateUserProfile({
        ...form,
        passwordConfirm: password,
      });

      toast.success("Perfil actualizado");
      setProfile({ ...profile, ...form });
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Perfil del usuario</h1>

      {/* PANEL PRINCIPAL */}
      <div className="bg-white p-6 rounded-xl shadow-md space-y-6">

        {/* DATOS PERSONALES */}
        <div>
          <h2 className="font-semibold mb-2">Datos personales</h2>

          <div className="space-y-4">
            <input
              className="border p-3 rounded w-full"
              placeholder="Nombre"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            />

            {profile?.tipoCuenta !== "invitado" && (
              <input
                className="border p-3 rounded w-full"
                placeholder="Teléfono"
                value={form.telefono}
                onChange={(e) => setForm({ ...form, telefono: e.target.value })}
              />
            )}

            <input
              className="border p-3 rounded w-full"
              placeholder="Correo"
              value={form.email}
              disabled={profile?.provider !== "local"}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            {profile?.provider !== "local" && (
              <p className="text-xs text-gray-500 mt-1">
                Este correo está vinculado a Google y no puede ser modificado.
              </p>
            )}
          </div>

          <button
            onClick={() =>
              requestPasswordConfirmation(async (pwd) => await saveProfile(pwd))
            }
            className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-lg"
          >
            Guardar cambios
          </button>
        </div>

        <hr />

        {/* CAMBIO DE CONTRASEÑA */}
        {profile?.provider === "local" && (
          <div>
            <h2 className="font-semibold mb-2">Cambiar contraseña</h2>

            <input
              type={showPass ? "text" : "password"}
              className="border p-3 rounded w-full mb-2"
              placeholder="Contraseña actual"
              value={passwordOld}
              onChange={(e) => setPasswordOld(e.target.value)}
            />

            <input
              type={showPass ? "text" : "password"}
              className="border p-3 rounded w-full mb-2"
              placeholder="Nueva contraseña"
              value={passwordNew}
              onChange={(e) => setPasswordNew(e.target.value)}
            />

            <button
              className="text-sm text-gray-600 flex items-center gap-1"
              onClick={() => setShowPass(!showPass)}
            >
              {showPass ? <EyeOff size={16} /> : <Eye size={16} />} Mostrar
            </button>

            <button
              onClick={async () => {
                try {
                  await changePassword(passwordOld, passwordNew);
                  toast.success("Contraseña actualizada");
                  setPasswordOld("");
                  setPasswordNew("");
                } catch (err: any) {
                  toast.error(err.message);
                }
              }}
              className="mt-3 bg-black text-white px-4 py-2 rounded"
            >
              Actualizar contraseña
            </button>
          </div>
        )}
      </div>

      {/* MODAL DE CONFIRMACIÓN */}
      <ConfirmPasswordModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={async (password: string) => {
          setModalOpen(false);
          if (pendingAction) await pendingAction(password);
        }}
      />
    </div>
  );
}
