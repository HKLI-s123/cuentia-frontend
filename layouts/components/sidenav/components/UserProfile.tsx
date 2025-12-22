"use client";

import Link from "next/link";
import {Fragment, useEffect, useState} from "react";
import {TbSettings} from "react-icons/tb";
import {Dropdown, DropdownDivider, DropdownItem, DropdownMenu, DropdownToggle} from "react-bootstrap";
import {userDropdownItems} from "@/layouts/components/data";

import user2 from "@/assets/images/users/user-2.jpg"
import Image from "next/image";
import { getSessionInfo } from "@/app/services/authService";

const UserProfile = () => {
    const [session, setSession] = useState<any>(null);

    useEffect(() => { 
      const load = async () => {
        try {
          const data = await getSessionInfo();
          setSession(data);
        } catch (err) {
          console.error("Error cargando sesión:", err);
        }
      };
      load();
    }, []);

    return (
        <div className="sidenav-user">
            <div className="d-flex justify-content-between align-items-center">
                <div>
                    <Link href="/" className="link-reset">
                        <span className="sidenav-user-name fw-bold">{session?.nombre ?? "Cargando..."}</span>
                    </Link>
                </div>
                <Dropdown>
                    <DropdownToggle as={'a'} role="button" aria-label="profile dropdown"
                                    className="dropdown-toggle drop-arrow-none link-reset sidenav-user-set-icon">
                        <TbSettings className="fs-24 align-middle ms-1"/>
                    </DropdownToggle>

                    <DropdownMenu>
                        {userDropdownItems.map((item, idx) => (
                            <Fragment key={idx}>
                                {item.isHeader ? (
                                    <div className="dropdown-header noti-title">
                                        <h6 className="text-overflow m-0">{item.label}</h6>
                                    </div>
                                ) : item.isDivider ? (
                                    <DropdownDivider />
                                ) : item.action === "logout" ? (
                                    // 🔥 Item especial para cerrar sesión
                                    <DropdownItem
                                        as="button"
                                        onClick={async () => {
                                            const { logoutUser } = await import("@/app/services/authService");
                                            await logoutUser();
                                            window.location.href = "/login";
                                        }}
                                        className={item.class}
                                    >
                                        {item.icon && <item.icon className="me-2 fs-17 align-middle" />}
                                        <span className="align-middle">{item.label}</span>
                                    </DropdownItem>
                                ) : (
                                    // 🔗 Items normales con URL
                                    <DropdownItem
                                        as={Link}
                                        href={item.url}
                                        className={item.class}
                                    >
                                        {item.icon && <item.icon className="me-2 fs-17 align-middle" />}
                                        <span className="align-middle">{item.label}</span>
                                    </DropdownItem>
                                )}
                            </Fragment>
                        ))}
                    </DropdownMenu>
                </Dropdown>
            </div>
        </div>
    )
}

export default UserProfile