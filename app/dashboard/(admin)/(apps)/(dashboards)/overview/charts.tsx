"use client"

import { useEffect, useState } from "react";
import { LineChart, PieChart, BarChart} from 'echarts/charts';
import { TooltipComponent,LegendComponent, GridComponent } from 'echarts/components';
import { CanvasRenderer, } from 'echarts/renderers';
import dynamic from "next/dynamic";
import { useIsClient } from "usehooks-ts";
import { EChartsOption } from 'echarts'
import { Modal, Input } from "antd"; // ejemplo con Ant Design, puedes usar otra librería

import { getFinanceStatsChart } from '@/app/services/financeService';

import { getEchartOptions, getWorldMapOptions } from "./data";
import { apiFetch } from "@/app/services/apiClient";
import { API_URL } from "@/utils/env";

const EChartClient = dynamic(() => import("@/components/EChartClient"), { ssr: false });
const BaseVectorMap = dynamic(() => import("@/components/maps/BaseVectorMap"), { ssr: false });

type DonutChartProps = {
  data: { name: string; value: number }[];
};

type ClientsRevenueProps = {
  data: { name: string; value: number }[];
};

type ExpensesByProviderChartProps = {
  data: { name: string; value: number }[]
}

type MainExpensesChartProps = {
  data: {
    clave: string
    descripcion: string
    total: number
    uuids: string[]
  }[]
}

export type MainRevenueChartProps = {
  data: {
    clave: string           // clave de la categoría o producto
    descripcion: string     // nombre de la categoría
    total: number           // total de ingresos
    uuids: string[]         // UUIDs relacionados para fetch dinámico
  }[]
}



type FinanceChartProps = {
  rfc: string
  startDate?: string
  endDate?: string
}


interface Factura {
  uuid: string;
  fecha: string;
  rfc_emisor: string;
  razonsocialemisor: string;
  total: number;
  moneda: string;
  totaltrasladosiva: number;
}

export const MainRevenueChart = ({ data }: MainRevenueChartProps) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDescripcion, setSelectedDescripcion] = useState<string | null>(null);
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [search, setSearch] = useState("");
  
  // Función para obtener facturas por UUIDs
  const fetchFacturas = async (uuids: string[]) => {
    if (!uuids || uuids.length === 0) {
      setFacturas([]);
      return;
    }

    const query = uuids.map(u => `uuids=${encodeURIComponent(u)}`).join("&");
    const response = await apiFetch(`${API_URL}/cfdis/by-uuid?${query}`);
    const data: Factura[] = await response?.json();
    setFacturas(data);
  };

  const handleChartClick = (params: any) => {
    const descripcion = params.name;
    const item = data.find(d => d.descripcion === descripcion);

    if (item) {
      setSelectedDescripcion(descripcion);
      setModalOpen(true);
      fetchFacturas(item.uuids);
    }
  };

  // Filtrado por barra de búsqueda
  const filteredFacturas = facturas.filter(f =>
    f.uuid.includes(search) || f.rfc_emisor.includes(search) || f.razonsocialemisor.includes(search)
  );

  const formatFiscalDate = (value?: string) => {
    if (!value) return "";
    if (value.includes("T")) return value.split("T")[0].split("-").reverse().join("/");
    if (value.includes("-")) return value.split("-").reverse().join("/");
    return value;
  };

  return (
    <>
      <EChartClient
        key={JSON.stringify(data)}
        extensions={[PieChart, TooltipComponent, LegendComponent, CanvasRenderer]}
        getOptions={() => ({
          tooltip: { trigger: "item",
              formatter: (params: any) => {
                return `
                  <div>
                    <b>${params.name}</b><br/>
                    Clave: ${params.data.clave}<br/>
                    Total: $${Number(params.value).toLocaleString("es-MX", { minimumFractionDigits: 2 })}<br/>
                    ${params.percent}%
                  </div>
                `
              },
            },
          legend: { type: "scroll", orient: "horizontal", bottom: 0 },
          series: [
            {
              type: "pie",
              radius: ["40%", "70%"],
              label: { show: true, formatter: "{b}: {d}%" },
              data: data.map(item => ({
                name: item.descripcion,      // 👈 usamos descripcion
                value: Number(item.total),
                clave: item.clave // 👈 AQUI SE AGREGA
              }))
            }
          ]
        })}
        onEvents={{ click: handleChartClick }}
        style={{ height: 400, width: "100%" }}
      />

      <Modal
        title={`Facturas relacionadas a: ${selectedDescripcion}`}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        width={800}
        centered
      >
        <Input
          placeholder="Buscar por UUID o RFC"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ marginBottom: 16 }}
        />
        <div
          style={{
            width: "100%",
            maxHeight: "420px",   // 👈 altura máxima del listado
            overflowY: "auto",    // 👈 scroll vertical
            overflowX: "auto",    // mantiene scroll horizontal si hace falta
          }}
        >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ borderBottom: "1px solid var(--border-color)", padding: "8px" }}>UUID</th>
              <th style={{ borderBottom: "1px solid #ccc", padding: "8px" }}>Fecha</th>
              <th style={{ borderBottom: "1px solid #ccc", padding: "8px" }}>RFC Emisor</th>
              <th style={{ borderBottom: "1px solid #ccc", padding: "8px" }}>Razon social emisor</th>
              <th style={{ borderBottom: "1px solid #ccc", padding: "8px" }}>Moneda</th>
              <th style={{ borderBottom: "1px solid #ccc", padding: "8px" }}>Total</th>
              <th style={{ borderBottom: "1px solid #ccc", padding: "8px" }}>IVA</th>
            </tr>
          </thead>
          <tbody>
            {filteredFacturas.map(f => (
              <tr key={f.uuid}>
                <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>{f.uuid}</td>
                <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>{formatFiscalDate(f.fecha)}</td>
                <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>{f.rfc_emisor}</td>
                <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>{f.razonsocialemisor}</td>
                <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>{f.moneda}</td>
                <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>${f.total}</td>
                <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>${f.totaltrasladosiva}</td>
              </tr>
            ))}
          </tbody>
        </table>
       </div>
      </Modal>
    </>
  );
};

