import { apiFetch } from "@/app/services/apiClient";
import { API_URL } from "@/utils/env";
import { useState, useEffect } from "react";
import { Card, Button, Table, Form, Spinner } from "react-bootstrap";

interface ComprobantesDigitalesClienteProps {
  userId: number | null;
}

interface ComprobanteDigital {
  id: number;
  createdAt?: string;
  nombre_remitente?: string;
  telefono_remitente?: string;
  banco_emisor: string;
  banco_receptor: string;
  fecha_operacion?: string;
  monto?: number;
  folio_interno?: string;
  titular_receptor?: string;
  referencia?: string;
  claveRastreo?: string;
  tipo_movimiento?: string;
}

export const ComprobantesDigitalesList = ({
  userId,
}: ComprobantesDigitalesClienteProps) => {
  const [comprobantes, setComprobantes] = useState<ComprobanteDigital[]>([]);
  const [loading, setLoading] = useState(false);
  const [fechaInicio, setFechaInicio] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split("T")[0];
  });
  const [fechaFin, setFechaFin] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0)
      .toISOString()
      .split("T")[0];
  });

  const handleChangeTipoMovimiento = async (
    id: number,
    value: 'ingreso' | 'egreso' | ''
  ): Promise<void> => {
    try {
      await apiFetch(`${API_URL}/comprobantes-digitales/${id}/tipo-movimiento`, {
        method: 'PATCH',
        body: JSON.stringify({ tipo_movimiento: value }),
      });
  
      // Actualiza el estado localmente para reflejar el cambio
      setComprobantes((prev) =>
        prev.map((c) =>
          c.id === id ? { ...c, tipo_movimiento: value } : c
        )
      );
    } catch (err) {
      console.error('Error al actualizar tipo de movimiento:', err);
    }
  };

  const cargarComprobantes = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await apiFetch(
        `${API_URL}/comprobantes-digitales?userId=${userId}&fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`
      );
      const data = await res?.json();

      const comprobantesArray: ComprobanteDigital[] = Array.isArray(data)
        ? data
        : data?.comprobantes || [];

      setComprobantes(comprobantesArray);
    } catch (err) {
      console.error("Error al cargar comprobantes digitales:", err);
      setComprobantes([]);
    } finally {
      setLoading(false);
    }
  };

  const exportarExcel = async () => {
    try {
      const res = await apiFetch(
        `${API_URL}/comprobantes-digitales/exportar?userId=${userId}&fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`,
        {
         method: "GET",
         raw: true, // ⬅️ IMPORTANTE: para no hacer res.json() internamente
         formData: true,  // ⬅️ Previene Content-Type JSON
        }
      );

      if (!res) {
       throw new Error("No se recibió respuesta del servidor");
      }

      const blob = await res.blob();

      if (!blob) {
       throw new Error("No se pudo generar el archivo");
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `reporte_comprobantes_digitales_${fechaInicio}_a_${fechaFin}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error al exportar comprobantes digitales:", err);
    }
  };

  useEffect(() => {
    cargarComprobantes();
  }, [userId, fechaInicio, fechaFin]);

  return (
    <Card className="mt-4 shadow-sm">
      <Card.Header className="d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Comprobantes Digitales</h5>
        <div className="d-flex gap-2 flex-wrap">
          <Form.Control
            type="date"
            size="sm"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
            style={{ width: "160px" }}
          />
          <Form.Control
            type="date"
            size="sm"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
            style={{ width: "160px" }}
          />
          <Button variant="outline-primary" size="sm" onClick={cargarComprobantes}>
            Recargar
          </Button>
          <Button variant="success" size="sm" onClick={exportarExcel}>
            Exportar Excel
          </Button>
        </div>
      </Card.Header>

      <Card.Body>
        {loading ? (
          <div className="text-center my-4">
            <Spinner animation="border" /> <p>Cargando comprobantes...</p>
          </div>
        ) : comprobantes.length === 0 ? (
          <p className="text-muted text-center my-3">
            No hay comprobantes digitales en el rango seleccionado.
          </p>
        ) : (
          <div
            className="table-responsive"
            style={{
              maxHeight: "500px",     // 🔵 limite vertical
              overflowY: "auto",       // 🔵 scroll vertical
              overflowX: "auto",       // 🔵 scroll horizontal
            }}
          >
            <Table striped bordered hover size="sm">
              <thead className="table-light">
                <tr>
                  <th>Fecha Recibido</th>
                  <th>Nombre Remitente</th>
                  <th>Teléfono</th>
                  <th>Banco emisor</th>
                  <th>Banco receptor</th>
                  <th>Fecha Pago</th>
                  <th>Monto</th>
                  <th>Beneficiario</th>
                  <th>Clasificacion</th>
                </tr>
              </thead>
          
              <tbody>
                {comprobantes.map((c) => (
                  <tr key={c.id}>
                    <td>{c.createdAt ? new Date(c.createdAt).toLocaleString("es-MX") : "—"}</td>
                    <td>{c.nombre_remitente || "—"}</td>
                    <td>{c.telefono_remitente || "—"}</td>
                    <td>{c.banco_emisor || "—"}</td>
                    <td>{c.banco_receptor || "—"}</td>
                    <td>{c.fecha_operacion || "—"}</td>
                    <td>${Number(c.monto || 0).toLocaleString()}</td>
                    <td>{c.titular_receptor || "—"}</td>
          
                    <td>
                      <select
                        value={c.tipo_movimiento || ""}
                        onChange={(e) =>
                          handleChangeTipoMovimiento(
                            c.id,
                            e.target.value as "" | "ingreso" | "egreso"
                          )
                        }
                        className="border rounded px-2 py-1 text-sm bg-white text-black"
                      >
                        <option value="">Seleccionar</option>
                        <option value="ingreso">Ingreso</option>
                        <option value="egreso">Egreso</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};
