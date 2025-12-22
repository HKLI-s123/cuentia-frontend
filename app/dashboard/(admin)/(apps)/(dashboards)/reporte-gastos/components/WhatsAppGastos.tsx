"use client";

import { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button, Spinner } from "react-bootstrap";
import { TbBrandWhatsapp, TbRocket } from "react-icons/tb";
import { ComprobantesCliente } from "./comprobantesList";
import { toast } from "sonner";
import { apiFetch } from "@/app/services/apiClient";
import { getSessionInfo } from "@/app/services/authService";

export const WhatsappGastos = () => {
  const [qr, setQr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [showReconnect, setShowReconnect] = useState(false);
  const [hasContract, setHasContract] = useState(false); // 🆕 nuevo estado
  const [userId, setUserId] = useState<number | null>(null);
  const [type, setType] = useState<string | null>(null);

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

    apiFetch(`http://localhost:3001/whatsapp/status/${clientId}/${BOT_TYPE}`)
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
      const res = await apiFetch(`http://localhost:3001/whatsapp/qr-limit/${clientId}/${BOT_TYPE}`);
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
      await apiFetch(`http://localhost:3001/whatsapp/reconnect`, {
        method: "POST",
        body: JSON.stringify({ clientId, botType: BOT_TYPE}),
      });

      const eventSource = new EventSource(
        `http://localhost:3001/whatsapp/qr/${clientId}/${BOT_TYPE}`
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
      const res = await apiFetch(`http://localhost:3001/whatsapp/qr-limit/${clientId}/${BOT_TYPE}`);
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
      await apiFetch(`http://localhost:3001/whatsapp/create`, {
        method: "POST",
        body: JSON.stringify({ clientId,  botType: BOT_TYPE }),
      });

      const eventSource = new EventSource(
        `http://localhost:3001/whatsapp/qr/${clientId}/${BOT_TYPE}`
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
      const res = await apiFetch(`http://localhost:3001/whatsapp/qr-limit/${clientId}/${BOT_TYPE}`);
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
