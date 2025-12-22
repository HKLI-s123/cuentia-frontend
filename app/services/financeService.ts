import { authHeaders } from "./api";
import { apiFetch } from "./apiClient";

export const getFinanceStats = async (
  rfc: string,
  startDate?: string,
  endDate?: string
) => {
  const url = new URL(`http://localhost:3001/cfdis/finance-stats`);
  url.searchParams.append("rfc", rfc);
  if (startDate) url.searchParams.append("startDate", startDate);
  if (endDate) url.searchParams.append("endDate", endDate);

  const res = await apiFetch(url.toString(), { method: "GET" });

  if (!res?.ok) {
    throw new Error(`Error al obtener finance-stats: ${res?.statusText}`);
  }

  const data = await res.json();

  // ✅ Asegurar que data siempre sea un objeto
  const safeData = data || {};

  // ✅ Convertir valores a número o 0 si no existen
  const ingresos = Number(safeData.ingresos) || 0;
  const egresos = Number(safeData.egresos) || 0;
  const utilidad = Number(safeData.utilidad) || 0;
  const iva_acreditado = Number(safeData.iva_acreditado) || 0;
  const iva_trasladado = Number(safeData.iva_trasladado) || 0;
  const iva_saldo = Number(safeData.iva_saldo) || 0;

  const regimen = safeData.regimenfiscal ; // el que venga de un ingreso

  let isr_estimado: number | null = null;
  
  switch (regimen) {
    case '626':            // RESICO PF
      isr_estimado = ingresos * 0.025;
      break;
  
    case '601':            // PF Actividad Empresarial y Profesional
      // aproximado con tasa marginal promedio
      isr_estimado = utilidad > 0 ? utilidad * 0.30 : 0;
      break;
  
    case '612':            // PM general
      // ISR corporativo 30%
      isr_estimado = utilidad > 0 ? utilidad * 0.30 : 0;
      break;
  
    case '605':            // Sueldos y Salarios
    case '606':            // Arrendamiento
    case '607':            // RIF (ya no aplica)
    case '608':            // pensiones
    case '609':            // residentes en el extranjero
    case '610':            // dividendos
    case '615':            // ingresos por intereses
    case '620':            // producción agrícola / ganadera
      isr_estimado = null;  // NO calculable con sola utilidad
      break;
  
    default:
      isr_estimado = null;
  }


  // ✅ Devuelve un arreglo con los 4 paneles
  return [
    {
      title: "Ingresos",
      badgeColor: "primary",
      badgeText: "Total",
      value: ingresos,
      metric: "Ingresos totales",
      prefix: "$",
      chartData: [
        { name: "Ingresos", value: ingresos, itemStyle: { color: "#5e7fe1ff" } }
      ]
    },
    {
      title: "Egresos",
      badgeColor: "danger",
      badgeText: "Total",
      value: egresos,
      metric: "Egresos totales",
      prefix: "$",
      chartData: [
        { name: "Egresos", value: egresos, itemStyle: { color: "#555555" } }
      ]
    },
    {
      title: "Utilidad",
      badgeColor: utilidad >= 0 ? "success" : "danger",
      badgeText: "Total",
      value: utilidad,
      metric: "Utilidad neta",
      prefix: "$",
      chartData: [
        { name: "Ingresos", value: ingresos, itemStyle: { color: "#5e7fe1ff" } },
        { name: "Egresos", value: egresos, itemStyle: { color: "#555555" } },
        { name: "Utilidad", value: utilidad, itemStyle: { color: "#38d59bff" } },
        { name: "ISR estimado", value: Number(isr_estimado) || 0, itemStyle: { color:  "#f0a000" } }
      ]
    },
    {
      title: "IVA",
      badgeColor:
        iva_saldo > 0
          ? "danger"   // debo pagar
          : iva_saldo < 0
            ? "success" // tengo saldo a favor
            : "secondary", // neutro
      badgeText:
        iva_saldo > 0
          ? "IVA a pagar"
          : iva_saldo < 0
            ? "IVA a favor"
            : "Sin saldo",
      value: iva_saldo,
      metric: "IVA total",
      prefix: "$",
      chartData: [
        { name: "IVA acreditado", value: iva_acreditado, itemStyle: { color: "#5e7fe1" } },
        { name: "IVA trasladado", value: iva_trasladado, itemStyle: { color: "#78b9f0" } },
      ]
    }
  ];
};


export const getFinanceTrends = async (rfc: string, startDate?: string, endDate?: string) => {
  const url = new URL(`http://localhost:3001/cfdis/finance-trends`);
  url.searchParams.append('rfc', rfc);
  if (startDate) url.searchParams.append('startDate', startDate);
  if (endDate) url.searchParams.append('endDate', endDate);

  const res = await apiFetch(url.toString(), { method: "GET" });

  if (!res?.ok) {
    throw new Error(`Error al obtener finance-trends: ${res?.statusText}`);
  }

  const data = await res.json();

  // extraer valores
  const { cfdisRecibidos, cfdisVigentes, cfdisCancelados } = data;

  // calcular porcentajes
  const total = cfdisRecibidos || 1; // evitar división por 0
  const pctVigentes = ((cfdisVigentes || 0) / total) * 100;
  const pctCancelados = ((cfdisCancelados || 0) / total) * 100;

  return [
    {
      value: cfdisRecibidos || 0,
      percentage: 100,
      title: 'CFDIs recibidos',
      progress: 100
    },
    {
      value: cfdisVigentes || 0,
      percentage: pctVigentes,
      title: 'CFDIs vigentes',
      progress: pctVigentes
    },
    {
      value: cfdisCancelados || 0,
      percentage: pctCancelados,
      title: 'CFDIs cancelados',
      progress: pctCancelados
    }
  ];
};


