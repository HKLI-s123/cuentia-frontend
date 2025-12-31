"use client"

import { useEffect, useState } from "react"
import { Button, Card, CardBody, CardHeader, CardTitle, Col, Form } from "react-bootstrap"
import { TbFileExport } from "react-icons/tb"
import { saveAs } from "file-saver";
import dynamic from "next/dynamic"
import { getMainRevenue } from "../../../../../../services/financeService"

const MainRevenueChart = dynamic(() =>
  import("../charts").then((mod) => mod.MainRevenueChart)
)

type RevenueItem = {
  clave: string
  descripcion: string
  total: number
  uuids: string[]
}

type Props = {
  rfc: string
}

const MainRevenue = ({ rfc }: Props) => {
  const [revenue, setRevenue] = useState<RevenueItem[]>([])
  const [startDate, setStartDate] = useState<string>("")
  const [endDate, setEndDate] = useState<string>("")

  // Calcular fechas del mes actual
  useEffect(() => {
    const today = new Date()
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0)

    setStartDate(firstDay.toISOString().split("T")[0]) // YYYY-MM-DD
    setEndDate(lastDay.toISOString().split("T")[0])   // YYYY-MM-DD
  }, [])

  // Función para traer ingresos filtrados
  const fetchRevenue = () => {
    getMainRevenue(rfc, startDate, endDate)
      .then(setRevenue)
      .catch(console.error)
  }

  // Cargar datos cuando fechas ya estén listas
  useEffect(() => {
    if (startDate && endDate) {
      fetchRevenue()
    }
  }, [startDate, endDate, rfc])

  // Manejar click en botón filtrar
  const handleFilter = () => {
    fetchRevenue()
  }

  const handleExportCSV = () => {
    const csvRows = [
      ["Categoria", "Total"], // encabezado
      ...revenue.map(e => [e.descripcion, e.total])
    ];
  
    const csvContent = csvRows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, `IngresosPrincipales-${startDate}-${endDate}.csv`);
  };

  
  const chartData = revenue.map(e => ({
    clave: e.clave,
    descripcion: e.descripcion,
    total: Number(e.total),
    uuids: e.uuids
  }))
  
  return (
    <Col xs={12}>
      <Card>
        <CardHeader className="justify-content-between align-items-center border-dashed">
          <CardTitle as="h4" className="mb-0">Principales Ingresos</CardTitle>
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
          <div style={{ height: 400 }}>
            <MainRevenueChart data={(chartData)} />
          </div>
        </CardBody>
      </Card>
    </Col>
  )
}

export default MainRevenue
