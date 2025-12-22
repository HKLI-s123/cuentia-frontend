import { menuItems } from "@/layouts/components/data";
import { MenuItemType } from "@/types/layout";

export function getMenuForAccount(
  tipo: "individual" | "empresarial" | "invitado" | "empleado" | null
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

        return item;
      })
      .filter(Boolean) as MenuItemType[];
  }

  // Default
  return menuItems;
}
