import { menuItems } from "@/layouts/components/data";
import { MenuItemType } from "@/types/layout";

// Secciones de CFDIs → tipos de comprobante que muestran
const TIPOS_POR_MENU: Record<string, string[]> = {
  "listado-facturas": ["I", "E", "N"],
  complementos: ["P"],
  notascredito: ["E"],
  diot: ["I"],
};

export function getMenuForAccount(
  tipo: "individual" | "empresarial" | "invitado" | "empleado" | null,
  allowedCfdiTypes: string[] | null = null // empleado: null = todos los tipos
) {
  // 🟦 Empresarial → ve TODO
  if (tipo === "empresarial") return menuItems;

  // 🟨 Invitado → restricciones máximas
  if (tipo === "invitado") {
    return menuItems
      .map((item) => {
        // Ocultar "Clientes"
        if (item.key === "clientes") return null;

        // IA → solo asistente contable
        if (item.key === "chatcontable") {
          return {
            ...item,
            children: item.children?.filter((c) => c.key === "chatcontable"),
          };
        }

        return item;
      })
      .filter(Boolean) as MenuItemType[];
  }

  // 🟩 Individual → igual que invitado, pero sí ve WhatsApp Bot
  if (tipo === "individual") {
    return menuItems
      .map((item) => {
        // Ocultar "Clientes"
        if (item.key === "clientes") return null;

        // IA → mostrar ambos hijos
        if (item.key === "chatcontable") {
          return {
            ...item,
            children: item.children,
          };
        }

        return item;
      })
      .filter(Boolean) as MenuItemType[];
  }

  // 🟥 Empleado → ocultar WhatsApp Bot SIEMPRE
  if (tipo === "empleado") {
    return menuItems
      .map((item) => {
        // IA → mostrar solo asistente contable
        if (item.key === "chatcontable") {
          return {
            ...item,
            children: item.children?.filter((c) => c.key === "chatcontable"),
          };
        }

        // CFDIs → solo secciones de los tipos que puede ver
        if (item.key === "cfdis" && allowedCfdiTypes) {
          return {
            ...item,
            children: item.children?.filter((c) =>
              (TIPOS_POR_MENU[c.key] ?? []).some((t) => allowedCfdiTypes.includes(t))
            ),
          };
        }

        return item;
      })
      .filter(Boolean) as MenuItemType[];
  }

  // Default
  return menuItems;
}
