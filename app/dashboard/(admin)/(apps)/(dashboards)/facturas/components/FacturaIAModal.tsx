// src/components/FacturaIAModal.tsx
import { apiFetch } from "@/app/services/apiClient";
import React, { useEffect, useState } from "react";
import { Modal, Button, Spinner } from "react-bootstrap";
import { TbBrain } from "react-icons/tb";

interface FacturaIAModalProps {
  show: boolean;
  loading: boolean;
  iaAnalysis: string | null;
  onClose: () => void;
}

const FacturaIAModal: React.FC<FacturaIAModalProps> = ({
  show,
  loading,
  iaAnalysis,
  onClose,
}) => {

  const [usados, setUsados] = useState<number | null>(null);
  const [limite, setLimite] = useState<number | null>(null);

  useEffect(() => {
    const fetchContador = async () => {
      try {
        const userId = 1; // simulado
        const response = await apiFetch(`http://localhost:3001/cfdis/ia-factura/contador?userId=${userId}`);
        if (!response?.ok) throw new Error("Error al obtener el contador IA");
        const data = await response.json();
        setUsados(data.usados);
        setLimite(data.limite);
      } catch (error) {
        console.error("❌ Error al obtener contador de análisis IA:", error);
      }
    };

    if (show && loading) {
      fetchContador();
    }
  }, [show, loading]);

  const renderModalContent = () => {
    if (loading) {
      return (
        <div className="text-center py-4">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2 text-muted">Analizando factura con IA...</p>

          {usados !== null && limite !== null && (
            <p className="mt-3">
               Has realizado <strong>{usados}</strong> de <strong>{limite}</strong> análisis disponibles hoy.<br />
              <a
                href="/plans"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary fw-semibold text-decoration-underline"
              >
                Ampliar límite
              </a>
            </p>
          )}
        </div>
      );
    }

    if (!iaAnalysis) {
      return <p className="text-muted">No se encontró análisis disponible.</p>;
    }

    let parsed: any;
    try {
      parsed = JSON.parse(iaAnalysis.replace(/```json|```/g, "").trim());
    } catch (err) {
      console.error("❌ Error al parsear JSON IA:", err);
      return <p className="text-danger">Ocurrió un error al obtener el análisis de IA o se superó el límite diario.</p>;
    }

    // 🔹 Limpieza de claves y conversión de valores
    const formatKey = (key: string) =>
      key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

    const formatValue = (value: any): React.ReactNode => {
      if (value === null || value === undefined) return "—";
      if (typeof value === "boolean") return value ? "Verdadero" : "Falso";
      if (typeof value === "string" || typeof value === "number") return String(value);

      if (Array.isArray(value))
        return (
          <ul
            className="ms-4 list-disc"
            style={{
              paddingLeft: "1.2rem",
              marginTop: "0.5rem",
              marginBottom: "0.5rem",
            }}
          >
            {value.map((v, i) => (
              <li
                key={i}
                className="mb-4"
                style={{
                  marginBottom: "0.5rem",
                  lineHeight: 1.5,
                }}
              >
                {formatValue(v)}
              </li>
            ))}
          </ul>
        );

      if (typeof value === "object") {
        return (
          <div
            className="ms-3"
            style={{
              borderLeft: "2px solid #dee2e6",
              paddingLeft: "0.8rem",
              marginTop: "0.5rem",
              marginBottom: "0.5rem",
            }}
          >
            {Object.entries(value).map(([k, v]) => (
              <div
                key={k}
                className="mb-2"
                style={{ marginBottom: "0.3rem" }}
              >
                <strong>{formatKey(k)}:</strong> {formatValue(v)}
              </div>
            ))}
          </div>
        );
      }

      return String(value);
    };

    const renderSection = (title: string, content: any) => (
      <div
        className="mb-4 pb-3 border-bottom"
        style={{ borderColor: "#e9ecef" }}
      >
        <h5 className="fw-bold text-primary mb-2">{formatKey(title)}</h5>
        <div>{formatValue(content)}</div>
      </div>
    );

    return (
      <div>
        {renderSection("resumen_general", parsed.resumen_general)}
        {renderSection("clasificacion_contable", parsed.clasificacion_contable)}
        {renderSection("analisis_pagos", parsed.analisis_pagos)}
        {renderSection("validacion_fiscal", parsed.validacion_fiscal)}
        {renderSection("observaciones", parsed.observaciones)}
        {renderSection("indice_salud_fiscal", parsed.indice_salud_fiscal)}
        {renderSection("conclusion", parsed.conclusion)}
      </div>
    );
  };

  return (
    <Modal show={show} onHide={onClose} centered size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          <TbBrain className="me-2 text-primary" />
          Análisis Inteligente de Factura
        </Modal.Title>
      </Modal.Header>

      <Modal.Body
        className="bg-light p-3 rounded border"
        style={{
          maxHeight: "70vh",
          overflowY: "auto",
          lineHeight: 1.6,
          fontSize: "0.95rem",
        }}
      >
        {renderModalContent()}
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Cerrar
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default FacturaIAModal;
