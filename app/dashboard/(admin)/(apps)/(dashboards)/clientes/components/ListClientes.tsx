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
import { toast } from "sonner";
import * as XLSX from "xlsx";
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

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getSessionInfo();
        setSession(data);
        console.log("YO ", session);
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

  console.log(session);

  const isConsulta = session?.role === "consulta";

  
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
    toast.error("No se pudo guardar el cliente, ya existe o se alcanzo el limite del plan actual");
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

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      clientes.map(c => ({
        Nombre: c.nombre,
        RFC: c.rfc,
        CFDIs: c.cfdis,
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Clientes");
    XLSX.writeFile(wb, "Clientes.xlsx");
  };
    
  const exportPDF = () => {
    const doc = new jsPDF();
  
    const tableColumn = ["Nombre", "RFC", "CFDIs"];
    const tableRows = clientes.map(c => [c.nombre, c.rfc, c.cfdis]);
  
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
    });
  
    doc.save("Clientes.pdf");
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
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowModal(true)}
            >
              <TbUserPlus className="me-1" /> Registrar Cliente
            </Button>
          )}
        </div>
      </CardHeader>
      <CardBody>
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>RFC</th>
              <th>CFDIs</th>
              <th style={{ width: "120px" }} className="text-center">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {displayedClientes.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center text-muted">
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
