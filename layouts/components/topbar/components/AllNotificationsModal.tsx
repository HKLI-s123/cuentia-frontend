"use client";

import { Modal, Button } from "react-bootstrap";
import SimpleBar from "simplebar-react";
import { TbXboxXFilled } from "react-icons/tb";
import { deleteNotification } from "../../../../app/services/notificationService";
import { LuBellRing, LuCircleCheck, LuDatabaseZap, LuMessageCircle, LuTriangleAlert } from "react-icons/lu";

const iconMap: any = {
  EMAIL: LuMessageCircle,
  INTERNAL: LuBellRing,
  BOT: LuCircleCheck,
  SMS: LuTriangleAlert,
  PUSH: LuDatabaseZap,
};

const variantMap: any = {
  EMAIL: "info",
  INTERNAL: "primary",
  BOT: "success",
  SMS: "warning",
  PUSH: "danger",
};


export default function AllNotificationsModal({
  show,
  onHide,
  notifications,
  refresh,
}: any) {

  const handleDelete = async (id: number) => {
    await deleteNotification(id);
    refresh(); // vuelve a cargar notificaciones
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Todas las notificaciones</Modal.Title>
      </Modal.Header>

      <Modal.Body style={{ padding: 0 }}>
        <SimpleBar style={{ maxHeight: "60vh" }}>
          {notifications.map((n: any) => {
            const Icon = iconMap[n.type];
            const variant = variantMap[n.type];

            return (
              <div
                key={n.id}
                className="d-flex align-items-start px-3 py-2 border-bottom"
              >
                <span className="avatar-md flex-shrink-0 me-2">
                  <span
                    className={`avatar-title bg-${variant}-subtle text-${variant} rounded fs-22`}
                  >
                    <Icon />
                  </span>
                </span>

                <div className="flex-grow-1">
                  <h6 className="mb-1">{n.title}</h6>
                  <p className="text-muted mb-1">{n.content}</p>
                  <small className="text-muted">{n.createdAt}</small>
                </div>

                <Button
                  variant="link"
                  className="text-muted p-0 ms-2"
                  onClick={() => handleDelete(n.id)}
                >
                  <TbXboxXFilled className="fs-4" />
                </Button>
              </div>
            );
          })}
        </SimpleBar>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cerrar
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
