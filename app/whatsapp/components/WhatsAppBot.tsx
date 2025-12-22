"use client";

import { Container, Row, Col, Card, Button } from "react-bootstrap";
import { TbBrandWhatsapp, TbRocket } from "react-icons/tb";

export const WhatsappBot = () => {
  return (
    <Container fluid>
      <Row className="justify-content-center mt-4">
        <Col xxl={8} lg={10}>
          <Card className="text-center border-dashed shadow-sm">
            <Card.Body>
              <h2 className="mb-3">🤖 Tu Asistente Contable en WhatsApp</h2>
              <p className="text-muted">
                Conversa con tu empresa como si hablaras con un amigo.  
                Consulta tus <strong>ingresos</strong>, <strong>gastos</strong>,  
                descarga tu <strong>Constancia de Situación Fiscal</strong> y revisa tu  
                <strong>Opinión de Cumplimiento</strong>, todo desde WhatsApp.
              </p>

              <div className="d-flex justify-content-center gap-3 mt-4">
                <Button
                  variant="success"
                  size="lg"
                  href="https://wa.me/521XXXXXXXXXX"
                  target="_blank"
                >
                  <TbBrandWhatsapp className="me-2" /> Abrir en WhatsApp
                </Button>

                <Button variant="primary" size="lg">
                  <TbRocket className="me-2" /> Contratar Bot
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};
