// src/components/ComplementoPreviewModal.tsx
"use client";

import React, { useState } from "react";
import { Modal, Button, Badge, Collapse } from "react-bootstrap";
import {
  TbChevronDown,
  TbCash,
  TbBuildingBank,
  TbUser,
  TbReceiptTax,
  TbFileInvoice,
  TbCreditCard,
} from "react-icons/tb";

// El preview recibe todas las filas (documentos relacionados) que comparten
// el mismo uuid_complemento. La primera fila sirve de "cabecera" del pago.
interface ComplementoPreviewModalProps {
  show: boolean;
  onClose: () => void;
  pago: any | null;          // fila representativa del complemento
  documentos: any[];         // todas las filas con el mismo uuid_complemento
  rfcActual?: string;        // RFC seleccionado, para inferir Ingreso/Egreso
}

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

const ComplementoPreviewModal: React.FC<ComplementoPreviewModalProps> = ({
  show,
  onClose,
  pago,
  documentos,
  rfcActual,
}) => {
  const [openDocs, setOpenDocs] = useState(true);
  const [openCuentas, setOpenCuentas] = useState(false);

  if (!pago) return null;

  // Ingreso: el RFC actual EMITE el complemento (recibió el pago).
  // Egreso: el RFC actual lo RECIBE (realizó el pago).
  const esIngreso = rfcActual && pago.rfc_emisor === rfcActual;
  const movimiento = !rfcActual ? "—" : esIngreso ? "Ingreso" : "Egreso";
  const movimientoColor = !rfcActual
    ? "secondary"
    : esIngreso
    ? "success"
    : "danger";

  const statusColor =
    pago.status === "Vigente"
      ? "success"
      : pago.status === "Pendiente"
      ? "warning"
      : pago.status
      ? "danger"
      : "secondary";

  // Monto total del complemento (el mismo en todas las filas del grupo)
  const montoTotal = Number(pago.monto ?? pago.total ?? 0);

  // Impuestos del pago (a nivel complemento)
  const impuestos = [
    { label: "Base IVA 16%", value: pago.base_16 },
    { label: "IVA trasladado 16%", value: pago.importe_trasladado_16 },
    { label: "Base IVA 8%", value: pago.base_8 },
    { label: "IVA trasladado 8%", value: pago.importe_trasladado_8 },
    { label: "Total trasladados", value: pago.total_imp_trasladados },
  ];
  const retenciones = [
    { label: "Importe retenido", value: pago.importe_retenido },
    { label: "Total retenidos", value: pago.total_imp_retenidos },
    { label: "Base exento", value: pago.base_exento },
  ];
  const hayImpuestos = [...impuestos, ...retenciones].some(
    (r) => (Number(r.value) || 0) !== 0
  );

  const hayCuentas =
    pago.banco_ordenante ||
    pago.cta_ordenante ||
    pago.rfc_cta_ordenante ||
    pago.cta_beneficiario ||
    pago.rfc_cta_beneficiario;

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
                <TbCash size={22} />
                <span style={{ fontSize: "1.05rem", fontWeight: 700 }}>
                  Complemento de Pago (REP)
                </span>
              </div>
              <div style={{ fontSize: "0.78rem", opacity: 0.9 }}>
                Fecha de pago: {fecha(pago.fecha_pago)}
                {pago.forma_pago ? ` · Forma de pago: ${pago.forma_pago}` : ""}
              </div>
            </div>
            <div className="text-end">
              <Badge bg={movimientoColor} className="mb-1">
                {movimiento}
              </Badge>
              <div style={{ fontSize: "1.6rem", fontWeight: 800, lineHeight: 1.1 }}>
                {money(montoTotal)}
              </div>
              <div style={{ fontSize: "0.72rem", opacity: 0.9 }}>
                {pago.moneda_pago || "MXN"}
                {pago.moneda_pago &&
                pago.moneda_pago !== "MXN" &&
                pago.tipo_cambio_pago
                  ? ` · TC ${pago.tipo_cambio_pago}`
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
            UUID complemento: {pago.uuid_complemento || "—"}
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
                  {pago.nombre_emisor || "—"}
                </div>
                <div className="text-muted" style={{ fontSize: "0.82rem" }}>
                  RFC: {pago.rfc_emisor || "—"}
                </div>
                {pago.regimen_emisor && (
                  <div className="text-muted" style={{ fontSize: "0.82rem" }}>
                    Régimen: {pago.regimen_emisor}
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
                  {pago.nombre_receptor || "—"}
                </div>
                <div className="text-muted" style={{ fontSize: "0.82rem" }}>
                  RFC: {pago.rfc_receptor || "—"}
                </div>
                {pago.regimen_receptor && (
                  <div className="text-muted" style={{ fontSize: "0.82rem" }}>
                    Régimen: {pago.regimen_receptor}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Datos del pago */}
          <div
            className="bg-white rounded-3 p-3 mb-3"
            style={{ border: "1px solid #e6e8ef" }}
          >
            <div style={sectionTitle}>
              <TbCreditCard className="me-1" /> Datos del pago
            </div>
            <div className="row g-2" style={{ fontSize: "0.82rem" }}>
              <DatoGeneral label="Fecha de pago" value={fecha(pago.fecha_pago)} />
              <DatoGeneral label="Forma de pago" value={pago.forma_pago} />
              <DatoGeneral label="Moneda" value={pago.moneda_pago} />
              <DatoGeneral
                label="Tipo de cambio"
                value={
                  pago.tipo_cambio_pago && Number(pago.tipo_cambio_pago) !== 1
                    ? pago.tipo_cambio_pago
                    : "1"
                }
              />
              <DatoGeneral label="Monto" value={money(montoTotal)} />
              {pago.status && (
                <DatoGeneral
                  label="Estatus"
                  value={
                    <>
                      <span className={`text-${statusColor}`}>●</span> {pago.status}
                    </>
                  }
                />
              )}
            </div>
          </div>

          {/* ───── Documentos relacionados (facturas pagadas) ───── */}
          <SeccionColapsable
            icon={<TbFileInvoice />}
            titulo="Documentos relacionados (facturas pagadas)"
            count={documentos.length}
            open={openDocs}
            onToggle={() => setOpenDocs((o) => !o)}
            color={TEAL}
          >
            {documentos.length === 0 ? (
              <div className="text-muted small px-1 py-2">
                No hay documentos relacionados con este complemento de pago.
              </div>
            ) : (
              <div style={{ maxHeight: "360px", overflowY: "auto" }} className="pe-1">
                {documentos.map((d, i) => (
                  <div
                    key={d.uuid_factura || i}
                    className="rounded-3 p-2 mb-2"
                    style={{ background: "#f7f8fc", border: "1px solid #e6e8ef" }}
                  >
                    <div className="d-flex justify-content-between align-items-start gap-2 mb-1">
                      <span className="fw-semibold" style={{ fontSize: "0.82rem", color: DARK }}>
                        {i + 1}. Parcialidad {d.num_parcialidad ?? "—"}
                        {d.serie || d.folio
                          ? ` · ${d.serie || ""}${d.folio ? `-${d.folio}` : ""}`
                          : ""}
                      </span>
                      <span className="fw-bold text-nowrap" style={{ color: TEAL }}>
                        {money(d.imp_pagado ?? d.monto)}
                      </span>
                    </div>
                    <div
                      className="text-muted"
                      style={{ fontSize: "0.68rem", wordBreak: "break-all" }}
                    >
                      UUID factura: {d.uuid_factura || "—"}
                    </div>
                    <div className="row g-1 mt-1" style={{ fontSize: "0.78rem" }}>
                      <MiniDato label="Saldo anterior" value={money(d.imp_saldo_ant)} />
                      <MiniDato label="Pagado" value={money(d.imp_pagado ?? d.monto)} />
                      <MiniDato label="Saldo insoluto" value={money(d.imp_saldo_insoluto)} />
                      <MiniDato label="Método de pago" value={d.metodo_pago_dr || "—"} />
                      {d.moneda_dr && <MiniDato label="Moneda DR" value={d.moneda_dr} />}
                      {d.equivalencia_dr && Number(d.equivalencia_dr) !== 1 && (
                        <MiniDato label="Equivalencia DR" value={d.equivalencia_dr} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SeccionColapsable>

          {/* Impuestos del pago */}
          {hayImpuestos && (
            <div
              className="bg-white rounded-3 p-3 mb-3"
              style={{ border: "1px solid #e6e8ef" }}
            >
              <div style={sectionTitle}>
                <TbReceiptTax className="me-1" /> Impuestos del pago
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
            </div>
          )}

          {/* ───── Cuentas bancarias (colapsable) ───── */}
          {hayCuentas && (
            <SeccionColapsable
              icon={<TbBuildingBank />}
              titulo="Cuentas bancarias"
              count={0}
              hideCount
              open={openCuentas}
              onToggle={() => setOpenCuentas((o) => !o)}
              color={INDIGO}
            >
              <div className="row g-3">
                <div className="col-12 col-md-6">
                  <div style={sectionTitle}>Ordenante</div>
                  <MiniDatoStack label="Banco" value={pago.banco_ordenante || "—"} />
                  <MiniDatoStack label="RFC" value={pago.rfc_cta_ordenante || "—"} />
                  <MiniDatoStack label="Cuenta" value={pago.cta_ordenante || "—"} />
                </div>
                <div className="col-12 col-md-6">
                  <div style={sectionTitle}>Beneficiario</div>
                  <MiniDatoStack label="RFC" value={pago.rfc_cta_beneficiario || "—"} />
                  <MiniDatoStack label="Cuenta" value={pago.cta_beneficiario || "—"} />
                </div>
              </div>
            </SeccionColapsable>
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
  <div className="col-6 col-md-4">
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

const MiniDatoStack: React.FC<{ label: string; value: React.ReactNode }> = ({
  label,
  value,
}) => (
  <div className="mb-1">
    <span className="text-muted" style={{ fontSize: "0.7rem" }}>
      {label}:{" "}
    </span>
    <span className="fw-semibold" style={{ color: DARK, fontSize: "0.82rem", wordBreak: "break-all" }}>
      {value}
    </span>
  </div>
);

const SeccionColapsable: React.FC<{
  icon: React.ReactNode;
  titulo: string;
  count: number;
  hideCount?: boolean;
  open: boolean;
  onToggle: () => void;
  color: string;
  children: React.ReactNode;
}> = ({ icon, titulo, count, hideCount, open, onToggle, color, children }) => (
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
        {!hideCount && (
          <Badge bg="light" text="dark" style={{ border: "1px solid #e6e8ef" }}>
            {count}
          </Badge>
        )}
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

export default ComplementoPreviewModal;
