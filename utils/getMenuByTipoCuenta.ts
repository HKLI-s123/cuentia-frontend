import { menuItems } from "@/layouts/components/data";
import { MenuItemType } from "@/types/layout";

// Secciones de CFDIs → tipos de comprobante que muestran
const TIPOS_POR_MENU: Record<string, string[]> = {
  "listado-facturas": ["I", "E", "N"],
  complementos: ["P"],
  notascredito: ["E"],
  diot: ["I"],
};

type TipoCuenta = "individual" | "empresarial" | "invitado" | "empleado" | null;

export function getMenuForAccount(
  tipo: TipoCuenta,
  allowedCfdiTypes: string[] | null = null, // empleado: null = todos los tipos
  features: string[] = [] // módulos exclusivos habilitados (session-info.features)
) {
  const menu = getMenuByTipo(tipo, allowedCfdiTypes);
  return removeEmptySections(filterByFeatures(menu, features));
}

/** Quita los items (y sub-items) que requieren un módulo que la cuenta no tiene. */
function filterByFeatures(items: MenuItemType[], features: string[]): MenuItemType[] {
  return items
    .filter((item) => !item.requiredFeature || features.includes(item.requiredFeature))
    .map((item) =>
      item.children ? { ...item, children: filterByFeatures(item.children, features) } : item
    )
    // Un grupo que se quedó sin hijos no se muestra
    .filter((item) => !item.children || item.children.length > 0);
}

/** Quita los títulos de sección que no tienen ningún item debajo. */
function removeEmptySections(items: MenuItemType[]): MenuItemType[] {
  return items.filter((item, i) => {
    if (!item.isTitle) return true;
    const next = items[i + 1];
    return !!next && !next.isTitle;
  });
}

function getMenuByTipo(tipo: TipoCuenta, allowedCfdiTypes: string[] | null): MenuItemType[] {
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
