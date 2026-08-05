"use client";

/**
 * Pantalla que se muestra a un usuario cuyo acceso fue bloqueado porque su
 * prueba gratuita terminó (user.accessBlocked === true). Solo deja una salida:
 * ir a /plans para pagar. La renderiza withSessionGuard en cualquier sección
 * protegida distinta de /plans.
 */
export default function TrialExpiredScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6 text-center">
      <div className="max-w-md">
        <h1 className="text-2xl font-semibold text-gray-900">
          Tu prueba gratuita terminó
        </h1>

        <p className="mt-4 text-gray-600">
          Para seguir usando CuentIA necesitas elegir y activar un plan. Tu
          información sigue guardada y estará disponible en cuanto reactives tu
          cuenta.
        </p>

        <a
          href="/plans"
          className="mt-8 inline-block rounded-lg bg-gray-900 px-6 py-3 font-medium text-white transition hover:bg-gray-800"
        >
          Ver planes y pagar
        </a>
      </div>
    </div>
  );
}
