"use client";

import { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button, Spinner } from "react-bootstrap";
import { TbBrandWhatsapp, TbRocket } from "react-icons/tb";
import { ComprobantesCliente } from "./comprobantesList";
import { toast } from "sonner";
import { apiFetch } from "@/app/services/apiClient";
import { getSessionInfo } from "@/app/services/authService";
import { API_URL } from "@/utils/env";
import { motion, AnimatePresence } from "framer-motion";

export const WhatsappGastos = () => {
  const [qr, setQr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [showReconnect, setShowReconnect] = useState(false);
  const [hasContract, setHasContract] = useState(false); // 🆕 nuevo estado
  const [userId, setUserId] = useState<number | null>(null);
  const [type, setType] = useState<string | null>(null);
  const [showInstructions, setShowInstructions] = useState(true);

  useEffect(() => {
      const loadSession = async () => {
        try {
          const session = await getSessionInfo();  // 💥 YA LO USAS EN CHAT

          if (!session.verified) {
            window.location.href = "/validar-cuenta";
            return;
          }

          setUserId(session.userId);     
          setType(session.tipoCuenta);     
        } catch (err) {
          console.error("Error cargando sesión", err);
        }
      };
    
      loadSession();
  }, []);

  const BOT_TYPE = "gastos";
  console.log("type", type);

  useEffect(() => {
    if (!userId) return;   // 👈 evitar ejecutar sin ID

    const clientId = `${BOT_TYPE}-${userId}`;

    console.log(clientId);

    apiFetch(`${API_URL}/whatsapp/status/${clientId}/${BOT_TYPE}`)
      .then((res) => res?.json())
      .then((data) => {
        console.log("status:", data);

        // ✅ Simulamos que el backend devuelve hasContract
        setHasContract(data.contracted);

        console.log(hasContract);

        if (data.connected) {
          setConnected(true);
          setQr(null);
          setLoading(false);
          setShowReconnect(false);
        } else if (data.hadSession && data.status === "disconnected") {
          setConnected(false);
          setShowReconnect(true);
          setQr(null);
        } else {
          setConnected(false);
          setShowReconnect(false);
        }
      })
      .catch((err) => console.error(err));
  }, [userId]);

  const handleReconnect = async () => {
    const clientId =  `${BOT_TYPE}-${userId}`;

    toast.info("Una vez que el QR desaparezca tras la conexión, reinicie la página para continuar.");

     try {
      const res = await apiFetch(`${API_URL}/whatsapp/qr-limit/${clientId}/${BOT_TYPE}`);
      const data = await res?.json();
  
      if (!data.canGenerate) {
        toast.error("Has alcanzado el límite diario de 10 QR. Intenta de nuevo mañana.");
        return; // salir sin generar QR
      }
    } catch (err) {
      toast.error("Error al validar límite de QR. Intenta nuevamente.");
      return;
    }

    setLoading(true);
    setQr(null);
    setConnected(false);

    try {
      await apiFetch(`${API_URL}/whatsapp/reconnect`, {
        method: "POST",
        body: JSON.stringify({ clientId, botType: BOT_TYPE}),
      });

      const eventSource = new EventSource(
        `${API_URL}/whatsapp/qr/${clientId}/${BOT_TYPE}`
      );

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.qr) {
          setQr(data.qr.qr);
          setLoading(false);
        }

        if (data.connected) {
          setQr(null);
          setConnected(true);
          setLoading(false);
          setShowReconnect(false);
          window.location.reload();
        }

        if (data.error) {
          toast.error(data.error);
          setLoading(false);
        }

        if (data.disconnected) {
          setConnected(false);
          setShowReconnect(true);
          setLoading(false);
          window.location.reload();
        }
      };

      eventSource.onerror = () => {
        console.error("Error recibiendo QR");
        eventSource.close();
      };
    } catch (err) {
      console.error("Error al reconectar sesión:", err);
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    const clientId =  `${BOT_TYPE}-${userId}`;

    try {
      const res = await apiFetch(`${API_URL}/whatsapp/qr-limit/${clientId}/${BOT_TYPE}`);
      const data = await res?.json();
  
      if (!data.canGenerate) {
        toast.error("Has alcanzado el límite diario de 10 QR. Intenta de nuevo mañana.");
        return; // salir sin generar QR
      }
    } catch (err) {
      toast.error("Error al validar límite de QR. Intenta nuevamente.");
      return;
    }


    setLoading(true);
    setQr(null);
    setConnected(false);

    try {
      await apiFetch(`${API_URL}/whatsapp/create`, {
        method: "POST",
        body: JSON.stringify({ clientId,  botType: BOT_TYPE }),
      });

      const eventSource = new EventSource(
        `${API_URL}/whatsapp/qr/${clientId}/${BOT_TYPE}`
      );

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.qr) {
          setQr(data.qr.qr);
          setLoading(false);
        }

        if (data.connected) {
          setQr(null);
          setConnected(true);
          setLoading(false);
          setShowReconnect(false);
          setHasContract(true); // 🆕 ya contratado tras primera conexión
          window.location.reload();
        }

        if (data.disconnected) {
          setConnected(false);
          setShowReconnect(true);
          setLoading(false);
          window.location.reload();
        }
      };

      eventSource.onerror = () => {
        console.error("Error recibiendo QR");
        eventSource.close();
      };
    } catch (err) {
      console.error("Error al crear sesión:", err);
      setLoading(false);
    }
  };

  const handleStartBot = async () => {
    const clientId =  `${BOT_TYPE}-${userId}`;

    try {
      const res = await apiFetch(`${API_URL}/whatsapp/qr-limit/${clientId}/${BOT_TYPE}`);
      const data = await res?.json();
  
        if (!data.canGenerate) {
          toast.error("Has alcanzado el límite diario de 10 QR. Intenta de nuevo mañana.");
          return; // salir sin generar QR
      }
    } catch (err) {
      toast.error("Error al validar límite de QR. Intenta nuevamente.");
      return;
    }
  
    toast.warning("La generación del código QR puede demorar unos minutos. Por favor, espere...");
    toast.info("Una vez que el QR desaparezca tras la conexión, reinicie la página para continuar.");


    await handleConnect();
  };

  const Countdown = ({ duration = 10 }) => {
    const [timeLeft, setTimeLeft] = useState(duration);
  
    useEffect(() => {
      const interval = setInterval(() => {
        setTimeLeft((prev) => (prev > 0 ? prev - 1 : duration));
      }, 1000);
      return () => clearInterval(interval);
    }, [duration]);
  
    return (
      <p className="mt-3 text-muted" style={{ fontSize: "0.9rem" }}>
        Generando nuevo QR en: <strong>{timeLeft}s</strong>
      </p>
    );
  };


  return (
    <Container fluid>
      <Row className="justify-content-center mt-4">
        <Col xxl={8} lg={10}>
          <Card className="text-center border-dashed shadow-sm">
            <Card.Body>
              <h2 className="mb-3">📸 Bot de Comprobantes de Gastos</h2>
              <p className="text-muted">
                Sube una foto o captura de tu ticket o comprobante de gasto y nuestro
                asistente lo procesará automáticamente.
                Los datos serán registrados en un <strong>Excel</strong> listo para tus reportes contables.
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
                    <h5 className="mb-3">¿Cómo usar correctamente el Bot de Comprobantes de Gastos?</h5>
              
                    <ul className="mb-3">
                      <li className="mb-2">
                        <strong>Usa un teléfono exclusivo para este bot.</strong><br />
                        Recomendamos utilizar un número dedicado únicamente a enviar tickets y
                        comprobantes de gastos, para mayor seguridad y mejor organización.
                      </li>
              
                      <li className="mb-2">
                        <strong>¿Qué tipo de comprobantes puedes enviar?</strong><br />
                        Puedes enviar:
                        <ul className="mt-1">
                          <li>Fotos de tickets de compra.</li>
                          <li>Imágenes de notas de compra o recibos físicos.</li>
                        </ul>
                      </li>
              
                      <li className="mb-2">
                        <strong>¿Cómo funciona el registro?</strong><br />
                        Toma la foto o captura del comprobante, envíala por WhatsApp al número con el que
                        iniciaste sesión y espera el mensaje de confirmación.  
                        Una vez confirmado, recarga esta página para ver el gasto registrado en la tabla.
                      </li>
              
                      <li className="mb-2">
                        <strong>No envíes demasiadas imágenes al mismo tiempo.</strong><br />
                        Para evitar bloqueos por spam:
                        <ul className="mt-1">
                          <li>Envía máximo <strong>3 imágenes por mensaje</strong>.</li>
                          <li>Espera al menos <strong>15 segundos</strong> entre cada envío.</li>
                        </ul>
                      </li>
              
                      <li className="mb-2">
                        <strong>Si el bot se desconecta, no te preocupes.</strong><br />
                        Solo da clic en <em>“Iniciar Bot”</em> nuevamente.
                        Todos tus comprobantes de gastos <strong>permanecen guardados</strong> en tu cuenta.
                      </li>
                    </ul>
              
                    <p className="mb-0 text-muted" style={{ fontSize: "0.9rem" }}>
                      💡 Consejo: enviar comprobantes claros y bien enfocados mejora la lectura automática
                      y evita registros incompletos en tus reportes.
                    </p>
                  </Card.Body>
                 </Card>
                </div>
               </motion.div>
              )}
              </AnimatePresence>

              {/* 🟡 Mostrar Reconectar */}
              {showReconnect && !connected && (
                <div className="mt-4">
                  <h5>Sesión desconectada</h5>
                  <p>Puedes reconectar tu bot dando click en el botón de abajo.</p>
                  <Button variant="warning" size="lg" onClick={handleReconnect}>
                    Reconectar
                  </Button>
                </div>
              )}

              {/* 🟢 Lógica de botones */}
              {!qr && !connected && !showReconnect && type !== "empleado" &&(
                <div className="d-flex justify-content-center gap-3 mt-4">
                  {!hasContract ? (
                    // 👉 Mostrar solo contratar
                    <Button
                      variant="success"
                      size="lg"
                      href="/plans#bots"
                      className="d-flex align-items-center justify-content-center gap-2 text-white"
                    >
                      <TbRocket />
                      Contratar Bot
                    </Button>
                  ) : (
                    // 👉 Mostrar solo iniciar
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={handleStartBot}
                    >
                      <TbBrandWhatsapp className="me-2" /> Iniciar Bot
                    </Button>
                  )}
                </div>
              )}

              {loading && (
                <div className="mt-4">
                  <Spinner animation="border" /> <p>Generando QR...</p>
                </div>
              )}

              {qr && !connected && (
                <div className="mt-4 text-center">
                  <h5>Escanea este código QR para conectar tu bot</h5>
                  <div className="d-flex justify-content-center mt-3">
                    <img
                      src={qr}
                      alt="QR de WhatsApp"
                      style={{
                        maxWidth: "300px",
                        border: "2px dashed #25D366",
                        borderRadius: "10px",
                        padding: "10px",
                      }}
                    />
                  </div>
                  {/* Contador regresivo */}
                  <Countdown key={qr} />
                </div>
              )}
              {(connected || type === "empleado")&& (
                <div className="mt-4">
                  <ComprobantesCliente 
                  userId={userId} 
                  />
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default WhatsappGastos;
