"use client";

import { Modal, Button, Spinner } from "react-bootstrap";
import { toast } from "sonner";
import { removeWhatsappBotPhone, getWhatsappBotStatus } from "@/app/services/botService";
import { useState } from "react";

type Props = {
  show: boolean;
  onClose: () => void;
  onSuccess: (status: any) => void;
};

export const ConfirmRemovePhoneModal = ({
  show,
  onClose,
  onSuccess,
}: Props) => {
  const [loading, setLoading] = useState(false);

  const handleRemove = async () => {
    try {
      setLoading(true);
      await removeWhatsappBotPhone();

      const refreshed = await getWhatsappBotStatus();
      onSuccess(refreshed);

      toast.success("Número eliminado correctamente");
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Error al quitar número");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Quitar número</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <p>
          ¿Estás seguro de quitar este número?
        </p>
        <p className="text-muted mb-0">
          Esta acción solo puede realizarse <strong>una vez por día</strong>.
        </p>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button variant="danger" onClick={handleRemove} disabled={loading}>
          {loading ? <Spinner size="sm" /> : "Sí, quitar"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
