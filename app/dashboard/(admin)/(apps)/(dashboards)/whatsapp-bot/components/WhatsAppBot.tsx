"use client";

import { getSessionInfo } from "@/app/services/authService";
import { useOnboardingRedirect } from "@/hooks/useUserSessionGuard";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button, Spinner } from "react-bootstrap";
import { TbBrandWhatsapp, TbRocket } from "react-icons/tb";

export const WhatsappBot = () => {
  const [hasBot, setHasBot] = useState<boolean | null>(null); // null = cargando
  const [session, setSession] = useState<any>(null);
  const [showInstructions, setShowInstructions] = useState(true);

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
              </p>

              <div className="d-flex justify-content-between align-items-center mt-4">
                <h5 className="mb-0">Guía de uso del bot</h5>
              
                <Button
                  variant="link"
                  className="text-decoration-none"
                  onClick={() => setShowInstructions((prev) => !prev)}
                >
                  {showInstructions ? "Ocultar instrucciones " : "¿Cómo funciona?"}
                </Button>
              </div>

              <AnimatePresence initial={false}>
              {showInstructions && (
                <motion.div
                  key="instructions"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  style={{ overflow: "hidden" }}
                >
              <div className="mt-4 text-start">
                <Card className="border-0 bg-light">
                  <Card.Body>
                    <h5 className="mb-3">¿Qué puedes hacer con tu Asistente Contable?</h5>
              
                    <p className="mb-3">
                      Este bot funciona como tu <strong>asistente financiero y contable</strong>.
                      Puedes hacerle preguntas y solicitar reportes directamente desde WhatsApp,
                      como si estuvieras chateando con una persona.
                    </p>
              
                    <ul className="mb-3">
                      <li className="mb-2">
                        <strong>Consulta tus ingresos y egresos</strong><br />
                        Pregunta por tus ingresos totales, gastos del mes o un
                        resumen general de tu flujo de dinero.
                      </li>
              
                      <li className="mb-2">
                        <strong>Analiza tu información</strong><br />
                        Puedes solicitar:
                        <ul className="mt-1">
                          <li>- Resumen de flujo de efectivo.</li>
                          <li>- Top de ingresos.</li>
                          <li>- Top de gastos.</li>
                          <li>- Ingresos por cliente.</li>
                          <li>- Gastos por proveedor.</li>
                        </ul>
                      </li>
              
                      <li className="mb-2">
                        <strong>Consulta impuestos y control</strong><br />
                        Pregunta por tu <strong>IVA trasladado</strong>, control de egresos
                        y otros indicadores clave de tu operación.
                      </li>
              
                      <li className="mb-2">
                        <strong>Exporta tu información</strong><br />
                        Solicita la exportación de tus comprobantes de gastos o ventas guardados
                        en <strong>Excel</strong> para análisis o respaldo.
                      </li>
                    </ul>
              
                    <hr />
              
                    <h6 className="mt-3">Según tu tipo de cuenta</h6>
                    <ul className="mb-3">
                      <li className="mb-2">
                        <strong>Cuenta individual:</strong><br />
                        Puedes consultar toda tu información financiera y contable
                        correspondiente a tu actividad personal.
                      </li>
              
                      <li className="mb-2">
                        <strong>Cuenta empresarial:</strong><br />
                        Puedes realizar estas consultas <strong>por cada RFC </strong>
                        que tengas registrado como cliente dentro de tu cuenta.
                      </li>
                    </ul>
              
                    <hr />
              
                    <h6 className="mt-3">Recomendaciones importantes</h6>
                    <ul className="mb-2">
                      <li className="mb-2">
                        <strong>Registra un número fijo y de uso personal.</strong><br />
                        El bot utiliza tu número de WhatsApp como método de
                        <strong> autenticación</strong>, por lo que recomendamos usar
                        un número que solo tú controles.
                      </li>
              
                      <li className="mb-2">
                        <strong>Evita compartir el acceso.</strong><br />
                        Para mantener la seguridad de tu información financiera,
                        no compartas el número con terceros.
                      </li>
                    </ul>
              
                    <p className="mb-0 text-muted" style={{ fontSize: "0.9rem" }}>
                      💡 Consejo: mientras más organizada esté tu información,
                      más precisas y útiles serán las respuestas del asistente.
                    </p>
                  </Card.Body>
                </Card>
              </div>
              </motion.div>
              )}
              </AnimatePresence>


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
