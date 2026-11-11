// src/components/NotaCreditoPreviewModal.tsx
"use client";

import React, { useState } from "react";
import { Modal, Button, Badge, Collapse, Spinner } from "react-bootstrap";
import {
  TbChevronDown,
  TbFileMinus,
  TbBuildingBank,
  TbUser,
  TbReceiptTax,
  TbFileInvoice,
  TbListDetails,
  TbFileTypePdf,
  TbFileZip,
} from "react-icons/tb";
import { toast } from "sonner";
import { descargarCfdiPdf, descargarXmlsZip, notaCreditoFromDb } from "@/utils/cfdi";

interface NotaCreditoPreviewModalProps {
  show: boolean;
  onClose: () => void;
  nota: any | null;
  conceptos: any[];
  cargandoConceptos?: boolean;
  rfcActual?: string; // RFC seleccionado: para pedir el XML e inferir Emitida/Recibida
}

// Lee un campo de concepto tolerando distintas convenciones de nombre
const cf = (c: any, ...keys: string[]) => {
  for (const k of keys) {
    if (c[k] !== undefined && c[k] !== null && c[k] !== "") return c[k];
  }
  return undefined;
};

// 🎨 Paleta de marca Cuentia (misma que FacturaPreviewModal)
const TEAL = "#1AB394";
const INDIGO = "#6B5EAE";
const DARK = "#2E2E3A";

