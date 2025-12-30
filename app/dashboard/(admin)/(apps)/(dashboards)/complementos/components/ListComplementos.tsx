// use client
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
  TbDotsVertical,
  TbFileExport,
  TbArrowDown,
  TbArrowUp,
} from "react-icons/tb";
import CardPagination from "@/components/cards/CardPagination";
import { getPagos } from "../../../../../../services/financeService"; // asegúrate de exportarlo
import { getSessionInfo } from "@/app/services/authService";
import { toast } from "sonner";
import { activateGuest, validateGuestKey } from "@/app/services/chatService";
import { useOnboardingRedirect } from "@/hooks/useUserSessionGuard";

type Pago = {
  id: number;
  uuid_complemento: string;
  fecha_emision: string;
  fecha_pago: string;
  rfc_emisor: string;
  nombre_emisor?: string;
  regimen_emisor?: string;
  rfc_receptor: string;
  nombre_receptor?: string;
  regimen_receptor?: string;
  forma_pago?: string;
  moneda_pago?: string;
  tipo_cambio_pago?: number;
  monto: number;
  rfc_cta_ordenante?: string;
  banco_ordenante?: string;
  cta_ordenante?: string;
  rfc_cta_beneficiario?: string;
  cta_beneficiario?: string;
  uuid_factura?: string;
  serie?: string;
  folio?: string;
  moneda_dr?: string;
  equivalencia_dr?: number;
  num_parcialidad?: number;
  imp_saldo_ant?: number;
  imp_pagado?: number;
  imp_saldo_insoluto?: number;
  objeto_imp_dr?: string;
  metodo_pago_dr?: string;
  fecha_factura?: string;
  forma_pago_factura?: string;
  condiciones_pago?: string;
  subtotal?: number;
  descuento?: number;
  moneda?: string;
  tipo_cambio?: number;
  total?: number;
  tipo_comprobante?: string; // 'E'|'I' etc.
  exportacion?: string;
  metodo_pago?: string;
  total_imp_trasladados?: number;
  total_imp_retenidos?: number;
  base_16?: number;
  tipo_factor_16?: string;
  tasa_cuota_16?: number;
  importe_trasladado_16?: number;
  impuesto_retenido?: string;
  importe_retenido?: number;
  base_8?: number;
  tipo_factor_8?: string;
  tasa_cuota_8?: number;
  importe_trasladado_8?: number;
  base_exento?: number;
  impuesto_exento?: string;
  tipo_exento?: string;
  status?: string; // estatus visual
};

