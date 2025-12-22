"use client";

import { useRouter } from "next/navigation";
import { useSession } from "@/hooks/useSession";
import Spinner from "@/components/Spinner";

export function withSessionGuard(Component: any) {
  return function GuardedPage(props: any) {
    const { user, loading } = useSession();
    const router = useRouter();

    // Mientras consulta /auth/me → mostrar loading
    if (loading) {
      return (
        <div className="flex min-h-screen items-center justify-center text-gray-600">
          <Spinner></Spinner>
        </div>
      );
    }

    // No autenticado
    if (!user) {
      router.replace("/login");
      return null;
    }

    // Autenticado → mostrar página
    return <Component {...props} />;
  };
}
