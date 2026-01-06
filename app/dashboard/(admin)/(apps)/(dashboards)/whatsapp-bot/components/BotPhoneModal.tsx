"use client";

import { Modal, Button, Form, Spinner } from "react-bootstrap";
import { useState } from "react";
import { toast } from "sonner";
import {
  setWhatsappBotPhone,
  getWhatsappBotStatus,
} from "@/app/services/botService";

type Props = {
  show: boolean;
  onClose: () => void;
  onSuccess: (status: any) => void;
  title: string;
};

export const BotPhoneModal = ({
  show,
  onClose,
  onSuccess,
  title,
}: Props) => {
  const [telefono, setTelefono] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!telefono) {
      toast.error("Ingresa un número de teléfono");
      return;
    }

    if (!/^\d{10,15}$/.test(telefono)) {
       toast.error("El número solo debe contener dígitos, sin espacios ni letras.");
       return;
    }

    try {
      setLoading(true);

      await setWhatsappBotPhone(telefono);

      const refreshed = await getWhatsappBotStatus();
      onSuccess(refreshed);

      toast.success("Número configurado correctamente");
      onClose();
      setTelefono("");
    } catch (err: any) {
      toast.error(err.message || "Error al guardar el número");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <Form.Group>
          <Form.Label>Número de WhatsApp</Form.Label>
          <Form.Control
            placeholder="Ej. 5219991234567"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
          />
          <Form.Text className="text-muted">
            Incluye código de país (ej. 521 para México)
          </Form.Text>
        </Form.Group>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button variant="primary" onClick={handleSave} disabled={loading}>
          {loading ? <Spinner size="sm" /> : "Guardar"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
