"use client";

import Link from "next/link";
import {Fragment, useEffect, useState} from "react";
import {Dropdown, DropdownDivider, DropdownItem, DropdownMenu, DropdownToggle} from "react-bootstrap";
import {userDropdownItems} from "@/layouts/components/data";
import {TbChevronDown, TbUsers} from "react-icons/tb";
import Image from "next/image";
import user2 from "@/assets/images/users/user-2.jpg";
import { getSessionInfo } from "@/app/services/authService";
import { apiFetch } from "@/app/services/apiClient";
import { API_URL } from "@/utils/env";

type PlanBadgeInfo = {
  plan: string | null;
  status: "active" | "trialing" | "expired" | "canceled" | "none";
  trialEndsAt?: string | null;
};


const UserProfile = () => {

    const [session, setSession] = useState<any>(null);
    const [planInfo, setPlanInfo] = useState<PlanBadgeInfo | null>(null);

    const formatPlanName = (plan?: string | null) => {
      if (!plan) return "Free";
      return plan.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
    };
    
    const getTrialDays = () => {
      if (!planInfo?.trialEndsAt) return null;
      const diff =
        (new Date(planInfo.trialEndsAt).getTime() - Date.now()) /
        (1000 * 60 * 60 * 24);
      return Math.max(0, Math.ceil(diff));
    };
    
    const badgeStyles = () => {
      if (!planInfo?.plan) return null;
    
      switch (planInfo.status) {
        case "active":
          return "bg-emerald-100 text-emerald-700";
        case "trialing":
          return "bg-indigo-100 text-indigo-700";
        case "expired":
          return "bg-yellow-100 text-yellow-700";
        case "canceled":
          return "bg-red-100 text-red-700";
        default:
          return null;
      }
    };

    useEffect(() => { 
      const load = async () => {
        try {
          const data = await getSessionInfo();
          setSession(data);

          const res = await apiFetch(`${API_URL}/billing/me-plan`, {});
          const plan = await res?.json();
          setPlanInfo(plan);
        } catch (err) {
          console.error("Error cargando user badge:", err);
        }
      };
      load();
    }, []);

   const computedItems = (() => {
     if (!session) return userDropdownItems;
   
     let items = [...userDropdownItems];
   
     if (session.tipoCuenta === "empresarial") {
       const index = items.findIndex(
         (i) => i.label === "Configuración de la cuenta"
       );
   
       if (index !== -1) {
         items.splice(index + 1, 0, {
           label: "Agregar colaboradores",
           icon: TbUsers,
           url: "/configuracion/equipo",
         });
       }
     }
   
     return items;
   })();

    return (
        <div className="topbar-item nav-user">
            {planInfo?.plan && (
              <Link
                href="/plans"
                className={`px-2 py-0.5 rounded-full text-xs font-semibold ${badgeStyles()}`}
                title="Ver detalles del plan"
              >
                {planInfo.status === "trialing"
                  ? `Trial · ${getTrialDays()} días`
                  : `${formatPlanName(planInfo.plan)} · Activo`}
              </Link>
            )}
            <Dropdown align="end">
                <DropdownToggle as={'a'} className="topbar-link dropdown-toggle drop-arrow-none px-2">
                    <Image src={user2.src} width="14" height="14" className="rounded-circle me-lg-2 d-flex" alt="user-image"/>
                    <div className="d-lg-flex align-items-center gap-1 d-none">
                        <h5 className="my-0">
                           {session?.nombre ?? "Cargando..."}
                        </h5>
                        <TbChevronDown className="align-middle"/>
                    </div>
                </DropdownToggle>

                <DropdownMenu className="dropdown-menu-end">
                    {computedItems.map((item, idx) => (
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
                                    as="button"
                                    onClick={() => {
                                      window.location.href = item.url!;
                                    }}
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
    );
};

export default UserProfile;
