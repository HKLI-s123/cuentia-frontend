// src/components/FacturaPreviewModal.tsx
"use client";

import React, { useState } from "react";
import { Modal, Button, Badge, Collapse } from "react-bootstrap";
import {
  TbChevronDown,
  TbFileInvoice,
  TbBuildingBank,
  TbUser,
  TbReceiptTax,
  TbCash,
  TbFileMinus,
  TbListDetails,
} from "react-icons/tb";
import { Factura } from "../../../../../../types/factura";

interface FacturaPreviewModalProps {
  show: boolean;
  onClose: () => void;
  factura: Factura | null;
  conceptos: any[];
  pagos: any[];
  notas: any[];
}

// Lee un campo de concepto tolerando distintas convenciones de nombre
const cf = (c: any, ...keys: string[]) => {
  for (const k of keys) {
    if (c[k] !== undefined && c[k] !== null && c[k] !== "") return c[k];
  }
  return undefined;
};

// 🎨 Paleta de marca Cuentia
const TEAL = "#1AB394";
const INDIGO = "#6B5EAE";
const DARK = "#2E2E3A";

const money = (v: any) =>
  `$${(Number(v) || 0).toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const fecha = (v: any) =>
  v ? String(v).substring(0, 10).split("-").reverse().join("/") : "—";

const FacturaPreviewModal: React.FC<FacturaPreviewModalProps> = ({
  show,
  onClose,
  factura,
  conceptos,
  pagos,
  notas,
}) => {
  const [openConceptos, setOpenConceptos] = useState(true);
  const [openPagos, setOpenPagos] = useState(true);
  const [openNotas, setOpenNotas] = useState(true);

  if (!factura) return null;

  // Nómina (N) y complementos de pago (P) no tienen complementos de pago
  // ni notas de crédito asociadas.
  const aplicaRelacionados =
    factura.tipocomprobante !== "N" &&
    factura.tipocomprobante !== "P" &&
    factura.movimiento !== "Nomina";

  const movimientoColor =
    factura.movimiento === "Ingreso"
      ? "success"
      : factura.movimiento === "Egreso"
      ? "danger"
      : "secondary";

  const statusColor =
    factura.status === "Vigente"
      ? "success"
      : factura.status === "Pendiente"
      ? "warning"
      : "danger";

  // Filas de impuestos / retenciones que tienen valor
  const impuestos = [
    { label: "Subtotal", value: factura.subtotal, strong: false },
    { label: "Descuento", value: factura.descuento, negative: true },
    { label: "IVA 8%", value: factura.iva8 },
    { label: "IVA 16%", value: factura.iva16 },
    { label: "Total trasladados", value: factura.totaltrasladado },
  ];

  const retenciones = [
    { label: "Retención ISR", value: factura.retencionisr },
    { label: "Retención IVA", value: factura.retencioniva },
    { label: "Total retenidos", value: factura.totalretenidos },
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
        {/* ───── Encabezado tipo factura ───── */}
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
                <TbFileInvoice size={22} />
                <span style={{ fontSize: "1.05rem", fontWeight: 700 }}>
                  Comprobante Fiscal Digital
                </span>
              </div>
              <div style={{ fontSize: "0.78rem", opacity: 0.9 }}>
                Folio: {factura.folio || "—"} · Fecha: {fecha(factura.fecha_emision)}
              </div>
            </div>
            <div className="text-end">
              <Badge bg={movimientoColor} className="mb-1">
                {factura.movimiento || "—"}
              </Badge>
              <div style={{ fontSize: "1.6rem", fontWeight: 800, lineHeight: 1.1 }}>
                {money(factura.total)}
              </div>
              <div style={{ fontSize: "0.72rem", opacity: 0.9 }}>
                {factura.moneda || "MXN"}
                {factura.moneda && factura.moneda !== "MXN" && factura.tipocambio
                  ? ` · TC ${factura.tipocambio}`
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
            UUID: {factura.uuid}
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
                  {factura.razonsocialemisor || factura.cliente?.nombre || "—"}
                </div>
                <div className="text-muted" style={{ fontSize: "0.82rem" }}>
                  RFC: {factura.rfc_emisor || "—"}
                </div>
                {factura.regimenfiscal && (
                  <div className="text-muted" style={{ fontSize: "0.82rem" }}>
                    Régimen: {factura.regimenfiscal}
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
                  {factura.razonsocialreceptor || "—"}
                </div>
                <div className="text-muted" style={{ fontSize: "0.82rem" }}>
                  RFC: {factura.rfc_receptor || "—"}
                </div>
                {factura.regimenfiscalreceptor && (
                  <div className="text-muted" style={{ fontSize: "0.82rem" }}>
                    Régimen: {factura.regimenfiscalreceptor}
                  </div>
                )}
                {factura.usocfdi && (
                  <div className="text-muted" style={{ fontSize: "0.82rem" }}>
                    Uso CFDI: {factura.usocfdi}
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
              <DatoGeneral label="Tipo comprobante" value={factura.tipocomprobante} />
              <DatoGeneral label="Método de pago" value={factura.metodopago} />
              <DatoGeneral label="Forma de pago" value={factura.tipopago} />
              <DatoGeneral label="Estatus" value={
                <>
                  <span className={`text-${statusColor}`}>●</span> {factura.status}
                </>
              } />
            </div>
          </div>

          {/* ───── Conceptos (desglose, colapsable con scroll) ───── */}
          <SeccionColapsable
            icon={<TbListDetails />}
            titulo="Conceptos"
            count={conceptos.length}
            open={openConceptos}
            onToggle={() => setOpenConceptos((o) => !o)}
            color={INDIGO}
          >
            {conceptos.length === 0 ? (
              <div className="text-muted small px-1 py-2">
                No hay conceptos disponibles para esta factura.
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
                {money(factura.total)}
              </span>
            </div>
          </div>

          {/* ───── Complementos de pago (colapsable) ───── */}
          {aplicaRelacionados && (
          <>
          <SeccionColapsable
            icon={<TbCash />}
            titulo="Complementos de pago relacionados"
            count={pagos.length}
            open={openPagos}
            onToggle={() => setOpenPagos((o) => !o)}
            color={TEAL}
          >
            {pagos.length === 0 ? (
              <div className="text-muted small px-1 py-2">
                No hay complementos de pago relacionados con esta factura.
              </div>
            ) : (
              pagos.map((p, i) => (
                <div
                  key={p.uuid_complemento || i}
                  className="rounded-3 p-2 mb-2"
                  style={{ background: "#f7f8fc", border: "1px solid #e6e8ef" }}
                >
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="fw-semibold" style={{ fontSize: "0.8rem" }}>
                      Parcialidad {p.num_parcialidad ?? "—"} · {fecha(p.fecha_pago)}
                    </span>
                    <span className="fw-bold" style={{ color: TEAL }}>
                      {money(p.imp_pagado ?? p.monto)}
                    </span>
                  </div>
                  <div
                    className="text-muted"
                    style={{ fontSize: "0.68rem", wordBreak: "break-all" }}
                  >
                    UUID: {p.uuid_complemento || "—"}
                  </div>
                  <div className="row g-1 mt-1" style={{ fontSize: "0.78rem" }}>
                    <MiniDato label="Saldo anterior" value={money(p.imp_saldo_ant)} />
                    <MiniDato label="Pagado" value={money(p.imp_pagado ?? p.monto)} />
                    <MiniDato label="Saldo insoluto" value={money(p.imp_saldo_insoluto)} />
                    <MiniDato label="Forma de pago" value={p.forma_pago || "—"} />
                  </div>
                </div>
              ))
            )}
          </SeccionColapsable>

          {/* ───── Notas de crédito (colapsable) ───── */}
          <SeccionColapsable
            icon={<TbFileMinus />}
            titulo="Notas de crédito relacionadas"
            count={notas.length}
            open={openNotas}
            onToggle={() => setOpenNotas((o) => !o)}
            color={INDIGO}
          >
            {notas.length === 0 ? (
              <div className="text-muted small px-1 py-2">
                No hay notas de crédito relacionadas con esta factura.
              </div>
            ) : (
              notas.map((n, i) => (
                <div
                  key={n.uuid || i}
                  className="rounded-3 p-2 mb-2"
                  style={{ background: "#f7f8fc", border: "1px solid #e6e8ef" }}
                >
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="fw-semibold" style={{ fontSize: "0.8rem" }}>
                      {fecha(n.fecha_emision)}
                    </span>
                    <span className="fw-bold" style={{ color: INDIGO }}>
                      -{money(n.total)}
                    </span>
                  </div>
                  <div
                    className="text-muted"
                    style={{ fontSize: "0.68rem", wordBreak: "break-all" }}
                  >
                    UUID: {n.uuid || "—"}
                  </div>
                  <div className="row g-1 mt-1" style={{ fontSize: "0.78rem" }}>
                    <MiniDato label="Subtotal" value={money(n.subtotal)} />
                    <MiniDato label="IVA 16%" value={money(n.iva_16)} />
                    <MiniDato label="IVA 8%" value={money(n.iva_8)} />
                    <MiniDato label="Total" value={money(n.total)} />
                  </div>
                </div>
              ))
            )}
          </SeccionColapsable>
          </>
          )}
        </div>
      </Modal.Body>

      <Modal.Footer className="border-0">
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

export default FacturaPreviewModal;
