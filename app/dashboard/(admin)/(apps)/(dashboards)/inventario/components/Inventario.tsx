"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Form,
  ListGroup,
  Modal,
  Row,
  Spinner,
  Table,
} from "react-bootstrap";
import {
  TbBrandWhatsapp,
  TbBuildingWarehouse,
  TbCloudUpload,
  TbCopy,
  TbDownload,
  TbFileSpreadsheet,
  TbFileTypePdf,
  TbTrash,
  TbX,
} from "react-icons/tb";
import { toast } from "sonner";
import { getSessionInfo } from "@/app/services/authService";
import {
  INVENTARIO_ACCEPT,
  INVENTARIO_FEATURE,
  INVENTARIO_MAX_FILES,
  INVENTARIO_MAX_FILE_MB,
  InventarioArchivo,
  InventarioCliente,
  deleteInventarioArchivo,
  downloadInventarioArchivo,
  getInventarioArchivos,
  getInventarioClientes,
  uploadInventarioArchivos,
} from "@/app/services/inventarioService";

const ALLOWED_EXT = INVENTARIO_ACCEPT.split(",");

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" });
}

function FileIcon({ name }: { name: string }) {
  return name.toLowerCase().endsWith(".pdf") ? (
    <TbFileTypePdf className="text-danger fs-20" />
  ) : (
    <TbFileSpreadsheet className="text-success fs-20" />
  );
}

/** Valida extensión/tamaño/cantidad en el navegador (el API vuelve a validar). */
function validateFiles(files: File[]): string | null {
  if (files.length > INVENTARIO_MAX_FILES) {
    return `Puedes subir máximo ${INVENTARIO_MAX_FILES} archivos a la vez.`;
  }
  for (const f of files) {
    const ext = f.name.slice(f.name.lastIndexOf(".")).toLowerCase();
    if (!ALLOWED_EXT.includes(ext)) return `"${f.name}" no es PDF o Excel (.pdf, .xlsx, .xls).`;
    if (f.size > INVENTARIO_MAX_FILE_MB * 1024 * 1024) {
      return `"${f.name}" pesa más de ${INVENTARIO_MAX_FILE_MB} MB.`;
    }
  }
  return null;
}

