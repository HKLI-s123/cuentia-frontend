"use client";

import { useEffect, useState } from "react";
import { Dropdown, DropdownToggle, DropdownMenu, DropdownItem, Button, Col, Row } from "react-bootstrap";
import SimpleBar from "simplebar-react";
import { LuBell, LuBellRing, LuCircleCheck, LuDatabaseZap, LuMessageCircle, LuTriangleAlert } from "react-icons/lu";
import { TbXboxXFilled } from "react-icons/tb";
import { getNotifications, deleteNotification } from "../../../../app/services/notificationService";
import AllNotificationsModal from "./AllNotificationsModal";

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

function timeAgo(dateStr: string) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return "Justo ahora";
  if (diff < 3600) return `${Math.floor(diff / 60)} minutos`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} horas`;
  return `${Math.floor(diff / 86400)} días`;
}


const NotificationDropdown = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  const loadNotifications = async () => {
    try {
      const data = await getNotifications();
      setNotifications(data);
    } catch (e) {
      console.error("Error cargando notificaciones:", e);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleDelete = async (id: number) => {
    await deleteNotification(id);
    loadNotifications();
  };

  return (
   <>
    <div className="topbar-item">
      <Dropdown align="end">
        <DropdownToggle as={'button'} className="topbar-link dropdown-toggle drop-arrow-none">
          <LuBell className="fs-xxl" />
          {notifications.length > 0 && (
            <span className="badge badge-square text-bg-warning topbar-badge">
              {notifications.length}
            </span>
          )}
        </DropdownToggle>

        <DropdownMenu className="p-0 dropdown-menu-end dropdown-menu-lg">

          <div className="px-3 py-2 border-bottom">
            <Row className="align-items-center">
              <Col><h6 className="m-0 fs-md fw-semibold">Notificaciones</h6></Col>
              <Col className="text-end">
                <span className="badge text-bg-light badge-label py-1">
                  {notifications.length} nuevas
                </span>
              </Col>
            </Row>
          </div>

          <SimpleBar style={{ maxHeight: "300px" }}>
            {notifications.map(n => {
              const Icon = iconMap[n.type];
              const variant = variantMap[n.type];

              return (
                <DropdownItem key={n.id} className="notification-item py-2 text-wrap">
                  <span className="d-flex gap-2">
                    <span className="avatar-md flex-shrink-0">
                      <span className={`avatar-title bg-${variant}-subtle text-${variant} rounded fs-22`}>
                        <Icon />
                      </span>
                    </span>

                    <span className="flex-grow-1 text-muted">
                      <span className="fw-medium text-body">{n.title}</span>
                      <br />
                      <span className="fs-xs">{timeAgo(n.createdAt)}</span>
                    </span>

                    <Button variant="link" className="flex-shrink-0 text-muted p-0" onClick={() => handleDelete(n.id)}>
                      <TbXboxXFilled className="fs-xxl"/>
                    </Button>
                  </span>
                </DropdownItem>
              );
            })}
          </SimpleBar>
            <button
              onClick={() => setModalOpen(true)}
              className="dropdown-item text-center text-reset text-decoration-underline fw-bold notify-item border-top py-2"
            >
              Ver todas
            </button>
        </DropdownMenu>
      </Dropdown>
    </div>
      <AllNotificationsModal
        show={modalOpen}
        onHide={() => setModalOpen(false)}
        notifications={notifications}
        refresh={loadNotifications}
      />
    </>
  );
};

export default NotificationDropdown;
