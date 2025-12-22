"use client";

import { useEffect, useState } from "react";
import { Button, Card, CardBody, CardFooter, CardHeader, CardTitle, Col, Form, Table} from "react-bootstrap";
import { TbFileExport, TbCircleFilled } from "react-icons/tb";
import { saveAs } from "file-saver";
import { getIncomeByClient } from "../../../../../../services/financeService"
import dynamic from "next/dynamic";
import CardPagination from "@/components/cards/CardPagination";

const RevenueByClientChart = dynamic(() =>
  import("../charts").then((mod) => mod.RevenueByClientChart)
);

type ClientIncome = {
  id: string;
  name: string;
  rfc: string;
  ingresos: number;
  porcentaje: number;
  status: string;
  statusVariant: string;
};

type Props = {
  rfc: string
}

const RevenueByClient = ({ rfc }: Props) => {
  const [data, setData] = useState<ClientIncome[]>([]);
  const [loading, setLoading] = useState(true);
  
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
   
    const data = await getIncomeByClient(rfc, startDate, endDate);

    setData(data);
    setLoading(false);
    setCurrentPage(1); // reinicia la paginación al filtrar
  };

  useEffect(() => {
    fetchData();
  }, [rfc]);

  const handleFilter = () => {
    fetchData();
  };

  const handleExportCSV = () => {
  if (data.length === 0) return;
  // 🔹 Cabeceras del CSV
  const headers = ["Cliente", "RFC", "Ingresos", "Participacion", "Estatus"];
  // 🔹 Total general para calcular %
  const totalIngresos = data.reduce((acc, c) => acc + c.ingresos, 0);
  // 🔹 Filas con datos
  const rows = data.map((client) => [
    client.name,
    client.rfc,
    client.ingresos,
    ((client.ingresos / totalIngresos) * 100).toFixed(2) + "%",
    client.status,
  ]);
  // 🔹 También puedes añadir sección de la gráfica (ejemplo, al final)
  const chartRows = [
    [],
    ["Datos de Grafica (Ingresos por Cliente)"],
    ["Cliente", "Valor"],
    ...data.map((r) => [r.name, r.ingresos]),
  ];
  // 🔹 Generar string CSV
  const csvContent =
    [headers, ...rows, ...chartRows]
      .map((row) => row.map((value) => `"${value}"`).join(","))
      .join("\n");
  // 🔹 Descargar con FileSaver
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  saveAs(blob, `Reporte-Ingresos-${rfc}-${startDate || "inicio"}_${endDate || "fin"}.csv`);
  
  };

  // Calcular índices para paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentData = data.slice(indexOfFirstItem, indexOfLastItem);

  // Total general para porcentaje
  const totalIngresos = data.reduce((acc, c) => acc + c.ingresos, 0);

  if (loading) return <Col xxl={6}><p>Cargando...</p></Col>;

  return (
    <Col xxl={6}>
      <Card>
        <CardHeader className="justify-content-between align-items-center border-dashed">
          <CardTitle as="h4" className="mb-0">Ingresos por cliente</CardTitle>
          <div className="d-flex flex-sm-nowrap flex-wrap gap-2 align-items-center">
              <Form.Label
               className="fw-semibold text-secondary"
               style={{ fontSize: "0.75rem", letterSpacing: "0.3px" }}
              >
               Desde
            </Form.Label>
            <Form.Control type="date" size="sm" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              <Form.Label
               className="fw-semibold text-secondary"
               style={{ fontSize: "0.75rem", letterSpacing: "0.3px" }}
              >
               Hasta
            </Form.Label>
            <Form.Control type="date" size="sm" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            <Button variant="secondary" size="sm" onClick={handleFilter}>Filtrar</Button>
            <Button variant="primary" size="sm" onClick={handleExportCSV}>
              <TbFileExport className="me-1" /> CSV
            </Button>
          </div>
        </CardHeader>
        <CardBody>
          <div style={{ height: 400 }}>
            <RevenueByClientChart data={data.map(r => ({ name: r.name, value: r.ingresos }))} />
          </div>

          <div className="table-responsive mt-3">
            <Table className="table-centered table-custom table-sm table-nowrap table-hover mb-0">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>RFC</th>
                  <th>Ingresos</th>
                  <th>Participación</th>
                  <th>Estatus</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {currentData.map(client => (
                  <tr key={client.id}>
                    <td>{client.name}</td>
                    <td>{client.rfc}</td>
                    <td><strong>${client.ingresos.toLocaleString()}</strong></td>
                    <td>{((client.ingresos / totalIngresos) * 100).toFixed(2)}%</td>
                    <td>
                      <TbCircleFilled className={`fs-xs text-${client.statusVariant} me-1`} />
                      {client.status}
                    </td>
                    <td style={{ width: 30 }}>
                    </td>
                  </tr>
                ))}

                {/* Fila de total de la página */}
              </tbody>
            </Table>
          </div>
        </CardBody>
        <CardFooter className="border-0">
          <CardPagination
            totalItems={data.length}
            itemsPerPage={itemsPerPage}
            currentPage={currentPage}
            itemsName="clientes"
            onPageChange={(page: number) => setCurrentPage(page)}
          />
        </CardFooter>
      </Card>
    </Col>
  );
};

export default RevenueByClient;
