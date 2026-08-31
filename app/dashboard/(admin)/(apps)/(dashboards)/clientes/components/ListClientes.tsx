"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Table,
  Button,
  Form,
  Badge,
} from "react-bootstrap";
import {
  TbEdit,
  TbTrash,
  TbFileSpreadsheet,
  TbFileTypePdf,
  TbUserPlus,
} from "react-icons/tb";
import CardPagination from "@/components/cards/CardPagination";
import { ClienteModal, ClienteFormData } from "./ClienteModal";
import {
  getClientes,
  createCliente,
  updateCliente,
  deleteCliente,
} from "../../../../../../services/clientsService";
import {
  FISCAL_DOCS_ENABLED,
  FISCAL_DOCS_PRICE_MXN,
  fiscalDocsWillCharge,
  toggleFiscalDocs,
  toggleFiscalDocsAll,
  downloadCsf,
  downloadOpinion,
} from "@/app/services/fiscalDocsService";
import { toast } from "sonner";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import "jspdf-autotable";
import autoTable from "jspdf-autotable";
import { getSessionInfo } from "@/app/services/authService";
import { useOnboardingRedirect } from "@/hooks/useUserSessionGuard";


type ClienteDto = {
  id: number;
  nombre: string;
  rfc: string;
  fiel?: string | null;
  key_path?: string | null;
  cer_path?: string | null;
  fiscalDocsEnabled?: boolean;
  opinionSentido?: "positiva" | "negativa" | "no_disponible" | null;
  opinionDate?: string | null;
};

type Cliente = ClienteDto & {
  cfdis: number; // 👈 extendemos con cfdis
  key_url?: string;
  cer_url?: string;
};

export const ClientesLista = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editCliente, setEditCliente] = useState<Cliente | null>(null);

  const [searchTerm, setSearchTerm] = useState(""); // estado para la barra de búsqueda

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [session, setSession] = useState<any>(null);

  const currentYear = new Date().getFullYear();

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

  const isConsulta = session?.role === "consulta";

  // El backend decide si activar cobraría (grandfathering + plan de pago activo).
  // Solo entonces mostramos el aviso/confirmación de $49/RFC.
  const [willCharge, setWillCharge] = useState(false);

  useEffect(() => {
    fiscalDocsWillCharge()
      .then(setWillCharge)
      .catch(() => setWillCharge(false));
  }, []);

  
  // 🔹 Cargar clientes al montar componente
  useEffect(() => {
    fetchClientes();
  }, []);

  const fetchClientes = async () => {
    try {
      const data = await getClientes();
      const mapped = data.map((c: any) => ({
      ...c,
      cfdis: c.cfdis ?? 0, // si no existe, default = 0
    }));
      setClientes(mapped);
    } catch (error) {
      console.error("Error al obtener clientes:", error);
    }
  };

  const handleEdit = (cliente: Cliente) => {
    setEditCliente(cliente);
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    toast.warning("¿Eliminar cliente?", {
      description: "Esta acción no se puede deshacer.",
      action: {
        label: "Eliminar",
        onClick: async () => {
          try {
            await deleteCliente(id);
            setClientes((prev) => prev.filter((c) => c.id !== id));
            toast.success("Cliente eliminado correctamente");
          } catch (error) {
            console.error("Error al eliminar cliente:", error);
            toast.error("No se pudo eliminar el cliente");
          }
        },
      },
    });
  };

