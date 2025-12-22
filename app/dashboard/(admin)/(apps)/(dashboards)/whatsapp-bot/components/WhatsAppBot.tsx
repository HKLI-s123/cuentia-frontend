"use client";

import { getSessionInfo } from "@/app/services/authService";
import { useOnboardingRedirect } from "@/hooks/useUserSessionGuard";
import { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button, Spinner } from "react-bootstrap";
import { TbBrandWhatsapp, TbRocket } from "react-icons/tb";

export const WhatsappBot = () => {
  const [hasBot, setHasBot] = useState<boolean | null>(null); // null = cargando
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getSessionInfo();
        setSession(data);

        // 🔒 Validar que esté verificado
        if (!data.verified) {
          window.location.href = "/validar-cuenta";
          return;
        }

        // TODO: cuando conectes al backend de bots, aquí setHasBot(true/false)
        setHasBot(false);

      } catch (err: any) {
        console.error("Error cargando sesión:", err);

        // 🔐 Si no hay sesión → al login
        if (err?.status === 401 || err?.status === 403) {
          localStorage.removeItem("accessToken");
          window.location.href = "/login";
        }
      }
    };

    load();
  }, []);

  useOnboardingRedirect(session);

  if (!session) {
    return (
      <div className="flex justify-center items-center h-[60vh] text-gray-600">
        Cargando tu cuenta...
      </div>
    );
  }

  // ⏳ Mientras carga
  if (!session || hasBot === null) {
    return (
      <Container fluid className="mt-4 text-center">
        <Spinner animation="border" role="status" />
      </Container>
    );
  }

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
                descarga tu <strong>Constancia de Situación Fiscal</strong> y revisa tu{" "}
                <strong>Opinión de Cumplimiento</strong>, todo desde WhatsApp.
              </p>

              <div className="d-flex justify-content-center gap-3 mt-4">
                {session.tipoCuenta === "invitado" ? (
                  <Button variant="secondary" size="lg" disabled>
                    <TbRocket className="me-2" /> No disponible
                  </Button>
                ) : hasBot ? (
                  <Button
                    variant="success"
                    size="lg"
                    href="https://wa.me/521XXXXXXXXXX"
                    target="_blank"
                  >
                    <TbBrandWhatsapp className="me-2" /> Abrir en WhatsApp
                  </Button>
                ) : (
                  <Button variant="primary" size="lg">
                    <TbRocket className="me-2" /> Contratar Bot
                  </Button>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default WhatsappBot;