export default function Inventario() {
  const [sessionLoading, setSessionLoading] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [canEdit, setCanEdit] = useState(false);

  const [clientes, setClientes] = useState<InventarioCliente[]>([]);
  const [clientesLoading, setClientesLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedRfc, setSelectedRfc] = useState<string | null>(null);

  const [archivos, setArchivos] = useState<InventarioArchivo[]>([]);
  const [archivosLoading, setArchivosLoading] = useState(false);

  const [pending, setPending] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const [toDelete, setToDelete] = useState<InventarioArchivo | null>(null);
  const [deleting, setDeleting] = useState(false);

  // 1) Sesión: ¿la cuenta tiene el módulo? ¿puede subir/borrar?
  useEffect(() => {
    (async () => {
      try {
        const session = await getSessionInfo();
        const features: string[] = Array.isArray(session.features) ? session.features : [];
        setEnabled(features.includes(INVENTARIO_FEATURE));
        // Colaboradores: solo los de rol admin pueden subir/borrar (igual que en Clientes).
        setCanEdit(session.tipoCuenta !== "empleado" || session.role === "admin");
      } catch (err) {
        console.error("Error cargando sesión:", err);
      } finally {
        setSessionLoading(false);
      }
    })();
  }, []);

  const loadClientes = useCallback(async () => {
    setClientesLoading(true);
    try {
      const data = await getInventarioClientes();
      setClientes(data);
      setSelectedRfc((prev) => prev ?? data[0]?.rfc ?? null);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setClientesLoading(false);
    }
  }, []);

  const loadArchivos = useCallback(async (rfc: string) => {
    setArchivosLoading(true);
    try {
      setArchivos(await getInventarioArchivos(rfc));
    } catch (err: any) {
      toast.error(err.message);
      setArchivos([]);
    } finally {
      setArchivosLoading(false);
    }
  }, []);

  useEffect(() => {
    if (enabled) loadClientes();
  }, [enabled, loadClientes]);

  useEffect(() => {
    setPending([]);
    if (selectedRfc) loadArchivos(selectedRfc);
    else setArchivos([]);
  }, [selectedRfc, loadArchivos]);

  const filteredClientes = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clientes;
    return clientes.filter(
      (c) => c.rfc.toLowerCase().includes(q) || (c.nombre || "").toLowerCase().includes(q)
    );
  }, [clientes, search]);

  const selectedCliente = clientes.find((c) => c.rfc === selectedRfc) ?? null;
  const botCommand = selectedRfc ? `Inventario - ${selectedRfc}` : "";

  const addFiles = (list: FileList | null) => {
    if (!list || list.length === 0) return;
    const next = [...pending, ...Array.from(list)];
    const error = validateFiles(next);
    if (error) {
      toast.error(error);
      return;
    }
    setPending(next);
  };

  const handleUpload = async () => {
    if (!selectedRfc || pending.length === 0) return;
    setUploading(true);
    try {
      const saved = await uploadInventarioArchivos(selectedRfc, pending);
      toast.success(
        saved.length === 1 ? "Archivo subido correctamente." : `${saved.length} archivos subidos correctamente.`
      );
      setPending([]);
      if (inputRef.current) inputRef.current.value = "";
      await Promise.all([loadArchivos(selectedRfc), loadClientes()]);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!toDelete || !selectedRfc) return;
    setDeleting(true);
    try {
      await deleteInventarioArchivo(toDelete.id);
      toast.success("Archivo eliminado.");
      setToDelete(null);
      await Promise.all([loadArchivos(selectedRfc), loadClientes()]);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleDownload = async (archivo: InventarioArchivo) => {
    try {
      await downloadInventarioArchivo(archivo);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const copyCommand = async () => {
    try {
      await navigator.clipboard.writeText(botCommand);
      toast.success("Comando copiado.");
    } catch {
      toast.error("No se pudo copiar.");
    }
  };

  // ---------------------------------------------------------------------------

  if (sessionLoading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" />
      </div>
    );
  }

  if (!enabled) {
    return (
      <Alert variant="warning" className="mt-3">
        Este módulo no está habilitado para tu cuenta.
      </Alert>
    );
  }

  return (
    <>
      <Card className="shadow-sm mb-3">
        <Card.Body className="d-flex flex-wrap align-items-center gap-3">
          <div className="avatar-md bg-primary-subtle text-primary rounded d-flex align-items-center justify-content-center p-2">
            <TbBuildingWarehouse className="fs-24" />
          </div>
          <div className="flex-grow-1">
            <h4 className="mb-1">Inventario</h4>
            <p className="text-muted mb-0">
              Sube archivos Excel o PDF por RFC. Se envían automáticamente por WhatsApp cuando se
              escribe al bot <strong>Inventario - RFC</strong>.
            </p>
          </div>
        </Card.Body>
      </Card>

      <Row className="g-3">
        {/* RFCs */}
        <Col lg={4}>
          <Card className="shadow-sm h-100">
            <Card.Header>
              <h5 className="mb-2">RFCs</h5>
              <Form.Control
                size="sm"
                placeholder="Buscar por nombre o RFC"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </Card.Header>
            <Card.Body className="p-0" style={{ maxHeight: 520, overflowY: "auto" }}>
              {clientesLoading && clientes.length === 0 ? (
                <div className="text-center my-4">
                  <Spinner animation="border" size="sm" />
                </div>
              ) : filteredClientes.length === 0 ? (
                <p className="text-muted text-center my-4 px-3">
                  {clientes.length === 0 ? "No tienes clientes registrados." : "Sin resultados."}
                </p>
              ) : (
                <ListGroup variant="flush">
                  {filteredClientes.map((c) => (
                    <ListGroup.Item
                      key={c.rfc}
                      action
                      active={c.rfc === selectedRfc}
                      onClick={() => setSelectedRfc(c.rfc)}
                      className="d-flex justify-content-between align-items-center gap-2"
                    >
                      <div className="text-truncate">
                        <div className="fw-semibold text-truncate">{c.nombre || c.rfc}</div>
                        <small className={c.rfc === selectedRfc ? "" : "text-muted"}>{c.rfc}</small>
                      </div>
                      <Badge bg={c.archivos > 0 ? "success" : "secondary"} pill>
                        {c.archivos}
                      </Badge>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Archivos del RFC seleccionado */}
        <Col lg={8}>
          <Card className="shadow-sm h-100">
            {!selectedCliente ? (
              <Card.Body>
                <p className="text-muted text-center my-4">Selecciona un RFC.</p>
              </Card.Body>
            ) : (
              <>
                <Card.Header className="d-flex flex-wrap justify-content-between align-items-center gap-2">
                  <div>
                    <h5 className="mb-0">{selectedCliente.nombre || selectedCliente.rfc}</h5>
                    <small className="text-muted">{selectedCliente.rfc}</small>
                  </div>
                  <Button variant="outline-success" size="sm" onClick={copyCommand}>
                    <TbBrandWhatsapp className="me-1" />
                    <code className="text-success">{botCommand}</code>
                    <TbCopy className="ms-1" />
                  </Button>
                </Card.Header>

                <Card.Body>
                  {canEdit && (
                    <div className="mb-4">
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => inputRef.current?.click()}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setDragOver(true);
                        }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setDragOver(false);
                          addFiles(e.dataTransfer.files);
                        }}
                        className={`border border-2 border-dashed rounded p-4 text-center ${
                          dragOver ? "border-primary bg-primary-subtle" : ""
                        }`}
                        style={{ cursor: "pointer", borderStyle: "dashed" }}
                      >
                        <TbCloudUpload className="fs-32 text-primary mb-2" />
                        <p className="mb-1 fw-semibold">Arrastra tus archivos o haz clic para elegirlos</p>
                        <small className="text-muted">
                          PDF, XLSX o XLS · máx. {INVENTARIO_MAX_FILE_MB} MB por archivo ·{" "}
                          {INVENTARIO_MAX_FILES} archivos por carga
                        </small>
                        <input
                          ref={inputRef}
                          type="file"
                          multiple
                          accept={INVENTARIO_ACCEPT}
                          className="d-none"
                          onChange={(e) => {
                            addFiles(e.target.files);
                            e.target.value = "";
                          }}
                        />
                      </div>

                      {pending.length > 0 && (
                        <div className="mt-3">
                          <ListGroup className="mb-2">
                            {pending.map((f, i) => (
                              <ListGroup.Item
                                key={`${f.name}-${i}`}
                                className="d-flex align-items-center gap-2"
                              >
                                <FileIcon name={f.name} />
                                <span className="flex-grow-1 text-truncate">{f.name}</span>
                                <small className="text-muted">{formatBytes(f.size)}</small>
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="text-danger p-0"
                                  aria-label={`Quitar ${f.name}`}
                                  disabled={uploading}
                                  onClick={() => setPending((prev) => prev.filter((_, j) => j !== i))}
                                >
                                  <TbX />
                                </Button>
                              </ListGroup.Item>
                            ))}
                          </ListGroup>
                          <div className="d-flex justify-content-end gap-2">
                            <Button
                              variant="light"
                              size="sm"
                              disabled={uploading}
                              onClick={() => setPending([])}
                            >
                              Cancelar
                            </Button>
                            <Button size="sm" disabled={uploading} onClick={handleUpload}>
                              {uploading ? (
                                <>
                                  <Spinner animation="border" size="sm" className="me-1" /> Subiendo...
                                </>
                              ) : (
                                `Subir ${pending.length} archivo${pending.length === 1 ? "" : "s"}`
                              )}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <h6 className="text-uppercase text-muted fs-12 mb-2">Archivos cargados</h6>
                  {archivosLoading ? (
                    <div className="text-center my-4">
                      <Spinner animation="border" size="sm" />
                    </div>
                  ) : archivos.length === 0 ? (
                    <p className="text-muted text-center my-4">
                      Este RFC aún no tiene archivos de inventario.
                    </p>
                  ) : (
                    <div className="table-responsive">
                      <Table hover size="sm" className="align-middle mb-0">
                        <thead className="table-light">
                          <tr>
                            <th>Archivo</th>
                            <th>Subido</th>
                            <th className="text-end">Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {archivos.map((a) => (
                            <tr key={a.id}>
                              <td style={{ maxWidth: 0, width: "60%" }}>
                                <div className="d-flex align-items-center gap-2">
                                  <FileIcon name={a.originalName} />
                                  <div className="text-truncate" title={a.originalName}>
                                    <div className="text-truncate">{a.originalName}</div>
                                    <small className="text-muted">{formatBytes(a.sizeBytes)}</small>
                                  </div>
                                </div>
                              </td>
                              <td className="text-nowrap">
                                <small>{formatDate(a.createdAt)}</small>
                              </td>
                              <td className="text-end text-nowrap">
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="p-1"
                                  title="Descargar"
                                  aria-label={`Descargar ${a.originalName}`}
                                  onClick={() => handleDownload(a)}
                                >
                                  <TbDownload className="fs-18" />
                                </Button>
                                {canEdit && (
                                  <Button
                                    variant="link"
                                    size="sm"
                                    className="p-1 text-danger"
                                    title="Eliminar"
                                    aria-label={`Eliminar ${a.originalName}`}
                                    onClick={() => setToDelete(a)}
                                  >
                                    <TbTrash className="fs-18" />
                                  </Button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  )}
                </Card.Body>
              </>
            )}
          </Card>
        </Col>
      </Row>

      <Modal show={!!toDelete} onHide={() => !deleting && setToDelete(null)} centered>
        <Modal.Header closeButton={!deleting}>
          <Modal.Title as="h5">Eliminar archivo</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          ¿Eliminar <strong>{toDelete?.originalName}</strong>? Ya no se enviará por WhatsApp y no
          se puede deshacer.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" disabled={deleting} onClick={() => setToDelete(null)}>
            Cancelar
          </Button>
          <Button variant="danger" disabled={deleting} onClick={handleDelete}>
            {deleting ? <Spinner animation="border" size="sm" /> : "Eliminar"}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