const handleSave = async (data: ClienteFormData) => {
  try {
    const fd = new FormData();
    fd.append("nombre", data.nombre);
    fd.append("rfc", data.rfc);
    if (data.fiel) fd.append("fiel", data.fiel);
    if (data.key_path instanceof File) fd.append("key_path", data.key_path);
    if (data.cer_path instanceof File) fd.append("cer_path", data.cer_path);

    // Solo al registrar: la descarga de XMLs se decide en el alta.
    // La edición se maneja con el toggle de sincronización por cliente.
    if (!editCliente) {
      fd.append("descargarXmls", String(data.descargarXmls ?? true));
    }

    let savedCliente: ClienteDto; // <- tipo explícito

    if (editCliente) {
      savedCliente = await updateCliente(editCliente.id, fd);

      setClientes(prev =>
        prev.map((c) =>
          c.id === editCliente.id
            ? ({ ...savedCliente, cfdis: c.cfdis ?? 0 }) // mapeamos y conservamos cfdis
            : c
        )
      );
      toast.success("Cliente actualizado");
    } else {
      savedCliente = await createCliente(fd);

      setClientes(prev => [
        ...prev,
        { ...savedCliente, cfdis: 0 } // añadimos cfdis por defecto
      ]);
      toast.success("Cliente creado");
    }

    setShowModal(false);
    setEditCliente(null);
  } catch (error) {
    console.error("Error al guardar cliente:", error);
    const message =
      error instanceof Error && error.message
        ? error.message
        : "No se pudo guardar el cliente. Intenta de nuevo.";
    toast.error(message);
  }
};

  // 🔹 Documentos fiscales (CSF / Opinión)
  const applyToggleFiscalDocs = async (cliente: Cliente, next: boolean) => {
    // Optimista
    setClientes((prev) =>
      prev.map((c) =>
        c.id === cliente.id ? { ...c, fiscalDocsEnabled: next } : c
      )
    );
    try {
      await toggleFiscalDocs(cliente.rfc, next);
      toast.success(
        next
          ? "Descarga de documentos fiscales activada"
          : "Descarga de documentos fiscales desactivada"
      );
    } catch (error) {
      console.error(error);
      // Revertir
      setClientes((prev) =>
        prev.map((c) =>
          c.id === cliente.id ? { ...c, fiscalDocsEnabled: !next } : c
        )
      );
      toast.error("No se pudo actualizar la descarga de documentos fiscales");
    }
  };

  const handleToggleFiscalDocs = (cliente: Cliente) => {
    const next = !cliente.fiscalDocsEnabled;

    // Al ACTIVAR y solo si cobraría → confirmar para no sorprender.
    if (next && willCharge) {
      toast.warning("Activar Documentos Fiscales tiene costo", {
        description: `Se agregará $${FISCAL_DOCS_PRICE_MXN} MXN/mes por el RFC ${cliente.rfc} a tu suscripción (prorrateado).`,
        action: {
          label: "Activar",
          onClick: () => applyToggleFiscalDocs(cliente, next),
        },
      });
      return;
    }

    applyToggleFiscalDocs(cliente, next);
  };

  const applyToggleAllFiscalDocs = async (enabled: boolean) => {
    try {
      await toggleFiscalDocsAll(enabled);
      setClientes((prev) =>
        prev.map((c) => ({ ...c, fiscalDocsEnabled: enabled }))
      );
      toast.success(
        enabled
          ? "Descarga activada para todos los RFCs"
          : "Descarga desactivada para todos los RFCs"
      );
    } catch (error) {
      console.error(error);
      toast.error("No se pudo actualizar la descarga para todos los RFCs");
    }
  };

  const handleToggleAllFiscalDocs = (enabled: boolean) => {
    // Al ACTIVAR para todos y solo si cobraría → confirmar.
    if (enabled && willCharge) {
      toast.warning("Activar para todos tiene costo", {
        description: `Se agregará $${FISCAL_DOCS_PRICE_MXN} MXN/mes por cada RFC a tu suscripción (prorrateado).`,
        action: {
          label: "Activar todos",
          onClick: () => applyToggleAllFiscalDocs(true),
        },
      });
      return;
    }

    applyToggleAllFiscalDocs(enabled);
  };

  const handleDownloadFiscalDoc = async (
    rfc: string,
    kind: "csf" | "opinion"
  ) => {
    try {
      if (kind === "csf") await downloadCsf(rfc);
      else await downloadOpinion(rfc);
    } catch (error: any) {
      toast.error(error?.message || "No se pudo descargar el documento");
    }
  };

 // 🔹 Filtrado por búsqueda
  const filteredClientes = clientes.filter(cliente =>
    cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.rfc.toLowerCase().includes(searchTerm.toLowerCase())
  );

  
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  
  const displayedClientes = filteredClientes.slice(startIndex, endIndex);

  // Etiqueta legible del sentido de la Opinión de Cumplimiento.
  const sentidoLabel = (s?: string | null) =>
    s === "positiva" ? "Positiva" : s === "negativa" ? "Negativa" : "No disponible";

  const exportExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "CuentIA";
    workbook.created = new Date();

    const ws = workbook.addWorksheet("Clientes", {
      // Congela título (fila 1) + encabezado (fila 2).
      views: [{ state: "frozen", ySplit: 2 }],
    });

    const columns = [
      { header: "Nombre", width: 34 },
      { header: "RFC", width: 18 },
      { header: `CFDIs (${currentYear})`, width: 14 },
      { header: "Documentos fiscales", width: 20 },
      { header: "Opinión de Cumplimiento", width: 24 },
      { header: "Actualización opinión", width: 20 },
    ];

    const thinBorder: Partial<ExcelJS.Borders> = {
      top: { style: "thin", color: { argb: "FFE5E7EB" } },
      left: { style: "thin", color: { argb: "FFE5E7EB" } },
      bottom: { style: "thin", color: { argb: "FFE5E7EB" } },
      right: { style: "thin", color: { argb: "FFE5E7EB" } },
    };

    // Anchos de columna.
    columns.forEach((col, i) => {
      ws.getColumn(i + 1).width = col.width;
    });

    // Fila 1: título (celda combinada).
    const lastCol = ws.getColumn(columns.length).letter;
    ws.mergeCells(`A1:${lastCol}1`);
    const titleCell = ws.getCell("A1");
    titleCell.value = `Lista de Clientes — ${currentYear}`;
    titleCell.font = { size: 14, bold: true, color: { argb: "FF4F46E5" } };
    titleCell.alignment = { vertical: "middle", horizontal: "left" };
    ws.getRow(1).height = 26;

    // Fila 2: encabezado con fondo índigo.
    const headerRow = ws.getRow(2);
    columns.forEach((col, i) => {
      const cell = headerRow.getCell(i + 1);
      cell.value = col.header;
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF4F46E5" },
      };
      cell.alignment = { vertical: "middle", horizontal: "center" };
      cell.border = thinBorder;
    });
    headerRow.height = 20;

    // Filas de datos.
    clientes.forEach((c) => {
      const row = ws.addRow([
        c.nombre,
        c.rfc,
        c.cfdis,
        c.fiscalDocsEnabled ? "Activa" : "Inactiva",
        sentidoLabel(c.opinionSentido),
        c.opinionDate ?? "—",
      ]);

      row.eachCell((cell) => {
        cell.border = thinBorder;
        cell.alignment = { vertical: "middle" };
      });
      // Centrar columnas de estado/numéricas.
      [3, 4, 5, 6].forEach((n) => {
        row.getCell(n).alignment = { vertical: "middle", horizontal: "center" };
      });

      // Coloreado condicional de la Opinión.
      const opCell = row.getCell(5);
      if (c.opinionSentido === "positiva") {
        opCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD1FAE5" } };
        opCell.font = { bold: true, color: { argb: "FF065F46" } };
      } else if (c.opinionSentido === "negativa") {
        opCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFEE2E2" } };
        opCell.font = { bold: true, color: { argb: "FF991B1B" } };
      } else {
        opCell.font = { color: { argb: "FF6B7280" } };
      }

      // Documentos fiscales: verde si activa, gris si no.
      const docCell = row.getCell(4);
      docCell.font = c.fiscalDocsEnabled
        ? { bold: true, color: { argb: "FF065F46" } }
        : { color: { argb: "FF6B7280" } };
    });

    // Autofiltro sobre el encabezado.
    ws.autoFilter = {
      from: { row: 2, column: 1 },
      to: { row: 2, column: columns.length },
    };

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(
      new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      `Clientes_${currentYear}.xlsx`,
    );
  };
    
  const exportPDF = () => {
    const doc = new jsPDF();
  
    const tableColumn = ["Nombre", "RFC", `CFDIs (${currentYear})`];
    const tableRows = clientes.map(c => [c.nombre, c.rfc, c.cfdis]);
  
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
    });
  
    doc.save(`Clientes_${currentYear}.pdf`);
  };

  if (!session) {
    return (
      <div className="flex justify-center items-center h-[60vh] text-gray-600">
        Cargando tu cuenta...
      </div>
    );
  }

  return (
    <Card className="shadow-sm rounded-4">
      <CardHeader className="d-flex justify-content-between align-items-center">
        <CardTitle className="mb-0">Lista de Clientes</CardTitle>
          <Form.Control
            type="text"
            placeholder="Buscar cliente por nombre o RFC"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        <div className="d-flex gap-2">
          <Button variant="success" size="sm" onClick={exportExcel}>
            <TbFileSpreadsheet className="me-1" /> Excel
          </Button>
          <Button variant="secondary" size="sm" onClick={exportPDF}>
            <TbFileTypePdf className="me-1" /> PDF
          </Button>
          {!isConsulta && (
            <>
              <Button
                variant="outline-primary"
                size="sm"
                disabled={!FISCAL_DOCS_ENABLED}
                onClick={() => handleToggleAllFiscalDocs(true)}
                title="Activar descarga de documentos fiscales para todos los RFCs"
              >
                Docs: activar todos
                {!FISCAL_DOCS_ENABLED && (
                  <Badge bg="secondary" className="ms-1">
                    Próximamente
                  </Badge>
                )}
              </Button>
              <Button
                variant="outline-secondary"
                size="sm"
                disabled={!FISCAL_DOCS_ENABLED}
                onClick={() => handleToggleAllFiscalDocs(false)}
                title="Desactivar descarga de documentos fiscales para todos los RFCs"
              >
                Docs: desactivar todos
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowModal(true)}
              >
                <TbUserPlus className="me-1" /> Registrar Cliente
              </Button>
            </>
          )}
        </div>
      </CardHeader>
      <CardBody>
        {!isConsulta && willCharge && (
          <div
            className="small mb-3 px-3 py-2 rounded-3"
            style={{ backgroundColor: "rgba(99,102,241,0.08)", color: "#4f46e5" }}
          >
            💡 Activar <strong>Documentos Fiscales</strong> (CSF y Opinión)
            tiene un costo de <strong>${FISCAL_DOCS_PRICE_MXN} MXN/mes por RFC</strong>,
            que se agrega a tu suscripción de forma prorrateada.
          </div>
        )}
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>RFC</th>
              <th>CFDIs ({currentYear})</th>
              <th className="text-center">Documentos fiscales</th>
              <th className="text-center">Opinión de Cumplimiento</th>
              <th style={{ width: "120px" }} className="text-center">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {displayedClientes.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center text-muted">
                  No hay clientes registrados
                </td>
              </tr>
            ) : (
              displayedClientes.map((cliente) => (
                <tr key={cliente.id}>
                  <td>{cliente.nombre}</td>
                  <td>{cliente.rfc}</td>
                  <td>{cliente.cfdis}</td>
                  <td className="text-center">
                    {isConsulta ? (
                      <span className="text-muted text-sm">—</span>
                    ) : (
                      <div className="d-flex flex-column align-items-center gap-1">
                        <Form.Check
                          type="switch"
                          id={`fdocs-${cliente.id}`}
                          checked={!!cliente.fiscalDocsEnabled}
                          disabled={!FISCAL_DOCS_ENABLED}
                          onChange={() => handleToggleFiscalDocs(cliente)}
                          label={
                            !FISCAL_DOCS_ENABLED ? (
                              <Badge bg="secondary">Próximamente</Badge>
                            ) : cliente.fiscalDocsEnabled ? (
                              "Activa"
                            ) : (
                              "Inactiva"
                            )
                          }
                        />
                        <div className="d-flex gap-1">
                          <Button
                            size="sm"
                            variant="outline-secondary"
                            disabled={
                              !FISCAL_DOCS_ENABLED || !cliente.fiscalDocsEnabled
                            }
                            onClick={() =>
                              handleDownloadFiscalDoc(cliente.rfc, "csf")
                            }
                            title="Descargar Constancia de Situación Fiscal"
                          >
                            <TbFileTypePdf /> CSF
                          </Button>
                          <Button
                            size="sm"
                            variant="outline-secondary"
                            disabled={
                              !FISCAL_DOCS_ENABLED || !cliente.fiscalDocsEnabled
                            }
                            onClick={() =>
                              handleDownloadFiscalDoc(cliente.rfc, "opinion")
                            }
                            title="Descargar Opinión de Cumplimiento"
                          >
                            <TbFileTypePdf /> Opinión
                          </Button>
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="text-center">
                    {cliente.opinionSentido === "positiva" ? (
                      <Badge bg="success" title={cliente.opinionDate ? `Actualizada: ${cliente.opinionDate}` : undefined}>
                        Positiva
                      </Badge>
                    ) : cliente.opinionSentido === "negativa" ? (
                      <Badge bg="danger" title={cliente.opinionDate ? `Actualizada: ${cliente.opinionDate}` : undefined}>
                        Negativa
                      </Badge>
                    ) : (
                      <Badge bg="secondary">N/D</Badge>
                    )}
                  </td>
                  <td className="text-center">
                      {/* ⬇️ 3) si es consulta, no mostramos botones y ponemos texto */}
                      {isConsulta ? (
                        <span className="text-muted text-sm">Solo lectura</span>
                      ) : (
                        <div className="d-flex justify-content-center gap-2">
                          <Button
                            size="sm"
                            variant="warning"
                            onClick={() => handleEdit(cliente)}
                          >
                            <TbEdit />
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleDelete(cliente.id)}
                          >
                            <TbTrash />
                          </Button>
                        </div>
                      )}
                    </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
        <CardPagination
          totalItems={filteredClientes.length}
          itemsPerPage={itemsPerPage}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          itemsName="clientes"
        />
      </CardBody>

      {/* Modal */}
      {showModal && (
        <ClienteModal
          show={showModal}
          onHide={() => {
            setShowModal(false);
            setEditCliente(null);
          }}
          onSave={handleSave}
          initialData={
            editCliente
              ? {
                  nombre: editCliente.nombre,
                  rfc: editCliente.rfc,
                  fiel: editCliente.fiel ?? "",
                  key_url: editCliente.key_url ?? undefined,
                  cer_url: editCliente.cer_url ?? undefined,
                }
              : undefined
          }
        />
      )}
    </Card>
  );
};

export default ClientesLista;
