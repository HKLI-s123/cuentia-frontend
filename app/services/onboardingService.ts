// app/services/onboardingService.ts
import * as asn1js from "asn1js";
import * as pkijs from "pkijs";
import { apiFetch } from "./apiClient";
import { API_URL } from "@/utils/env";

export async function uploadOwnFirma(cer: File, key: File, fielPass: string, rfcFinal: string) {
  const formData = new FormData();
  formData.append("cer", cer);
  formData.append("key", key);
  formData.append("fielPass", fielPass);
  formData.append("rfc", rfcFinal);

  const res = await apiFetch(`${API_URL}/clientes/upload-own-firma`, {
    method: "POST",
    body: formData,
  });

  if (!res?.ok) {
    const text = await res?.text();
    throw new Error(text || "Error al subir los archivos");
  }

  return await res.json();
}

export async function extractRFCfromCer(file: File): Promise<string | null> {
  const buffer = await file.arrayBuffer();
  const asn1 = asn1js.fromBER(buffer);

  if (asn1.offset === -1) return null;

  const cert = new pkijs.Certificate({ schema: asn1.result });

  // Buscar atributo OID 2.5.4.45 → UID → RFC
  const subject = cert.subject.typesAndValues;

  for (const attr of subject) {
    if (attr.type === "2.5.4.45") {
      // Convertir valor a texto
      return attr.value.valueBlock.value;
    }
  }

  return null;
}

export async function omitOnboarding() {
  const res = await apiFetch(`${API_URL}/auth/omit`, {
    method: "PATCH",
  });

  if (!res?.ok) throw new Error("No se pudo omitir el onboarding");

  return await res.json();
}

export async function updateCertificates(cer: File, key: File, fielPass: string, rfc?: string) {
  const form = new FormData();
  form.append("cer", cer);
  form.append("key", key);
  form.append("fielPass", fielPass);

  if (rfc) form.append("rfc", rfc);

  const res = await apiFetch(`${API_URL}/clientes/update-certificates`, {
    method: "POST",
    body: form
  });

  if (!res?.ok) {
    const error = await res?.json().catch(() => ({}));
    throw new Error(error.message || "Error actualizando certificados");
  }

  return res.json();
}

export async function updateOwnCertificates(cer: File, key: File, fielPass: string) {
  const form = new FormData();
  form.append("cer", cer);
  form.append("key", key);
  form.append("fielPass", fielPass);

  const res = await apiFetch(`${API_URL}/clientes/update-own-certificates`, {
    method: "POST",
    body: form
  });

  if (!res?.ok) {
    const error = await res?.json().catch(() => ({}));
    throw new Error(error.message || "Error actualizando certificados");
  }

  return res.json();
}