const money = (v: any) =>
  `$${(Number(v) || 0).toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const fecha = (v: any) => {
  if (!v) return "—";
  const s = String(v);
  const base = s.includes("T") ? s.split("T")[0] : s.split(" ")[0];
  if (base.includes("-")) return base.split("-").reverse().join("/");
  return base;
};

const NotaCreditoPreviewModal: React.FC<NotaCreditoPreviewModalProps> = ({
  show,
  onClose,
  nota,
  conceptos,
  cargandoConceptos,
  rfcActual,
}) => {
  const [openConceptos, setOpenConceptos] = useState(true);
  const [descargandoPdf, setDescargandoPdf] = useState(false);
  const [exportandoXml, setExportandoXml] = useState(false);

  if (!nota) return null;

  // ZIP con el XML original de esta nota de crédito
  const handleExportarXml = async () => {
    setExportandoXml(true);
    try {
      const { exportados } = await descargarXmlsZip({
        uuids: [nota.uuid],
        rfc: rfcActual,
        nombre: `XML_${nota.uuid}`,
      });
      if (exportados === 0) {
        toast.error("No encontramos el XML original de esta nota de crédito.");
      }
    } catch (err) {
      console.error("Error al exportar el XML de la nota de crédito:", err);
      toast.error("No se pudo exportar el XML de la nota de crédito.");
    } finally {
      setExportandoXml(false);
    }
  };

  // PDF estilo SAT: usa el XML original; si no está, los datos registrados
  const handleDescargarPdf = async () => {
    setDescargandoPdf(true);
    try {
      const { fuente } = await descargarCfdiPdf({
        uuid: nota.uuid,
        rfc: rfcActual,
        fallback: () => notaCreditoFromDb(nota, conceptos),
      });
      if (fuente === "db") {
        toast.info(
          "No encontramos el XML original de esta nota de crédito; el PDF se generó con los datos registrados (sin sellos digitales)."
        );
      }
    } catch (err) {
      console.error("Error al generar el PDF de la nota de crédito:", err);
      toast.error("No se pudo generar el PDF de la nota de crédito.");
    } finally {
      setDescargandoPdf(false);
    }
  };

  // Emitida: el RFC actual EMITE la nota (reduce sus ingresos).
  // Recibida: el RFC actual la RECIBE (reduce sus gastos).
  const esEmitida = rfcActual && nota.rfc_emisor === rfcActual;
  const movimiento = !rfcActual ? "—" : esEmitida ? "Emitida" : "Recibida";
  const movimientoColor = !rfcActual ? "secondary" : esEmitida ? "danger" : "success";

  const statusColor =
    nota.estatus === "Vigente"
      ? "success"
      : nota.estatus === "Pendiente"
      ? "warning"
      : nota.estatus
      ? "danger"
      : "secondary";

  const impuestos = [
    { label: "Subtotal", value: nota.subtotal },
    { label: "Descuento", value: nota.descuento, negative: true },
    { label: "IVA 8%", value: nota.iva_8 },
    { label: "IVA 16%", value: nota.iva_16 },
    { label: "Total trasladados", value: nota.total_trasladados },
  ];

  const retenciones = [
    { label: "Retención ISR", value: nota.retencion_isr },
    { label: "Retención IVA", value: nota.retencion_iva },
    { label: "Total retenidos", value: nota.total_retenidos },
  ];

  const sectionTitle: React.CSSProperties = {
    fontSize: "0.72rem",
    fontWeight: 700,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: INDIGO,
    marginBottom: "0.5rem",
  };

  return (
    <Modal show={show} onHide={onClose} centered size="lg" scrollable>
      <Modal.Body className="p-0" style={{ background: "#f4f5f9" }}>
        {/* ───── Encabezado tipo comprobante ───── */}
        <div
          style={{
            background: `linear-gradient(135deg, ${TEAL} 0%, ${INDIGO} 100%)`,
            color: "#fff",
            padding: "1.25rem 1.5rem",
          }}
        >
          <div className="d-flex justify-content-between align-items-start">
            <div>
              <div className="d-flex align-items-center gap-2 mb-1">
                <TbFileMinus size={22} />
                <span style={{ fontSize: "1.05rem", fontWeight: 700 }}>
                  Nota de Crédito (CFDI de Egreso)
                </span>
              </div>
              <div style={{ fontSize: "0.78rem", opacity: 0.9 }}>
                Fecha: {fecha(nota.fecha_emision)}
                {nota.forma_pago ? ` · Forma de pago: ${nota.forma_pago}` : ""}
              </div>
            </div>
            <div className="text-end">
              <Badge bg={movimientoColor} className="mb-1">
                {movimiento}
              </Badge>
              <div style={{ fontSize: "1.6rem", fontWeight: 800, lineHeight: 1.1 }}>
                {money(nota.total)}
              </div>
              <div style={{ fontSize: "0.72rem", opacity: 0.9 }}>
                {nota.moneda || "MXN"}
                {nota.moneda && nota.moneda !== "MXN" && nota.tipo_cambio
                  ? ` · TC ${nota.tipo_cambio}`
                  : ""}
              </div>
            </div>
          </div>

          <div
            className="mt-2 pt-2"
            style={{
              borderTop: "1px solid rgba(255,255,255,0.25)",
              fontSize: "0.7rem",
              wordBreak: "break-all",
              opacity: 0.92,
            }}
          >
            UUID: {nota.uuid || "—"}
          </div>
        </div>

        {/* ───── Cuerpo "papel" ───── */}
        <div className="p-3 p-md-4">
          {/* Emisor / Receptor */}
          <div className="row g-3 mb-3">
            <div className="col-12 col-md-6">
              <div
                className="bg-white rounded-3 p-3 h-100"
                style={{ border: "1px solid #e6e8ef" }}
              >
                <div style={sectionTitle}>
                  <TbBuildingBank className="me-1" /> Emisor
                </div>
                <div className="fw-semibold" style={{ color: DARK }}>
                  {nota.nombre_emisor || "—"}
                </div>
                <div className="text-muted" style={{ fontSize: "0.82rem" }}>
                  RFC: {nota.rfc_emisor || "—"}
                </div>
                {nota.regimen_emisor && (
                  <div className="text-muted" style={{ fontSize: "0.82rem" }}>
                    Régimen: {nota.regimen_emisor}
                  </div>
                )}
              </div>
            </div>
            <div className="col-12 col-md-6">
              <div
                className="bg-white rounded-3 p-3 h-100"
                style={{ border: "1px solid #e6e8ef" }}
              >
                <div style={sectionTitle}>
                  <TbUser className="me-1" /> Receptor
                </div>
                <div className="fw-semibold" style={{ color: DARK }}>
                  {nota.nombre_receptor || "—"}
                </div>
                <div className="text-muted" style={{ fontSize: "0.82rem" }}>
                  RFC: {nota.rfc_receptor || "—"}
                </div>
                {nota.regimen_receptor && (
                  <div className="text-muted" style={{ fontSize: "0.82rem" }}>
                    Régimen: {nota.regimen_receptor}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Datos generales */}
          <div
            className="bg-white rounded-3 p-3 mb-3"
            style={{ border: "1px solid #e6e8ef" }}
          >
            <div className="row g-2" style={{ fontSize: "0.82rem" }}>
              <DatoGeneral label="Tipo comprobante" value={nota.tipo_comprobante || "E"} />
              <DatoGeneral label="Método de pago" value={nota.metodo_pago} />
              <DatoGeneral label="Forma de pago" value={nota.forma_pago} />
              <DatoGeneral
                label="Estatus"
                value={
                  nota.estatus ? (
                    <>
                      <span className={`text-${statusColor}`}>●</span> {nota.estatus}
                    </>
                  ) : null
                }
              />
            </div>
          </div>

          {/* Factura relacionada */}
          <div
            className="bg-white rounded-3 p-3 mb-3"
            style={{ border: "1px solid #e6e8ef" }}
          >
            <div style={sectionTitle}>
              <TbFileInvoice className="me-1" /> Factura relacionada
            </div>
            <div
              className="fw-semibold"
              style={{ color: DARK, fontSize: "0.82rem", wordBreak: "break-all" }}
            >
              {nota.uuid_factura_relacionada || "Sin factura relacionada registrada"}
            </div>
          </div>

          {/* ───── Conceptos (colapsable con scroll) ───── */}
          <SeccionColapsable
            icon={<TbListDetails />}
            titulo="Conceptos"
            count={conceptos.length}
            open={openConceptos}
            onToggle={() => setOpenConceptos((o) => !o)}
            color={INDIGO}
          >
            {cargandoConceptos ? (
              <div className="text-muted small px-1 py-2 d-flex align-items-center gap-2">
                <Spinner animation="border" size="sm" /> Cargando conceptos...
              </div>
            ) : conceptos.length === 0 ? (
              <div className="text-muted small px-1 py-2">
                No hay conceptos disponibles para esta nota de crédito.
              </div>
            ) : (
              <div style={{ maxHeight: "360px", overflowY: "auto" }} className="pe-1">
                {conceptos.map((c, i) => (
                  <div
                    key={i}
                    className="rounded-3 p-2 mb-2"
                    style={{ background: "#f7f8fc", border: "1px solid #e6e8ef" }}
                  >
                    <div className="d-flex justify-content-between align-items-start gap-2 mb-1">
                      <span className="fw-semibold" style={{ fontSize: "0.82rem", color: DARK }}>
                        {i + 1}. {cf(c, "descripcion") || "—"}
                      </span>
                      <span className="fw-bold text-nowrap" style={{ color: TEAL }}>
                        {money(cf(c, "importe"))}
                      </span>
                    </div>
                    {(cf(c, "clave_prod_serv", "claveprodserv") ||
                      cf(c, "no_identificacion", "noidentificacion")) && (
                      <div className="text-muted" style={{ fontSize: "0.68rem" }}>
                        {cf(c, "clave_prod_serv", "claveprodserv") &&
                          `Clave: ${cf(c, "clave_prod_serv", "claveprodserv")}`}
                        {cf(c, "no_identificacion", "noidentificacion") &&
                          ` · No. Ident.: ${cf(c, "no_identificacion", "noidentificacion")}`}
                      </div>
                    )}
                    <div className="row g-1 mt-1" style={{ fontSize: "0.78rem" }}>
                      <MiniDato label="Cantidad" value={cf(c, "cantidad") ?? "—"} />
                      <MiniDato
                        label="Unidad"
                        value={cf(c, "unidad", "clave_unidad", "claveunidad") ?? "—"}
                      />
                      <MiniDato
                        label="Valor unitario"
                        value={money(cf(c, "valor_unitario", "valorunitario"))}
                      />
                      <MiniDato label="Descuento" value={money(cf(c, "descuento"))} />
                      <MiniDato label="IVA 16%" value={money(cf(c, "iva16"))} />
                      <MiniDato label="IVA 8%" value={money(cf(c, "iva8"))} />
                      <MiniDato label="IEPS tras." value={money(cf(c, "ieps_trasladado"))} />
                      <MiniDato label="Ret. ISR" value={money(cf(c, "retencion_isr"))} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SeccionColapsable>

          {/* Impuestos y retenciones */}
          <div
            className="bg-white rounded-3 p-3 mb-3"
            style={{ border: "1px solid #e6e8ef" }}
          >
            <div style={sectionTitle}>
              <TbReceiptTax className="me-1" /> Impuestos y retenciones
            </div>
            <div className="row g-3">
              <div className="col-12 col-md-6">
                {impuestos.map((r) => (
                  <FilaMonto key={r.label} {...r} />
                ))}
              </div>
              <div className="col-12 col-md-6">
                {retenciones.map((r) => (
                  <FilaMonto key={r.label} {...r} negative />
                ))}
              </div>
            </div>
            <div
              className="d-flex justify-content-between align-items-center mt-3 pt-2"
              style={{ borderTop: `2px solid ${TEAL}` }}
            >
              <span className="fw-bold" style={{ color: DARK }}>
                TOTAL
              </span>
              <span className="fw-bold" style={{ color: TEAL, fontSize: "1.15rem" }}>
                {money(nota.total)}
              </span>
            </div>
          </div>
        </div>
      </Modal.Body>

      <Modal.Footer className="border-0">
        <Button
          variant="outline-primary"
          onClick={handleExportarXml}
          disabled={exportandoXml || !nota.uuid}
          className="d-inline-flex align-items-center gap-1"
        >
          <TbFileZip size={18} />
          {exportandoXml ? "Exportando..." : "Exportar XML"}
        </Button>
        <Button
          variant="primary"
          onClick={handleDescargarPdf}
          // Espera a los conceptos: si no hay XML, el PDF se arma con ellos
          disabled={descargandoPdf || cargandoConceptos || !nota.uuid}
          className="d-inline-flex align-items-center gap-1"
        >
          <TbFileTypePdf size={18} />
          {descargandoPdf ? "Generando PDF..." : "Descargar PDF"}
        </Button>
        <Button variant="secondary" onClick={onClose}>
          Cerrar
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

// ───── Subcomponentes ─────

const DatoGeneral: React.FC<{ label: string; value: React.ReactNode }> = ({
  label,
  value,
}) => (
  <div className="col-6 col-md-3">
    <div className="text-muted" style={{ fontSize: "0.68rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>
      {label}
    </div>
    <div className="fw-semibold" style={{ color: DARK }}>
      {value || "—"}
    </div>
  </div>
);

const FilaMonto: React.FC<{ label: string; value: any; negative?: boolean }> = ({
  label,
  value,
  negative,
}) => (
  <div className="d-flex justify-content-between py-1" style={{ fontSize: "0.85rem" }}>
    <span className="text-muted">{label}</span>
    <span className="fw-semibold" style={{ color: negative ? "#c0392b" : DARK }}>
      {negative && (Number(value) || 0) !== 0 ? "-" : ""}
      {money(value)}
    </span>
  </div>
);

const MiniDato: React.FC<{ label: string; value: React.ReactNode }> = ({
  label,
  value,
}) => (
  <div className="col-6 col-md-3">
    <div className="text-muted" style={{ fontSize: "0.66rem" }}>
      {label}
    </div>
    <div className="fw-semibold" style={{ color: DARK }}>
      {value}
    </div>
  </div>
);

const SeccionColapsable: React.FC<{
  icon: React.ReactNode;
  titulo: string;
  count: number;
  open: boolean;
  onToggle: () => void;
  color: string;
  children: React.ReactNode;
}> = ({ icon, titulo, count, open, onToggle, color, children }) => (
  <div className="bg-white rounded-3 mb-3" style={{ border: "1px solid #e6e8ef" }}>
    <button
      type="button"
      onClick={onToggle}
      className="btn w-100 d-flex justify-content-between align-items-center p-3"
      style={{ border: "none", background: "transparent" }}
    >
      <span className="d-flex align-items-center gap-2 fw-semibold" style={{ color: DARK }}>
        <span style={{ color }}>{icon}</span>
        {titulo}
        <Badge bg="light" text="dark" style={{ border: "1px solid #e6e8ef" }}>
          {count}
        </Badge>
      </span>
      <TbChevronDown
        style={{
          transition: "transform 0.2s",
          transform: open ? "rotate(180deg)" : "rotate(0deg)",
          color: "#8a8fa3",
        }}
      />
    </button>
    <Collapse in={open}>
      <div>
        <div className="px-3 pb-3">{children}</div>
      </div>
    </Collapse>
  </div>
);

export default NotaCreditoPreviewModal;
