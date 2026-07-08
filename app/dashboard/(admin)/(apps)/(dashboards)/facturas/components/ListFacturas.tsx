"use client"

import { useState, useEffect } from "react"
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { Button, Card, CardBody, CardFooter, CardHeader, CardTitle, Col, Dropdown, DropdownItem, DropdownMenu, DropdownToggle, Table, Modal, Form } from 'react-bootstrap'
import { TbCircleFilled, TbDotsVertical, TbFileExport, TbArrowDown, TbArrowUp } from 'react-icons/tb'
import CardPagination from '@/components/cards/CardPagination'
import { getFacturas, getFacturasConConceptos, getPagos } from "../../../../../../services/financeService"  // 🔹 nuevo servicio
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
  const [tipoExport, setTipoExport] = useState<"TODO" | "PUE" | "PPD" | "CONCEPTOS">("TODO");
  const [loadingFlujo, setLoadingFlujo] = useState(false);
  const [loadingConceptos, setLoadingConceptos] = useState(false);
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
    if (!selectedRFC || !fechaInicio || !fechaFin) return; // 🔒 BLOQUEO

    try {
      const params = {
        rfc: selectedRFC,
        startDate: fechaInicio || undefined,
        endDate: fechaFin || undefined,
      };

      const rawData = await getFacturas(params);

      const filtradas = rawData.filter(
        (f: any) => f.tipocomprobante !== "P"
      );

      const data: Factura[] = filtradas.map((f: any, idx: number) => {
        let movimiento = f.movimiento;

        const fechaFiscal = f.fecha
          ? f.fecha.substring(0, 10) // YYYY-MM-DD
          : "";
       
        if (f.tipocomprobante === "N") {
          if (f.rfc_emisor === selectedRFC) {
            // Tú emites nómina → egreso
            movimiento = "Nomina";
          } else {
            // Tú recibes nómina → ingreso
            movimiento = "Ingreso";
          }
        }
              // 🔑 Nombre correcto según rol fiscal
        let contraparteNombre = "";
        
       if (movimiento === "Ingreso") {
          contraparteNombre = f.razonsocialreceptor;
        } else if (movimiento === "Egreso") {
          contraparteNombre = f.razonsocialemisor;
        } else if (movimiento === "Nomina") {
          // Empleado (receptor) cuando tú emites nómina
          contraparteNombre = f.razonsocialreceptor;
        }

        return {
        id: idx + 1,
        uuid: f.uuid,
        cliente: {
          id: idx + 1,
          nombre: contraparteNombre || "—",
        },
        rfc_emisor: f.rfc_emisor,
        rfc_receptor: f.rfc_receptor,
        subtotal: f.subtotal,
        total: Number(f.total),
        clasificacion: f.clasificacion,
        status: f.status,
        fecha_emision: fechaFiscal,
        movimiento,
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
        };
      });

      setFacturas(data);
    } catch (error) {
      console.error("Error al cargar facturas:", error);
      setFacturas([]);
    }
  };

  useEffect(() => {
    if (!selectedRFC || !fechaInicio || !fechaFin) return;
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
      valueA = valueA;
      valueB = valueB;
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

  const exportarFlujoEfectivo = async () => {
    if (!selectedRFC || !fechaInicio || !fechaFin) return;
    setLoadingFlujo(true);
    try {
      // Fetch en paralelo: facturas PUE + complementos de pago (cada uno con su monto correcto)
      const [todasFacturas, pagosData] = await Promise.all([
        getFacturas({ rfc: selectedRFC, startDate: fechaInicio, endDate: fechaFin }),
        getPagos({ rfc: selectedRFC, startDate: fechaInicio, endDate: fechaFin }),
      ]);

      // Solo facturas PUE (excluir tipo P, esos vienen del endpoint de pagos)
      const pueRows = todasFacturas.filter((f: any) => f.metodopago === "PUE");

      // Deduplicar por uuid_complemento: cada complemento de pago tiene N rows en pagos_cfdi
      // (una por cada DoctoRelacionado), todas con el mismo monto total del pago.
      // Tomamos solo la primera ocurrencia de cada uuid_complemento para no multiplicar el monto.
      const complementosUnicos = new Map<string, any>();
      for (const p of pagosData) {
        if (!complementosUnicos.has(p.uuid_complemento)) {
          complementosUnicos.set(p.uuid_complemento, p);
        }
      }

      // Normalizar complementos de pago al mismo shape que facturas
      const pagosRows = Array.from(complementosUnicos.values()).map((p: any) => ({
        fecha: p.fecha_pago || p.fecha_emision || "",
        uuid: p.uuid_complemento || "",
        rfc_emisor: p.rfc_emisor || "",
        razonsocialemisor: p.nombre_emisor || p.rfc_emisor || "",
        rfc_receptor: p.rfc_receptor || "",
        razonsocialreceptor: p.nombre_receptor || p.rfc_receptor || "",
        total: p.monto,          // monto real del complemento de pago (sin duplicar)
        tipocomprobante: "P",
        metodopago: "",
        tipopago: p.forma_pago || "",
        status: "",
      }));

      const flujoData = [...pueRows, ...pagosRows];

      if (flujoData.length === 0) {
        toast.info("No hay facturas de flujo de efectivo en el periodo seleccionado.");
        return;
      }

      const ingresos = flujoData.filter((f: any) => f.rfc_emisor === selectedRFC);
      const egresos  = flujoData.filter((f: any) => f.rfc_emisor !== selectedRFC);

      const wb = new ExcelJS.Workbook();
      wb.creator = "CuentIA";
      wb.created = new Date();

      const ws = wb.addWorksheet("Flujo de Efectivo");

      // ── Título principal ──
      ws.mergeCells("A1:J1");
      const tituloCell = ws.getCell("A1");
      tituloCell.value = `Flujo de Efectivo — ${selectedRFC} | ${fechaInicio} al ${fechaFin}`;
      tituloCell.font = { bold: true, size: 14, color: { argb: "FFFFFFFF" } };
      tituloCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1F4E78" } };
      tituloCell.alignment = { horizontal: "center" };

      const HEADERS = ["Fecha", "UUID", "Contraparte", "RFC Emisor", "RFC Receptor", "Total", "Tipo Comprobante", "Método Pago", "Forma Pago", "Estatus"];
      const HEADER_STYLE = (color: string) => (cell: ExcelJS.Cell, col: number) => {
        if (col > HEADERS.length) return;
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: color } };
        cell.alignment = { horizontal: "center" };
      };

      const addSection = (
        titulo: string,
        color: string,
        headerColor: string,
        rows: any[]
      ) => {
        // Título sección
        ws.mergeCells(`A${ws.lastRow!.number + 2}:J${ws.lastRow!.number + 2}`);
        const secRow = ws.lastRow!;
        secRow.getCell(1).value = titulo;
        secRow.getCell(1).font = { bold: true, size: 12, color: { argb: "FFFFFFFF" } };
        secRow.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: color } };
        secRow.getCell(1).alignment = { horizontal: "center" };

        // Encabezados
        const hRow = ws.addRow(HEADERS);
        hRow.eachCell({ includeEmpty: true }, (cell, col) => HEADER_STYLE(headerColor)(cell, col));

        // Datos
        rows.forEach((f: any) => {
          const contraparte = f.rfc_emisor === selectedRFC
            ? (f.razonsocialreceptor || f.rfc_receptor || "")
            : (f.razonsocialemisor  || f.rfc_emisor   || "");
          ws.addRow([
            (f.fecha || f.fecha_emision || "").substring(0, 10).split("-").reverse().join("/"),
            f.uuid || "",
            contraparte,
            f.rfc_emisor || "",
            f.rfc_receptor || "",
            parseFloat(f.total) || 0,
            f.tipocomprobante || "",
            f.metodopago || "",
            f.tipopago || "",
            f.status || "",
          ]);
        });

        // Total sección
        const totalSec = rows.reduce((acc: number, f: any) => acc + (parseFloat(f.total) || 0), 0);
        const totRow = ws.addRow(["", "", "", "", `TOTAL ${titulo.toUpperCase()}`, totalSec, "", "", "", ""]);
        totRow.eachCell({ includeEmpty: true }, (cell, col) => {
          if (col > HEADERS.length) return;
          cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF404040" } };
          cell.alignment = { horizontal: "center" };
          if (typeof cell.value === "number") cell.numFmt = "$#,##0.00";
        });

        return totalSec;
      };

      // Secciones
      const totalIng = addSection("Ingresos", "FF2E75B6", "FF5B9BD5", ingresos);
      const totalEgr = addSection("Egresos",  "FF555555", "FF777777", egresos);

      // ── Resumen final ──
      ws.addRow([]);
      ws.mergeCells(`A${ws.lastRow!.number + 1}:J${ws.lastRow!.number + 1}`);
      const resRow = ws.lastRow!;
      resRow.getCell(1).value = "RESUMEN DE LIQUIDEZ";
      resRow.getCell(1).font = { bold: true, size: 12, color: { argb: "FFFFFFFF" } };
      resRow.getCell(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1F4E78" } };
      resRow.getCell(1).alignment = { horizontal: "center" };

      const summaryRows = [
        ["Total Ingresos", totalIng],
        ["Total Egresos", totalEgr],
        ["Liquidez Neta", totalIng - totalEgr],
      ];
      summaryRows.forEach(([label, value]) => {
        const r = ws.addRow([label, value, "", "", "", "", "", "", "", ""]);
        r.getCell(1).font = { bold: true };
        r.getCell(2).numFmt = "$#,##0.00";
        const isNeta = label === "Liquidez Neta";
        if (isNeta) {
          [1, 2].forEach(c => {
            r.getCell(c).fill = {
              type: "pattern", pattern: "solid",
              fgColor: { argb: (value as number) >= 0 ? "FF92D050" : "FFFF0000" },
            };
          });
        }
      });

      // Estilos generales
      ws.columns = Array(HEADERS.length).fill({ width: 22 });
      ws.eachRow({ includeEmpty: false }, row => {
        row.eachCell({ includeEmpty: false }, (cell, col) => {
          if (col > HEADERS.length) return;
          cell.border = { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } };
          if (typeof cell.value === "number") cell.numFmt = "$#,##0.00";
        });
      });

      const buffer = await wb.xlsx.writeBuffer();
      saveAs(
        new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
        `FlujoEfectivo_${selectedRFC}.xlsx`
      );
    } catch (err) {
      console.error(err);
      toast.error("No se pudo generar el reporte de flujo de efectivo.");
    } finally {
      setLoadingFlujo(false);
    }
  };
  
  
  const exportConceptosFacturas = async () => {
    if (!selectedRFC || !fechaInicio || !fechaFin) return;
    setLoadingConceptos(true);

    // 🎨 Paleta de marca Cuentia
    const TEAL = "FF1AB394";         // primary
    const TEAL_LIGHT = "FF7BD3BF";   // header secundario
    const TEAL_BG = "FFE4F6F1";      // fondo zebra
    const INDIGO = "FF6B5EAE";       // acentos
    const INDIGO_LIGHT = "FFB3ACD6"; // sub-encabezados
    const DARK = "FF2E2E3A";         // texto/total final
    const WHITE = "FFFFFFFF";

    try {
      const facturasConConceptos = await getFacturasConConceptos({
        rfc: selectedRFC,
        startDate: fechaInicio,
        endDate: fechaFin,
      });

      console.log("[exportConceptos] respuesta backend:", facturasConConceptos);
      console.log("[exportConceptos] params enviados:", { rfc: selectedRFC, startDate: fechaInicio, endDate: fechaFin });

      if (!Array.isArray(facturasConConceptos) || facturasConConceptos.length === 0) {
        toast.info("No hay conceptos en el periodo seleccionado.");
        return;
      }

      const nombreCliente = (() => {
        const c = clientes.find((x) => x.rfc === selectedRFC);
        return c?.nombre || selectedRFC;
      })();

      const toNum = (v: any) => parseFloat(String(v ?? 0)) || 0;
      const fmtFecha = (v: any) => {
        const s = String(v || "").substring(0, 10);
        return s.includes("-") ? s.split("-").reverse().join("/") : s;
      };

      const wb = new ExcelJS.Workbook();
      wb.creator = "CuentIA";
      wb.created = new Date();

      // ============================================================
      // HOJA 1 — Facturas con sus conceptos
      // ============================================================
      const ws1 = wb.addWorksheet("Facturas y Conceptos");

      const HEADERS_1 = [
        "Fecha", "UUID", "Movimiento", "RFC Emisor", "Razón Social Emisor",
        "RFC Receptor", "Razón Social Receptor", "Moneda", "Método Pago", "Forma Pago", "Total Factura",
        "Clave ProdServ", "No. Identificación", "Descripción Concepto",
        "Cantidad", "Unidad", "Valor Unitario", "Importe", "Descuento",
        "Objeto Imp", "Base IVA 16", "IVA 16", "Base IVA 8", "IVA 8",
        "Base Exento", "IEPS Tras.", "Total Trasladado",
        "Ret. IVA", "Ret. ISR", "Ret. IEPS", "Total Retenido",
      ];

      // Título principal
      ws1.mergeCells(1, 1, 1, HEADERS_1.length);
      const t1 = ws1.getCell(1, 1);
      t1.value = `Conceptos por Factura — ${nombreCliente} (${selectedRFC}) | ${fmtFecha(fechaInicio)} al ${fmtFecha(fechaFin)}`;
      t1.font = { bold: true, size: 14, color: { argb: WHITE } };
      t1.fill = { type: "pattern", pattern: "solid", fgColor: { argb: TEAL } };
      t1.alignment = { horizontal: "center", vertical: "middle" };
      ws1.getRow(1).height = 26;

      // Encabezados
      const h1 = ws1.addRow(HEADERS_1);
      h1.eachCell({ includeEmpty: true }, (cell, col) => {
        if (col > HEADERS_1.length) return;
        cell.font = { bold: true, color: { argb: WHITE } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: INDIGO } };
        cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
        cell.border = {
          top: { style: "thin" }, left: { style: "thin" },
          bottom: { style: "thin" }, right: { style: "thin" },
        };
      });
      h1.height = 28;

      // Datos: una factura → varias filas de concepto
      facturasConConceptos.forEach((f: any, idx: number) => {
        const conceptos: any[] = Array.isArray(f.conceptos) ? f.conceptos : [];
        const baseFactura = [
          fmtFecha(f.fecha || f.fecha_emision),
          f.uuid || "",
          f.movimiento || (f.rfc_emisor === selectedRFC ? "Ingreso" : "Egreso"),
          f.rfc_emisor || "",
          f.razonsocialemisor || "",
          f.rfc_receptor || "",
          f.razonsocialreceptor || "",
          f.moneda || "MXN",
          f.metodopago || "",
          f.tipopago || "",
          toNum(f.total),
        ];

        const zebra = idx % 2 === 0;

        if (conceptos.length === 0) {
          const sinRow = [...baseFactura];
          while (sinRow.length < HEADERS_1.length) sinRow.push("");
          sinRow[13] = "(Sin conceptos)"; // columna "Descripción Concepto"
          const row = ws1.addRow(sinRow);
          row.eachCell({ includeEmpty: true }, (cell, col) => {
            if (col > HEADERS_1.length) return;
            cell.border = {
              top: { style: "thin" }, left: { style: "thin" },
              bottom: { style: "thin" }, right: { style: "thin" },
            };
            if (zebra) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: TEAL_BG } };
            if (typeof cell.value === "number") cell.numFmt = "$#,##0.00";
          });
          return;
        }

        conceptos.forEach((c: any, ci: number) => {
          // En la primera fila del bloque mostramos los datos de la factura;
          // en las siguientes dejamos las columnas de factura en blanco para no repetir.
          const filaFactura = ci === 0 ? baseFactura : ["", "", "", "", "", "", "", "", "", "", ""];
          const row = ws1.addRow([
            ...filaFactura,
            c.clave_prod_serv || c.claveprodserv || "",
            c.no_identificacion || c.noidentificacion || "",
            c.descripcion || "",
            toNum(c.cantidad),
            c.unidad || c.clave_unidad || c.claveunidad || "",
            toNum(c.valor_unitario ?? c.valorunitario),
            toNum(c.importe),
            toNum(c.descuento),
            c.objeto_imp || "",
            toNum(c.base_iva16), toNum(c.iva16),
            toNum(c.base_iva8), toNum(c.iva8),
            toNum(c.base_exento),
            toNum(c.ieps_trasladado),
            toNum(c.total_trasladado),
            toNum(c.retencion_iva), toNum(c.retencion_isr), toNum(c.retencion_ieps),
            toNum(c.total_retenido),
          ]);
          row.eachCell({ includeEmpty: true }, (cell, col) => {
            if (col > HEADERS_1.length) return;
            cell.border = {
              top: { style: "thin" }, left: { style: "thin" },
              bottom: { style: "thin" }, right: { style: "thin" },
            };
            cell.alignment = { vertical: "middle", wrapText: col === 14 };
            if (zebra) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: TEAL_BG } };
            if (typeof cell.value === "number") cell.numFmt = "$#,##0.00";
          });
        });
      });

      // Total general (suma de importes + impuestos por concepto en el periodo)
      const sumConcepto = (field: string) =>
        facturasConConceptos.reduce((acc: number, f: any) => {
          const cs: any[] = Array.isArray(f.conceptos) ? f.conceptos : [];
          return acc + cs.reduce((a, c) => a + toNum(c[field]), 0);
        }, 0);

      const totalImporte = sumConcepto("importe");

      const totRow = ws1.addRow([
        "", "", "", "", "", "", "", "", "", "", "", "", "", "TOTALES",
        "", "", "", totalImporte, "",
        "", sumConcepto("base_iva16"), sumConcepto("iva16"),
        sumConcepto("base_iva8"), sumConcepto("iva8"),
        sumConcepto("base_exento"), sumConcepto("ieps_trasladado"),
        sumConcepto("total_trasladado"),
        sumConcepto("retencion_iva"), sumConcepto("retencion_isr"), sumConcepto("retencion_ieps"),
        sumConcepto("total_retenido"),
      ]);
      totRow.eachCell({ includeEmpty: true }, (cell, col) => {
        if (col > HEADERS_1.length) return;
        cell.font = { bold: true, color: { argb: WHITE } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: DARK } };
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.border = {
          top: { style: "medium" }, left: { style: "thin" },
          bottom: { style: "medium" }, right: { style: "thin" },
        };
        if (typeof cell.value === "number") cell.numFmt = "$#,##0.00";
      });

      ws1.columns = [
        { width: 12 }, { width: 38 }, { width: 12 }, { width: 16 }, { width: 28 },
        { width: 16 }, { width: 28 }, { width: 10 }, { width: 12 }, { width: 12 }, { width: 14 },
        { width: 16 }, { width: 18 }, { width: 38 }, { width: 10 },
        { width: 12 }, { width: 14 }, { width: 14 }, { width: 12 },
        { width: 10 }, { width: 13 }, { width: 12 }, { width: 13 }, { width: 12 },
        { width: 13 }, { width: 13 }, { width: 15 },
        { width: 12 }, { width: 12 }, { width: 12 }, { width: 14 },
      ];
      ws1.views = [{ state: "frozen", ySplit: 2 }];

      // ============================================================
      // HOJA 2 — Conceptos agrupados con sus facturas
      // ============================================================
      const ws2 = wb.addWorksheet("Conceptos agrupados");

      // Agrupamos por descripción (clave secundaria: clave_prod_serv)
      type ConceptoGrupo = {
        descripcion: string;
        clave_prod_serv: string;
        cantidadTotal: number;
        importeTotal: number;
        iva16Total: number; iva8Total: number; iepsTotal: number; trasladadoTotal: number;
        retIvaTotal: number; retIsrTotal: number; retIepsTotal: number; retenidoTotal: number;
        facturas: {
          fecha: string; uuid: string; movimiento: string;
          rfc_emisor: string; razonsocialemisor: string;
          rfc_receptor: string; razonsocialreceptor: string;
          metodopago: string; tipopago: string;
          cantidad: number; valor_unitario: number; importe: number;
          iva16: number; iva8: number; ieps_trasladado: number; total_trasladado: number;
          retencion_iva: number; retencion_isr: number; retencion_ieps: number; total_retenido: number;
        }[];
      };

      const grupos = new Map<string, ConceptoGrupo>();

      facturasConConceptos.forEach((f: any) => {
        const conceptos: any[] = Array.isArray(f.conceptos) ? f.conceptos : [];
        conceptos.forEach((c: any) => {
          const desc = (c.descripcion || "(Sin descripción)").trim();
          const clave = c.clave_prod_serv || c.claveprodserv || "";
          const key = `${desc}__${clave}`;
          if (!grupos.has(key)) {
            grupos.set(key, {
              descripcion: desc,
              clave_prod_serv: clave,
              cantidadTotal: 0,
              importeTotal: 0,
              iva16Total: 0, iva8Total: 0, iepsTotal: 0, trasladadoTotal: 0,
              retIvaTotal: 0, retIsrTotal: 0, retIepsTotal: 0, retenidoTotal: 0,
              facturas: [],
            });
          }
          const g = grupos.get(key)!;
          const cantidad = toNum(c.cantidad);
          const importe = toNum(c.importe);
          const iva16 = toNum(c.iva16);
          const iva8 = toNum(c.iva8);
          const ieps = toNum(c.ieps_trasladado);
          const trasladado = toNum(c.total_trasladado);
          const retIva = toNum(c.retencion_iva);
          const retIsr = toNum(c.retencion_isr);
          const retIeps = toNum(c.retencion_ieps);
          const retenido = toNum(c.total_retenido);
          g.cantidadTotal += cantidad;
          g.importeTotal += importe;
          g.iva16Total += iva16; g.iva8Total += iva8; g.iepsTotal += ieps; g.trasladadoTotal += trasladado;
          g.retIvaTotal += retIva; g.retIsrTotal += retIsr; g.retIepsTotal += retIeps; g.retenidoTotal += retenido;
          g.facturas.push({
            fecha: fmtFecha(f.fecha || f.fecha_emision),
            uuid: f.uuid || "",
            movimiento: f.movimiento || (f.rfc_emisor === selectedRFC ? "Ingreso" : "Egreso"),
            rfc_emisor: f.rfc_emisor || "",
            razonsocialemisor: f.razonsocialemisor || "",
            rfc_receptor: f.rfc_receptor || "",
            razonsocialreceptor: f.razonsocialreceptor || "",
            metodopago: f.metodopago || "",
            tipopago: f.tipopago || "",
            cantidad,
            valor_unitario: toNum(c.valor_unitario ?? c.valorunitario),
            importe,
            iva16, iva8, ieps_trasladado: ieps, total_trasladado: trasladado,
            retencion_iva: retIva, retencion_isr: retIsr, retencion_ieps: retIeps, total_retenido: retenido,
          });
        });
      });

      const HEADERS_2 = [
        "Fecha", "UUID", "Movimiento", "RFC Emisor", "Razón Social Emisor",
        "RFC Receptor", "Razón Social Receptor", "Método Pago", "Forma Pago",
        "Cantidad", "Valor Unitario", "Importe",
        "IVA 16", "IVA 8", "IEPS Tras.", "Total Trasladado",
        "Ret. IVA", "Ret. ISR", "Ret. IEPS", "Total Retenido",
      ];

      // Título principal hoja 2
      ws2.mergeCells(1, 1, 1, HEADERS_2.length);
      const t2 = ws2.getCell(1, 1);
      t2.value = `Conceptos agrupados — ${nombreCliente} (${selectedRFC}) | ${fmtFecha(fechaInicio)} al ${fmtFecha(fechaFin)}`;
      t2.font = { bold: true, size: 14, color: { argb: WHITE } };
      t2.fill = { type: "pattern", pattern: "solid", fgColor: { argb: INDIGO } };
      t2.alignment = { horizontal: "center", vertical: "middle" };
      ws2.getRow(1).height = 26;

      // Ordenamos los grupos por importe descendente (los más relevantes primero)
      const gruposOrdenados = Array.from(grupos.values()).sort((a, b) => b.importeTotal - a.importeTotal);

      gruposOrdenados.forEach((g) => {
        ws2.addRow([]);
        // Cabecera del grupo
        const startRow = ws2.lastRow!.number + 1;
        ws2.mergeCells(startRow, 1, startRow, HEADERS_2.length);
        const gCell = ws2.getCell(startRow, 1);
        gCell.value = `${g.descripcion}${g.clave_prod_serv ? `  ·  Clave: ${g.clave_prod_serv}` : ""}  ·  Facturas: ${g.facturas.length}  ·  Cant. total: ${g.cantidadTotal.toLocaleString("es-MX")}  ·  Importe: $${g.importeTotal.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        gCell.font = { bold: true, color: { argb: WHITE } };
        gCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: TEAL } };
        gCell.alignment = { horizontal: "left", vertical: "middle", indent: 1 };
        ws2.getRow(startRow).height = 22;

        // Encabezados de columnas para este grupo
        const hRow = ws2.addRow(HEADERS_2);
        hRow.eachCell({ includeEmpty: true }, (cell, col) => {
          if (col > HEADERS_2.length) return;
          cell.font = { bold: true, color: { argb: WHITE } };
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: INDIGO_LIGHT } };
          cell.alignment = { horizontal: "center", vertical: "middle" };
          cell.border = {
            top: { style: "thin" }, left: { style: "thin" },
            bottom: { style: "thin" }, right: { style: "thin" },
          };
        });

        // Filas de facturas del grupo
        g.facturas.forEach((fac, fi) => {
          const row = ws2.addRow([
            fac.fecha, fac.uuid, fac.movimiento,
            fac.rfc_emisor, fac.razonsocialemisor,
            fac.rfc_receptor, fac.razonsocialreceptor,
            fac.metodopago, fac.tipopago,
            fac.cantidad, fac.valor_unitario, fac.importe,
            fac.iva16, fac.iva8, fac.ieps_trasladado, fac.total_trasladado,
            fac.retencion_iva, fac.retencion_isr, fac.retencion_ieps, fac.total_retenido,
          ]);
          const zebra = fi % 2 === 0;
          row.eachCell({ includeEmpty: true }, (cell, col) => {
            if (col > HEADERS_2.length) return;
            cell.border = {
              top: { style: "thin" }, left: { style: "thin" },
              bottom: { style: "thin" }, right: { style: "thin" },
            };
            if (zebra) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: TEAL_BG } };
            if (typeof cell.value === "number") cell.numFmt = "$#,##0.00";
          });
        });

        // Total por grupo
        const subRow = ws2.addRow([
          "", "", "", "", "", "", "TOTAL", "", "", g.cantidadTotal, "", g.importeTotal,
          g.iva16Total, g.iva8Total, g.iepsTotal, g.trasladadoTotal,
          g.retIvaTotal, g.retIsrTotal, g.retIepsTotal, g.retenidoTotal,
        ]);
        subRow.eachCell({ includeEmpty: true }, (cell, col) => {
          if (col > HEADERS_2.length) return;
          cell.font = { bold: true, color: { argb: WHITE } };
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: DARK } };
          cell.alignment = { horizontal: "center", vertical: "middle" };
          cell.border = {
            top: { style: "medium" }, left: { style: "thin" },
            bottom: { style: "medium" }, right: { style: "thin" },
          };
          if (typeof cell.value === "number") cell.numFmt = "$#,##0.00";
        });
      });

      ws2.columns = [
        { width: 12 }, { width: 38 }, { width: 12 }, { width: 16 }, { width: 28 },
        { width: 16 }, { width: 28 }, { width: 12 }, { width: 12 },
        { width: 12 }, { width: 14 }, { width: 14 },
        { width: 12 }, { width: 12 }, { width: 13 }, { width: 15 },
        { width: 12 }, { width: 12 }, { width: 12 }, { width: 14 },
      ];
      ws2.views = [{ state: "frozen", ySplit: 1 }];

      const buffer = await wb.xlsx.writeBuffer();
      saveAs(
        new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
        `Conceptos_${selectedRFC}_${fechaInicio}_${fechaFin}.xlsx`
      );
    } catch (err) {
      console.error(err);
      toast.error("No se pudo generar el reporte de conceptos.");
    } finally {
      setLoadingConceptos(false);
    }
  };


  const exportToExcel = async (facturasFiltradas?: Factura[]) => {
      const data = facturasFiltradas && facturasFiltradas.length > 0 ? facturasFiltradas : facturas;
      if (data.length === 0) return;
  
      const wb = new ExcelJS.Workbook();
      wb.creator = "CuentIA";
      wb.created = new Date();
    
      const facturasPorMes: Record<string, Factura[]> = {};
      data.forEach((f) => {
        const [year, month] = f.fecha_emision.split("-");
        
        const mes = new Date(
          Number(year),
          Number(month) - 1,
          1
        ).toLocaleString("es-MX", {
          month: "long",
          year: "numeric",
        });
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

          const terceroLabel =
          seccion.titulo === "Ingresos"
            ? "Cliente"
            : seccion.titulo === "Egresos"
            ? "Proveedor"
            : seccion.titulo === "Nómina"
            ? "Empleado"
            : "Contraparte";
    
          const headers = [
            "Fecha", "UUID", terceroLabel, "RFC Emisor", "Regimen Emisor", "RFC Receptor",
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
                f.fecha_emision.split("-").reverse().join("/"),
                f.uuid || "", f.cliente?.nombre || "", f.rfc_emisor || "", f.regimenfiscal || "",
                f.rfc_receptor || "", f.regimenfiscalreceptor || "",
                toPesos(f, f.subtotal), toPesos(f, f.iva8), toPesos(f, f.iva16), toPesos(f, f.totaltrasladado),
                toPesos(f, f.retencionisr), toPesos(f, f.retencioniva), toPesos(f, f.retencionieps),
                toPesos(f, f.totalretenidos), toPesos(f, f.descuento), toPesos(f, f.total),
                f.moneda || "", f.tipocambio || "", f.movimiento || "", f.tipocomprobante || "",
                f.tipopago || "", f.metodopago || "", f.usocfdi || "", f.status || ""
              ]);
                  if (f.tipopago === "01") {
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
                f.fecha_emision.split("-").reverse().join("/"),
                f.uuid || "", f.cliente?.nombre || "", f.rfc_emisor || "", f.regimenfiscal || "",
                f.rfc_receptor || "", f.regimenfiscalreceptor || "", f.subtotal || 0, f.iva8 || 0,
                f.iva16 || 0, f.totaltrasladado || 0, f.retencionisr || 0, f.retencioniva || 0,
                f.retencionieps || 0, f.totalretenidos || 0, f.descuento || 0, f.total || 0,
                f.moneda || "", f.tipocambio || "", f.movimiento || "", f.tipocomprobante || "",
                f.tipopago || "", f.metodopago || "", f.usocfdi || "", f.status || ""
              ]);
  
              if (f.tipopago === "01") {
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
            f.fecha_emision.split("-").reverse().join("/"),
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
            <Button
              variant="outline-primary"
              size="sm"
              disabled={!selectedRFC || loadingFlujo}
              className="text-nowrap mb-1 mb-md-0"
              onClick={exportarFlujoEfectivo}
            >
              <TbFileExport className="me-1" />
              {loadingFlujo ? "Generando..." : "Flujo de efectivo"}
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
                    {(tipoCuenta === "empresarial" || tipoCuenta === "empleado") && 
                         <th>
                         {/*
                           El header se adapta al tipo de movimiento que se está mostrando.
                           Usamos el primer registro visible como referencia.
                         */}
                         {paginatedFacturas[0]?.movimiento === "Ingreso"
                           ? "Cliente"
                           : paginatedFacturas[0]?.movimiento === "Egreso"
                           ? "Proveedor"
                           : paginatedFacturas[0]?.movimiento === "Nomina"
                           ? "Empleado"
                           : "Contraparte"}
                       </th>
                    }
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
                        <td>{factura.fecha_emision.split("-").reverse().join("/")}</td>
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
            <Button
              variant={tipoExport === "CONCEPTOS" ? "info" : "outline-info"}
              onClick={() => setTipoExport("CONCEPTOS")}
            >
              Conceptos de facturas
            </Button>
          </div>
          {tipoExport === "CONCEPTOS" && (
            <p className="text-muted small mt-3 mb-0">
              Genera un Excel con cada factura del periodo y sus conceptos relacionados,
              y una segunda hoja con los conceptos agrupados.
            </p>
          )}
        </Modal.Body>
        <Modal.Footer className="justify-content-between">
          <Button variant="secondary" onClick={() => setShowExportModal(false)}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            disabled={loadingConceptos}
            onClick={() => {
              if (tipoExport === "CONCEPTOS") {
                exportConceptosFacturas();
              } else {
                handleExport(tipoExport);
              }
              setShowExportModal(false);
            }}
          >
            {loadingConceptos && tipoExport === "CONCEPTOS" ? "Generando..." : "Exportar"}
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