export const getFinanceStatsChart = async (rfc: string, startDate?: string, endDate?: string) => {
  const url = new URL(`http://localhost:3001/cfdis/finance-stats-chart`);
  url.searchParams.append("rfc", rfc);
  if (startDate) url.searchParams.append("startDate", startDate);
  if (endDate) url.searchParams.append("endDate", endDate);

  const res = await apiFetch(url.toString(), { method: "GET" });
  if (!res?.ok) throw new Error(`Error en getFinanceStats: ${res?.statusText}`);

  return res.json(); // [{fecha, ingresos, egresos, utilidad}]
};


export const getMainExpenses = async (rfc: string, startDate?: string, endDate?: string) => {
  const url = new URL("http://localhost:3001/cfdis/main-expenses");
  url.searchParams.append("rfc", rfc);
  if (startDate) url.searchParams.append("startDate", startDate);
  if (endDate) url.searchParams.append("endDate", endDate);

  const res = await apiFetch(url.toString(), { method: "GET" });
  if (!res?.ok) throw new Error(`Error fetching main expenses: ${res?.statusText}`);

  return res.json(); // [{ category: string, total: number }]
};



export const getMainRevenue = async (rfc: string, startDate?: string, endDate?: string) => {
  const url = new URL("http://localhost:3001/cfdis/main-revenue");
  url.searchParams.append("rfc", rfc);
  if (startDate) url.searchParams.append("startDate", startDate);
  if (endDate) url.searchParams.append("endDate", endDate);

  const res = await apiFetch(url.toString(), { method: "GET" });
  if (!res?.ok) throw new Error(`Error fetching main revenue: ${res?.statusText}`);

  return res.json(); // [{ category: string, total: number }]
};

export async function getIncomeByClient(rfc: string, startDate?: string, endDate?: string) {
  const params = new URLSearchParams();
  if (startDate) params.append("startDate", startDate);
  if (endDate) params.append("endDate", endDate);
  if (rfc) params.append("rfc", rfc);

  const res = await apiFetch(`http://localhost:3001/cfdis/income-by-client?${params.toString()}`, { method: "GET" });

  const json = await res?.json();

  // Normalizar la respuesta
  if (Array.isArray(json)) return json;
  if (Array.isArray(json.data)) return json.data;

  console.warn("La API no devolvió un array", json);
  return [];
}

export async function getExpensesByProvider(rfc: string, startDate?: string, endDate?: string) {
  const params = new URLSearchParams();
  if (startDate) params.append("startDate", startDate);
  if (endDate) params.append("endDate", endDate);
  if (rfc) params.append("rfc", rfc);

  const res = await apiFetch(`http://localhost:3001/cfdis/expenses-by-provider?${params.toString()}`, { method: "GET" });

  const json = await res?.json();

  // Normalización segura
  if (Array.isArray(json)) return json;
  if (Array.isArray(json.data)) return json.data;

  console.warn("La API no devolvió un array", json);
  return [];
}

export const getFacturas = async (params: { rfc?: string; startDate?: string; endDate?: string }) => {
  const url = new URL("http://localhost:3001/cfdis");

  if (params.rfc) url.searchParams.append("rfc", params.rfc);
  if (params.startDate) url.searchParams.append("fechaInicio", params.startDate);
  if (params.endDate) url.searchParams.append("fechaFin", params.endDate);

  const res = await apiFetch(url.toString(), { method: "GET" });

  if (!res?.ok) {
    throw new Error(`Error al obtener facturas: ${res?.statusText}`);
  }

  return res.json();
};


export const getPagos = async (params: { rfc?: string; startDate?: string; endDate?: string }) => {
  const url = new URL("http://localhost:3001/cfdis/pagos");

  if (params.rfc) url.searchParams.append("rfc", params.rfc);
  if (params.startDate) url.searchParams.append("fechaInicio", params.startDate);
  if (params.endDate) url.searchParams.append("fechaFin", params.endDate);

  const res = await apiFetch(url.toString(), { method: "GET" });


  if (!res?.ok) {
    throw new Error(`Error al obtener los complementos de pago: ${res?.statusText}`);
  }

  return res.json();
};


export const getNotasCredito = async (params: { rfc?: string; startDate?: string; endDate?: string }) => {
  const url = new URL("http://localhost:3001/cfdis/notas-credito");

  if (params.rfc) url.searchParams.append("rfc", params.rfc);
  if (params.startDate) url.searchParams.append("fechaInicio", params.startDate);
  if (params.endDate) url.searchParams.append("fechaFin", params.endDate);

  const res = await apiFetch(url.toString(), { method: "GET" });


  if (!res?.ok) {
    throw new Error(`Error al obtener las notas de credito: ${res?.statusText}`);
  }

  return res.json();
};


export const generarDiot = async (params: {rfc?: string; startDate?: string; endDate?: string }) => {
  const url = new URL("http://localhost:3001/cfdis/generar-diot");

  if (params.rfc) url.searchParams.append("rfc", params.rfc);
  if (params.startDate) url.searchParams.append("fechaInicio", params.startDate);
  if (params.endDate) url.searchParams.append("fechaFin", params.endDate);

  const res = await apiFetch(url.toString(), {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(params),
  });

  if (!res?.ok) {
    throw new Error("Error al generar DIOT");
  }

  return res.json();
};