export const MainExpensesChart = ({ data }: MainExpensesChartProps) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDescripcion, setSelectedDescripcion] = useState<string | null>(null);
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [search, setSearch] = useState("");
  const [darkMode, setDarkMode] = useState(false); // 🌙 Estado del modo oscuro


  // Función para obtener facturas por UUIDs
  const fetchFacturas = async (uuids: string[]) => {
    if (!uuids || uuids.length === 0) {
      setFacturas([]);
      return;
    }
  
    // Construimos query params: ?uuids=UUID-1&uuids=UUID-2
    const query = uuids.map(u => `uuids=${encodeURIComponent(u)}`).join("&");
  
    const response = await apiFetch(`${API_URL}/cfdis/by-uuid?${query}`);
    const data: Factura[] = await response?.json();
    setFacturas(data);
  };

  const handleChartClick = (params: any) => {
    const descripcion = params.name;
    // Buscamos el objeto del concepto que coincide con la descripción
    const concepto = data.find(item => item.descripcion === descripcion);

    if (concepto) {
      setSelectedDescripcion(descripcion);
      setModalOpen(true);
      fetchFacturas(concepto.uuids); // 👈 usamos los UUIDs relacionados
    }
  };

  // Filtrado por barra de búsqueda
  const filteredFacturas = facturas.filter(f =>
    f.uuid.includes(search) || f.rfc_emisor.includes(search) || f.razonsocialemisor.includes(search)
  );

    const modalStyle = {
    backgroundColor: darkMode ? "#1f1f1f" : "#fff",
    color: darkMode ? "#eaeaea" : "#000",
    transition: "all 0.3s ease",
  };

  const tableHeaderStyle = {
    borderBottom: "1px solid #ccc",
    padding: "8px",
    backgroundColor: darkMode ? "#333" : "#f5f5f5",
    color: darkMode ? "#eaeaea" : "#000",
  };

  const tableCellStyle = {
    padding: "8px",
    borderBottom: "1px solid #eee",
    color: darkMode ? "#eaeaea" : "#000",
  };

  const formatFiscalDate = (value?: string) => {
    if (!value) return "";
    if (value.includes("T")) return value.split("T")[0].split("-").reverse().join("/");
    if (value.includes("-")) return value.split("-").reverse().join("/");
    return value;
  };

  return (
    <>
      <EChartClient
        key={JSON.stringify(data)}
        extensions={[PieChart, TooltipComponent, LegendComponent, CanvasRenderer]}
        getOptions={() => ({
          tooltip: { 
            trigger: "item", 
              formatter: (params: any) => {
                return `
                  <div>
                    <b>${params.name}</b><br/>
                    Clave: ${params.data.clave}<br/>
                    Total: $${Number(params.value).toLocaleString("es-MX", { minimumFractionDigits: 2 })}<br/>
                    ${params.percent}%
                  </div>
                `
              }
          },
          legend: { type: "scroll", orient: "horizontal", bottom: 0 },
          series: [
            {
              type: "pie",
              radius: ["40%", "70%"],
              label: { 
                show: true, 
                formatter: "{b}: {d}%" 
              },
              data: data.map(item => ({
                name: item.descripcion,
                value: Number(item.total),
                clave: item.clave // 👈 AQUI SE AGREGA
              }))
            }
          ]
        })}
        onEvents={{ click: handleChartClick }}
        style={{ height: 400, width: "100%" }}
      />
      <Modal
        title={`Facturas relacionadas a: ${selectedDescripcion}`}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        width={800}
        centered
      >
        <Input
          placeholder="Buscar por UUID o RFC"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ marginBottom: 16 }}
        />
        <div
          style={{
            width: "100%",
            maxHeight: "420px",   // 👈 altura máxima del listado
            overflowY: "auto",    // 👈 scroll vertical
            overflowX: "auto",    // mantiene scroll horizontal si hace falta
          }}
        >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ borderBottom: "1px solid #ccc", padding: "8px" }}>UUID</th>
              <th style={{ borderBottom: "1px solid #ccc", padding: "8px" }}>Fecha</th>
              <th style={{ borderBottom: "1px solid #ccc", padding: "8px" }}>RFC Emisor</th>
              <th style={{ borderBottom: "1px solid #ccc", padding: "8px" }}>Razon social emisor</th>
              <th style={{ borderBottom: "1px solid #ccc", padding: "8px" }}>Moneda</th>
              <th style={{ borderBottom: "1px solid #ccc", padding: "8px" }}>Total</th>
              <th style={{ borderBottom: "1px solid #ccc", padding: "8px" }}>IVA</th>
            </tr>
          </thead>
          <tbody>
            {filteredFacturas.map(f => (
              <tr key={f.uuid}>
                <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>{f.uuid}</td>
                <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>{formatFiscalDate(f.fecha)}</td>
                <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>{f.rfc_emisor}</td>
                <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>{f.razonsocialemisor}</td>
                <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>{f.moneda}</td>
                <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>${f.total}</td>
                <td style={{ padding: "8px", borderBottom: "1px solid #eee" }}>${f.totaltrasladosiva}</td>
              </tr>
            ))}
          </tbody>
        </table>
       </div>
      </Modal>
    </>
  );
};


