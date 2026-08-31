import { useState, useEffect } from "react";
import { Button, Modal, Form, InputGroup } from "react-bootstrap";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

import { extractRFCfromCer } from "@/app/services/onboardingService";

type ClienteFormProps = {
  show: boolean;
  onHide: () => void;
  onSave: (data: ClienteFormData) => void;
  initialData?: ClienteFormData & { key_url?: string; cer_url?: string };
};

export type ClienteFormData = {
  nombre: string;
  rfc: string;
  fiel: string;
  key_path?: File | null;
  cer_path?: File | null;
  descargarXmls?: boolean;
};

export const ClienteModal = ({ show, onHide, onSave, initialData }: ClienteFormProps) => {
  const isEditing = !!initialData;

  const [formData, setFormData] = useState<ClienteFormData>({
    nombre: "",
    rfc: "",
    fiel: "",
    key_path: undefined,
    cer_path: undefined,
    descargarXmls: true, // activa por defecto
  });

  const [showPassword, setShowPassword] = useState(false);
  // Cuando el RFC se rellena solo desde el .cer lo marcamos, para avisar al
  // usuario que puede corregirlo. En edición respetamos el RFC existente.
  const [rfcAutoDetected, setRfcAutoDetected] = useState(false);

  // 🔹 Sincroniza formData cuando initialData cambia
  useEffect(() => {
    setShowPassword(false);
    setRfcAutoDetected(false);
    if (initialData) {
      setFormData({
        nombre: initialData.nombre || "",
        rfc: initialData.rfc || "",
        fiel: initialData.fiel || "",
        key_path: undefined,
        cer_path: undefined,
        descargarXmls: initialData.descargarXmls ?? true,
      });
    } else {
      // Alta nueva: reiniciamos con la descarga de XMLs activa por defecto.
      setFormData({
        nombre: "",
        rfc: "",
        fiel: "",
        key_path: undefined,
        cer_path: undefined,
        descargarXmls: true,
      });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "rfc" ? value.toUpperCase() : value,
    }));
    if (name === "rfc") setRfcAutoDetected(false);
  };

  // Al elegir el .cer intentamos leer el RFC del certificado (OID 2.5.4.45) y
  // rellenamos el campo automáticamente. El usuario siempre puede editarlo.
  const handleCerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setFormData((prev) => ({ ...prev, cer_path: file }));
    if (!file) return;

    try {
      const raw = await extractRFCfromCer(file);
      // Personas morales: el OID puede traer "RFC_empresa / RFC_representante".
      // Nos quedamos con el primer RFC con formato válido.
      const match = raw
        ?.toUpperCase()
        .match(/[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}/);
      if (match) {
        setFormData((prev) => ({ ...prev, rfc: match[0] }));
        setRfcAutoDetected(true);
      } else {
        toast.warning("No se pudo leer el RFC del .cer; escríbelo manualmente.");
      }
    } catch {
      toast.warning("No se pudo leer el RFC del .cer; escríbelo manualmente.");
    }
  };

  const handleKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setFormData((prev) => ({ ...prev, key_path: file }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onHide();
  };

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>{initialData ? "Editar Cliente" : "Registrar Cliente"}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Nombre</Form.Label>
            <Form.Control
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              required
            />
          </Form.Group>

          {/* Archivos primero: al subir el .cer, el RFC se autocompleta abajo */}
          <Form.Group className="mb-3">
            <Form.Label>Archivo .cer</Form.Label>
            {initialData?.cer_url && (
              <div className="mb-2">
                <a href={initialData.cer_url} target="_blank" rel="noopener noreferrer">
                  Descargar .cer actual
                </a>
              </div>
            )}
            <Form.Control type="file" accept=".cer" name="cer_path" onChange={handleCerChange} />
            <Form.Text className="text-muted">
              Selecciona el certificado (.cer) de la e.firma. El RFC se detecta solo.
            </Form.Text>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Archivo .key</Form.Label>
            {initialData?.key_url && (
              <div className="mb-2">
                <a href={initialData.key_url} target="_blank" rel="noopener noreferrer">
                  Descargar .key actual
                </a>
              </div>
            )}
            <Form.Control type="file" accept=".key" name="key_path" onChange={handleKeyChange} />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>RFC</Form.Label>
            <Form.Control
              type="text"
              name="rfc"
              value={formData.rfc}
              onChange={handleChange}
              autoComplete="off"
              required
            />
            {rfcAutoDetected && (
              <Form.Text className="text-success">
                RFC detectado del certificado. Puedes corregirlo si es necesario.
              </Form.Text>
            )}
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Contraseña de la FIEL</Form.Label>
            <InputGroup>
              <Form.Control
                type={showPassword ? "text" : "password"}
                name="fiel"
                value={formData.fiel}
                onChange={handleChange}
                autoComplete="off"
                placeholder="Contraseña de la llave privada"
              />
              <Button
                variant="outline-secondary"
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </Button>
            </InputGroup>
          </Form.Group>

          {/* Descarga de XMLs/CFDIs — solo al registrar */}
          {!isEditing && (
            <Form.Group className="mb-3 p-3 rounded border bg-light">
              <Form.Check
                type="checkbox"
                id="descargarXmls"
                name="descargarXmls"
                label="Descargar XMLs (facturas) para este cliente"
                checked={formData.descargarXmls ?? true}
                onChange={(e) =>
                  setFormData({ ...formData, descargarXmls: e.target.checked })
                }
              />
              <Form.Text className="text-muted d-block mt-1">
                Activo por defecto. Si lo desactivas, no se descargarán XMLs de este
                cliente. Puedes cambiarlo después desde la lista de clientes.
              </Form.Text>
            </Form.Group>
          )}

          <div className="d-flex justify-content-end gap-2">
            <Button variant="secondary" onClick={onHide}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary">
              {initialData ? "Actualizar" : "Registrar"}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};
