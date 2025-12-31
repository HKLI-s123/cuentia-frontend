"use client";

import { useEffect, useState } from "react";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  CardTitle,
  Col,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownToggle,
  Table,
  Modal,
  Form,
} from "react-bootstrap";
import {
  TbCircleFilled,
  TbDotsVertical,
  TbFileExport,
  TbArrowDown,
  TbArrowUp,
} from "react-icons/tb";
import CardPagination from "@/components/cards/CardPagination";
import { getNotasCredito } from "../../../../../../services/financeService"; // tu servicio backend
import { getSessionInfo } from "@/app/services/authService";
import { activateGuest, validateGuestKey } from "@/app/services/chatService";
import { toast } from "sonner";
import { useOnboardingRedirect } from "@/hooks/useUserSessionGuard";

type NotaCredito = {
  id: number;
  uuid: string;
  fecha_emision: string;
  rfc_emisor: string;
  nombre_emisor?: string;
  regimen_emisor?: string;
  rfc_receptor: string;
  nombre_receptor?: string;
  regimen_receptor?: string;
  uuid_factura_relacionada: string;
  subtotal: number;
  iva_8: number;
  iva_16: number;
  total_trasladados: number;
  retencion_isr: number;
  retencion_iva: number;
  total_retenidos: number;
  descuento: number;
  total: number;
  forma_pago?: string;
  moneda?: string;
  tipo_cambio?: number;
  tipo_comprobante: string; // E
  metodo_pago?: string;
  estatus?: string;
};