export const ExpensesByProviderChart = ({ data }: ExpensesByProviderChartProps) => {
    const colors = ["#4caf50", "#2196f3", "#ff9800", "#9c27b0", "#f44336", "#00bcd4"];

    const truncate = (text: string, max = 18) =>
      text.length > max ? text.slice(0, max) + "…" : text;

  return (
    <EChartClient
      extensions={[BarChart, TooltipComponent, LegendComponent, GridComponent, CanvasRenderer]}
      getOptions={() => ({
        tooltip: {
          trigger: "axis",
          formatter: (params: any) => {
            const p = params[0];
            return `
              <strong>${p.name}</strong><br/>
              Gasto: $${Number(p.value).toLocaleString("es-MX")}
            `;
          },
        },
        legend: { show: false },
        grid: { left: "4%", right: "4%", top: "10%", bottom: "15%", containLabel: true },
        xAxis: {
          type: "category",
          data: data.map(item => item.name), // usar la propiedad de proveedor de tu data
          axisLabel: {
            interval: 0,
            rotate: 45,              // 👈 más rotación
            width: 120,              // 👈 ancho máximo
            overflow: "truncate",    // 👈 clave
            formatter: (value: string) => truncate(value, 22),
          },
        },
        yAxis: {
          type: "value",
          splitNumber: 4, // menos líneas horizontales
        },
        series: [
          {
            type: "bar",
            barMaxWidth: 50, // 👈 clave
            data: data.map(item => ({
              value: item.value,
              itemStyle: {
                color: colors[data.indexOf(item) % colors.length] // asigna color según índice
              }
            })), // usar la propiedad de monto/gasto
            itemStyle: { 
              borderRadius: [6, 6, 0, 0] }
          }
        ]
      })}
      style={{ height: 400, width: "100%" }}
    />
  )
}


