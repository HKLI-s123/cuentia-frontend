import { useState, useEffect } from "react";
import { Button, Modal, Form } from "react-bootstrap";

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
};

export const ClienteModal = ({ show, onHide, onSave, initialData }: ClienteFormProps) => {
  const [formData, setFormData] = useState<ClienteFormData>({
    nombre: "",
    rfc: "",
    fiel: "",
    key_path: undefined,
    cer_path: undefined,
  });

  // 🔹 Sincroniza formData cuando initialData cambia
  useEffect(() => {
    if (initialData) {
      setFormData({
        nombre: initialData.nombre || "",
        rfc: initialData.rfc || "",
        fiel: initialData.fiel || "",
        key_path: undefined,
        cer_path: undefined,
      });
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, files } = e.target;
    if (files) {
      setFormData({ ...formData, [name]: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
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

          <Form.Group className="mb-3">
            <Form.Label>RFC</Form.Label>
            <Form.Control
              type="text"
              name="rfc"
              value={formData.rfc}
              onChange={handleChange}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>FIEL</Form.Label>
            <Form.Control
              type="text"
              name="fiel"
              value={formData.fiel}
              onChange={handleChange}
            />
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
            <Form.Control type="file" name="key_path" onChange={handleChange} />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Archivo .cer</Form.Label>
            {initialData?.cer_url && (
              <div className="mb-2">
                <a href={initialData.cer_url} target="_blank" rel="noopener noreferrer">
                  Descargar .cer actual
                </a>
              </div>
            )}
            <Form.Control type="file" name="cer_path" onChange={handleChange} />
          </Form.Group>

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
