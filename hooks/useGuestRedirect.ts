"use client";

import { useEffect } from "react";
import { useSession } from "@/hooks/useSession";
import { useRouter } from "next/navigation";

export function useGuestRedirect() {
  const router = useRouter();
  const { user, loading } = useSession();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard/dashboard");
    }
  }, [user, loading]);

  return { user, loading };
}
