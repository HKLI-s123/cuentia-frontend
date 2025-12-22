"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function ConfirmPasswordModal({ open, onClose, onConfirm }: any) {
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
        <h2 className="text-xl font-semibold mb-4">Confirmar contraseña</h2>

        <p className="text-gray-600 mb-4 text-sm">
          Por seguridad, ingresa tu contraseña para continuar.
        </p>

        <div className="relative">
          <input
            type={show ? "text" : "password"}
            placeholder="Contraseña"
            className="w-full border p-3 rounded-lg"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <div
            className="absolute right-3 top-3 cursor-pointer text-gray-600"
            onClick={() => setShow(!show)}
          >
            {show ? <EyeOff /> : <Eye />}
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
            onClick={onClose}
          >
            Cancelar
          </button>

          <button
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg"
            onClick={() => onConfirm(password)}
            disabled={!password}
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
