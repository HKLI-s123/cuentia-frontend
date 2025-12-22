"use client";

import { Dialog } from "@headlessui/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Props = {
  open: boolean;
  onClose: () => void;
  paymentMethod: string | null;
  sessionId: number;
};

export default function MetodoPagoModal({
  open,
  onClose,
  paymentMethod,
}: Props) {
  const router = useRouter();

  const isTransfer = paymentMethod === "transfer";
  const isCard = !!paymentMethod && paymentMethod !== "transfer";

  console.log("metoodoo",paymentMethod)

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">

          <Dialog.Title className="text-lg font-bold text-gray-800 mb-4">
            Pago por transferencia
          </Dialog.Title>

          {/* 📌 DATOS DE TRANSFERENCIA */}
          <div className="rounded-lg border bg-gray-50 p-4 text-sm text-gray-700 space-y-1 mb-4">
            <p><strong>Banco:</strong> BBVA</p>
            <p><strong>CLABE:</strong> 012164015504841260</p>
            <p><strong>Concepto:</strong> Suscripción CuentIA</p>
          </div>

          {/* 🧠 MENSAJE DINÁMICO */}
          <p className="text-sm text-gray-600 mb-6">
            {isTransfer && (
              <>
                Para cambiar tu método de pago a <strong>Tarjeta</strong>, primero debes
                cancelar tu plan actual.
                <br />
                <Link
                  href="/configuracion/danger"
                  className="text-indigo-600 font-semibold hover:underline"
                >
                  Cancelar plan y cambiar método de pago
                </Link>
              </>
            )}

            {isCard && (
                <>
                  Para cambiar tu método de pago a <strong>Transferencia</strong>, primero debes
                  cancelar tu plan actual para evitar cargos duplicados.
                  <br />
                  <Link
                    href="/configuracion/danger"
                    className="text-indigo-600 font-semibold hover:underline"
                  >
                    Cancelar plan y cambiar método de pago
                  </Link>
                </>
            )}

            {paymentMethod === null && (
              <>
                Para completar tu pago, dirígete a la sección de planes y elige
                el método de pago que prefieras.
              </>
            )}
          </p>

          {/* 🎯 CTA */}
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100"
            >
              Cerrar
            </button>

            <button
              onClick={() => router.push("/plans")}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700"
            >
              Ir a planes
            </button>
          </div>

        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
