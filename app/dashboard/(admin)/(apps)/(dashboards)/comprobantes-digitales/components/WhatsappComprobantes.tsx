"use client";

import { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button, Spinner } from "react-bootstrap";
import { TbBrandWhatsapp, TbRocket } from "react-icons/tb";
import { ComprobantesDigitalesList } from "./comprobantesDigitalesList"; // o un componente nuevo si quieres más campos
import { toast } from "sonner";
import { apiFetch } from "@/app/services/apiClient";
import { getSessionInfo } from "@/app/services/authService";
import { API_URL } from "@/utils/env";

export const WhatsappComprobantes = () => {
  const [qr, setQr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [showReconnect, setShowReconnect] = useState(false);
  const [hasContract, setHasContract] = useState(false);
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


  const BOT_TYPE = "comprobantes-digitales";

  useEffect(() => {
    if (!userId) return;   // 👈 evitar ejecutar sin ID
    const clientId = `${BOT_TYPE}-${userId}`;

    apiFetch(`${API_URL}/whatsapp/status/${clientId}/${BOT_TYPE}`)
      .then((res) => res?.json())
      .then((data) => {
        setHasContract(data.hasContract ?? false);

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
    const clientId = `${BOT_TYPE}-${userId}`;

    toast.info(
      "Una vez que el QR desaparezca tras la conexión, reinicie la página para continuar."
    );

    try {
      const res = await apiFetch(`${API_URL}/whatsapp/qr-limit/${clientId}/${BOT_TYPE}`);
      const data = await res?.json();

      if (!data.canGenerate) {
        toast.error("Has alcanzado el límite diario de 10 QR. Intenta de nuevo mañana.");
        return;
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
        body: JSON.stringify({ clientId, botType: BOT_TYPE }),
      });

      const eventSource = new EventSource(
        `${API_URL}/whatsapp/qr/${clientId}/${BOT_TYPE}`
      );

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.qr){
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
    const clientId = `${BOT_TYPE}-${userId}`;

    try {
      const res = await apiFetch(`${API_URL}/whatsapp/qr-limit/${clientId}/${BOT_TYPE}`);
      const data = await res?.json();
      if (!data.canGenerate) {
        toast.error("Has alcanzado el límite diario de 10 QR. Intenta de nuevo mañana.");
        return;
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
        body: JSON.stringify({ clientId, botType: BOT_TYPE}),
      });

      const eventSource = new EventSource(
        `${API_URL}/whatsapp/qr/${clientId}/${BOT_TYPE}`
      );

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.qr){
          setQr(data.qr.qr);
          setLoading(false); // ✅ Detiene el spinner al recibir el QR
        }
        if (data.connected) {
          setQr(null);
          setConnected(true);
          setLoading(false);
          setShowReconnect(false);
          setHasContract(true);
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
    const clientId = `${BOT_TYPE}-${userId}`;

    try {
      const res = await apiFetch(`${API_URL}/whatsapp/qr-limit/${clientId}/${BOT_TYPE}`);
      const data = await res?.json();
      if (!data.canGenerate) {
        toast.error("Has alcanzado el límite diario de 10 QR. Intenta de nuevo mañana.");
        return;
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
              <h2 className="mb-3">💬 Bot de Comprobantes</h2>
              <p className="text-muted">
                Envía tus comprobantes de transferencias o efectivo directamente y el sistema los
                procesará automáticamente. Se guardarán en tu contabilidad y podrás exportarlos a Excel.
              </p>

              {showReconnect && !connected && (
                <div className="mt-4">
                  <h5>Sesión desconectada</h5>
                  <p>Puedes reconectar tu bot dando click en el botón de abajo.</p>
                  <Button variant="warning" size="lg" onClick={handleReconnect}>
                    Reconectar
                  </Button>
                </div>
              )}

              {!qr && !connected && !showReconnect && type !== "empleado" && (
                <div className="d-flex justify-content-center gap-3 mt-4">
                  {!hasContract ? (
                    <Button variant="success" size="lg" href="/plans#bots" className="d-flex align-items-center justify-content-center gap-2 text-white">
                      <TbRocket className="me-2" />Contratar Bot
                    </Button>
                  ) : (
                    <Button variant="primary" size="lg" onClick={handleStartBot}>
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
                  <Countdown key={qr} />
                </div>
              )}

              {(connected || type === "empleado") && (
                <div className="mt-4">
                  <ComprobantesDigitalesList userId={userId} />
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default WhatsappComprobantes;
