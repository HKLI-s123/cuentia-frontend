import { apiFetch } from "@/app/services/apiClient";

export interface UpdatePaymentMethodPayload {
  metodoPago: "TARJETA" | "TRANSFERENCIA" | "PAYPAL";

  banco?: string;
  clabe?: string;
  referencia?: string;

  stripeCustomerId?: string;
  stripePaymentMethodId?: string;
  last4?: string;
  brand?: string;
  expMonth?: string;
  expYear?: string;
}

export async function getPaymentMethod() {
  const res = await apiFetch("http://localhost:3001/billing/payment/me");

  if (!res?.ok) {
    throw new Error("No se pudo obtener el método de pago");
  }

  return res.json();
}

export async function updatePaymentMethod(data: UpdatePaymentMethodPayload) {
  const res = await apiFetch("http://localhost:3001/billing/payment/update-method", {
    method: "POST",
    body: JSON.stringify(data),
  });

  if (!res?.ok) throw new Error("Error al actualizar el método de pago");

  return res.json();
}