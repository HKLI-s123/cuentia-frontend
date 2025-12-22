import { apiFetch } from "@/app/services/apiClient";
import { API_URL } from "@/utils/env";
import { useState, useEffect } from "react";
import { Card, Button, Table, Form, Spinner } from "react-bootstrap";

interface ComprobantesClienteProps {
  userId: number | null;
}

interface Comprobante {
  id: number;
  Fecha?: string;
  Nombre_del_emisor_del_ticket?: string;
  rfc?: string;
  Numero_de_ticket?: string;
  Total?: number;
  Iva8?: number;
  Iva16?: number;
  createdAt?: string;
}

export const ComprobantesCliente = ({ userId }: ComprobantesClienteProps) => {
  const [comprobantes, setComprobantes] = useState<Comprobante[]>([]);
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

  const cargarComprobantes = async () => {
    setLoading(true);
    try {
      let url = "";
  
      url = `${API_URL}/comprobantes?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`;
      
      const res = await apiFetch(url);
      const data = await res?.json();

      console.log(data);

      // 👇 Aseguramos que siempre se asigne un array
      const comprobantesArray: Comprobante[] = Array.isArray(data)
        ? data
        : data?.comprobantes || [];

      setComprobantes(comprobantesArray);
    } catch (err) {
      console.error("Error al cargar comprobantes:", err);
      setComprobantes([]);
    } finally {
      setLoading(false);
    }
  };

  const exportarExcel = async () => {
    try {
      const res = await apiFetch(
        `${API_URL}/comprobantes/exportar?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`,
         {
         method: "GET",
         raw: true, // ⬅️ IMPORTANTE: para no hacer res.json() internamente
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
      a.download = `reporte_comprobantes_${fechaInicio}_a_${fechaFin}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error al exportar Excel:", err);
    }
  };

  useEffect(() => {
    if (userId) {
      cargarComprobantes();
    }
  }, [userId, fechaInicio, fechaFin]);

  return (
    <Card className="mt-4 shadow-sm">
      <Card.Header className="d-flex justify-content-between align-items-center">
        <h5 className="mb-0">Comprobantes Registrados</h5>
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
          <Button
            variant="outline-primary"
            size="sm"
            onClick={cargarComprobantes}
          >
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
            No hay comprobantes en el rango seleccionado.
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
                  <th>Fecha</th>
                  <th>Emisor</th>
                  <th>RFC</th>
                  <th>Número Ticket</th>
                  <th>Total</th>
                  <th>IVA 8%</th>
                  <th>IVA 16%</th>
                  <th>Fecha Registro</th>
                </tr>
              </thead>
              <tbody>
                {comprobantes.map((c) => (
                  <tr key={c.id}>
                    <td>{c.Fecha || "—"}</td>
                    <td>{c.Nombre_del_emisor_del_ticket || "—"}</td>
                    <td>{c.rfc || "—"}</td>
                    <td>{c.Numero_de_ticket || "—"}</td>
                    <td>${Number(c.Total || 0).toLocaleString()}</td>
                    <td>{c.Iva8 ?? "—"}</td>
                    <td>{c.Iva16 ?? "—"}</td>
                    <td>
                      {c.createdAt
                        ? new Date(c.createdAt).toLocaleString("es-MX")
                        : "—"}
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
