import { apiFetch } from "@/app/services/apiClient";
import { API_URL } from "@/utils/env";

export async function listEmployees() {
  const res = await apiFetch(`${API_URL}/employee`);
 
  if (!res?.ok) {
    throw new Error(`Error al obtener empleados: ${res?.statusText}`);
  }

  return res?.json();
}

export async function createEmployee(body: any) {
  const res = await apiFetch(`${API_URL}/employee`, {
    method: "POST",
    body: JSON.stringify(body),
  });

  if (!res?.ok) {
    throw new Error(`Error al crear empleado: ${res?.statusText}`);
  }

  return res?.json();
}

export async function updateEmployee(id: number, body: any) {
  const res = await apiFetch(`${API_URL}/employee/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });

  if (!res?.ok) {
    throw new Error(`Error al actualizar empleado: ${res?.statusText}`);
  }

  return res?.json();
}

export async function deleteEmployee(id: number) {
  const res = await apiFetch(`${API_URL}/employee/${id}`, {
    method: "DELETE",
  });

  if (!res?.ok) {
    throw new Error(`Error al eliminar empleado: ${res?.statusText}`);
  }

  return res?.json();
}


// NUEVO: RFCs
export async function listEmployeeRfcs(employeeId: number) {
  const res = await apiFetch(`${API_URL}/employee/${employeeId}/rfcs`);

  if (!res?.ok) {
    throw new Error(`Error al listar los rfcs asignados al empleado: ${res?.statusText}`);
  }

  return res?.json();
}

export async function saveEmployeeRfcAssignments(employeeId: number, rfcList: string[]) {
  const res = await apiFetch(`${API_URL}/employee/${employeeId}/rfcs`, {
    method: "POST",
    body: JSON.stringify({ rfcList }),
  });

  if (!res?.ok) {
    throw new Error(`Error al listar los rfcs asignados al empleado: ${res?.statusText}`);
  }
  return res?.json();
}