export const RevenueByClientChart = ({ data }: ClientsRevenueProps) => {
  const colors = ["#4caf50", "#2196f3", "#ff9800", "#9c27b0", "#f44336", "#00bcd4"];

  const truncate = (text: string, max = 22) =>
    text.length > max ? text.slice(0, max) + "…" : text;

  return (
    <EChartClient
      extensions={[BarChart, TooltipComponent, LegendComponent, GridComponent, CanvasRenderer]}
      getOptions={() => ({
        tooltip: {
          trigger: "axis",
          formatter: (params: any) => {
            const p = params[0];
            return `
              <strong>${p.name}</strong><br/>
              Ingresos: $${Number(p.value).toLocaleString("es-MX")}
            `;
          },
        },
        legend: { show: false },
        grid: { left: "4%", right: "4%", top: "10%", bottom: "15%", containLabel: true },
        xAxis: {
          type: "category",
          data: data.map(item => item.name), // usar la propiedad de cliente de tu data
          axisLabel: {
             interval: 0, 
             rotate: 30,
             formatter: (value: string) => truncate(value),
            }, // rotar etiquetas largas
        },
        yAxis: {
          type: "value",
          splitNumber: 4, // menos líneas horizontales
        },
        series: [
          {
            type: "bar",
            barMaxWidth: 50, // 👈 clave
            data: data.map(item => ({
              value: item.value,
              itemStyle: {
                color: colors[data.indexOf(item) % colors.length] // asigna color según índice
              }
            })), // usar la propiedad de monto/revenue
            itemStyle: { borderRadius: [6, 6, 0, 0] }
          }
        ]
      })}
      style={{ height: "100%", width: "100%" }}
    />
  )
}


export const DonutChart = ({ data }: DonutChartProps) => {
  const [options, setOptions] = useState<EChartsOption>(() => getEchartOptions(data));
  const [updateKey, setUpdateKey] = useState(0);

  useEffect(() => {
    // cuando cambie data, recalculamos y forzamos remount
    setOptions(getEchartOptions(data));
    setUpdateKey((k) => k + 1);
  }, [data]);

  return (
    <EChartClient
      key={updateKey}
      extensions={[PieChart, TooltipComponent, CanvasRenderer]}
      getOptions={() => options}
      style={{ height: 60, width: 60 }}
    />
  );
};

export const FinanceChart = ({ rfc, startDate, endDate }: FinanceChartProps) => {
  const [options, setOptions] = useState<EChartsOption>({
    xAxis: { type: "category", data: [] },
    yAxis: { type: "value" },
    series: [],
  })
  const [updateKey, setUpdateKey] = useState(0)

  useEffect(() => {
    getFinanceStatsChart(rfc, startDate, endDate).then((data) => {
 
      const category = data.map((row: any) => {
        return row.fecha;
      })
      const ingresos = data.map((row: any) => row.ingresos)
      const egresos = data.map((row: any) => row.egresos)

      setOptions({
        tooltip: { trigger: 'item' },
        legend: { data: ['Ingresos', 'Egresos'] },
        xAxis: { type: 'category', data: category },
        yAxis: { type: 'value' },
        series: [
          { name: 'Ingresos', type: 'line', data: ingresos, smooth: true },
          { name: 'Egresos', type: 'line', data: egresos, smooth: true, itemStyle: { color: "#555555" }}
        ],
      })
      setUpdateKey((k) => k + 1) // <--- forzar actualización
    })
  }, [rfc, startDate, endDate])

  return (
    <EChartClient
      extensions={[LineChart, TooltipComponent, CanvasRenderer]}
      getOptions={() => options}
      key={updateKey} // <--- importante
      style={{ height: 405 }}
    />
  )
}

export const WorldMap = () => {
  const isClient = useIsClient()
  return (
    isClient && <BaseVectorMap type="world" options={getWorldMapOptions()} style={{ height: 297 }} />
  )
}