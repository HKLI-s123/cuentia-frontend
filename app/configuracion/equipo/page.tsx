"use client";

import { useEffect, useState } from "react";
import { getSessionInfo } from "@/app/services/authService";
import {
  listEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  listEmployeeRfcs,
  saveEmployeeRfcAssignments,
} from "../../services/employeeService";
import { toast } from "sonner";
import { getClientes } from "@/app/services/clientsService";
import { MoreVertical } from "lucide-react";

type EmployeeRfcEntry = {
  id: number;
  rfc: string;
  employeeId: number;
  ownerId: number;
  createdAt: string;
};

// Tipos de comprobante que se pueden limitar por colaborador
const TIPOS_CFDI = [
  { value: "I", label: "Ingreso" },
  { value: "E", label: "Egreso" },
  { value: "N", label: "Nómina" },
  { value: "P", label: "Pagos" },
];
const TODOS_TIPOS_CFDI = TIPOS_CFDI.map((t) => t.value);

// null en BD = sin restricción
function tiposCfdiLabel(tipos: string[] | null) {
  if (!tipos) return "Todos";
  return TIPOS_CFDI.filter((t) => tipos.includes(t.value))
    .map((t) => t.label)
    .join(", ");
}

export default function EmployeePage() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [ownerRfcs, setOwnerRfcs] = useState<any[]>([]);
  const [selectedRfcList, setSelectedRfcList] = useState<string[]>([]);
  const [search, setSearch] = useState("");

  // Empleados
  const [employees, setEmployees] = useState<any[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);

  // Modal empleado
  const [showModal, setShowModal] = useState(false);

  // Modal RFCs
  const [showRfcModal, setShowRfcModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [openMenu, setOpenMenu] = useState<number | null>(null);
  const toggleMenu = (id: number) =>
  setOpenMenu(openMenu === id ? null : id);

  // Empleado en edición
  const [editing, setEditing] = useState<any>(null);

  // Form empleado
  const [form, setForm] = useState({
    email: "",
    nombre: "",
    role: "consulta",
    password: "",
    allowedCfdiTypes: TODOS_TIPOS_CFDI,
  });

  // ==========================================
  // Cargar sesión y empleados
  // ==========================================
  useEffect(() => {
    const load = async () => {
      try {
        const s = await getSessionInfo();
        setSession(s);

        if (s?.tipoCuenta === "empresarial") {
          await loadEmployees();
        }
      } catch {
        toast.error("No se pudo cargar la información de la cuenta");
        window.location.href = "/login";
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const loadEmployees = async () => {
    setLoadingEmployees(true);
    try {
      const data = await listEmployees();
      setEmployees(data || []);
    } catch {
      toast.error("Error cargando el equipo");
    } finally {
      setLoadingEmployees(false);
    }
  };

  // ==========================================
  // Modal crear
  // ==========================================
  const openCreate = () => {
    setEditing(null);
    setForm({
      email: "",
      nombre: "",
      role: "consulta",
      password: "",
      allowedCfdiTypes: TODOS_TIPOS_CFDI,
    });
    setShowModal(true);
  };

  const openEdit = (emp: any) => {
    setEditing(emp);
    setForm({
      email: emp.email,
      nombre: emp.nombre,
      role: emp.role,
      password: "",
      allowedCfdiTypes: emp.allowedCfdiTypes ?? TODOS_TIPOS_CFDI,
    });
    setShowModal(true);
  };

  function toggleTipoCfdi(tipo: string) {
    setForm((f) => ({
      ...f,
      allowedCfdiTypes: f.allowedCfdiTypes.includes(tipo)
        ? f.allowedCfdiTypes.filter((t) => t !== tipo)
        : [...f.allowedCfdiTypes, tipo],
    }));
  }

  // ==========================================
  // VALIDACIONES
  // ==========================================
  function validateForm() {
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      toast.error("Correo inválido");
      return false;
    }

    if (!form.nombre || form.nombre.length < 3) {
      toast.error("El nombre debe tener al menos 3 letras");
      return false;
    }

    // crear → password obligatorio
    if (!editing && (!form.password || form.password.length < 8)) {
      toast.error("La contraseña debe tener al menos 8 caracteres");
      return false;
    }

    // editar → si password enviado debe ser >= 8
    if (editing && form.password && form.password.length < 8) {
      toast.error("La nueva contraseña es muy corta");
      return false;
    }

    if (form.allowedCfdiTypes.length === 0) {
      toast.error("Selecciona al menos un tipo de CFDI");
      return false;
    }

    return true;
  }

  // ==========================================
  // Guardar empleado
  // ==========================================
  const handleSave = async () => {
    const { password, ...rest } = form;
    const body = {
      ...rest,
      // El API valida longitud mínima: al editar sin cambiarla no se envía
      ...(password ? { password } : {}),
      // Todos marcados = sin restricción
      allowedCfdiTypes:
        form.allowedCfdiTypes.length === TODOS_TIPOS_CFDI.length
          ? null
          : form.allowedCfdiTypes,
    };

    try {
      if (editing) {
        await updateEmployee(editing.id, body);
        toast.success("Empleado actualizado");
      } else {
        await createEmployee(body);
        toast.success("Empleado creado");
      }

      setShowModal(false);
      await loadEmployees();
    } catch {
      toast.error("Error guardando empleado");
    }
  };

  // ==========================================
  // Eliminar empleado
  // ==========================================
  function handleDelete(id: number) {
    toast.warning("¿Eliminar este usuario?", {
      description: "Esta acción no se puede deshacer.",
      action: {
        label: "Eliminar",
        onClick: async () => {
          try {
            await deleteEmployee(id);
            toast.success("Empleado eliminado");
            loadEmployees();
          } catch {
            toast.error("Error al eliminar");
          }
        },
      },
    });
  }

  function toggleRfc(rfc: string) {
    if (selectedRfcList.includes(rfc)) {
      setSelectedRfcList(selectedRfcList.filter((x) => x !== rfc));
    } else {
      setSelectedRfcList([...selectedRfcList, rfc]);
    }
  }

  const filteredRfcs = ownerRfcs.filter(r => {
  const txt = search.toLowerCase();
    return (
      r.rfc.toLowerCase().includes(txt) ||
      r.nombre.toLowerCase().includes(txt)
    );
  });

  // ==========================================
  // RFCs → abrir modal
  // ==========================================
  async function openRfcManager(employee: any) {
    setSelectedEmployee(employee);
    setShowRfcModal(true);
  
    // Obtener todos los RFCs del dueño
    const availableRfcs = await getClientes();
    setOwnerRfcs(availableRfcs);
  
    // RFCs ya asignados
    const assigned = await listEmployeeRfcs(employee.id);
    setSelectedRfcList(assigned.map((a: EmployeeRfcEntry) => a.rfc));
  }

  async function saveRfcAssignments() {
    try {
      await saveEmployeeRfcAssignments(selectedEmployee.id, selectedRfcList);
      toast.success("Asignaciones guardadas");
      setShowRfcModal(false);
    } catch {
      toast.error("Error guardando RFCs");
    }
  }


  // ==========================================
  // UI
  // ==========================================
  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh] text-gray-600">
        Cargando...
      </div>
    );
  }

  if (session?.tipoCuenta !== "empresarial") {
    return (
      <div className="text-center mt-20 text-gray-600">
        Esta sección solo está disponible para cuentas empresariales.
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto mt-10 p-6 bg-white shadow rounded-2xl border">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Equipo y Roles</h1>

      <button
        onClick={openCreate}
        className="mb-6 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
      >
        + Invitar usuario
      </button>

      <div className="border rounded-xl p-4 bg-gray-50">
        {loadingEmployees ? (
          <div className="text-gray-600 text-center p-10">Cargando...</div>
        ) : employees.length === 0 ? (
          <div className="text-center text-gray-500 py-6">
            No tienes empleados registrados.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600 border-b">
                <th className="py-2">Nombre</th>
                <th>Email</th>
                <th>Rol</th>
                <th>CFDIs</th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((e) => (
                <tr key={e.id} className="border-b last:border-none">
                  <td className="py-2">{e.nombre}</td>
                  <td>{e.email}</td>
                  <td className="capitalize">{e.role}</td>
                  <td>{tiposCfdiLabel(e.allowedCfdiTypes)}</td>
                    <td className="text-right py-2 relative">
                    <button
                      onClick={() => toggleMenu(e.id)}
                      className="p-1 rounded hover:bg-gray-200"
                    >
                      <MoreVertical size={20} className="text-gray-700" />
                    </button>      
                      {openMenu === e.id && (
                        <div className="absolute right-0 mt-2 w-32 bg-white border rounded-md shadow-lg text-sm">
                          <button 
                            onClick={() => openEdit(e)} 
                            className="block w-full text-left px-3 py-2 hover:bg-gray-100 text-gray-700"
                          >
                            Editar
                          </button>
                          <button 
                            onClick={() => openRfcManager(e)} 
                            className="block w-full text-left px-3 py-2 hover:bg-gray-100 text-gray-700"
                          >
                            RFCs
                          </button>
                          <button 
                            onClick={() => handleDelete(e.id)} 
                            className="block w-full text-left px-3 py-2 hover:bg-gray-100 text-red-600"
                          >
                            Eliminar
                          </button>
                        </div>
                      )}
                    </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {/* ======================= */}
      {/* MODAL → CREAR / EDITAR */}
      {/* ======================= */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-[999]">
          <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              {editing ? "Editar usuario" : "Crear usuario"}
            </h2>

            <div className="space-y-4">
              <input
                className="w-full border p-2 rounded"
                placeholder="Correo"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                disabled={!!editing}
              />

              <input
                className="w-full border p-2 rounded"
                placeholder="Nombre"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              />

              <select
                className="w-full border p-2 rounded"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                <option value="admin">Administrador</option>
                <option value="consulta">Solo lectura</option>
              </select>

              <input
                type="password"
                className="w-full border p-2 rounded"
                placeholder="Contraseña (opcional)"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />

              {/* TIPOS DE CFDI */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Tipos de CFDI que puede ver
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {TIPOS_CFDI.map((t) => (
                    <label
                      key={t.value}
                      className="flex items-center gap-2 border rounded p-2 cursor-pointer text-sm text-gray-700"
                    >
                      <input
                        type="checkbox"
                        className="w-4 h-4"
                        checked={form.allowedCfdiTypes.includes(t.value)}
                        onChange={() => toggleTipoCfdi(t.value)}
                      />
                      {t.label}
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Con todos marcados no tiene restricción por tipo.
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-gray-200 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (!validateForm()) return;
                  handleSave();
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ======================= */}
      {/* MODAL → RFC MANAGER */}
      {/* ======================= */}
      {showRfcModal && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-[999]">
          <div className="bg-white p-6 rounded-xl w-full max-w-md shadow-xl">
            
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              RFCs de {selectedEmployee?.nombre}
            </h2>
      
            {/* BUSCADOR */}
            <input
              className="w-full border p-2 rounded mb-4"
              placeholder="Buscar por nombre o RFC"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
             {/* LISTA SCROLLEABLE */}
             <div className="border rounded-lg p-3 bg-gray-50 max-h-64 overflow-y-auto">
               {filteredRfcs.length === 0 ? (
                 <p className="text-gray-500 text-sm">No se encontraron RFCs.</p>
               ) : (
                 filteredRfcs.map((item) => (
                   <label
                     key={item.id || item.rfc}
                     className="flex items-center justify-between py-2 px-1 border-b last:border-none cursor-pointer"
                   >
                     {/* Nombre + RFC alineados */}
                     <div className="flex flex-col">
                       <span className="font-medium text-gray-800">{item.nombre}</span>
                       <span className="text-gray-600 text-xs">{item.rfc}</span>
                     </div>
             
                     {/* Checkbox */}
                     <input
                       type="checkbox"
                       className="w-4 h-4"
                       checked={selectedRfcList.includes(item.rfc)}
                       onChange={() => toggleRfc(item.rfc)}
                     />
                   </label>
                 ))
               )}
             </div>      
            {/* BOTONES */}
            <div className="flex justify-end mt-6 gap-2">
              <button
                onClick={() => setShowRfcModal(false)}
                className="px-4 py-2 bg-gray-200 rounded-lg"
              >
                Cancelar
              </button>
      
              <button
                onClick={saveRfcAssignments}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg"
              >
                Guardar cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