const ListPagos = () => {
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedRFC, setSelectedRFC] = useState("");
  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [tipoCuenta, setTipoCuenta] = useState<"individual" | "empresarial" | "invitado" | "empleado" | null>(null);
  const [clientes, setClientes] = useState<{ rfc: string; nombre: string }[]>([]);
  const [searchCliente, setSearchCliente] = useState("");
  const itemsPerPage = 10;
  const [sortConfig, setSortConfig] = useState<{ key: keyof Pago; direction: "asc" | "desc" } | null>(null);
  const [invitePanelVisible, setInvitePanelVisible] = useState(false);
  const [guestKey, setGuestKey] = useState("");
  const [session, setSession] = useState<any>(null);

  const [visibleRows, setVisibleRows] = useState<Record<number, boolean>>({});

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

  // fetch pagos from service
  const fetchPagos = async () => {
    try {
      const params = {
        rfc: selectedRFC,
        startDate: fechaInicio || undefined,
        endDate: fechaFin || undefined,
      };
      const raw = await getPagos(params);
      // map to Pago[]
      const data: Pago[] = raw.map((p: any, idx: number) => ({
        id: idx + 1,
        uuid_complemento: p.uuid_complemento ?? p.uuid ?? "",
        fecha_emision: p.fecha_emision ?? p.fecha ?? "",
        fecha_pago: p.fecha_pago ?? p.fechaPago ?? "",
        rfc_emisor: p.rfc_emisor ?? "",
        nombre_emisor: p.nombre_emisor ?? p.razonsocialemisor ?? "",
        regimen_emisor: p.regimen_emisor ?? p.regimenemisor ?? "",
        rfc_receptor: p.rfc_receptor ?? "",
        nombre_receptor: p.nombre_receptor ?? p.razonsocialreceptor ?? "",
        regimen_receptor: p.regimen_receptor ?? p.regimenreceptor ?? "",
        forma_pago: p.forma_pago ?? p.formapago ?? "",
        moneda_pago: p.moneda_pago ?? p.moneda ?? "",
        tipo_cambio_pago: Number(p.tipo_cambio_pago ?? p.tipocambio ?? 1),
        monto: Number(p.monto ?? p.imp_pagado ?? p.total ?? 0),
        rfc_cta_ordenante: p.rfc_cta_ordenante ?? "",
        banco_ordenante: p.banco_ordenante ?? "",
        cta_ordenante: p.cta_ordenante ?? "",
        rfc_cta_beneficiario: p.rfc_cta_beneficiario ?? "",
        cta_beneficiario: p.cta_beneficiario ?? "",
        uuid_factura: p.uuid_factura ?? p.uuid_factura_rel ?? p.uuid_factura_relacion ?? null,
        serie: p.serie ?? "",
        folio: p.folio ?? "",
        moneda_dr: p.moneda_dr ?? "",
        equivalencia_dr: Number(p.equivalencia_dr ?? 1),
        num_parcialidad: Number(p.num_parcialidad ?? p.numparcialidad ?? 1),
        imp_saldo_ant: Number(p.imp_saldo_ant ?? p.imp_saldo_ant ?? 0),
        imp_pagado: Number(p.imp_pagado ?? p.imp_pagado ?? p.monto ?? 0),
        imp_saldo_insoluto: Number(p.imp_saldo_insoluto ?? 0),
        objeto_imp_dr: p.objeto_imp_dr ?? "",
        metodo_pago_dr: p.metodo_pago_dr ?? "",
        fecha_factura: p.fecha_factura ?? "",
        forma_pago_factura: p.forma_pago_factura ?? "",
        condiciones_pago: p.condiciones_pago ?? "",
        subtotal: Number(p.subtotal ?? 0),
        descuento: Number(p.descuento ?? 0),
        moneda: p.moneda ?? "",
        tipo_cambio: Number(p.tipo_cambio ?? p.tipocambio ?? 1),
        total: Number(p.total ?? p.monto ?? 0),
        tipo_comprobante: p.tipo_comprobante ?? p.tipocomprobante ?? "",
        exportacion: p.exportacion ?? "",
        metodo_pago: p.metodo_pago ?? p.metodopago ?? "",
        total_imp_trasladados: Number(p.total_imp_trasladados ?? p.total_imp_trasladado ?? p.total_imp_trasladados ?? 0),
        total_imp_retenidos: Number(p.total_imp_retenidos ?? p.total_retenidos ?? 0),
        base_16: Number(p.base_16 ?? p.base16 ?? 0),
        importe_trasladado_16: Number(p.importe_trasladado_16 ?? p.importe_trasladado_16 ?? p.importe_trasladado_16 ?? 0),
        tipo_factor_16: p.tipo_factor_16 ?? "",
        tasa_cuota_16: Number(p.tasa_cuota_16 ?? p.tasa_cuota_16 ?? 0),
        impuesto_retenido: p.impuesto_retenido ?? "",
        importe_retenido: Number(p.importe_retenido ?? 0),
        base_8: Number(p.base_8 ?? 0),
        importe_trasladado_8: Number(p.importe_trasladado_8 ?? 0),
        tipo_factor_8: p.tipo_factor_8 ?? "",
        tasa_cuota_8: Number(p.tasa_cuota_8 ?? 0),
        base_exento: Number(p.base_exento ?? 0),
        impuesto_exento: p.impuesto_exento ?? "",
        tipo_exento: p.tipo_exento ?? "",
        status: p.status ?? p.estatus ?? "",
      }));
      setPagos(data);
    } catch (error) {
      console.error("Error al cargar pagos:", error);
      setPagos([]);
    }
  };

  useEffect(() => {
    fetchPagos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRFC, fechaInicio, fechaFin]);

  // sorting
  const sortedPagos = [...pagos].sort((a, b) => {
    if (!sortConfig) return 0;
    const { key, direction } = sortConfig;
    let valueA: any = a[key];
    let valueB: any = b[key];

    if (key === "monto" || key === "total" || key === "imp_pagado") {
      valueA = Number(valueA);
      valueB = Number(valueB);
    }
    if (key === "fecha_pago" || key === "fecha_emision" || key === "fecha_factura") {
      valueA = new Date(valueA).getTime();
      valueB = new Date(valueB).getTime();
    }

    if (valueA < valueB) return direction === "asc" ? -1 : 1;
    if (valueA > valueB) return direction === "asc" ? 1 : -1;
    return 0;
  });

  // search filter
  const filteredPagos = sortedPagos.filter((p) => {
    const term = searchTerm.toLowerCase();
    return (
      (p.rfc_emisor || "").toLowerCase().includes(term) ||
      (p.rfc_receptor || "").toLowerCase().includes(term) ||
      (p.nombre_receptor || "").toLowerCase().includes(term) ||
      (p.nombre_emisor || "").toLowerCase().includes(term) ||
      (p.uuid_complemento || "").toLowerCase().includes(term)
    );
  });

  const toPesosPago = (p: Pago, valor: number | string | undefined): number => {
    const num =
      typeof valor === "number"
        ? valor
        : parseFloat((valor ?? "").toString().replace(/,/g, "")) || 0;
  
    const tcPago =
      typeof p.tipo_cambio_pago === "number"
        ? p.tipo_cambio_pago
        : parseFloat((p.tipo_cambio_pago ?? "").toString().replace(/,/g, "")) || 0;
  
    const tcFactura =
      typeof p.tipo_cambio === "number"
        ? p.tipo_cambio
        : parseFloat((p.tipo_cambio ?? "").toString().replace(/,/g, "")) || 0;
  
    if (p.moneda_pago && p.moneda_pago !== "MXN" && tcPago > 0) {
      return num * tcPago;
    }
  
    if (p.moneda && p.moneda !== "MXN" && tcFactura > 0) {
      return num * tcFactura;
    }
  
    return num;
  };

  // pagination
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPagos = filteredPagos.slice(startIndex, endIndex);

  const requestSort = (key: keyof Pago) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") direction = "desc";
    setSortConfig({ key, direction });
  };
  const renderSortIcon = (key: keyof Pago) => {
    if (!sortConfig || sortConfig.key !== key) return null;
    return sortConfig.direction === "asc" ? <TbArrowUp className="ms-1" /> : <TbArrowDown className="ms-1" />;
  };

  // helper safe number
  const safeNum = (v: any) => (typeof v === "number" ? v : parseFloat(`${v || 0}`) || 0);

  // export to Excel
  const exportToExcel = async () => {
    if (pagos.length === 0) return;
  
    const getNombreClientePorRfc = (rfc: string | undefined) => {
     if (!rfc) return "Cliente desconocido";
     const cliente = clientes.find(c => c.rfc === rfc);
     return cliente?.nombre || "Cliente desconocido";
    };
  
  
    const wb = new ExcelJS.Workbook();
    wb.creator = "CuentIA";
    wb.created = new Date();
  
    const MI_RFC = selectedRFC; // 👈 cambia esto a tu RFC
  
    // Agrupar pagos por mes
    const pagosPorMes: Record<string, Pago[]> = {};
    pagos.forEach((p) => {
      const mes = new Date(p.fecha_pago || p.fecha_emision).toLocaleString("es-MX", {
        month: "long",
        year: "numeric",
      });
      if (!pagosPorMes[mes]) pagosPorMes[mes] = [];
      pagosPorMes[mes].push(p);
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
  
    // Crear hojas por mes
    for (const [mes, pagosMes] of Object.entries(pagosPorMes)) {
      // Ordenar por UUID de factura
      pagosMes.sort((a, b) => (a.uuid_factura || "").localeCompare(b.uuid_factura || ""));
  
      const ws = wb.addWorksheet(mes);
  
      const headers = [
        "Fecha Emisión", "UUID Complemento", "UUID Factura", "RFC Emisor", "Nombre Emisor", "Régimen Emisor",
        "RFC Receptor", "Nombre Receptor", "Régimen Receptor", "Fecha Pago", "Forma Pago",
        "Moneda Pago", "Tipo Cambio Pago", "Monto", "RFC Emisor Cta Ord", "Banco Ordenante",
        "Cta Ordenante", "RFC Emisor Cta Ben", "Cta Beneficiario", "Serie",
        "Folio", "Moneda DR", "Equivalencia DR", "Num Parcialidad", "Imp Saldo Ant", "Imp Pagado",
        "Imp Saldo Insoluto", "Objeto Imp DR", "Metodo Pago DR", "Fecha Factura", "Forma Pago Factura",
        "Condiciones Pago", "Subtotal", "Descuento", "Moneda", "Tipo Cambio", "Total",
        "Tipo Comprobante", "Metodo Pago", "Total Imp Trasladados", "Total Imp Retenidos",
        "Base 16%", "Importe Trasladado 16%", "Tipo Factor 16", "Tasa Cuota 16", "Impuesto Retenido",
        "Base 8%", "Importe Trasladado 8%", "Tipo Factor 8", "Tasa Cuota 8", "Base Exento",
        "Impuesto Exento", "Tipo Exento",
      ];
  
      const nombreCliente = getNombreClientePorRfc(selectedRFC);
  
      // Fila 1: Título
      const lastCol = colLetter(headers.length);
      ws.mergeCells(`A1:${lastCol}1`);
      const titleCell = ws.getCell("A1");
      titleCell.value = `Pagos del mes de ${mes} - Cliente ${nombreCliente}`;
      titleCell.font = { bold: true, size: 16, color: { argb: "FFFFFFFF" } };
      titleCell.alignment = { horizontal: "center" };
      titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF004080" } };
  
      // Fila 2: Headers
      const headerRow = ws.addRow(headers);
      headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        cell.alignment = { horizontal: "center", vertical: "middle" };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF5F9EA0" } };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
  
      // Filas de datos
      pagosMes.forEach((p, i) => {
        const row = ws.addRow([
          p.fecha_emision, p.uuid_complemento, p.uuid_factura, p.rfc_emisor, p.nombre_emisor, p.regimen_emisor,
          p.rfc_receptor, p.nombre_receptor, p.regimen_receptor, p.fecha_pago, p.forma_pago,
          p.moneda_pago, p.tipo_cambio_pago, p.monto, p.rfc_cta_ordenante, p.banco_ordenante,
          p.cta_ordenante, p.rfc_cta_beneficiario, p.cta_beneficiario, p.serie,
          p.folio, p.moneda_dr, p.equivalencia_dr, p.num_parcialidad, p.imp_saldo_ant, p.imp_pagado,
          p.imp_saldo_insoluto, p.objeto_imp_dr, p.metodo_pago_dr, p.fecha_factura, p.forma_pago_factura,
          p.condiciones_pago, p.subtotal, p.descuento, p.moneda, p.tipo_cambio, p.total,
          p.tipo_comprobante, p.metodo_pago, p.total_imp_trasladados, p.total_imp_retenidos,
          p.base_16, p.importe_trasladado_16, p.tipo_factor_16, p.tasa_cuota_16, p.impuesto_retenido,
          p.base_8, p.importe_trasladado_8, p.tipo_factor_8, p.tasa_cuota_8, p.base_exento,
          p.impuesto_exento, p.tipo_exento,
        ]);
  
        // Estilo alternado + bordes
        row.eachCell((cell) => {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: i % 2 === 0 ? "FFFFFFFF" : "FFF7F7F7" },
          };
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
        });
  
        // Formato numérico
        row.eachCell((cell) => {
          if (typeof cell.value === "number") cell.numFmt = "$#,##0.00";
        });
      });
  
      // Ajustar ancho
      ws.columns.forEach((col) => (col.width = 18));
  
      // Calcular totales
      // 🔹 Calcular totales
      const totalIngresos = pagosMes
        .filter((p) => p.rfc_emisor === MI_RFC)
        .reduce((acc, p) => acc + toPesosPago(p, p.total), 0);
      
      const totalEgresos = pagosMes
        .filter((p) => p.rfc_receptor === MI_RFC)
        .reduce((acc, p) => acc + toPesosPago(p, p.total), 0);
      
      const totalMes = totalIngresos - totalEgresos;
  
  
      // TOTAL MES
      const totalRow = ws.addRow(Array(headers.length).fill(""));
      totalRow.getCell(36).value = "TOTAL UTILIDAD MES";
      totalRow.getCell(37).value = totalMes;
      totalRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2F4F4F" } };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
        if (typeof cell.value === "number") cell.numFmt = "$#,##0.00";
      });
  
      // TOTAL INGRESOS
      const ingresosRow = ws.addRow(Array(headers.length).fill(""));
      ingresosRow.getCell(36).value = "TOTAL INGRESOS POR PAGOS";
      ingresosRow.getCell(37).value = totalIngresos;
      ingresosRow.eachCell((cell) => {
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
  
      // TOTAL EGRESOS
      const egresosRow = ws.addRow(Array(headers.length).fill(""));
      egresosRow.getCell(36).value = "TOTAL EGRESOS POR PAGOS";
      egresosRow.getCell(37).value = totalEgresos;
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
    saveAs(new Blob([buffer]), "Reporte_Pagos_"+selectedRFC+".xlsx");
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
          <CardTitle as="h4" className="mb-0">Pagos</CardTitle>
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
              disabled={pagos.length === 0}
              className="text-nowrap mb-1 mb-md-0"
              onClick={exportToExcel}
            >
              <TbFileExport className="me-1" /> Reporte detallado
            </Button>
            {(tipoCuenta === "empresarial" || tipoCuenta === "empleado" ) && (
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
          {filteredPagos.length > 0 ? (
            <div className="table-responsive">
              <Table className="table-centered table-custom table-sm table-nowrap table-hover mb-0">
                <thead>
                  <tr>
                    {(tipoCuenta === "empresarial" || tipoCuenta === "empleado" ) && <th>UUID Complemento</th>}
                    <th onClick={() => requestSort("fecha_pago")} style={{ cursor: "pointer" }}>
                      Fecha Pago {renderSortIcon("fecha_pago")}
                    </th>
                    <th>RFC Emisor</th>
                    <th>RFC Receptor</th>
                    <th onClick={() => requestSort("monto")} style={{ cursor: "pointer" }}>
                      Monto {renderSortIcon("monto")}
                    </th>
                    <th>Moneda</th>
                    <th>CFDI Relacionado</th>
                    <th></th>
                  </tr>
                </thead>
                 <tbody>
                  {paginatedPagos.map((pago) => {
                    const isVisible = visibleRows[pago.id] ?? true; // por defecto visible
                    if (!isVisible) return null;
                
                    return (
                      <tr key={pago.id}>
                        {(tipoCuenta === "empresarial" || tipoCuenta === "empleado") && <td>{pago.uuid_complemento}</td>}
                        <td>{new Date(pago.fecha_pago).toLocaleDateString()}</td>
                        <td>{pago.rfc_emisor}</td>
                        <td>{pago.rfc_receptor}</td>
                        <td><strong>${safeNum(pago.monto).toLocaleString()}</strong></td>
                        <td>{pago.moneda_pago || pago.moneda}</td>
                        <td>{pago.uuid_factura}</td>
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
                                  setVisibleRows(prev => ({ ...prev, [pago.id]: false }));
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
              {selectedRFC ? "Sin datos de pagos" : "Seleccionar cliente"}
            </div>
          )}
        </CardBody>

        {filteredPagos.length > 0 && (
          <CardFooter className="border-0">
            <CardPagination
              totalItems={filteredPagos.length}
              itemsPerPage={itemsPerPage}
              currentPage={currentPage}
              itemsName="pagos"
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
    </Col>
  );
};

export default ListPagos;
