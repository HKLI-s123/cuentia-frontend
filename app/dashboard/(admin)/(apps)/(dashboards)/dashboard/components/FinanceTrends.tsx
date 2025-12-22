"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Col,
  Nav,
  NavItem,
  NavLink,
  ProgressBar,
  Row,
} from "react-bootstrap";
import {
  TbDownload,
  TbCalendarStats,
  TbCalendar,
  TbArrowUp,
  TbArrowDown,
  TbBolt,
} from "react-icons/tb";

import { getFinanceTrends } from "../../../../../../services/financeService";
import { apiFetch } from "@/app/services/apiClient";
import { API_URL } from "@/utils/env";

const FinanceChart = dynamic(
  () => import("../charts").then((mod) => mod.FinanceChart),
  { ssr: false }
);

type TrendItem = {
  value: number;
  valuePrefix?: string;
  valueSuffix?: string;
  percentage: number;
  title: string;
  progress: number;
};

type Props = {
  rfc: string;
};

// -----------------------------
// Helper: Obtiene rango de fechas
// -----------------------------
const getDateRange = (key: string) => {
  const today = new Date();
  let startDate: string | undefined;
  let endDate: string | undefined;

  if (key === "monthly-ct") {
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    startDate = firstDay.toISOString().split("T")[0];
    endDate = lastDay.toISOString().split("T")[0];
  } else if (key === "annual-ct") {
    const firstDay = new Date(today.getFullYear(), 0, 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    startDate = firstDay.toISOString().split("T")[0];
    endDate = lastDay.toISOString().split("T")[0];
  }

  return { startDate, endDate };
};

const FinanceTrends = ({ rfc }: Props) => {
  const [trendsData, setTrendsData] = useState<TrendItem[]>([]);
  const [activeKey, setActiveKey] = useState("monthly-ct");

  // Estado que almacena las fechas *ya cálculadas en cliente*
  const [range, setRange] = useState({ startDate: "", endDate: "" });

  // -----------------------------
  // 1) Calcular fechas en cliente
  // -----------------------------
  useEffect(() => {
    const { startDate, endDate } = getDateRange(activeKey);

    if (startDate && endDate) {
      setRange({ startDate, endDate });
    }
  }, [activeKey]);

  // -----------------------------
  // 2) Fetch cuando ya haya fechas válidas
  // -----------------------------
  useEffect(() => {
    if (!range.startDate || !range.endDate) return;

    getFinanceTrends(rfc, range.startDate, range.endDate)
      .then(setTrendsData)
      .catch(console.error);
  }, [range, rfc]);

  const renderIcon = (percentage: number) => {
    if (percentage > 0) return <TbArrowUp className="text-success" />;
    if (percentage < 0) return <TbArrowDown className="text-danger" />;
    return <TbBolt className="text-primary" />;
  };

  const { startDate, endDate } = range;

  // -----------------------------
  // Descargar Reporte
  // -----------------------------
  const handleDownload = async () => {
    try {
      const res = await apiFetch(
        `${API_URL}/cfdis/finance-report?rfc=${rfc}&startDate=${startDate}&endDate=${endDate}`,
        { method: "GET" }
      );

      if (!res?.ok) throw new Error("Error al generar el reporte");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `Reporte-${rfc}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Row>
      <Col xs={12}>
        <Card>
          <CardHeader className="border-dashed card-tabs d-flex align-items-center">
            <div className="flex-grow-1">
              <CardTitle as="h4">Tendencias Financieras</CardTitle>
            </div>

            {/* Tabs Mensual / Anual */}
            <Nav
              variant="tabs"
              activeKey={activeKey}
              onSelect={(k) => setActiveKey(k || "monthly-ct")}
              className="card-header-tabs nav-bordered"
            >
              <NavItem>
                <NavLink eventKey="monthly-ct">
                  <TbCalendar className="d-md-none d-block" />
                  <span className="d-none d-md-block">Mensual</span>
                </NavLink>
              </NavItem>

              <NavItem>
                <NavLink eventKey="annual-ct">
                  <TbCalendarStats className="d-md-none d-block" />
                  <span className="d-none d-md-block">Anual</span>
                </NavLink>
              </NavItem>
            </Nav>
          </CardHeader>

          <CardBody className="p-0">
            <Row className="g-0">
              {/* Chart dinámico con fechas */}
              <Col xxl={8} className="border-end border-dashed">
                <FinanceChart
                  rfc={rfc}
                  startDate={startDate}
                  endDate={endDate}
                />
              </Col>

              {/* KPIs */}
              <Col xxl={4}>
                <div className="p-3 bg-light-subtle border-bottom border-dashed">
                  <Row>
                    <Col>
                      <h4 className="fs-sm mb-1">¿Quieres el reporte completo?</h4>
                      <small className="text-muted fs-xs mb-0">
                        Todos los datos financieros están actualizados
                      </small>
                    </Col>
                    <Col xs="auto" className="align-self-center">
                      <Button
                        variant="default"
                        size="sm"
                        className="rounded-circle btn-icon"
                        title="Descargar"
                        onClick={handleDownload}
                      >
                        <TbDownload className="fs-xl" />
                      </Button>
                    </Col>
                  </Row>
                </div>

                <Row xs={1} md={2} xxl={2} className="g-1 p-1">
                  {trendsData.map(
                    (
                      { value, valuePrefix, valueSuffix, percentage, progress, title },
                      index
                    ) => (
                      <Col key={index}>
                        <Card className="rounded-0 border shadow-none border-dashed mb-0">
                          <CardBody>
                            <div className="mb-3 d-flex justify-content-between align-items-center">
                              <h5 className="fs-xl mb-0">
                                {valuePrefix}
                                {value.toLocaleString()}
                                {valueSuffix && <small> {valueSuffix}</small>}
                              </h5>

                              <span>
                                {percentage.toFixed(2)}% {renderIcon(percentage)}
                              </span>
                            </div>

                            <p className="text-muted mb-2">{title}</p>

                            <ProgressBar
                              now={progress}
                              variant="secondary"
                              style={{ height: "0.25rem" }}
                              aria-label={title}
                            />
                          </CardBody>
                        </Card>
                      </Col>
                    )
                  )}
                </Row>
              </Col>
            </Row>
          </CardBody>
        </Card>
      </Col>
    </Row>
  );
};

export default FinanceTrends;
