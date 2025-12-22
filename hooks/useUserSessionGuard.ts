"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

export function useOnboardingRedirect(session: any) {
  const router = useRouter();
  const pathname = usePathname();

  const noVerificationPaths = [
    "/auth/login",
    "/auth/register",
    "/auth/verify",
    "/auth/reset-password",
    "/auth/request-password-reset",
    "/auth/resend-verification",
    "/validar-cuenta",
    "/guest-validate",
    "/guest/activate",
    "/auth/logout"
  ];

  useEffect(() => {
    // Si todavía no cargamos session en el componente padre, no hacemos nada
    if (!session) return;

    // 1️⃣ Ignorar rutas que NO requieren verificación
    if (noVerificationPaths.includes(pathname)) return;

    // 2️⃣ Verificación obligatoria
    if (!session.verified) {
      if (pathname !== "/validar-cuenta") {
        router.push("/validar-cuenta");
      }
      return;
    }

    // 3️⃣ Invitado = NO onboarding
    if (session.tipoCuenta === "invitado") return;

    // 4️⃣ Individual = requiere propioRFC obligatorio
    if (session.tipoCuenta === "individual") {
      if (!session.propioRFC) {
        router.push("/onboarding");
      }
      return;
    }

    // 5️⃣ Empresarial
    if (session.tipoCuenta === "empresarial") {
      // No tiene RFC propio: revisar si omitió onboarding
      if (!session.propioRFC) {
        if (session.omitOnboarding === true) {
          return; // permitir
        }
        router.push("/onboarding");
      }
      return;
    }
  }, [session, pathname]);
}
