import { apiFetch } from "./apiClient";

export type BillingIntent = "plan" | "addon";

interface SubscribePayload {
  intent: BillingIntent;
  priceIds: string[];
}

/**
 * 👉 PLAN
 * - Crea Checkout Session
 * - Retorna { url }
 */
interface CheckoutResponse {
  url: string;
}

/**
 * 👉 ADDON / BOT
 * - Agrega item a sub activa
 * - Retorna item Stripe
 */
interface AddonResponse {
  id: string;
  price: string;
  quantity: number;
  subscription: string;
}


export async function getBillingInfo() {
  const res = await apiFetch("http://localhost:3001/billing/info");
  return res?.json();
}

export async function updateBillingInfo(data: any) {
  const res = await apiFetch("http://localhost:3001/billing/update", {
    method: "POST",
    body: JSON.stringify(data),
  });

  // ❗ Si la respuesta NO es ok => lanzar excepción
  if (!res?.ok) {
    const error = await res?.json().catch(() => ({}));
    throw new Error(error.message || "Error al actualizar facturación");
  }

  return res.json();
}

export async function getInvoices() {
  const res = await apiFetch("http://localhost:3001/billing/invoices");
  return res?.json();
}

export async function subscribePlan(
  priceId: string,
): Promise<CheckoutResponse> {
  const res = await apiFetch("http://localhost:3001/billing/subscribe", {
    method: "POST",
    body: JSON.stringify({
      intent: "plan",
      priceIds: [priceId],
    }),
  });

  if (!res) {
    throw new Error("No response from server");
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.message || "Error al crear checkout");
  }

  return data as CheckoutResponse;
}

/**
 * 🤖 Comprar BOT / ADDON
 * - Agrega item a sub activa
 */
export async function subscribeAddon(
  priceId: string,
): Promise<AddonResponse> {
  const res = await apiFetch("http://localhost:3001/billing/subscribe", {
    method: "POST",
    body: JSON.stringify({
      intent: "addon",
      priceIds: [priceId],
    }),
  });

  if (!res) {
    throw new Error("No response from server");
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data?.message || "Error al activar bot");
  }

  return data as AddonResponse;
}

export async function cancelAddon(stripeItemId: string) {
  return apiFetch(`http://localhost:3001/billing/addon/${stripeItemId}`, {
    method: "DELETE",
  });
}

export async function submitManualTransfer(payload: {
  code: string | null;
  kind: "plan" | "bot";
  reference: string | null;
  }) 
  {
  const res = await apiFetch("http://localhost:3001/billing/manual-payment", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  console.log(payload);

  if (!res) throw new Error("No response from server");

  const data = await res.json().catch(() => ({}));

  // 🟡 Caso: ya existe una solicitud pendiente
  if (data.pending === true) {
    return { ok: false, reason: "pending" };
  }

  // 🟢 Éxito
  if (res.ok) {
    return { ok: true };
  }

  return { ok: false, reason: "unknown" };
}

export async function submitCustomPlanRequest(form: any) {
  const res = await apiFetch("http://localhost:3001/billing/custom-request", {
    method: "POST",
    body: JSON.stringify(form),
  });

  if (!res) return { ok: false, reason: "no-response" };

  const data = await res.json().catch(() => ({}));

  if (res.ok) return { ok: true };

  return {
    ok: false,
    reason: data?.message || "unknown",
  };
}

export async function getManualPayments() {
  try {
    const res = await apiFetch("http://localhost:3001/billing/manual-payments");

    if (!res) return { ok: false, status: 0, data: null };

    const status = res.status;

    // Unauthorized admin
    if (status === 403) {
      return { ok: false, status: 403, data: null };
    }

    const data = await res.json().catch(() => null);

    if (Array.isArray(data)) {
      return { ok: true, status, data };
    }

    return { ok: false, status, data: null };
  } catch (err) {
    console.error(err);
    return { ok: false, status: 0, data: null };
  }
}

export async function approveManualPayment(id: number) {
  try {
    const res = await apiFetch(
      `http://localhost:3001/billing/manual-payments/${id}/approve`,
      { method: "PATCH" }
    );

    if (!res) return { ok: false, status: 0, message: "No response" };

    const body = await res.json().catch(() => ({}));

    if (res.ok) return { ok: true };

    return { ok: false, status: res.status, message: body.message || null };
  } catch (err) {
    return { ok: false, status: 0, message: "Network error" };
  }
}

export async function rejectManualPayment(id: number) {
  try {
    const res = await apiFetch(
      `http://localhost:3001/billing/manual-payments/${id}/reject`,
      { method: "PATCH" }
    );

    if (!res) return { ok: false, status: 0, message: "No response" };

    const body = await res.json().catch(() => ({}));

    if (res.ok) return { ok: true };

    return { ok: false, status: res.status, message: body.message || null };
  } catch (err) {
    return { ok: false, status: 0, message: "Network error" };
  }
}

export async function openBillingPortal() {
  const res = await apiFetch("http://localhost:3001/billing-portal/portal", {
    method: "POST",
  });

  if (!res?.ok) {
    return null;
  }

  const data = await res.json();

  window.location.href = data.url;
}

export async function cancelSubscription() {
  return await apiFetch("http://localhost:3001/billing/cancel", {
    method: "POST",
  });
}

export async function upgradePlan(priceId: string) {
  return apiFetch("http://localhost:3001/billing/change-plan", {
    method: "POST",
    body: JSON.stringify({ newPriceId: priceId }),
  }).then(r => r?.json());
}

export async function applyRetentionDiscount(reason: string, customReason?: string) {
  const res = await apiFetch(
    "http://localhost:3001/billing/apply-retention-discount",
    {
      method: "POST",
      body: JSON.stringify({
        reason,
        customReason,
      }),
    }
  );

  if (!res?.ok) {
    const err = await res?.json();
    throw new Error(err.message || "No se pudo aplicar el descuento");
  }

  return res.json();
}
