'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { Badge, Button, Card, CardBody, CardHeader, CardTitle, Col, Row, Form } from 'react-bootstrap'
import CountUpClient from '@/components/CountUpClient'
import { getFinanceStats } from '../../../../../../services/financeService'
  
  const DonutChart = dynamic(() => import('../charts').then((mod) => mod.DonutChart))
  
  type Props = {
    rfc: string
  }
  
  type KpiData = {
    title: string
    badgeColor: string
    badgeText: string
    value: number
    metric: string
    prefix?: string
    suffix?: string
    chartData?: { name: string; value: number }[]
  }
  
  const FinanceStats = ({ rfc }: Props) => {
    const [cardData, setCardData] = useState<KpiData[]>([])
    const [startDate, setStartDate] = useState<string>("")
    const [endDate, setEndDate] = useState<string>("")
  
    const [isDark, setIsDark] = useState(false);
  
  useEffect(() => {
    const html = document.documentElement;
  
    const checkTheme = () => {
      const theme = html.getAttribute("data-bs-theme");
      setIsDark(theme === "dark");
    };
  
    // correr ahora
    checkTheme();
  
    // correr cuando cambie
    const observer = new MutationObserver(checkTheme);
    observer.observe(html, { attributes: true, attributeFilter: ["data-bs-theme"] });
  
    return () => observer.disconnect();
  }, []);
  
  
    // 🔹 Calcular fechas del mes actual por defecto
    useEffect(() => {
      const today = new Date()
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0)
  
      setStartDate(firstDay.toISOString().split('T')[0])
      setEndDate(lastDay.toISOString().split('T')[0])
    }, [])
  
    // 🔹 Traer datos cuando cambien las fechas
    useEffect(() => {
      if (!startDate || !endDate) return
  
      getFinanceStats(rfc, startDate, endDate)
        .then(setCardData)
        .catch(console.error)
    }, [startDate, endDate, rfc]
  )

  const handleFilter = () => {
    // refetch con las fechas seleccionadas
    if (startDate && endDate) {
      getFinanceStats(rfc, startDate, endDate)
        .then(setCardData)
        .catch(console.error)
    }
  }

  return (
    <>
      {/* Filtros de fecha */}
      <div
        className="p-3 mb-4 border rounded"
        style={{
          backgroundColor: isDark ? "#1d1f25" : "#ffffff"
        }}
      >
        <Row className="mb-2 g-3 align-items-end">
        <Col xs="auto">
          <Form.Group>
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
              style={{
                minWidth: "150px",
                borderRadius: "8px",
                borderColor: "#d0d5dd",
                fontSize: "0.85rem",
                paddingTop: "0.35rem",
                paddingBottom: "0.35rem",
              }}
            />
          </Form.Group>
        </Col>
      
        <Col xs="auto">
          <Form.Group>
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
              style={{
                minWidth: "150px",
                borderRadius: "8px",
                borderColor: "#d0d5dd",
                fontSize: "0.85rem",
                paddingTop: "0.35rem",
                paddingBottom: "0.35rem",
              }}
            />
          </Form.Group>
        </Col>
      
        <Col xs="auto" className="pt-2">
          <Button
            size="sm"
            variant="primary"
            onClick={handleFilter}
            className="px-4"
            style={{
              borderRadius: "8px",
              fontWeight: 500,
            }}
          >
            Filtrar
          </Button>
        </Col>
      </Row>
      </div>
      <Row xs={1} md={2} xxl={4}>
        {cardData.map((item, index) => (
          <Col key={index}>
            <Card>
              <CardHeader className="d-flex border-dashed justify-content-between align-items-center">
                <CardTitle as="h5">{item.title}</CardTitle>
                <Badge bg={item.badgeColor} className={`bg-opacity-10 text-${item.badgeColor}`}>
                  {item.badgeText}
                </Badge>
              </CardHeader>
              <CardBody>
                <div className="d-flex justify-content-between align-items-center text-nowrap">
                  <div className="flex-grow-1">
                    <DonutChart data={item.chartData || []} />
                  </div>
                  <div className="text-end">
                    <h3 className="mb-2 fw-normal">
                      {item?.prefix}
                      <CountUpClient duration={1} end={item.value} />
                      {item?.suffix}
                    </h3>
                    <p className="mb-0 text-muted">
                      <span>{item.metric}</span>
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </Col>
        ))}
      </Row>
    </>
  )
}

export default FinanceStats
