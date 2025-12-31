"use client";

import { useState, useEffect } from "react";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Col,
  Modal,
  Form,
  Table,
  Alert,
  Spinner,
} from "react-bootstrap";
import { TbFileExport, TbFileDownload } from "react-icons/tb";
import { generarDiot } from "../../../../../../services/financeService";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { getSessionInfo } from "@/app/services/authService";
import { toast } from "sonner";
import { activateGuest, validateGuestKey } from "@/app/services/chatService";
import { useOnboardingRedirect } from "@/hooks/useUserSessionGuard";

type DiotItem = {
  rfc_emisor: string;
  base_iva_8: number;
  iva_8: number;
  base_iva_16: number;
  iva_16: number;
  base_iva_0: number;
  base_iva_exento: number;
};

const GenerateDIOT = () => {
  const [showModal, setShowModal] = useState(false);
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [data, setData] = useState<DiotItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editedRows, setEditedRows] = useState<Record<number, boolean>>({}); // rastrear celdas editadas
  const [tipoCuenta, setTipoCuenta] = useState<"individual" | "empresarial" | "invitado" | "empleado" | null>(null);
  const [clientes, setClientes] = useState<{ rfc: string; nombre: string }[]>([]);
  const [searchCliente, setSearchCliente] = useState("");
  const [selectedRFC, setSelectedRFC] = useState("");
  const [invitePanelVisible, setInvitePanelVisible] = useState(false);
  const [guestKey, setGuestKey] = useState("");
  const [session, setSession] = useState<any>(null);
  
  useEffect(() => {
    const load = async () => {
      try {
        const data = await getSessionInfo();
        setSession(data);
      } catch (err: any) {
        console.error("Error cargando sesión:", err);
  
        // Si el backend devuelve 401 → no hay sesión → login
        if (err?.status === 401 || err?.status === 403) {
          localStorage.removeItem("accessToken"); 
          window.location.href = "/login";
        }
  
        // fallback por si otro error raro ocurre
        window.location.href = "/login";
      }
    };
  
    load();
  }, []);

  // ------------------------------
  // 2) Redirección onboarding
  // ------------------------------
  useOnboardingRedirect(session);

  // ------------------------------
  // 3) Cuando session llega → cargar datos UI
  // ------------------------------
  useEffect(() => {
    if (!session) return;

    setTipoCuenta(session.tipoCuenta);
    setClientes(session.clientes);

    if (session.tipoCuenta === "individual" && session.clientes.length > 0) {
      setSelectedRFC(session.clientes[0].rfc);
      setInvitePanelVisible(false);
    }

    if (session.tipoCuenta === "invitado") {
      if (session.guestRfc) {
        setSelectedRFC(session.guestRfc);
        setInvitePanelVisible(false);
      } else {
        setInvitePanelVisible(true);
      }
    }

    if (session.tipoCuenta === "empresarial" || session.tipoCuenta === "empleado") {
      if (session.propioRFC) {
        // ✔ Empresa con onboarding completo → usar su propio RFC como base
        setSelectedRFC(session.propioRFC);
      } else {
        // ❗ Empresa sin onboarding → dejarlo vacío y activar onboarding en redirect hook
        setSelectedRFC("");
      }
      setInvitePanelVisible(false);
      return;
    }
  }, [session]);

  // ------------------------------
  // 🔹 Generar DIOT desde API
  // ------------------------------
  const handleGenerar = async () => {
    setError("");
    setData([]);
    setLoading(true);
    setEditedRows({});

    const rfc = selectedRFC;

    if (!fechaInicio || !fechaFin) {
      setError("Debe ingresar ambas fechas.");
      setLoading(false);
      return;
    }
    if (fechaInicio.substring(0, 4) !== fechaFin.substring(0, 4)) {
      setError("Las fechas deben pertenecer al mismo año.");
      setLoading(false);
      return;
    }

    try {
      const response = await generarDiot({
        rfc,
        startDate: fechaInicio,
        endDate: fechaFin,
      });

      if (!response || response.length === 0) {
        setError("No se encontraron registros DIOT para este período.");
        setData([]);
      } else {
        setData(response);
      }
    } catch (err: any) {
      console.error("Error al generar DIOT:", err);
      setError("Error al generar la DIOT. Intente nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  // ------------------------------
  // 🔹 Función auxiliar para convertir a entero
  // ------------------------------
  const convertirAEntero = (valor: number | string) => {
    const valorLimpio = String(valor).replace(/,/g, ".").trim();
    const numero = parseFloat(valorLimpio) || 0;
    return Math.round(numero);
  };

  // ------------------------------
  // 🔹 Descargar TXT con formato SAT
  // ------------------------------
  const descargarTxt = () => {
    let contenidoTxt = "";

    data.forEach((fila) => {
      const rfc = fila.rfc_emisor;
      const tipoTercero =
        rfc === "XEXX010101000"
          ? "05"
          : rfc === "XAXX010101000"
          ? "15"
          : "04";

      const base16 = convertirAEntero(fila.base_iva_16);
      const iva16 = convertirAEntero(fila.iva_16);
      const base8 = convertirAEntero(fila.base_iva_8);
      const iva8 = convertirAEntero(fila.iva_8);
      const base0 = convertirAEntero(fila.base_iva_0);
      const baseExento = convertirAEntero(fila.base_iva_exento);

      const iva16Final = Math.round(base16 * 0.16) < iva16 ? iva16 - 1 : iva16;
      const iva8Final = Math.round(base8 * 0.08) < iva8 ? iva8 - 1 : iva8;

      if (iva8Final > 0 || iva16Final > 0 || baseExento > 0 || base0 > 0 || base8 > 0 || base16 > 0) {
        contenidoTxt += `${tipoTercero}|85|${rfc}|||||${base8 > 0 ? base8 : ""}||||${
          base16 > 0 ? base16 : ""
        }||||||${iva8Final > 0 ? iva8Final : ""}||||${iva16Final > 0 ? iva16Final : ""}||||||||||||||||||||||||||||${
          baseExento > 0 ? baseExento : ""
        }|${base0 > 0 ? base0 : ""}|||01\n`;
      }
    });

    const blob = new Blob([contenidoTxt], { type: "text/plain;charset=utf-8" });
    saveAs(blob, `DIOT_${fechaInicio.replace(/-/g, "")}_${fechaFin.replace(/-/g, "")}_${selectedRFC}.txt`);
  };

  // ------------------------------
  // 🔹 Exportar a Excel
  // ------------------------------
  const exportToExcel = async () => {
    if (data.length === 0) return;

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("DIOT");

    const headers = [
      "RFC Emisor",
      "Base IVA 8%",
      "IVA 8%",
      "Base IVA 16%",
      "IVA 16%",
      "Base IVA 0%",
      "Base IVA Exento",
    ];

    const headerRow = ws.addRow(headers);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF5F9EA0" } };
      cell.alignment = { horizontal: "center" };
    });

    data.forEach((d) => {
      ws.addRow([
        d.rfc_emisor,
        d.base_iva_8,
        d.iva_8,
        d.base_iva_16,
        d.iva_16,
        d.base_iva_0,
        d.base_iva_exento,
      ]);
    });

    ws.columns.forEach((col) => (col.width = 20));

    const buffer = await wb.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), `DIOT_${fechaInicio}_${fechaFin}_${selectedRFC}.xlsx`);
  };

  // ------------------------------
  // 🔹 Actualizar celda editable
  // ------------------------------
  type NumericKeys = Exclude<keyof DiotItem, "rfc_emisor">;

  const handleChange = (idx: number, key: NumericKeys, value: string) => {
    const updatedData = [...data];
    const numero = parseFloat(value) || 0;
    updatedData[idx][key] = numero;
    setData(updatedData);
    setEditedRows({ ...editedRows, [idx]: true });
  };

  const filteredClientes = clientes.filter((c) => {
    const term = searchCliente.toLowerCase();
    return (
      c.nombre.toLowerCase().includes(term) ||
      c.rfc.toLowerCase().includes(term)
    );
  });

  if (tipoCuenta === "invitado" && invitePanelVisible) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] gap-4 text-center">
        <h2 className="text-xl font-bold">Acceso Invitado</h2>
        <p className="text-sm opacity-80">
            La clave solo es necesaria para acceder a información fiscal (CFDIs / RFC).
        </p>
  
        <input
          type="text"
          className="border p-2 rounded-md w-64"
          placeholder="ej: 8d21ccxa33fe"
          value={guestKey}
          onChange={(e) => setGuestKey(e.target.value)}
        />
  
        <button
          className="px-4 py-2 bg-black text-white rounded-md"
          onClick={async () => {
            const cleaned = guestKey.trim();
            if (!cleaned) return toast.warning("Ingresa una clave");
  
            const result = await validateGuestKey(cleaned);
            if (!result) return toast.error("Clave inválida o bloqueada");
  
            try {
              await activateGuest(result.rfc);
              toast.success("Acceso habilitado");
  
              // Recargar sesión
              const refreshed = await getSessionInfo();
              setSelectedRFC(refreshed.guestRfc || result.rfc);
  
              setInvitePanelVisible(false);
            } catch (err) {
              toast.error("Error activando acceso invitado");
            }
          }}
        >
          Validar clave
        </button>
        <div className="mt-4 w-full max-w-md rounded-xl border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-700">
            <p className="font-semibold mb-1">
              ¿Solo quieres usar los bots de WhatsApp?
            </p>
            <p className="mb-3 text-indigo-600">
              No necesitas una clave de invitado para eso.
            </p>
          
            <button
              onClick={() => {
                window.location.href = "/dashboard/reporte-gastos";
              }}
              className="inline-flex items-center gap-2 font-semibold text-indigo-700 hover:underline"
            >
              Ir a Bots de WhatsApp
            </button>
        </div>  
      </div>
    );
  }

  // ------------------------------
  // 4) Render mientras carga
  // ------------------------------
  if (!session || tipoCuenta === null) {
    return (
      <div className="flex justify-center items-center h-[60vh] text-gray-600">
        Cargando tu cuenta...
      </div>
    );
  }

  return (
    <Col xxl={12}>
      <Card>
        <CardHeader className="justify-content-between align-items-center border-dashed">
          <CardTitle as="h4" className="mb-0">
            Generar DIOT
          </CardTitle>
          <div className="d-flex gap-2 align-items-center">
            {(tipoCuenta === "empresarial" || tipoCuenta === "empleado" ) && (
              <Button variant="secondary" size="sm" onClick={() => setShowModal(true)}>
                 {selectedRFC ? `Cliente: ${selectedRFC}` : "Seleccionar Cliente"}
              </Button>
            )}
          </div>
        </CardHeader>

        <CardBody>
          <div className="d-flex gap-2 align-items-center mb-3">
            <Form.Control
              type="date"
              size="sm"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              style={{ width: "250px" }} // ajusta el valor a tu gusto
            />
            <Form.Control
              type="date"
              size="sm"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              style={{ width: "250px" }} // ajusta el valor a tu gusto
            />
            <Button
              variant="primary"
              size="sm"
              onClick={handleGenerar}
              disabled={loading || !selectedRFC}
            >
              {loading ? <Spinner animation="border" size="sm" /> : "Generar"}
            </Button>
            {data.length > 0 && (
              <>
                <Button variant="outline-success" size="sm" onClick={exportToExcel}>
                  <TbFileExport className="me-1" /> Excel
                </Button>
                <Button
                  variant={Object.keys(editedRows).length > 0 ? "warning" : "outline-secondary"}
                  size="sm"
                  onClick={descargarTxt}
                >
                  <TbFileDownload className="me-1" /> TXT
                  {Object.keys(editedRows).length > 0 && " (Modificado)"}
                </Button>
              </>
            )}
          </div>

          {error && <Alert variant="danger">{error}</Alert>}

          {!loading && data.length > 0 && (
            <div className="table-responsive">
              <Table className="table-centered table-sm table-hover mb-0">
                <thead>
                  <tr>
                    <th>RFC Emisor</th>
                    <th>Base IVA 8%</th>
                    <th>IVA 8%</th>
                    <th>Base IVA 16%</th>
                    <th>IVA 16%</th>
                    <th>Base IVA 0%</th>
                    <th>Base IVA Exento</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((d, idx) => (
                    <tr key={idx} className={editedRows[idx] ? "bg-warning bg-opacity-25" : ""}>
                      <td>{d.rfc_emisor}</td>
                      <td>
                        <Form.Control
                          type="number"
                          size="sm"
                          value={d.base_iva_8}
                          onChange={(e) => handleChange(idx, "base_iva_8", e.target.value)}
                        />
                      </td>
                      <td>
                        <Form.Control
                          type="number"
                          size="sm"
                          value={d.iva_8}
                          onChange={(e) => handleChange(idx, "iva_8", e.target.value)}
                        />
                      </td>
                      <td>
                        <Form.Control
                          type="number"
                          size="sm"
                          value={d.base_iva_16}
                          onChange={(e) => handleChange(idx, "base_iva_16", e.target.value)}
                        />
                      </td>
                      <td>
                        <Form.Control
                          type="number"
                          size="sm"
                          value={d.iva_16}
                          onChange={(e) => handleChange(idx, "iva_16", e.target.value)}
                        />
                      </td>
                      <td>
                        <Form.Control
                          type="number"
                          size="sm"
                          value={d.base_iva_0}
                          onChange={(e) => handleChange(idx, "base_iva_0", e.target.value)}
                        />
                      </td>
                      <td>
                        <Form.Control
                          type="number"
                          size="sm"
                          value={d.base_iva_exento}
                          onChange={(e) => handleChange(idx, "base_iva_exento", e.target.value)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}

          {!loading && !error && data.length === 0 && (
            <div className="text-center text-muted py-3">
              {selectedRFC
                ? "Seleccione un rango de fechas y presione 'Generar'"
                : "Seleccione un cliente para comenzar"}
            </div>
          )}
        </CardBody>
      </Card>
      {/* Modal seleccionar cliente */}
     <Modal show={showModal} onHide={() => setShowModal(false)} centered>
       <Modal.Header closeButton>
         <Modal.Title>Selecciona un Cliente</Modal.Title>
       </Modal.Header>
       <Modal.Body>
         {clientes.length === 0 ? (
           <p className="text-muted mb-0">
             No tienes clientes registrados todavía. Agrega al menos uno para poder filtrar pagos.
           </p>
         ) : (
           <>
             {/* 🔍 Buscador */}
             <Form.Control
               type="text"
               placeholder="Buscar por nombre o RFC..."
               value={searchCliente}
               onChange={(e) => setSearchCliente(e.target.value)}
               className="mb-3"
             />
     
             {/* 🧭 Contenedor con scroll */}
             <div
               style={{
                 maxHeight: "300px",
                 overflowY: "auto",
                 paddingRight: "4px",
               }}
               className="d-flex flex-wrap gap-2"
             >
               {filteredClientes.length === 0 ? (
                 <p className="text-muted">No hay coincidencias.</p>
               ) : (
                 filteredClientes.map((cliente) => (
                   <Button
                     key={cliente.rfc}
                     variant={selectedRFC === cliente.rfc ? "primary" : "outline-primary"}
                     size="sm"
                     onClick={() => {
                       setSelectedRFC(cliente.rfc);
                       setShowModal(false);
                     }}
                   >
                     {cliente.nombre} ({cliente.rfc})
                   </Button>
                 ))
               )}
             </div>
           </>
         )}
       </Modal.Body>
     </Modal>
    </Col>
  );
};

export default GenerateDIOT;
