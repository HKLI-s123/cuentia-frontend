"use client";

import { Modal, Button } from "react-bootstrap";
import SimpleBar from "simplebar-react";
import { TbXboxXFilled } from "react-icons/tb";

import {
  LuBellRing,
  LuCircleCheck,
  LuDatabaseZap,
  LuMessageCircle,
  LuTriangleAlert,
  LuTrendingUp,
  LuInfo,
} from "react-icons/lu";

import { deleteNotification } from "../../../../app/services/notificationService";

/* =========================
   ICONOS POR TIPO
========================= */
const iconMap: Record<string, any> = {
  // 🔴 Sistema fiscal
  alerta: LuTriangleAlert,
  prediccion: LuTrendingUp,
  info: LuInfo,

  // 🔵 Legacy
  EMAIL: LuMessageCircle,
  INTERNAL: LuBellRing,
  BOT: LuCircleCheck,
  SMS: LuTriangleAlert,
  PUSH: LuDatabaseZap,
};

/* =========================
   VARIANTES VISUALES
========================= */
const variantMap: Record<string, string> = {
  // 🔴 Sistema fiscal
  alerta: "warning",
  prediccion: "info",
  info: "secondary",

  // 🔵 Legacy
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
    refresh();
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Todas las notificaciones</Modal.Title>
      </Modal.Header>

      <Modal.Body style={{ padding: 0 }}>
        <SimpleBar style={{ maxHeight: "60vh" }}>
          {notifications.map((n: any) => {
            const Icon = iconMap[n.type] ?? LuBellRing;
            const variant = variantMap[n.type] ?? "secondary";

            const metadata = n.metadata ?? {};
            const hasMetadata = Object.keys(metadata).length > 0;

            return (
              <div
                key={n.id}
                className="d-flex align-items-start px-3 py-2 border-bottom"
              >
                {/* ICONO */}
                <span className="avatar-md flex-shrink-0 me-2">
                  <span
                    className={`avatar-title bg-${variant}-subtle text-${variant} rounded fs-22`}
                  >
                    <Icon />
                  </span>
                </span>

                {/* CONTENIDO */}
                <div className="flex-grow-1">
                  <h6 className="mb-1">{n.title}</h6>

                  <p className="text-muted mb-1">{n.content}</p>

                  {/* 🔍 METADATA DINÁMICA */}
                  {hasMetadata && (
                    <div className="mt-1 ps-1">
                      {Object.entries(metadata).map(([key, value]) => (
                        <div key={key} className="fs-xs text-muted">
                          <strong className="text-capitalize">
                            {key.replace(/_/g, " ")}:
                          </strong>{" "}
                          {typeof value === "number"
                            ? value.toLocaleString()
                            : String(value)}
                        </div>
                      ))}
                    </div>
                  )}

                  <small className="text-muted d-block mt-1">
                    {new Date(n.createdAt).toLocaleString()}
                  </small>
                </div>

                {/* BORRAR */}
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
