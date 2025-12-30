"use client"

import { useState, useEffect } from "react"
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { Button, Card, CardBody, CardFooter, CardHeader, CardTitle, Col, Dropdown, DropdownItem, DropdownMenu, DropdownToggle, Table, Modal, Form } from 'react-bootstrap'
import { TbCircleFilled, TbDotsVertical, TbFileExport, TbArrowDown, TbArrowUp } from 'react-icons/tb'
import CardPagination from '@/components/cards/CardPagination'
import { getFacturas } from "../../../../../../services/financeService"  // 🔹 nuevo servicio
import { analizarFacturaIA } from "../../../../../../services/iaService" // 👈 nuevo servicio IA
import { TbBrain } from "react-icons/tb";
import { Factura } from "../../../../../../types/factura";
import { getSessionInfo } from "@/app/services/authService";
import FacturaIAModal from "../components/FacturaIAModal";
import { toast } from "sonner";
import { activateGuest, validateGuestKey } from "@/app/services/chatService";
import { useOnboardingRedirect } from "@/hooks/useUserSessionGuard";


const ListFacturas = () => {
  const [facturas, setFacturas] = useState<Factura[]>([])
  const [showModal, setShowModal] = useState(false)
  const [selectedRFC, setSelectedRFC] = useState("");
  const [fechaInicio, setFechaInicio] = useState("")
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [fechaFin, setFechaFin] = useState("")
  const [searchTerm, setSearchTerm] = useState("");
  const [showExportModal, setShowExportModal] = useState(false);
  const [tipoExport, setTipoExport] = useState<"TODO" | "PUE" | "PPD">("TODO");
  const [tipoCuenta, setTipoCuenta] = useState<"individual" | "empresarial" | "invitado" | "empleado" | null>(null);
  const [clientes, setClientes] = useState<{ rfc: string; nombre: string }[]>([]);
  const [searchCliente, setSearchCliente] = useState("");
  const [invitePanelVisible, setInvitePanelVisible] = useState(false);
  const [guestKey, setGuestKey] = useState("");


  const [showIAModal, setShowIAModal] = useState(false);
  const [selectedFacturaIA, setSelectedFacturaIA] = useState<Factura | null>(null);
  const [iaAnalysis, setIaAnalysis] = useState<string>("");
  const [loadingIA, setLoadingIA] = useState(false);

  const [sortConfig, setSortConfig] = useState<{ key: keyof Factura, direction: "asc" | "desc" } | null>(null)

  const [visibleRows, setVisibleRows] = useState<Record<number, boolean>>({});  
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
      }
    }, [session]);
  

  const toPesos = (f: Factura, valor: any) => {
    const num = parseFloat(String(valor)) || 0;
    const tipoCambio = parseFloat(String(f.tipocambio || "1"));
    const factor = f.moneda && f.moneda !== "MXN" ? tipoCambio : 1;
    return Math.round(num * factor * 100) / 100; // mantiene 2 decimales exactos
  };

  const handleAnalisisIA = async (factura: Factura) => {
    setSelectedFacturaIA(factura);
    setShowIAModal(true);
    setLoadingIA(true);
    setIaAnalysis("");

    const userId = 1;
  
    try {
      const result = await analizarFacturaIA(factura, userId);
      setIaAnalysis(result);
    } catch (err) {
      setIaAnalysis("Ocurrió un error al obtener el análisis de IA o se superó el límite diario.");
    } finally {
      setLoadingIA(false);
    }
  };

  const fetchFacturas = async () => {
    try {
      const params = {
        rfc: selectedRFC,
        startDate: fechaInicio || undefined,
        endDate: fechaFin || undefined,
      };

      const rawData = await getFacturas(params);

      const data: Factura[] = rawData.map((f: any, idx: number) => ({
        id: idx + 1,
        uuid: f.uuid,
        folio: f.folio,
        cliente: {
          id: idx + 1,
          nombre: f.razonsocialreceptor || f.razonsocialemisor,
        },
        rfc_emisor: f.rfc_emisor,
        rfc_receptor: f.rfc_receptor,
        subtotal: f.subtotal,
        total: Number(f.total),
        clasificacion: f.clasificacion,
        status: f.status,
        fecha_emision: f.fecha,
        movimiento:
        f.tipocomprobante === "N"
          ? "Nomina"
          : f.movimiento,
        tipocomprobante: f.tipocomprobante,
        totalretenidos: f.totalretenidos,
        iva8: f.iva8,
        iva16: f.iva16,
        totaltraslado: f.totaltraslado,
        retencionisr: f.retencionisr,
        retencioniva: f.retencioniva,
        regimenfiscal: f.regimenfiscal,
        regimenfiscalreceptor: f.regimenfiscalreceptor,
        moneda: f.moneda,
        tipocambio: f.tipocambio,
        tipopago: f.tipopago,
        metodopago: f.metodopago,
        usocfdi: f.usocfdi,
      }));

      setFacturas(data);
    } catch (error) {
      console.error("Error al cargar facturas:", error);
      setFacturas([]);
    }
  };

  useEffect(() => {
    fetchFacturas()
  }, [selectedRFC, fechaInicio, fechaFin])

  // 🔹 función de ordenamiento
  const sortedFacturas = [...facturas].sort((a, b) => {
    if (!sortConfig) return 0;
    const { key, direction } = sortConfig;

    let valueA: any = a[key];
    let valueB: any = b[key];

    if (key === "total") {
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

  // 🔎 filtrado por buscador
  const filteredFacturas = sortedFacturas.filter((factura) => {
    const term = searchTerm.toLowerCase();
    return (
      factura.rfc_emisor.toLowerCase().includes(term) ||
      factura.rfc_receptor.toLowerCase().includes(term) ||
      factura.cliente.nombre.toLowerCase().includes(term)
    );
  });

  // 📄 paginación después del filtrado
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedFacturas = filteredFacturas.slice(startIndex, endIndex);

  const requestSort = (key: keyof Factura) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const renderSortIcon = (key: keyof Factura) => {
    if (!sortConfig || sortConfig.key !== key) return null;
    return sortConfig.direction === "asc" ? <TbArrowUp className="ms-1" /> : <TbArrowDown className="ms-1" />;
  };

   // 🔹 Función auxiliar para sumar columnas financieras
  const sumColumns = (rows: any[], indices: number[]) => {
    return indices.map(idx => rows.reduce((acc, r) => acc + (parseFloat(r[idx]) || 0), 0));
  };

  const handleExport = (tipo: "TODO" | "PUE" | "PPD") => {
    let facturasFiltradas = facturas;
  
    if (tipo === "PUE") {
      facturasFiltradas = facturas.filter(f => f.metodopago === "PUE");
    } else if (tipo === "PPD") {
      facturasFiltradas = facturas.filter(f => f.metodopago === "PPD");
    }
  
    exportToExcel(facturasFiltradas);
  };
  
  
  const exportToExcel = async (facturasFiltradas?: Factura[]) => {
      const data = facturasFiltradas && facturasFiltradas.length > 0 ? facturasFiltradas : facturas;
      if (data.length === 0) return;
  
      const wb = new ExcelJS.Workbook();
      wb.creator = "CuentIA";
      wb.created = new Date();
    
      const facturasPorMes: Record<string, Factura[]> = {};
      data.forEach((f) => {
        const mes = new Date(f.fecha_emision).toLocaleString("es-MX", { month: "long", year: "numeric" });
        if (!facturasPorMes[mes]) facturasPorMes[mes] = [];
        facturasPorMes[mes].push(f);
      });
        
      const getNombreClientePorRfc = (rfc: string | undefined) => {
       if (!rfc) return "Cliente desconocido";
       const cliente = clientes.find(c => c.rfc === rfc);
       return cliente?.nombre || "Cliente desconocido";
      };
    
      const secciones = [
        { titulo: "Ingresos", color: "FF2E75B6", filtro: (f: Factura) => f.movimiento === "Ingreso" },
        { titulo: "Egresos", color: "FF555555", filtro: (f: Factura) => f.movimiento === "Egreso" },
        { titulo: "Nómina", color: "FFA0A0A0", filtro: (f: Factura) => f.movimiento === "Nomina" },
      ];
    
      // Función para sumar columnas financieras
      const sumColumns = (rows: any[], indices: number[]) => indices.map(idx => rows.reduce((acc, r) => acc + (parseFloat(r[idx]) || 0), 0));
    
      for (const [mes, facturasMes] of Object.entries(facturasPorMes)) {
        const ws = wb.addWorksheet(mes);
    
        const nombreCliente = getNombreClientePorRfc(selectedRFC);
        // Título principal
        ws.mergeCells("A1:Y1");
        const titulo = ws.getCell("A1");
        titulo.value = `Reporte de Facturas - ${mes} - Cliente ${nombreCliente}`;
        titulo.font = { bold: true, size: 16 };
        titulo.alignment = { horizontal: "center" };
    
        let rowIndex = 3;
    
        for (const seccion of secciones) {
          const data = facturasMes.filter(seccion.filtro);
          if (data.length === 0) continue;
    
          // Título de sección
          ws.mergeCells(`A${rowIndex}:Y${rowIndex}`);
          const secCell = ws.getCell(`A${rowIndex}`);
          secCell.value = seccion.titulo;
          secCell.font = { bold: true, size: 14, color: { argb: "FFFFFFFF" } };
          secCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: seccion.color } };
          secCell.alignment = { horizontal: "center" };
          rowIndex++;
    
          const headers = [
            "Fecha", "Folio", "Cliente", "RFC Emisor", "Regimen Emisor", "RFC Receptor",
            "Regimen Receptor", "SubTotal", "IVA 8%", "IVA 16%", "Total Trasladados",
            "Retencion ISR", "Retencion IVA", "Retencion IEPS", "Total Retenidos",
            "Descuento", "Total", "Moneda", "Tipo de Cambio", "Clasificación",
            "Tipo de Comprobante", "Forma Pago", "Metodo Pago", "Uso CFDI", "Estatus"
          ];
    
          const headerRow = ws.addRow(headers);
          const headerColor =
            seccion.color === "FF2E75B6"
              ? "FF5B9BD5"
              : seccion.color === "FF555555"
              ? "FF777777"
              : "FFC0C0C0";
          
          // 🔹 Aplicar estilo solo hasta la columna Y (25)
          headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
            if (colNumber <= 25) {
              cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
              cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: headerColor } };
              cell.alignment = { horizontal: "center" };
            }
          });
          rowIndex++;
    
    
          const colIndicesToSum = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
    
          if (seccion.titulo === "Egresos") {
            // 🔹 Agrupar por RFC solo para Egresos
            const rfcGroups: Record<string, Factura[]> = {};
            data.forEach(f => {
              if (!rfcGroups[f.rfc_emisor]) rfcGroups[f.rfc_emisor] = [];
              rfcGroups[f.rfc_emisor].push(f);
            });
    
            for (const [rfc, facturasRfc] of Object.entries(rfcGroups)) {
            facturasRfc.forEach(f => {
                const row = ws.addRow([
                new Date(f.fecha_emision).toLocaleDateString(),
                f.folio || "", f.cliente?.nombre || "", f.rfc_emisor || "", f.regimenfiscal || "",
                f.rfc_receptor || "", f.regimenfiscalreceptor || "",
                toPesos(f, f.subtotal), toPesos(f, f.iva8), toPesos(f, f.iva16), toPesos(f, f.totaltrasladado),
                toPesos(f, f.retencionisr), toPesos(f, f.retencioniva), toPesos(f, f.retencionieps),
                toPesos(f, f.totalretenidos), toPesos(f, f.descuento), toPesos(f, f.total),
                f.moneda || "", f.tipocambio || "", f.movimiento || "", f.tipocomprobante || "",
                f.tipopago || "", f.metodopago || "", f.usocfdi || "", f.status || ""
              ]);
                  if (f.tipopago?.toLowerCase() === "efectivo") {
                    row.eachCell((cell) => {
                      cell.fill = {
                        type: "pattern",
                        pattern: "solid",
                        fgColor: { argb: "FFCCFFCC" } // verde claro
                      };
                    });
                  }
            });
  
            
              // Total por RFC
              const totals = sumColumns(facturasRfc.map(f => [
                toPesos(f, f.subtotal), toPesos(f, f.iva8), toPesos(f, f.iva16), toPesos(f, f.totaltrasladado),
                toPesos(f, f.retencionisr), toPesos(f, f.retencioniva), toPesos(f, f.retencionieps),
                toPesos(f, f.totalretenidos), toPesos(f, f.descuento), toPesos(f, f.total)
              ]), Array.from({ length: 10 }, (_, i) => i));
    
              const totalRow = ws.addRow(["", "", "", `TOTAL ${rfc}`, "", "", "", ...totals, "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""]);
              totalRow.font = { bold: true };
            }
    
          } else {
            // Ingresos y Nómina: listado simple
            data.forEach(f => {
              const row = ws.addRow([
                new Date(f.fecha_emision).toLocaleDateString(),
                f.folio || "", f.cliente?.nombre || "", f.rfc_emisor || "", f.regimenfiscal || "",
                f.rfc_receptor || "", f.regimenfiscalreceptor || "", f.subtotal || 0, f.iva8 || 0,
                f.iva16 || 0, f.totaltrasladado || 0, f.retencionisr || 0, f.retencioniva || 0,
                f.retencionieps || 0, f.totalretenidos || 0, f.descuento || 0, f.total || 0,
                f.moneda || "", f.tipocambio || "", f.movimiento || "", f.tipocomprobante || "",
                f.tipopago || "", f.metodopago || "", f.usocfdi || "", f.status || ""
              ]);
  
              if (f.tipopago?.toLowerCase() === "efectivo") {
                    row.eachCell((cell) => {
                      cell.fill = {
                        type: "pattern",
                        pattern: "solid",
                        fgColor: { argb: "FFCCFFCC" } // verde claro
                      };
                    });
              }
            });
          }
    
          ws.addRow([]);
    
          // 🔹 Total final de la sección
          const totalsSeccion = sumColumns(
            data.map(f => [
              toPesos(f, f.subtotal), toPesos(f, f.iva8), toPesos(f, f.iva16), toPesos(f, f.totaltrasladado),
              toPesos(f, f.retencionisr), toPesos(f, f.retencioniva), toPesos(f, f.retencionieps),
              toPesos(f, f.totalretenidos), toPesos(f, f.descuento), toPesos(f, f.total)
            ]),
            Array.from({ length: 10 }, (_, i) => i)
          );
          
          const totalRowLabel = `TOTAL ${seccion.titulo.toUpperCase()}`;
          const totalSeccionRow = ws.addRow([
            "", "", "", totalRowLabel, "", "", "", ...totalsSeccion,
            "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""
          ]);
          
          totalSeccionRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
            if (colNumber <= 25) { // 🔹 Solo hasta Y
              cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
              cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF404040" } };
              cell.alignment = { horizontal: "center" };
            }
          });
    
          
          // 🔹 Fila de separación después del total
          ws.addRow([]);
    
          rowIndex = ws.lastRow!.number + 2;
        }
    
        // Ajustar columnas y formato
        ws.columns.forEach(col => { col.width = 20; });
        ws.eachRow({ includeEmpty: false }, (row) => {
          row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
            if (colNumber <= 25) {
              cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
              if (typeof cell.value === "number") cell.numFmt = "$#,##0.00";
            }
          });
        });
      }
  
  // === NUEVA HOJA: Totales Mensuales ===
  const wsTotales = wb.addWorksheet("Totales");
  
  // 🔹 Encabezado principal
  wsTotales.mergeCells("A1:M1");
  const tituloTotales = wsTotales.getCell("A1");
  tituloTotales.value = "Resumen de Totales por Mes";
  tituloTotales.font = { bold: true, size: 16, color: { argb: "FFFFFFFF" } };
  tituloTotales.alignment = { horizontal: "center" };
  tituloTotales.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1F4E78" } };
  
  // 🔹 Encabezados
  const headersTotales = [
    "Mes",
    "SubTotal (Egr)", "IVA 8% (Egr)", "IVA 16% (Egr)", "Total Trasladados (Egr)",
    "Retención ISR (Egr)", "Retención IVA (Egr)", "Retención IEPS (Egr)", "Total Retenidos (Egr)",
    "Descuento (Egr)", "Total Egresos", "Total Ingresos", "Total General"
  ];
  
  const headerRowTotales = wsTotales.addRow(headersTotales);
  const headerColorTotales = "FF2E75B6";
  
  // 🔹 Aplicar formato solo hasta la columna M (13 columnas)
  headerRowTotales.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    if (colNumber <= 13) {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: headerColorTotales } };
    }
  });
  
  // 🔹 Calcular totales por mes
  Object.entries(facturasPorMes).forEach(([mes, facturasMes]) => {
    const ingresos = facturasMes.filter(f => f.movimiento === "Ingreso");
    const egresos = facturasMes.filter(f => f.movimiento === "Egreso");
  
    const sum = (arr: Factura[], field: keyof Factura) =>
      arr.reduce((acc, f) => acc + (parseFloat(f[field] as any) || 0), 0);
  
    const subtotalEgr = egresos.reduce((acc, f) => acc + toPesos(f, f.subtotal), 0);
    const iva8Egr = egresos.reduce((acc, f) => acc + toPesos(f, f.iva8), 0);
    const iva16Egr = egresos.reduce((acc, f) => acc + toPesos(f, f.iva16), 0);
    const totalTrasEgr = egresos.reduce((acc, f) => acc + toPesos(f, f.totaltrasladado), 0);
    const retIsrEgr = egresos.reduce((acc, f) => acc + toPesos(f, f.retencionisr), 0);
    const retIvaEgr = egresos.reduce((acc, f) => acc + toPesos(f, f.retencioniva), 0);
    const retIepsEgr = egresos.reduce((acc, f) => acc + toPesos(f, f.retencionieps), 0);
    const totalRetEgr = egresos.reduce((acc, f) => acc + toPesos(f, f.totalretenidos), 0);
    const descuentoEgr = egresos.reduce((acc, f) => acc + toPesos(f, f.descuento), 0);
    const totalEgr = egresos.reduce((acc, f) => acc + toPesos(f, f.total), 0);
    
    const totalIng = ingresos.reduce((acc, f) => acc + toPesos(f, f.total), 0);
    const totalGeneral = totalIng - totalEgr;
  
  
    wsTotales.addRow([
      mes,
      subtotalEgr, iva8Egr, iva16Egr, totalTrasEgr,
      retIsrEgr, retIvaEgr, retIepsEgr, totalRetEgr,
      descuentoEgr, totalEgr, totalIng, totalGeneral
    ]);
  });
  
  // 🔹 Fila de total global (sumatoria de todos los meses)
  const allFacturas = facturas.flat();
  const sumAll = (field: keyof Factura, mov?: string) =>
    allFacturas
      .filter(f => !mov || f.movimiento === mov)
      .reduce((acc, f) => acc + toPesos(f, f[field]), 0);
  
  const totalGlobalRow = wsTotales.addRow([
    "TOTAL GLOBAL",
    sumAll("subtotal", "Egreso"),
    sumAll("iva8", "Egreso"),
    sumAll("iva16", "Egreso"),
    sumAll("totaltrasladado", "Egreso"),
    sumAll("retencionisr", "Egreso"),
    sumAll("retencioniva", "Egreso"),
    sumAll("retencionieps", "Egreso"),
    sumAll("totalretenidos", "Egreso"),
    sumAll("descuento", "Egreso"),
    sumAll("total", "Egreso"),
    sumAll("total", "Ingreso"),
    sumAll("total", "Ingreso") - sumAll("total", "Egreso")
  ]);
  
  // 🔹 Estilos hasta la columna M (13)
  totalGlobalRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    if (colNumber <= 13) {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.alignment = { horizontal: "center" };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF404040" } };
    }
  });
  
  // 🔹 Ajustes visuales
  wsTotales.columns = Array(13).fill({ width: 20 });
  
  wsTotales.eachRow(row => {
    row.eachCell(cell => {
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
      if (typeof cell.value === "number") cell.numFmt = "$#,##0.00";
    });
  });
  
  
  
    // 💰 NUEVA HOJA: Retenidos
      const wsRetenidos = wb.addWorksheet("Retenidos");
  
      wsRetenidos.mergeCells("A1:H1");
      const tituloRetenidos = wsRetenidos.getCell("A1");
      tituloRetenidos.value = "Retenciones general";
      tituloRetenidos.font = { bold: true, size: 16, color: { argb: "FFFFFFFF" } };
      tituloRetenidos.alignment = { horizontal: "center", vertical: "middle" };
      tituloRetenidos.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4B0082" } };
  
      wsRetenidos.addRow([
        "Mes",
        "Cliente",
        "RFC Emisor",
        "RFC Receptor",
        "Fecha",
        "Total",
        "Total Retenidos",
        "Estatus",
      ]);
      
      const headerR = wsRetenidos.getRow(2);
      const headerColorRetenidos = "FF6A5ACD";
      
      // 🔹 Aplicar estilo solo de la columna A a la H
      headerR.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        if (colNumber <= 8) {
          cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
          cell.alignment = { horizontal: "center" };
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: headerColorRetenidos } };
        }
      });
  
    
      // 🔹 Agregar facturas con retenidos > 0
      Object.entries(facturasPorMes).forEach(([mes, facturasMes]) => {
        const facturasRetenidas = facturasMes.filter(f => f.totalretenidos && f.totalretenidos > 0);
        if (facturasRetenidas.length === 0) return;
    
        // Subtítulo del mes
        const subHeader = wsRetenidos.addRow([`${mes}`]);
        subHeader.font = { bold: true, color: { argb: "FF000000" } };
        subHeader.alignment = { horizontal: "left" };
        wsRetenidos.mergeCells(`A${subHeader.number}:H${subHeader.number}`);
    
        facturasRetenidas.forEach((f) => {
          wsRetenidos.addRow([
            mes,
            f.cliente?.nombre || "",
            f.rfc_emisor,
            f.rfc_receptor,
            new Date(f.fecha_emision).toLocaleDateString(),
            f.total,
            f.totalretenidos,
            f.status,
          ]);
        });
    
        // 🔹 Total retenidos del mes (seguro y con formato)
        const totalMes = facturasRetenidas.reduce(
          (acc, f) => acc + (typeof f.totalretenidos === "number" ? f.totalretenidos : parseFloat(f.totalretenidos) || 0),
          0
        );
        
          const totalRow = wsRetenidos.addRow([
          "",
          "",
          "",
          "",
          "TOTAL RETENIDO DEL MES",
          "",
          totalMes,
          "",
        ]);
        
        // 🔹 Aplicar estilos SOLO a columnas A–H
        totalRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          if (colNumber <= 8) {
            cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
            cell.alignment = { horizontal: "center" };
            cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF404040" } };
            cell.border = {
              top: { style: "medium" },
              left: { style: "thin" },
              bottom: { style: "medium" },
              right: { style: "thin" },
            };
        
            if (typeof cell.value === "number") cell.numFmt = "$#,##0.00";
          }
        });
      });
    
      wsRetenidos.columns = [
        { width: 20 },
        { width: 25 },
        { width: 20 },
        { width: 20 },
        { width: 15 },
        { width: 15 },
        { width: 20 },
        { width: 15 },
      ];
    
      wsRetenidos.eachRow((row) => {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
          if (typeof cell.value === "number") cell.numFmt = "$#,##0.00";
        });
      });
  
    const buffer = await wb.xlsx.writeBuffer();
    saveAs(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), "Reporte_Facturas_"+selectedRFC+".xlsx");
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
        <p>Pega tu clave de invitado para continuar</p>
  
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
          <CardTitle as="h4" className="mb-0">Facturas</CardTitle>
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
              placeholder="Buscar por RFC o Cliente"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-100 w-md-auto mb-1 mb-md-0"
              style={{ minWidth: "180px" }}
            />
            <Button
              variant="primary"
              size="sm"
              disabled={facturas.length === 0}
              className="text-nowrap mb-1 mb-md-0"
              onClick={() => setShowExportModal(true)}
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
                {selectedRFC ? "Cambiar Cliente" : "Seleccionar Cliente"}
              </Button>
            )}
          </div>
        </CardHeader>

        <CardBody>
          {filteredFacturas.length > 0 ? (
            <div className="table-responsive">
              <Table className="table-centered table-custom table-sm table-nowrap table-hover mb-0">
                <thead>
                  <tr>
                    {(tipoCuenta === "empresarial" || tipoCuenta === "empleado") && <th>Cliente</th>}
                    <th>RFC Emisor</th>
                    <th>RFC Receptor</th>
                    <th onClick={() => requestSort("movimiento")} style={{ cursor: "pointer" }}>
                      Movimiento {renderSortIcon("movimiento")}
                    </th>
                    <th onClick={() => requestSort("total")} style={{ cursor: "pointer" }}>
                      Total {renderSortIcon("total")}
                    </th>
                    <th onClick={() => requestSort("fecha_emision")} style={{ cursor: "pointer" }}>
                      Fecha {renderSortIcon("fecha_emision")}
                    </th>
                    <th>Estatus</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedFacturas.map((factura) => {
                    const isVisible = visibleRows[factura.id] ?? true; // por defecto visible
                    if (!isVisible) return null; // si está oculto, no renderiza
                
                    return (
                      <tr key={factura.id}>
                        {(tipoCuenta === "empresarial" || tipoCuenta === "empleado") && <td>{factura.cliente?.nombre}</td>}
                        <td>{factura?.rfc_emisor}</td>
                        <td>{factura?.rfc_receptor}</td>
                        <td>{factura.movimiento}</td>
                        <td><strong>${factura.total.toLocaleString()}</strong></td>
                        <td>{new Date(factura.fecha_emision).toLocaleDateString()}</td>
                        <td>
                          <TbCircleFilled className={`fs-xs text-${factura.status === "Vigente" ? "success" : factura.status === "Pendiente" ? "warning" : "danger"} me-1`} />
                          {factura.status}
                        </td>
                        <td style={{ width: 30 }}>
                          <Dropdown>
                            <DropdownToggle as="a" href="#" className="dropdown-toggle text-muted drop-arrow-none card-drop p-0">
                              <TbDotsVertical className="fs-lg" />
                            </DropdownToggle>
                            <DropdownMenu className="dropdown-menu-end">
                              {/* Solo dejamos "Ocultar" */}
                              <DropdownItem
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  setVisibleRows(prev => ({ ...prev, [factura.id]: false }));
                                }}
                              >
                                Ocultar
                              </DropdownItem>
                               <DropdownItem
                                 href="#"
                                 onClick={(e) => {
                                   e.preventDefault();
                                   handleAnalisisIA(factura);
                                 }}
                               >
                                 <span className="d-inline-flex align-items-center">
                                   <TbBrain className="me-1 text-primary" />
                                   Análisis IA
                                 </span>
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
              {selectedRFC ? `Cliente: ${selectedRFC}` : "Seleccionar Cliente"}
            </div>
          )}
        </CardBody>

        {filteredFacturas.length > 0 && (
          <CardFooter className="border-0">
            <CardPagination
              totalItems={filteredFacturas.length}
              itemsPerPage={itemsPerPage}
              currentPage={currentPage}
              itemsName="facturas"
              onPageChange={(page) => setCurrentPage(page)}
            />
          </CardFooter>
        )}
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
      <Modal show={showExportModal} onHide={() => setShowExportModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Seleccionar tipo de reporte</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          <p className="text-muted mb-3">
            Elige qué tipo de facturas deseas incluir en el archivo Excel.
          </p>
      
          <div className="d-grid gap-2">
            <Button
              variant={tipoExport === "PUE" ? "success" : "outline-success"}
              onClick={() => setTipoExport("PUE")}
            >
              Solo facturas PUE
            </Button>
            <Button
              variant={tipoExport === "PPD" ? "warning" : "outline-warning"}
              onClick={() => setTipoExport("PPD")}
            >
              Solo facturas PPD
            </Button>
            <Button
              variant={tipoExport === "TODO" ? "primary" : "outline-primary"}
              onClick={() => setTipoExport("TODO")}
            >
              Todas las facturas
            </Button>
          </div>
        </Modal.Body>
        <Modal.Footer className="justify-content-between">
          <Button variant="secondary" onClick={() => setShowExportModal(false)}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              handleExport(tipoExport);
              setShowExportModal(false);
            }}
          >
            Exportar
          </Button>
        </Modal.Footer>
      </Modal>
      <FacturaIAModal
        show={showIAModal}
        loading={loadingIA}
        iaAnalysis={iaAnalysis}
        onClose={() => setShowIAModal(false)}
      />
    </Col>
  )
}

export default ListFacturas
