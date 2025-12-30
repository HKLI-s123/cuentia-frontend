"use client";

import { useEffect, useState } from "react";
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  CardTitle,
  Col,
  Form,
  Table,
} from "react-bootstrap";
import { saveAs } from "file-saver";
import { TbCircleFilled, TbFileExport } from "react-icons/tb";
import CardPagination from "@/components/cards/CardPagination";
import { getExpensesByProvider } from "../../../../../../services/financeService"
import dynamic from "next/dynamic";

const ExpensesByProviderChart = dynamic(() =>
  import("../charts").then((mod) => mod.ExpensesByProviderChart)
);

type ProviderExpense = {
  id: string;
  name: string;
  rfc: string;
  gastos: number;
  porcentaje: number;
  status: string;
  statusVariant: string;
};

type Props = {
  rfc: string
}

const ExpensesByProvider = ({ rfc }: Props) => {
  const [data, setData] = useState<ProviderExpense[]>([]);
  const [loading, setLoading] = useState(true);

  const MAX_ITEMS = 8;

  const processedChartData = (() => {
    if (!data || data.length === 0) return [];
  
    const sorted = [...data].sort((a, b) => b.gastos - a.gastos);
  
    if (sorted.length <= MAX_ITEMS) {
      return sorted.map(p => ({
        name: p.name,
        value: p.gastos,
      }));
    }
  
    const top = sorted.slice(0, MAX_ITEMS);
    const rest = sorted.slice(MAX_ITEMS);
  
    const othersTotal = rest.reduce((acc, p) => acc + p.gastos, 0);
  
    return [
      ...top.map(p => ({
        name: p.name,
        value: p.gastos,
      })),
      {
        name: "Otros proveedores",
        value: othersTotal,
      },
    ];
  })();

  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split("T")[0];
  
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    .toISOString()
    .split("T")[0];
  
  const [startDate, setStartDate] = useState(firstDayOfMonth);
  const [endDate, setEndDate] = useState(lastDayOfMonth);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const fetchData = async () => {
    setLoading(true);

    const data = await getExpensesByProvider(rfc, startDate, endDate);

    setData(data);
    setLoading(false);
    setCurrentPage(1); // Reinicia la paginación al filtrar
  };

  useEffect(() => {
    fetchData();
  }, [rfc]);

  const handleFilter = () => {
    fetchData();
  };

  const handleExportCSV = () => {
  if (data.length === 0) return  
  // 🔹 Cabeceras del CSV
  const headers = ["Cliente", "RFC", "Gastos", "Participacion", "Estatus"]  
  // 🔹 Total general para calcular %
  const totalGastos = data.reduce((acc, c) => acc + c.gastos, 0)  
  // 🔹 Filas con datos
  const rows = data.map((client) => [
    client.name,
    client.rfc,
    client.gastos,
    ((client.gastos / totalGastos) * 100).toFixed(2) + "%",
    client.status,
  ])  
  // 🔹 También puedes añadir sección de la gráfica (ejemplo, al final)
  const chartRows = [
    [],
    ["Datos de Grafica (Gastos por proveedor)"],
    ["Proveedor", "Gasto"],
    ...data.map((r) => [r.name, r.gastos]),
  ]  
  // 🔹 Generar string CSV
  const csvContent =
    [headers, ...rows, ...chartRows]
      .map((row) => row.map((value) => `"${value}"`).join(","))
      .join("\n")  
  // 🔹 Descargar con FileSaver
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  saveAs(blob, `Reporte-Gastos-${rfc}-${startDate || "inicio"}_${endDate || "fin"}.csv`);  
  };

  // ---- Paginación ----
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentData = data.slice(indexOfFirstItem, indexOfLastItem);

  if (loading) return <Col xxl={6}><p>Cargando...</p></Col>;

  return (
    <Col xxl={6}>
      <Card>
        <CardHeader className="justify-content-between align-items-center border-dashed">
          <CardTitle as="h4" className="mb-0">Gastos por Proveedor</CardTitle>
           <div className="d-flex flex-sm-nowrap flex-wrap gap-2 align-items-center">
            <Form.Label
               className="fw-semibold text-secondary"
               style={{ fontSize: "0.75rem", letterSpacing: "0.3px" }}
            >
               Desde
            </Form.Label>
            <Form.Control
              type="date"
              size="sm"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <Form.Label
               className="fw-semibold text-secondary"
               style={{ fontSize: "0.75rem", letterSpacing: "0.3px" }}
            >
               Hasta
            </Form.Label>
            <Form.Control
              type="date"
              size="sm"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
            <Button variant="secondary" size="sm" onClick={handleFilter}>
              Filtrar
            </Button>
            <Button variant="primary" size="sm" onClick={handleExportCSV}>
              <TbFileExport className="me-1" /> CSV
            </Button>
          </div>
        </CardHeader>

        <CardBody>
          <div style={{ height: 250 }}>
            <ExpensesByProviderChart
              data={processedChartData}
            />
          </div>

          <div className="table-responsive mt-3">
            <Table className="table-centered table-custom table-sm table-nowrap table-hover mb-0">
              <thead>
                <tr>
                  <th>Proveedor</th>
                  <th>RFC</th>
                  <th>Gastos</th>
                  <th>Participación</th>
                  <th>Estatus</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {currentData.map((provider) => (
                  <tr key={provider.id}>
                    <td>{provider.name}</td>
                    <td>{provider.rfc}</td>
                    <td>
                      <strong>${provider.gastos.toLocaleString()}</strong>
                    </td>
                    <td>{provider.porcentaje.toFixed(2)}%</td>
                    <td>
                      <TbCircleFilled
                        className={`fs-xs text-${provider.statusVariant} me-1`}
                      />{" "}
                      {provider.status}
                    </td>
                    <td style={{ width: 30 }}>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </CardBody>

        <CardFooter className="border-0">
          <CardPagination
            totalItems={data.length}
            itemsPerPage={itemsPerPage}
            currentPage={currentPage}
            itemsName="proveedores"
            onPageChange={(page: number) => setCurrentPage(page)}
          />
        </CardFooter>
      </Card>
    </Col>
  );
};

export default ExpensesByProvider;