const ListNotasCredito = () => {
  const [notas, setNotas] = useState<NotaCredito[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedRFC, setSelectedRFC] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [tipoCuenta, setTipoCuenta] = useState<"individual" | "empresarial" | "invitado" | "empleado" | null>(null);
  const [clientes, setClientes] = useState<{ rfc: string; nombre: string }[]>([]);
  const [searchCliente, setSearchCliente] = useState("");
  const [invitePanelVisible, setInvitePanelVisible] = useState(false);
  const [guestKey, setGuestKey] = useState("");
  const itemsPerPage = 10;
  const [session, setSession] = useState<any>(null);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof NotaCredito;
    direction: "asc" | "desc";
  } | null>(null);

  const getFirstDayOfCurrentMonth = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .slice(0, 10);
  };
  
  const getToday = () => {
    return new Date().toISOString().slice(0, 10);
  };
  
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
      
      setFechaInicio(getFirstDayOfCurrentMonth());
      setFechaFin(getToday());
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
     }
   }, [session]);
 

  // fetch notas de crédito
  const fetchNotas = async () => {
    try {
      const params = {
        rfc: selectedRFC,
        startDate: fechaInicio || undefined,
        endDate: fechaFin || undefined,
      };
      const raw = await getNotasCredito(params);
      const data: NotaCredito[] = raw.map((n: any, idx: number) => ({
        id: idx + 1,
        uuid: n.uuid ?? "",
        uuid_factura_relacionada: n.uuid_factura_relacionada ?? "",
        fecha_emision: n.fecha_emision ?? n.fecha ?? "",
        rfc_emisor: n.rfc_emisor ?? "",
        nombre_emisor: n.nombre_emisor ?? n.razonsocialemisor ?? "",
        regimen_emisor: n.regimen_emisor ?? n.regimenemisor ?? "",
        rfc_receptor: n.rfc_receptor ?? "",
        nombre_receptor: n.nombre_receptor ?? n.razonsocialreceptor ?? "",
        regimen_receptor: n.regimen_receptor ?? n.regimenreceptor ?? "",
        subtotal: Number(n.subtotal ?? 0),
        iva_8: Number(n.iva_8 ?? n.importe_trasladado_8 ?? 0),
        iva_16: Number(n.iva_16 ?? n.importe_trasladado_16 ?? 0),
        total_trasladados: Number(n.total_trasladados ?? 0),
        retencion_isr: Number(n.retencion_isr ?? 0),
        retencion_iva: Number(n.retencion_iva ?? 0),
        total_retenidos: Number(n.total_retenidos ?? 0),
        descuento: Number(n.descuento ?? 0),
        total: Number(n.total ?? 0),
        forma_pago: n.forma_pago ?? "",
        moneda: n.moneda ?? "",
        tipo_cambio: Number(n.tipo_cambio ?? 1),
        tipo_comprobante: "E",
        metodo_pago: n.metodo_pago ?? "",
        estatus: n.estatus ?? "Vigente",
      }));
      setNotas(data);
    } catch (error) {
      console.error("Error al cargar notas de crédito:", error);
      setNotas([]);
    }
  };

  useEffect(() => {
    fetchNotas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRFC, fechaInicio, fechaFin]);

  // sorting
  const sortedNotas = [...notas].sort((a, b) => {
    if (!sortConfig) return 0;
    const { key, direction } = sortConfig;
    let valueA: any = a[key];
    let valueB: any = b[key];

    if (key === "subtotal" || key === "total") {
      valueA = Number(valueA);
      valueB = Number(valueB);
    }
    if (key === "fecha_emision") {
      valueA = new Date(valueA).getTime();
      valueB = new Date(valueB).getTime();
    }

    if (valueA < valueB) return direction === "asc" ? -1 : 1;
    if (valueA > valueB) return direction === "asc" ? 1 : -1;
    return 0;
  });

  // search filter
  const filteredNotas = sortedNotas.filter((n) => {
    const term = searchTerm.toLowerCase();
    return (
      (n.rfc_emisor || "").toLowerCase().includes(term) ||
      (n.rfc_receptor || "").toLowerCase().includes(term) ||
      (n.nombre_receptor || "").toLowerCase().includes(term) ||
      (n.nombre_emisor || "").toLowerCase().includes(term) ||
      (n.uuid || "").toLowerCase().includes(term)
    );
  });

  const toPesosNota = (n: NotaCredito, valor: number | string | undefined): number => {
    const num =
      typeof valor === "number"
        ? valor
        : parseFloat((valor ?? "").toString().replace(/,/g, "")) || 0;
  
    const tc =
      typeof n.tipo_cambio === "number"
        ? n.tipo_cambio
        : parseFloat((n.tipo_cambio ?? "").toString().replace(/,/g, "")) || 0;
  
    if (n.moneda && n.moneda !== "MXN" && tc > 0) {
      return num * tc;
    }
    return num;
  };

  // pagination
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedNotas = filteredNotas.slice(startIndex, endIndex);

  const requestSort = (key: keyof NotaCredito) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc")
      direction = "desc";
    setSortConfig({ key, direction });
  };
  const renderSortIcon = (key: keyof NotaCredito) => {
    if (!sortConfig || sortConfig.key !== key) return null;
    return sortConfig.direction === "asc" ? (
      <TbArrowUp className="ms-1" />
    ) : (
      <TbArrowDown className="ms-1" />
    );
  };

  // exportar Excel
  const exportToExcel = async () => {
    if (notas.length === 0) return;
  
    const wb = new ExcelJS.Workbook();
    wb.creator = "CuentIA";
    wb.created = new Date();

    const getNombreClientePorRfc = (rfc: string | undefined) => {
     if (!rfc) return "Cliente desconocido";
     const cliente = clientes.find(c => c.rfc === rfc);
     return cliente?.nombre || "Cliente desconocido";
    };
  
    // Agrupar notas por mes
    const notasPorMes: Record<string, NotaCredito[]> = {};
    notas.forEach((n) => {
      const mes = new Date(n.fecha_emision).toLocaleString("es-MX", {
        month: "long",
        year: "numeric",
      });
      if (!notasPorMes[mes]) notasPorMes[mes] = [];
      notasPorMes[mes].push(n);
    });
  
    const colLetter = (n: number) => {
      let s = "";
      while (n > 0) {
        const m = (n - 1) % 26;
        s = String.fromCharCode(65 + m) + s;
        n = Math.floor((n - 1) / 26);
      }
      return s;
    };
  
    for (const [mes, notasMes] of Object.entries(notasPorMes)) {
      const ws = wb.addWorksheet(mes);
  
      // Fila 1: Título
      const headers = [
        "Fecha de emision","UUID", "RFC Emisor", "Nombre Emisor", "Régimen Emisor",
        "RFC Receptor", "Nombre Receptor", "Régimen Receptor",  "UUID Factura Relacionada", "Subtotal", "IVA 8%", "IVA 16%",
        "Total Trasladados", "Retención ISR", "Retención IVA", "Total Retenidos", "Descuento",
        "Total", "Forma Pago", "Moneda", "Tipo Cambio", "Tipo Comprobante", "Método Pago", "Estatus"
      ];

      const nombreCliente = getNombreClientePorRfc(selectedRFC);

      const lastCol = colLetter(headers.length);
      ws.mergeCells(`A1:${lastCol}1`);
      const titleCell = ws.getCell("A1");
      titleCell.value = `Notas de crédito del mes ${mes} - Cliente ${nombreCliente}`;
      titleCell.font = { bold: true, size: 16, color: { argb: "FFFFFFFF" } };
      titleCell.alignment = { horizontal: "center" };
      titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF004080" } };
  
      // Fila 2: Headers
      const headerRow = ws.addRow(headers);
      headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF5F9EA0" } };
      });
  
      // Filas de datos
      notasMes.forEach((n, i) => {
        const row = ws.addRow([
          n.fecha_emision,
          n.uuid,
          n.rfc_emisor,
          n.nombre_emisor,
          n.regimen_emisor,
          n.rfc_receptor,
          n.nombre_receptor,
          n.regimen_receptor,
          n.uuid_factura_relacionada || '',
          n.subtotal,
          n.iva_8,
          n.iva_16,
          n.total_trasladados,
          n.retencion_isr,
          n.retencion_iva,
          n.total_retenidos,
          n.descuento,
          n.total,
          n.forma_pago,
          n.moneda,
          n.tipo_cambio,
          n.tipo_comprobante,
          n.metodo_pago,
          n.estatus,
        ]);
  
        row.eachCell({ includeEmpty: true }, (cell) => {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: i % 2 === 0 ? "FFFFFFFF" : "FFF7F7F7" },
          };
          if (typeof cell.value === "number") cell.numFmt = "$#,##0.00";
        });
      });
  
      ws.columns.forEach((col) => (col.width = 18));
  
      // Totales
      const totalEgreso = notasMes
        .filter((n) => n.rfc_emisor === selectedRFC)
        .reduce((sum, n) => sum + toPesosNota(n, n.total), 0);
      
      const totalAjuste = notasMes
        .filter((n) => n.rfc_receptor === selectedRFC)
        .reduce((sum, n) => sum + toPesosNota(n, n.total), 0);

      const totalDiferencia = totalAjuste - totalEgreso;

      const difRow = ws.addRow(Array(headers.length).fill(""));
      difRow.getCell(17).value = "TOTAL DIFERENCIA";
      difRow.getCell(18).value = totalDiferencia;
      difRow.eachCell((cell) => {
          cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2F4F4F" } };
          if (typeof cell.value === "number") cell.numFmt = "$#,##0.00";
      });
  
      const ajusteRow = ws.addRow(Array(headers.length).fill(""));
      ajusteRow.getCell(17).value = "TOTAL AJUSTE/REDUCCIÓN";
      ajusteRow.getCell(18).value = totalAjuste;
      ajusteRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FF006400" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFDFFFD6" } };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
      if (typeof cell.value === "number") cell.numFmt = "$#,##0.00";
      });

      const egresosRow = ws.addRow(Array(headers.length).fill(""));
      egresosRow.getCell(17).value = "TOTAL EGRESO";
      egresosRow.getCell(18).value = totalEgreso;
      egresosRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FF8B0000" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFE5E5" } };
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
      if (typeof cell.value === "number") cell.numFmt = "$#,##0.00";
    });

    }
  
    // Descargar Excel
    const buffer = await wb.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), "Notas_Credito_"+selectedRFC+".xlsx");
  };


  // helper
  const safeNum = (v: any) =>
    typeof v === "number" ? v : parseFloat(`${v || 0}`) || 0;

  const [visibleRows, setVisibleRows] = useState<Record<number, boolean>>({});

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
            Notas de Crédito
          </CardTitle>
          <div className="d-flex flex-wrap flex-md-nowrap gap-2 align-items-center">
            <span>Desde</span>
            <Form.Control
              type="date"
              size="sm"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="w-100 w-md-auto mb-1 mb-md-0"
            />
            <span>Hasta</span>
            <Form.Control
              type="date"
              size="sm"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="w-100 w-md-auto mb-1 mb-md-0"
            />
            <Form.Control
              type="text"
              size="sm"
              placeholder="Buscar por RFC o Nombre"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-100 w-md-auto mb-1 mb-md-0"
              style={{ minWidth: "180px" }}
            />
            <Button
              variant="primary"
              size="sm"
              disabled={notas.length === 0}
              className="text-nowrap mb-1 mb-md-0"
              onClick={exportToExcel}
            >
              <TbFileExport className="me-1" /> Reporte detallado
            </Button>
            {(tipoCuenta === "empresarial" || tipoCuenta === "empleado") && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowModal(true)}
                className="text-nowrap mb-1 mb-md-0"
              >
               {selectedRFC ? `Cliente: ${selectedRFC}` : "Seleccionar Cliente"}
              </Button>
            )}
          </div>
        </CardHeader>  
        <CardBody>
          {filteredNotas.length > 0 ? (
            <div className="table-responsive">
              <Table className="table-centered table-custom table-sm table-nowrap table-hover mb-0">
                <thead>
                  <tr>
                    <th onClick={() => requestSort("fecha_emision")} style={{ cursor: "pointer" }}>
                      Fecha Emisión {renderSortIcon("fecha_emision")}
                    </th>
                    <th>RFC Emisor</th>
                    <th>RFC Receptor</th>
                    <th onClick={() => requestSort("total")} style={{ cursor: "pointer" }}>
                      Total {renderSortIcon("total")}
                    </th>
                    <th>Moneda</th>
                    <th>Estatus</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedNotas.map((nota) => {
                    const isVisible = visibleRows[nota.id] ?? true; // por defecto visible
                    if (!isVisible) return null;
                
                    return (
                      <tr key={nota.id}>
                        <td>{new Date(nota.fecha_emision).toLocaleDateString()}</td>
                        <td>{nota.rfc_emisor}</td>
                        <td>{nota.rfc_receptor}</td>
                        <td>
                          <strong>${safeNum(nota.total).toLocaleString()}</strong>
                        </td>
                        <td>{nota.moneda}</td>
                        <td>
                          <TbCircleFilled
                            className={`fs-xs text-${
                              nota.estatus === "Cancelada" ? "danger" : "success"
                            } me-1`}
                          />
                          {nota.estatus}
                        </td>
                        <td style={{ width: 30 }}>
                          <Dropdown>
                            <DropdownToggle
                              as="a"
                              href="#"
                              className="dropdown-toggle text-muted drop-arrow-none card-drop p-0"
                            >
                              <TbDotsVertical className="fs-lg" />
                            </DropdownToggle>
                            <DropdownMenu className="dropdown-menu-end">
                              {/* Nueva opción para ocultar */}
                              <DropdownItem
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  setVisibleRows((prev) => ({ ...prev, [nota.id]: false }));
                                }}
                              >
                                Ocultar
                              </DropdownItem>
                            </DropdownMenu>
                          </Dropdown>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-4 text-muted">
              {selectedRFC ? "Sin notas de crédito" : "Seleccionar cliente"}
            </div>
          )}
        </CardBody>

        {filteredNotas.length > 0 && (
          <CardFooter className="border-0">
            <CardPagination
              totalItems={filteredNotas.length}
              itemsPerPage={itemsPerPage}
              currentPage={currentPage}
              itemsName="notas"
              onPageChange={(page) => setCurrentPage(page)}
            />
          </CardFooter>
        )}
      </Card>
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

export default ListNotasCredito;
